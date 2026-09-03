import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  ShoppingBag, 
  X, 
  Instagram, 
  ChevronRight,
  Info, 
  Plus, 
  Minus, 
  Trash2, 
  History, 
  LogOut, 
  LogIn, 
  LayoutGrid, 
  Star, 
  Settings, 
  TrendingDown, 
  TrendingUp, 
  Package,
  Calendar,
  Clock,
  CreditCard,
  Check,
  MessageCircle,
  DollarSign,
  Calculator,
  Layers,
  FileText,
  Download,
  AlertCircle,
  Sparkles,
  ChefHat,
  FileSpreadsheet,
  MapPin,
  Store,
  BellRing,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Percent,
  Volume2,
  RotateCcw,
  AlertTriangle,
  Users,
  MessageSquare,
  Tag,
  Moon,
  Sun
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn, formatCurrency, removeAcentos, getProductUnitPrice, cleanFirestoreData } from './lib/utils';
import { generateOrderPdf } from './lib/pdfGenerator';
import { exportSalesToCsv, exportSalesToPdf, exportConsolidatedDREClosingReportPdf } from './lib/exportReports';
import { playNewOrderNotification } from './lib/audioNotifier';
import { sendPwaOrderNotification } from './lib/pwaNotificationHelper';
import { buildWhatsAppMessage, DEFAULT_WHATSAPP_TEMPLATE } from './lib/whatsappHelper';
import { calculateSettingsDiff, getClientIpAndDeviceInfo, buildAuditDetailedDescription } from './lib/auditHelper';
import { useWishlist } from './hooks/useWishlist';
import { getSeasonalTheme } from './lib/seasonalThemes';
import type { Product, CartItem, CategoryGroup, OrderDetails, ReadyBox, CustomerNoteData, QuickReplyPhrase, Coupon, AuditLog } from './types';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  serverTimestamp, 
  Timestamp,
  updateDoc,
  doc,
  onSnapshot,
  deleteDoc,
  where,
  limit
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { DEFAULT_CATALOG, fetchCatalogWithFallback } from './defaultCatalog';
import { HeroBanner } from './components/HeroBanner';
import { QuickSearchChips } from './components/QuickSearchChips';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CheckoutModal } from './components/CheckoutModal';
import { EventSweetCalculatorModal } from './components/EventSweetCalculatorModal';
import { MixedCentoModal } from './components/MixedCentoModal';
import { AdminProductionTab } from './components/AdminProductionTab';
import { AdminInventoryTab } from './components/AdminInventoryTab';
import { AdminQuickRepliesTab } from './components/AdminQuickRepliesTab';
import { QuickReplyModal } from './components/QuickReplyModal';
import { AdminBatchCostCalculator } from './components/AdminBatchCostCalculator';
import { ReadyBoxesSection } from './components/ReadyBoxesSection';
import { AdminReadyBoxesTab } from './components/AdminReadyBoxesTab';
import { AdminCrmTab } from './components/AdminCrmTab';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { CartDrawer } from './components/CartDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AdminOrderCard } from './components/AdminOrderCard';
import { AdminSettingsTab } from './components/AdminSettingsTab';
import { AdminReviewsTab } from './components/AdminReviewsTab';
import { AdminCharts } from './components/AdminCharts';
import { StatCard } from './components/StatCard';
import { TrackingView } from './components/TrackingView';
import { AdminCouponsTab } from './components/AdminCouponsTab';
import { CouponBanner } from './components/CouponBanner';
import { CustomerReviewModal } from './components/CustomerReviewModal';

function sendBrowserNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    });
  }
}

export function App() {
  const [catalog, setCatalog] = useState<CategoryGroup[]>(() => {
    try {
      const cached = localStorage.getItem('docesGourmetCatalog');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CATALOG;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('Todos');
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isEventCalculatorOpen, setIsEventCalculatorOpen] = useState(false);
  const [isMixedCentoOpen, setIsMixedCentoOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [view, setView] = useState<'catalog' | 'admin' | 'tracking'>('catalog');
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [productCosts, setProductCosts] = useState<Record<string, number>>({});
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<Record<string, any>>({});
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [readyBoxes, setReadyBoxes] = useState<ReadyBox[]>([]);
  const [customerNotes, setCustomerNotes] = useState<Record<string, CustomerNoteData>>({});
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    contactPhone: "5544998542446",
    googleSheetId: "1LnFf7VKaV4CLedmpiLsWtgt_Z9bZJKuyLrPfevybQc0",
    pixKey: "03972289960",
    pickupAddress: "Avenida Padre Jose Stefanello, n°340",
    businessHours: "Ter a Dom • 10h às 18h",
    storeStatusText: "Aceitando Encomendas & Pronta Entrega",
    storeStatusMode: "open" as 'open' | 'limited' | 'paused',
    announcementBanner: "",
    instagramUrl: "https://instagram.com/s.e_docesgourmet",
    minNoticeHours: 48,
    blockedDates: [] as string[],
    // Item 2: Delivery vs Pickup
    deliveryMode: "delivery_and_pickup" as 'pickup_only' | 'delivery_and_pickup',
    deliveryFeeType: "fixed" as 'fixed' | 'to_consult',
    deliveryFixedFee: 10,
    freeDeliveryThreshold: 0,
    // Item 3: Volume Discounts
    enableVolumeDiscount: true,
    volumeDiscountMinItems: 200,
    volumeDiscountPercent: 5,
    volumeDiscountMessage: "🎉 Parabéns! Desconto de 5% aplicado para pedidos acima de 200 doces.",
    // Item 4: Sound Notifications
    enableOrderSoundNotification: true,
    // Item 5: Custom WhatsApp Template
    customWhatsAppTemplate: DEFAULT_WHATSAPP_TEMPLATE,
    // Item 6: Global Minimum Stock Alert
    globalMinStockAlert: 2,
    // Item 7: Coupons & Loyalty
    enableCoupons: true,
    enableReviewRewardCoupon: true,
    reviewRewardCouponCode: "DOCES5",
    reviewRewardCouponDiscount: "5% de desconto",
    enablePostSaleFeedback: true,
    postSaleReviewTemplate: "",
    // Novos Módulos Opcionais Ativáveis / Desativáveis (Solicitação do Usuário)
    enableWishlist: true,
    enablePwaInstallPrompt: true,
    enableProductionCalendar: true,
    enablePredictiveStockAlerts: true,
    enableConsolidatedReports: true,
    seasonalTheme: 'default' as 'default' | 'easter' | 'mothers_day' | 'christmas' | 'halloween',
    seasonalThemeBanner: ''
  });

  const { wishlistIds, isWishlisted, toggleWishlist } = useWishlist();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>(() => {
    return localStorage.getItem('docesGourmetCoupon') || '';
  });
  const [reviewModalData, setReviewModalData] = useState<{
    isOpen: boolean;
    orderId?: string;
    customerName?: string;
  }>({ isOpen: false });

  // Admin Dark Mode (Night Mode) persisted in localStorage
  const [adminDarkMode, setAdminDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('docesGourmetAdminDarkMode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleAdminDarkMode = React.useCallback(() => {
    setAdminDarkMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('docesGourmetAdminDarkMode', String(next));
      } catch (e) {
        console.warn("Could not persist admin dark mode to localStorage", e);
      }
      return next;
    });
  }, []);

  const isAdmin = user?.email?.toLowerCase() === 'rafaelhirofujii17@gmail.com';
  const previousAdminOrdersCount = React.useRef<number | null>(null);

  // Sync body class for dark background when in admin view
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (view === 'admin' && adminDarkMode) {
      document.body.classList.add('admin-dark-mode-body');
    } else {
      document.body.classList.remove('admin-dark-mode-body');
    }
    return () => {
      document.body.classList.remove('admin-dark-mode-body');
    };
  }, [view, adminDarkMode]);

  // Check URL params for review request (?avaliar=true&pedido=...&cliente=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('avaliar') === 'true') {
      const pedido = urlParams.get('pedido') || '';
      const cliente = urlParams.get('cliente') || '';
      setReviewModalData({
        isOpen: true,
        orderId: pedido,
        customerName: cliente
      });
    }
  }, []);

  // Global Coupons Listener (Public)
  useEffect(() => {
    const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
      setCoupons(list);
    }, (err) => {
      console.warn("Coupons notice:", err);
    });
    return () => unsub();
  }, []);

  // Global Settings Listener
  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setGlobalSettings(prev => ({ ...prev, ...snap.data() }));
      }
    }, (err: any) => {
      console.warn("Global settings notice:", err);
    });
  }, []);

  const updateGlobalSettings = async (data: any) => {
    try {
      const diff = calculateSettingsDiff(globalSettings, data);
      const cleanData = cleanFirestoreData(data);

      await updateDoc(doc(db, 'settings', 'global'), {
        ...cleanData,
        updatedAt: serverTimestamp()
      }).catch(async () => {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'global'), {
          ...cleanData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });

      // Record audit log with client IP, Device Info and deep description if changes were made
      if (diff.length > 0) {
        try {
          const { ip, deviceInfo } = await getClientIpAndDeviceInfo();
          const detailedDescription = buildAuditDetailedDescription(diff);
          const mainCategory = diff[0]?.category || 'Atendimento & Horários';

          await addDoc(collection(db, 'audit_logs'), {
            action: 'settings_updated',
            userEmail: user?.email || 'rafaelhirofujii17@gmail.com',
            userName: user?.displayName || user?.email?.split('@')[0] || 'Administrador',
            userIp: ip,
            deviceInfo: deviceInfo,
            category: mainCategory,
            changedFields: diff,
            summary: diff.map(d => d.fieldLabel).slice(0, 3).join(', ') + (diff.length > 3 ? ` (+${diff.length - 3} alterações)` : ''),
            detailedDescription,
            timestamp: serverTimestamp()
          });
        } catch (logErr) {
          console.warn("Failed to write audit log:", logErr);
        }
      }

      setGlobalSettings(prev => ({ ...prev, ...data }));
      alert("Configurações atualizadas com sucesso!");
    } catch (err) {
      console.error("Failed to update settings", err);
      alert("Erro ao atualizar configurações.");
    }
  };

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  // Sync with Google Sheets with fallback
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const sheetId = globalSettings.googleSheetId || '1LnFf7VKaV4CLedmpiLsWtgt_Z9bZJKuyLrPfevybQc0';
        const data = await fetchCatalogWithFallback(sheetId);
        if (isMounted && data && data.length > 0) {
          setCatalog(data);
          setError(null);
        }
      } catch (err: any) {
        console.warn("Warning during catalog load:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCatalog();
    return () => { isMounted = false; };
  }, [globalSettings.googleSheetId]);

  // Orders Listener for Admin with Real-time Sound & Background PWA Push Notification
  useEffect(() => {
    if (view === 'admin' && isAdmin) {
      setLoadingOrders(true);
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Check if a new order arrived while in admin view
        if (previousAdminOrdersCount.current !== null && snapshot.docs.length > previousAdminOrdersCount.current) {
          const newestDoc = snapshot.docs[0];
          const newestOrder: any = newestDoc ? newestDoc.data() : null;
          const customerName = newestOrder?.customerName || 'Novo Cliente';
          const totalFormatted = newestOrder?.total ? ` • ${formatCurrency(newestOrder.total)}` : '';

          sendPwaOrderNotification({
            title: "🔔 Novo Pedido Recebido! • S.E Doces",
            body: `Nova encomenda de ${customerName}${totalFormatted}. Toque para abrir a Área Administrativa.`,
            orderId: newestDoc?.id,
            customerName,
            total: newestOrder?.total,
            playSound: globalSettings.enableOrderSoundNotification,
            vibrate: true
          });
        }
        previousAdminOrdersCount.current = snapshot.docs.length;

        setAdminOrders(ordersData);
        setLoadingOrders(false);
      }, (err) => {
        console.error("Orders Listener error:", err);
        setLoadingOrders(false);
      });

      return () => unsubscribe();
    } else {
      previousAdminOrdersCount.current = null;
    }
  }, [view, isAdmin, globalSettings.enableOrderSoundNotification]);

  // Order Tracking Listener (Client)
  useEffect(() => {
    const savedOrderIds: string[] = JSON.parse(localStorage.getItem('myOrderIds') || '[]');
    if (savedOrderIds.length === 0) return;

    let initialLoad = true;
    const unsubscribes: (() => void)[] = [];

    savedOrderIds.forEach(id => {
      const unsub = onSnapshot(doc(db, 'orders', id), (docSnap) => {
        if (docSnap.exists()) {
          const updated: any = { id: docSnap.id, ...docSnap.data() };
          setMyOrders(prev => {
            const index = prev.findIndex(o => o.id === id);
            const oldOrder: any = index >= 0 ? prev[index] : null;
            let newList;
            if (index >= 0) {
              newList = [...prev];
              newList[index] = updated;
            } else {
              newList = [updated, ...prev];
            }

            if (!initialLoad && oldOrder && oldOrder.status !== updated.status) {
              const statusMsg = 
                updated.status === 'confirmed' ? "Seu pedido foi confirmado pela confeitaria! 🎉" :
                updated.status === 'preparing' ? "Seus doces já estão sendo preparados com carinho! 🍫" :
                updated.status === 'ready' ? "Seu pedido está pronto para retirada! 🛍️" :
                updated.status === 'completed' ? "Seu pedido foi entregue. Obrigado! ❤️" : "";
              if (statusMsg) sendBrowserNotification("S.E Doces Gourmet", statusMsg);
            }
            
            return newList;
          });
          initialLoad = false;
        }
      }, (err) => {
        console.error(`Error tracking order ${id}:`, err);
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.code === 'auth/unauthorized-domain') {
        alert("Erro: Este domínio não está autorizado no Firebase Authentication. Adicione '" + window.location.hostname + "' aos domínios autorizados no console do Firebase.");
      } else {
        alert("Falha no login: " + err.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('catalog');
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updates: any = { status: newStatus };
      if (newStatus === 'deleted') {
        updates.deletedAt = serverTimestamp();
      } else {
        updates.deletedAt = null;
      }
      
      await updateDoc(orderRef, updates);
      
      setAdminOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      ));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const permanentlyDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Isso excluirá o pedido permanentemente. Continuar?")) return;
    try {
      const { deleteDoc, doc: firestoreDoc } = await import('firebase/firestore');
      await deleteDoc(firestoreDoc(db, 'orders', orderId));
      setAdminOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error("Failed to delete permanently", err);
    }
  };

  // Load Cart from LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('docesGourmetCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  // Save Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('docesGourmetCart', JSON.stringify(cart));
  }, [cart]);

  // Filter Products
  const filteredCatalog = useMemo(() => {
    return catalog.map(group => ({
      ...group,
      items: group.items.filter(item => {
        const matchesCategory = currentCategory === 'Todos' || group.category === currentCategory;
        
        let matchesSearch = true;
        if (searchTerm.trim()) {
          const cleanSearch = removeAcentos(searchTerm.toLowerCase());
          if (cleanSearch === 'mais vendidos' || cleanSearch === 'destaques') {
            matchesSearch = !!item.badge;
          } else if (cleanSearch === 'favoritos' || cleanSearch === 'meus favoritos') {
            matchesSearch = isWishlisted(item.id);
          } else {
            matchesSearch = 
              removeAcentos(item.name.toLowerCase()).includes(cleanSearch) ||
              removeAcentos(item.category.toLowerCase()).includes(cleanSearch) ||
              (item.badge ? removeAcentos(item.badge.toLowerCase()).includes(cleanSearch) : false);
          }
        }
        
        return matchesCategory && matchesSearch;
      })
    })).filter(group => group.items.length > 0);
  }, [catalog, currentCategory, searchTerm]);

  // Cart Operations (Minimum 25 units per item, step by 1)
  const addToCart = (product: Product, isUnit?: boolean, initialQty?: number) => {
    const qtyToAdd = initialQty !== undefined ? Math.max(25, initialQty) : 25;

    setCart(prev => {
      const existing = prev[product.id];
      if (existing) {
        return {
          ...prev,
          [product.id]: {
            ...existing,
            quantity: existing.quantity + (initialQty !== undefined ? initialQty : 1)
          }
        };
      }
      return {
        ...prev,
        [product.id]: {
          ...product,
          quantity: qtyToAdd,
          isUnitItem: isUnit ?? false
        }
      };
    });
  };

  const updateQuantity = (id: number, newQty: number) => {
    if (newQty < 25) {
      removeFromCart(id);
      return;
    }
    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      return {
        ...prev,
        [id]: { ...item, quantity: newQty }
      };
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const handleAddMultipleToCart = (items: { product: Product; quantity: number }[]) => {
    setCart(prev => {
      const nextCart = { ...prev };
      items.forEach(({ product, quantity }) => {
        const existing = nextCart[product.id];
        if (existing) {
          nextCart[product.id] = {
            ...existing,
            quantity: existing.quantity + quantity
          };
        } else {
          nextCart[product.id] = {
            ...product,
            quantity,
            isUnitItem: false
          };
        }
      });
      return nextCart;
    });
    setIsCartOpen(true);
  };

  const handleAddCustomItemToCart = (customItem: CartItem) => {
    setCart(prev => ({
      ...prev,
      [customItem.id]: customItem
    }));
    setIsCartOpen(true);
  };

  const handleDownloadCartPdf = () => {
    const itemsList = Object.values(cart) as CartItem[];
    if (itemsList.length === 0) return;

    generateOrderPdf({
      items: itemsList,
      total: cartTotal,
      pixKey: globalSettings.pixKey,
      pickupAddress: globalSettings.pickupAddress,
      contactPhone: globalSettings.contactPhone,
      isFormalProposal: true
    });
  };

  // Fetch Inventory and Reviews for Admin
  useEffect(() => {
    if (view === 'admin' && isAdmin) {
      const unsubInv = onSnapshot(collection(db, 'inventory'), (snap) => {
        const costs: Record<string, number> = {};
        snap.docs.forEach(d => {
          costs[d.data().productName] = d.data().costPerUnit;
        });
        setProductCosts(costs);
      }, (err) => {
        console.error("Admin Inventory Listener error:", err);
      });

      const unsubIngredients = onSnapshot(collection(db, 'ingredients'), (snap) => {
        setIngredients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Admin Ingredients Listener error:", err);
      });

      const unsubRecipes = onSnapshot(collection(db, 'recipes'), (snap) => {
        const r: Record<string, any> = {};
        snap.docs.forEach(d => {
          r[d.data().productName] = d.data().ingredients;
        });
        setRecipes(r);
      }, (err) => {
        console.error("Admin Recipes Listener error:", err);
      });

      const unsubReviews = onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), (snap) => {
        setAllReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Admin Reviews Listener error:", err);
      });

      const unsubCustomerNotes = onSnapshot(collection(db, 'customer_notes'), (snap) => {
        const notesMap: Record<string, CustomerNoteData> = {};
        snap.docs.forEach(d => {
          notesMap[d.id] = d.data() as CustomerNoteData;
        });
        setCustomerNotes(notesMap);
      }, (err) => {
        console.warn("Customer notes notice:", err);
      });

      const unsubAuditLogs = onSnapshot(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100)), (snap) => {
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
        setAuditLogs(logs);
      }, (err) => {
        console.warn("Audit logs notice:", err);
      });

      return () => {
        unsubInv();
        unsubIngredients();
        unsubRecipes();
        unsubReviews();
        unsubCustomerNotes();
        unsubAuditLogs();
      };
    }
  }, [view, isAdmin]);

  // Global Ready Boxes Listener (Public)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ready_boxes'), (snap) => {
      const boxes = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReadyBox));
      setReadyBoxes(boxes);
    }, (err) => {
      console.warn("Ready boxes notice:", err);
    });
    return () => unsub();
  }, []);

  const handleSaveReadyBox = async (boxData: Partial<ReadyBox> & { id?: string }) => {
    try {
      const { setDoc, addDoc } = await import('firebase/firestore');
      const cleanData = cleanFirestoreData(boxData);
      
      if (cleanData.id) {
        const boxId = cleanData.id;
        const { id, ...rest } = cleanData;
        await setDoc(doc(db, 'ready_boxes', boxId), {
          ...rest,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Optimistic UI update
        setReadyBoxes(prev => prev.map(b => b.id === boxId ? { ...b, ...rest } as ReadyBox : b));
      } else {
        const { id, ...rest } = cleanData;
        const docRef = await addDoc(collection(db, 'ready_boxes'), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Optimistic UI update
        setReadyBoxes(prev => [{ id: docRef.id, ...rest } as ReadyBox, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save ready box", err);
      throw err;
    }
  };

  const handleDeleteReadyBox = async (id: string) => {
    if (!window.confirm("Excluir esta caixinha de pronta entrega?")) return;
    try {
      await deleteDoc(doc(db, 'ready_boxes', id));
      setReadyBoxes(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error("Failed to delete ready box", err);
    }
  };

  const handleUpdateReadyBoxQuantity = async (id: string, newQuantity: number) => {
    try {
      setReadyBoxes(prev => prev.map(b => b.id === id ? { ...b, quantityAvailable: newQuantity } : b));
      await updateDoc(doc(db, 'ready_boxes', id), {
        quantityAvailable: newQuantity,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to update quantity", err);
    }
  };

  const handleToggleReadyBoxActive = async (id: string, currentActive: boolean) => {
    try {
      setReadyBoxes(prev => prev.map(b => b.id === id ? { ...b, active: !currentActive } : b));
      await updateDoc(doc(db, 'ready_boxes', id), {
        active: !currentActive,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to toggle ready box", err);
    }
  };

  const handleSaveCustomerNotes = async (phoneKey: string, noteData: CustomerNoteData) => {
    try {
      const { setDoc } = await import('firebase/firestore');
      const cleanKey = phoneKey.replace(/\D/g, '') || phoneKey.replace(/\s+/g, '_').toLowerCase();
      const cleanData = cleanFirestoreData(noteData);
      await setDoc(doc(db, 'customer_notes', cleanKey), {
        ...cleanData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to save customer notes", err);
      throw err;
    }
  };

  const handleSaveCoupon = async (couponData: Partial<Coupon> & { id?: string }) => {
    try {
      const { setDoc, addDoc } = await import('firebase/firestore');
      const code = (couponData.code || '').trim().toUpperCase();
      if (!code) throw new Error('Código do cupom é obrigatório');

      const cleanData = cleanFirestoreData(couponData);

      if (cleanData.id) {
        const { id, ...rest } = cleanData;
        await setDoc(doc(db, 'coupons', id), {
          ...rest,
          code,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        const { id, ...rest } = cleanData;
        await addDoc(collection(db, 'coupons'), {
          ...rest,
          code,
          usageCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      alert(`Cupom "${code}" salvo com sucesso!`);
    } catch (err: any) {
      console.error("Failed to save coupon", err);
      alert(`Erro ao salvar cupom: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este cupom?")) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (err: any) {
      console.error("Failed to delete coupon", err);
      alert(`Erro ao excluir cupom: ${err.message}`);
    }
  };

  const handleToggleCouponActive = async (id: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, 'coupons', id), {
        active: !currentActive,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to toggle coupon", err);
    }
  };

  const handleReadyBoxOrderSubmit = async (orderDetails: OrderDetails, items: any[], total: number, boxId?: string) => {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        customerName: orderDetails.name,
        customerPhone: orderDetails.phone || '',
        date: orderDetails.date,
        time: orderDetails.time,
        items,
        subtotal: total,
        discountAmount: 0,
        deliveryFee: 0,
        deliveryType: 'pickup',
        deliveryAddress: '',
        total,
        paymentMethod: orderDetails.paymentMethod,
        changeAmount: orderDetails.changeAmount || '',
        notes: orderDetails.notes || '[PRONTA ENTREGA DE HOJE]',
        createdAt: serverTimestamp(),
        status: 'pending',
        isReadyBoxOrder: true
      });

      // Safely decrement quantity of the ready box if boxId provided
      if (boxId) {
        try {
          const targetBox = readyBoxes.find(b => b.id === boxId);
          if (targetBox && targetBox.quantityAvailable > 0) {
            const nextQty = Math.max(0, targetBox.quantityAvailable - 1);
            await updateDoc(doc(db, 'ready_boxes', boxId), {
              quantityAvailable: nextQty,
              updatedAt: serverTimestamp()
            });
            setReadyBoxes(prev => prev.map(b => b.id === boxId ? { ...b, quantityAvailable: nextQty } : b));
          }
        } catch (boxErr) {
          console.warn("Could not auto-decrement box quantity:", boxErr);
        }
      }

      const existingIds = JSON.parse(localStorage.getItem('myOrderIds') || '[]');
      localStorage.setItem('myOrderIds', JSON.stringify([docRef.id, ...existingIds]));
      
      if (globalSettings.enableOrderSoundNotification) {
        playNewOrderNotification();
      }
    } catch (err) {
      console.error("Failed to save ready box order", err);
      throw err;
    }
  };

  const updateProductCost = async (productName: string, costPerUnit: number) => {
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'inventory', productName.replace(/\//g, '_')), {
        productName,
        costPerUnit,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update cost", err);
    }
  };

  const updateIngredient = async (id: string | null, data: any) => {
    try {
      const { setDoc, addDoc } = await import('firebase/firestore');
      const cleanData = cleanFirestoreData(data);
      if (id) {
        await setDoc(doc(db, 'ingredients', id), { ...cleanData, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await addDoc(collection(db, 'ingredients'), { ...cleanData, updatedAt: serverTimestamp() });
      }
    } catch (err) {
      console.error("Failed to update ingredient", err);
    }
  };

  const updateRecipe = async (productName: string, recipeItems: any[]) => {
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'recipes', productName.replace(/\//g, '_')), {
        productName,
        ingredients: recipeItems.map(item => cleanFirestoreData(item)),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update recipe", err);
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!window.confirm("Excluir este ingrediente?")) return;
    try {
      await deleteDoc(doc(db, 'ingredients', id));
    } catch (err) {
      console.error(err);
    }
  };

  const moderateReview = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { status });
    } catch (err) {
      console.error("Failed to moderate review", err);
    }
  };

  const replyReview = async (reviewId: string, replyText: string) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        adminReply: replyText.trim(),
        adminReplyAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to reply to review", err);
      throw err;
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!window.confirm("Excluir esta avaliação permanentemente?")) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  };

  const deleteAuditLog = async (id: string) => {
    if (!window.confirm("Excluir este registro de auditoria?")) return;
    try {
      await deleteDoc(doc(db, 'audit_logs', id));
    } catch (err) {
      console.error("Failed to delete audit log", err);
    }
  };

  const clearAllAuditLogs = async () => {
    if (!window.confirm("Atenção: Deseja realmente limpar todo o histórico de logs de auditoria de configurações?")) return;
    try {
      const snap = await getDocs(collection(db, 'audit_logs'));
      const batchPromises = snap.docs.map(d => deleteDoc(doc(db, 'audit_logs', d.id)));
      await Promise.all(batchPromises);
    } catch (err) {
      console.error("Failed to clear audit logs", err);
    }
  };

  const cartTotal = useMemo(() => {
    return (Object.values(cart) as CartItem[]).reduce((acc, item) => {
      const price = getProductUnitPrice(item);
      return acc + (price * item.quantity);
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return Object.keys(cart).length;
  }, [cart]);

  const handleOrderCompleted = async (orderDetails: OrderDetails) => {
    const items = (Object.values(cart) as CartItem[]).map(item => {
      const price = getProductUnitPrice(item);
      return {
        name: item.name,
        quantity: item.quantity,
        price,
        isUnitItem: item.isUnitItem
      };
    });

    const finalCalculatedTotal = orderDetails.finalTotal !== undefined 
      ? orderDetails.finalTotal 
      : Math.max(0, cartTotal - (orderDetails.discountAmount || 0) - (orderDetails.couponDiscount || 0) + (orderDetails.deliveryFee || 0));

    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        customerName: orderDetails.name,
        date: orderDetails.date,
        time: orderDetails.time,
        items,
        subtotal: cartTotal,
        discountAmount: orderDetails.discountAmount || 0,
        couponCode: orderDetails.couponCode || null,
        couponDiscount: orderDetails.couponDiscount || 0,
        deliveryFee: orderDetails.deliveryFee || 0,
        deliveryType: orderDetails.deliveryType || 'pickup',
        deliveryAddress: orderDetails.deliveryAddress || '',
        total: finalCalculatedTotal,
        paymentMethod: orderDetails.paymentMethod,
        changeAmount: orderDetails.changeAmount || '',
        notes: orderDetails.notes || '',
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      
      const existingIds = JSON.parse(localStorage.getItem('myOrderIds') || '[]');
      localStorage.setItem('myOrderIds', JSON.stringify([docRef.id, ...existingIds]));

      // Increment coupon usage count if applied
      if (orderDetails.couponCode) {
        const foundCoupon = coupons.find(c => c.code.toUpperCase() === orderDetails.couponCode?.toUpperCase());
        if (foundCoupon) {
          await updateDoc(doc(db, 'coupons', foundCoupon.id), {
            usageCount: (foundCoupon.usageCount || 0) + 1,
            updatedAt: serverTimestamp()
          }).catch(e => console.warn("Could not update coupon usage count:", e));
        }
      }
    } catch (err) {
      console.error("Failed to save order to database", err);
    }

    // Play chime sound notification immediately
    if (globalSettings.enableOrderSoundNotification) {
      playNewOrderNotification();
    }

    // Build customizable WhatsApp message
    const msg = buildWhatsAppMessage({
      orderDetails,
      items: Object.values(cart) as CartItem[],
      cartSubtotal: cartTotal,
      finalTotal: finalCalculatedTotal,
      discountAmount: orderDetails.discountAmount || 0,
      couponCode: orderDetails.couponCode,
      couponDiscount: orderDetails.couponDiscount || 0,
      deliveryFee: orderDetails.deliveryFee || 0,
      pickupAddress: globalSettings.pickupAddress,
      pixKey: globalSettings.pixKey,
      template: globalSettings.customWhatsAppTemplate
    });

    window.open(`https://wa.me/${globalSettings.contactPhone}?text=${encodeURIComponent(msg)}`, '_blank');

    // Clear cart and applied coupon
    setCart({});
    setAppliedCouponCode('');
    localStorage.removeItem('docesGourmetCoupon');
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand-cream text-brand-wine">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 mb-4"
        >
          <ShoppingBag className="w-full h-full" />
        </motion.div>
        <p className="font-serif text-lg italic">Sincronizando doçuras...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <X className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Ops!</h2>
        <p className="text-neutral-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-brand-wine text-white rounded-full font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-brand-cream/30 text-neutral-900">
      {/* Offline Connectivity Status Bar */}
      <OfflineIndicator />

      {/* Modular App Header with PWA Install Support */}
      <AppHeader 
        view={view}
        setView={setView}
        cartCount={cartCount}
        isAdmin={isAdmin}
        onOpenCart={() => setIsCartOpen(true)}
        instagramUrl={globalSettings.instagramUrl}
        enablePwaInstallPrompt={globalSettings.enablePwaInstallPrompt !== false}
        adminDarkMode={adminDarkMode}
        onToggleAdminDarkMode={handleToggleAdminDarkMode}
      />

      {/* Feature 5.2: Seasonal Theme Banner (when active) */}
      {globalSettings.seasonalTheme && globalSettings.seasonalTheme !== 'default' && (globalSettings.seasonalTheme as string) !== 'classic' && (
        (() => {
          const theme = getSeasonalTheme(globalSettings.seasonalTheme);
          if (!theme || theme.id === 'classic') return null;
          return (
            <div className="bg-gradient-to-r from-brand-wine via-[#68001a] to-brand-wine text-white py-2 px-4 text-center text-xs font-medium border-b border-brand-gold/30 shadow-inner flex items-center justify-center gap-2">
              <span className="text-base">{theme.iconEmoji}</span>
              <span className="font-semibold">{globalSettings.seasonalThemeBanner || theme.bannerText}</span>
              <span className="text-base">{theme.iconEmoji}</span>
            </div>
          );
        })()
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-6 md:pt-8">
        {view === 'catalog' ? (
          <>
            {/* Gourmet Hero Banner */}
            <HeroBanner 
              contactPhone={globalSettings.contactPhone}
              pickupAddress={globalSettings.pickupAddress}
              businessHours={globalSettings.businessHours}
              storeStatusText={globalSettings.storeStatusText}
              storeStatusMode={globalSettings.storeStatusMode}
              announcementBanner={globalSettings.announcementBanner}
              onOpenOrder={() => {
                const el = document.getElementById('catalog-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Feature 7: Promotional Coupon Banner */}
            <CouponBanner 
              coupons={coupons}
              couponsEnabled={globalSettings.enableCoupons !== false}
              onApplyCoupon={(code) => {
                setAppliedCouponCode(code);
                localStorage.setItem('docesGourmetCoupon', code);
                setIsCartOpen(true);
              }}
            />

            {/* Pronta Entrega / Doces de Hoje */}
            <ReadyBoxesSection 
              readyBoxes={readyBoxes} 
              globalSettings={globalSettings} 
              onSubmitOrder={handleReadyBoxOrderSubmit} 
            />

            {/* Exclusive Feature Cards: Event Calculator & Mixed Cento */}
            <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Event Sweet Calculator Card */}
              <div 
                onClick={() => setIsEventCalculatorOpen(true)}
                className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-brand-wine to-[#68001a] text-white shadow-lg border border-brand-gold/30 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1 pr-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> PLANEJADOR DE FESTAS
                  </span>
                  <h3 className="font-serif font-bold text-base sm:text-lg italic leading-tight">
                    Calculadora de Doces p/ Eventos
                  </h3>
                  <p className="text-[11px] text-brand-cream/80 leading-tight font-light">
                    Calcule na proporção de 8 doces por pessoa e monte seu pedido.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold shrink-0 group-hover:bg-brand-gold group-hover:text-brand-wine transition-colors">
                  <Calculator className="w-6 h-6" />
                </div>
              </div>

              {/* Mixed Cento Builder Card */}
              <div 
                onClick={() => setIsMixedCentoOpen(true)}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-brand-wine/15 shadow-sm hover:shadow-md hover:border-brand-wine hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1 pr-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-wine flex items-center gap-1">
                    <Layers className="w-3 h-3 text-brand-gold" /> CAIXA DE 100 UNIDADES
                  </span>
                  <h3 className="font-serif font-bold text-base sm:text-lg italic text-brand-wine leading-tight">
                    Construtor de Cento Misto
                  </h3>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Monte seu Cento escolhendo 4 sabores artesanais (25 un cada).
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-cream border border-brand-wine/10 flex items-center justify-center text-brand-wine shrink-0 group-hover:bg-brand-wine group-hover:text-brand-gold transition-colors">
                  <Package className="w-6 h-6" />
                </div>
              </div>

              {/* Formal PDF Proposal Download Card */}
              <div 
                onClick={() => {
                  if (cartCount === 0) {
                    alert("Adicione alguns itens ao seu carrinho primeiro para gerar seu orçamento formal em PDF!");
                    setIsEventCalculatorOpen(true);
                  } else {
                    handleDownloadCartPdf();
                  }
                }}
                className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#faf7f2] to-[#f4eee6] border border-brand-gold/40 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between group sm:col-span-2 lg:col-span-1"
              >
                <div className="space-y-1 pr-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-900 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-brand-gold" /> CASAMENTOS & EMPRESAS
                  </span>
                  <h3 className="font-serif font-bold text-base sm:text-lg italic text-brand-wine leading-tight">
                    Orçamento Formal em PDF
                  </h3>
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Gere uma proposta detalhada com itens, prazos e condições de reserva.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white border border-brand-gold/40 flex items-center justify-center text-brand-wine shrink-0 group-hover:bg-brand-wine group-hover:text-brand-gold transition-colors">
                  <Download className="w-6 h-6" />
                </div>
              </div>
            </section>

            {/* Quick Search & Filter Chips */}
            <section className="mb-8 space-y-4">
              <QuickSearchChips 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSelectChip={(chip) => {
                  setSearchTerm(chip);
                  setCurrentCategory('Todos');
                }}
                showWishlist={globalSettings.enableWishlist !== false}
                favoritesCount={wishlistIds.length}
              />

              {/* Category Filter Pills */}
              <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-brand-cream/95 backdrop-blur-md border-y border-brand-wine/10">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                  <FilterButton 
                    active={currentCategory === 'Todos'} 
                    onClick={() => setCurrentCategory('Todos')}
                  >
                    Todos os Doces
                  </FilterButton>
                  {catalog.map(cat => (
                    <FilterButton 
                      key={cat.category}
                      active={currentCategory === cat.category}
                      onClick={() => setCurrentCategory(cat.category)}
                    >
                      {cat.category}
                    </FilterButton>
                  ))}
                </div>
              </div>
            </section>

            {/* Product Grid */}
            <div id="catalog-grid" className="space-y-16">
              {filteredCatalog.map(group => (
                <section key={group.category}>
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-2xl md:text-3xl font-serif text-brand-wine italic font-bold">
                      {group.category}
                    </h2>
                    <div className="h-px bg-brand-gold/30 flex-grow" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {group.items.map(item => (
                      <ProductCard 
                        key={item.id}
                        item={item}
                        cartItem={cart[item.id]}
                        onAdd={(isUnit) => addToCart(item, isUnit)}
                        onUpdateQuantity={(newQty) => updateQuantity(item.id, newQty)}
                        onRemove={() => removeFromCart(item.id)}
                        onViewDetails={() => setSelectedProduct(item)}
                        contactPhone={globalSettings.contactPhone}
                        isFavorite={isWishlisted(item.id)}
                        onToggleFavorite={() => toggleWishlist(item.id)}
                        showWishlist={globalSettings.enableWishlist !== false}
                      />
                    ))}
                  </div>
                </section>
              ))}
              
              {filteredCatalog.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm max-w-lg mx-auto">
                  <p className="text-neutral-500 font-serif italic text-lg mb-4">
                    Nenhuma doçura encontrada para "{searchTerm}"
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentCategory('Todos');
                    }}
                    className="px-6 py-2.5 bg-brand-wine text-brand-gold text-xs font-bold rounded-full shadow-sm hover:bg-brand-wine/90 transition-all"
                  >
                    Ver Todos os Doces
                  </button>
                </div>
              )}
            </div>
          </>
        ) : view === 'admin' ? (
          <div className={cn("transition-colors duration-200", adminDarkMode && "admin-dark")}>
            <AdminView 
              orders={adminOrders} 
              loading={loadingOrders} 
              onUpdateStatus={updateOrderStatus} 
              onDeletePermanent={permanentlyDeleteOrder}
              productCosts={productCosts}
              onUpdateCost={updateProductCost}
              ingredients={ingredients}
              onUpdateIngredient={updateIngredient}
              onDeleteIngredient={deleteIngredient}
              recipes={recipes}
              onUpdateRecipe={updateRecipe}
              reviews={allReviews}
              onModerateReview={moderateReview}
              onDeleteReview={deleteReview}
              onReplyReview={replyReview}
              catalog={catalog}
              globalSettings={globalSettings}
              onUpdateSettings={updateGlobalSettings}
              readyBoxes={readyBoxes}
              onSaveReadyBox={handleSaveReadyBox}
              onDeleteReadyBox={handleDeleteReadyBox}
              onUpdateReadyBoxQuantity={handleUpdateReadyBoxQuantity}
              onToggleReadyBoxActive={handleToggleReadyBoxActive}
              customerNotes={customerNotes}
              onSaveCustomerNotes={handleSaveCustomerNotes}
              coupons={coupons}
              onSaveCoupon={handleSaveCoupon}
              onDeleteCoupon={handleDeleteCoupon}
              onToggleCouponActive={handleToggleCouponActive}
              auditLogs={auditLogs}
              onDeleteAuditLog={deleteAuditLog}
              onClearAuditLogs={clearAllAuditLogs}
              adminDarkMode={adminDarkMode}
              onToggleAdminDarkMode={handleToggleAdminDarkMode}
            />
          </div>
        ) : (
          <TrackingView orders={myOrders} onBack={() => setView('catalog')} />
        )}
      </main>

      {/* Modular Footer */}
      <AppFooter 
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        instagramUrl={globalSettings.instagramUrl}
      />

      {/* Floating Cart Button / Bottom Bar (Mobile) */}
      <AnimatePresence>
        {cartCount > 0 && view === 'catalog' && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-4 left-3 right-3 md:hidden z-30"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full flex items-center justify-between p-3.5 bg-brand-wine text-white rounded-2xl shadow-2xl border border-brand-gold/40 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-gold text-brand-wine text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-wine">
                    {cartCount}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-gold">Seu Pedido</p>
                  <p className="text-xs font-black text-white/95">{cartCount} {cartCount === 1 ? 'item adicionado' : 'itens adicionados'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl">
                <span className="text-sm font-black text-brand-gold">{formatCurrency(cartTotal)}</span>
                <ChevronRight className="w-4 h-4 text-white/80" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modular Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onDownloadPdf={handleDownloadCartPdf}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        coupons={coupons}
        appliedCouponCode={appliedCouponCode}
        onApplyCoupon={(code) => {
          setAppliedCouponCode(code);
          if (code) localStorage.setItem('docesGourmetCoupon', code);
          else localStorage.removeItem('docesGourmetCoupon');
        }}
        enableCoupons={globalSettings.enableCoupons}
      />

      {/* Product Details & Lightbox Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailsModal
            product={selectedProduct}
            cartItem={cart[selectedProduct.id]}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={(prod, isUnit, qty) => addToCart(prod, isUnit, qty)}
            onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
            onRemoveFromCart={(id) => removeFromCart(id)}
            contactPhone={globalSettings.contactPhone}
            isFavorite={isWishlisted(selectedProduct.id)}
            onToggleFavorite={() => toggleWishlist(selectedProduct.id)}
            showWishlist={globalSettings.enableWishlist !== false}
          />
        )}
      </AnimatePresence>

      {/* Event Sweet Calculator Modal */}
      <AnimatePresence>
        {isEventCalculatorOpen && (
          <EventSweetCalculatorModal
            isOpen={isEventCalculatorOpen}
            onClose={() => setIsEventCalculatorOpen(false)}
            catalog={catalog}
            onAddMultipleToCart={handleAddMultipleToCart}
          />
        )}
      </AnimatePresence>

      {/* Mixed Cento Builder Modal */}
      <AnimatePresence>
        {isMixedCentoOpen && (
          <MixedCentoModal
            isOpen={isMixedCentoOpen}
            onClose={() => setIsMixedCentoOpen(false)}
            catalog={catalog}
            onAddCustomItemToCart={handleAddCustomItemToCart}
          />
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            cart={cart}
            cartTotal={cartTotal}
            contactPhone={globalSettings.contactPhone}
            pixKey={globalSettings.pixKey}
            pickupAddress={globalSettings.pickupAddress}
            minNoticeHours={globalSettings.minNoticeHours || 48}
            blockedDates={globalSettings.blockedDates || []}
            deliveryMode={globalSettings.deliveryMode}
            deliveryFeeType={globalSettings.deliveryFeeType}
            deliveryFixedFee={globalSettings.deliveryFixedFee}
            freeDeliveryThreshold={globalSettings.freeDeliveryThreshold}
            enableVolumeDiscount={globalSettings.enableVolumeDiscount}
            volumeDiscountMinItems={globalSettings.volumeDiscountMinItems}
            volumeDiscountPercent={globalSettings.volumeDiscountPercent}
            volumeDiscountMessage={globalSettings.volumeDiscountMessage}
            customWhatsAppTemplate={globalSettings.customWhatsAppTemplate}
            coupons={coupons}
            appliedCouponCode={appliedCouponCode}
            onApplyCoupon={(code) => {
              setAppliedCouponCode(code);
              if (code) localStorage.setItem('docesGourmetCoupon', code);
              else localStorage.removeItem('docesGourmetCoupon');
            }}
            enableCoupons={globalSettings.enableCoupons}
            onOrderCompleted={handleOrderCompleted}
          />
        )}
      </AnimatePresence>

      {/* Customer Review & Reward Modal */}
      <CustomerReviewModal 
        isOpen={reviewModalData.isOpen}
        onClose={() => {
          setReviewModalData({ isOpen: false });
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
        orderId={reviewModalData.orderId}
        customerName={reviewModalData.customerName}
        globalSettings={globalSettings}
      />
    </div>
  );
}

const FilterButton: React.FC<{ children: React.ReactNode, active: boolean, onClick: () => void }> = ({ children, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 sm:px-6 py-2 rounded-full whitespace-nowrap font-bold transition-all text-xs sm:text-sm border shrink-0 active:scale-95",
        active 
          ? "bg-brand-wine text-brand-gold border-brand-wine shadow-md shadow-brand-wine/25 scale-[1.02]" 
          : "bg-white text-neutral-600 border-neutral-200 hover:border-brand-wine/30 hover:bg-brand-wine/5"
      )}
    >
      {children}
    </button>
  );
};

export function FormField({ label, children, icon }: { label: string, children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
        {icon && <span className="text-brand-wine">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

function calculateProductCost(productName: string, productCosts: Record<string, number>, ingredients: any[], recipes: Record<string, any[]>) {
  const recipe = recipes[productName];
  if (recipe && recipe.length > 0) {
    // Reduzimos os itens da receita somando (custo do ingrediente * quantidade usada)
    const cost = recipe.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (!ing) return total;
      
      // Precisão: garantimos que o custo unitário do ingrediente é aplicado pela quantidade exata
      return total + (ing.costPerUnit * item.quantity);
    }, 0);
    return cost;
  }
  // Se não houver receita, retorna o custo fixo definido manualmente ou zero
  return productCosts[productName] || 0;
}

function AdminView({ 
  orders, 
  loading, 
  onUpdateStatus, 
  onDeletePermanent,
  productCosts,
  onUpdateCost,
  ingredients,
  onUpdateIngredient,
  onDeleteIngredient,
  recipes,
  onUpdateRecipe,
  reviews,
  onModerateReview,
  onDeleteReview,
  onReplyReview,
  catalog,
  globalSettings,
  onUpdateSettings,
  readyBoxes = [],
  onSaveReadyBox,
  onDeleteReadyBox,
  onUpdateReadyBoxQuantity,
  onToggleReadyBoxActive,
  customerNotes = {},
  onSaveCustomerNotes,
  coupons = [],
  onSaveCoupon,
  onDeleteCoupon,
  onToggleCouponActive,
  auditLogs = [],
  onDeleteAuditLog,
  onClearAuditLogs,
  adminDarkMode = false,
  onToggleAdminDarkMode
}: { 
  orders: any[], 
  loading: boolean, 
  onUpdateStatus: (id: string, status: string) => void, 
  onDeletePermanent: (id: string) => void,
  productCosts: Record<string, number>,
  onUpdateCost: (name: string, cost: number) => void,
  ingredients: any[],
  onUpdateIngredient: (id: string | null, data: any) => void,
  onDeleteIngredient: (id: string) => void,
  recipes: Record<string, any[]>,
  onUpdateRecipe: (productName: string, items: any[]) => void,
  reviews: any[],
  onModerateReview: (id: string, status: 'approved' | 'rejected') => void,
  onDeleteReview: (id: string) => void,
  onReplyReview?: (id: string, replyText: string) => Promise<void>,
  catalog: any[],
  globalSettings: any,
  onUpdateSettings: (data: any) => void,
  readyBoxes?: ReadyBox[],
  onSaveReadyBox?: (box: Partial<ReadyBox> & { id?: string }) => Promise<void>,
  onDeleteReadyBox?: (id: string) => Promise<void>,
  onUpdateReadyBoxQuantity?: (id: string, qty: number) => Promise<void>,
  onToggleReadyBoxActive?: (id: string, active: boolean) => Promise<void>,
  customerNotes?: Record<string, CustomerNoteData>,
  onSaveCustomerNotes?: (phoneKey: string, noteData: CustomerNoteData) => Promise<void>,
  coupons?: Coupon[],
  onSaveCoupon?: (couponData: Partial<Coupon> & { id?: string }) => Promise<void>,
  onDeleteCoupon?: (id: string) => Promise<void>,
  onToggleCouponActive?: (id: string, active: boolean) => Promise<void>,
  auditLogs?: AuditLog[],
  onDeleteAuditLog?: (id: string) => void,
  onClearAuditLogs?: () => void,
  adminDarkMode?: boolean,
  onToggleAdminDarkMode?: () => void
}) {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'year' | 'trash'>('all');
  const [filterOverduePendingOnly, setFilterOverduePendingOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'production' | 'ready_boxes' | 'calculator' | 'crm' | 'coupons' | 'inventory' | 'quick_replies' | 'reviews' | 'settings'>('orders');

  // Pending orders without updates for > 24 hours
  const overduePendingOrders = useMemo(() => {
    const now = Date.now();
    return orders.filter(o => {
      if (o.status !== 'pending') return false;
      let lastActivityMs: number | null = null;
      if (o.updatedAt?.toDate) {
        lastActivityMs = o.updatedAt.toDate().getTime();
      } else if (o.updatedAt?.seconds) {
        lastActivityMs = o.updatedAt.seconds * 1000;
      } else if (o.createdAt?.toDate) {
        lastActivityMs = o.createdAt.toDate().getTime();
      } else if (o.createdAt?.seconds) {
        lastActivityMs = o.createdAt.seconds * 1000;
      } else if (o.date) {
        const parsed = new Date(`${o.date}T${o.time || '12:00'}`).getTime();
        if (!isNaN(parsed)) lastActivityMs = parsed;
      }
      if (!lastActivityMs) return false;
      const diffHours = (now - lastActivityMs) / (1000 * 60 * 60);
      return diffHours >= 24;
    });
  }, [orders]);

  useEffect(() => {
    if (overduePendingOrders.length === 0 && filterOverduePendingOnly) {
      setFilterOverduePendingOnly(false);
    }
  }, [overduePendingOrders.length, filterOverduePendingOnly]);

  const filteredOrders = useMemo(() => {
    if (filterOverduePendingOnly) {
      return overduePendingOrders;
    }
    const now = new Date();
    return orders.filter(order => {
      if (periodFilter === 'trash') {
        return order.status === 'deleted';
      }
      if (order.status === 'deleted') return false;
      if (periodFilter === 'all') return true;
      const orderDate = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date();
      if (periodFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return orderDate >= oneWeekAgo;
      }
      if (periodFilter === 'month') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      if (periodFilter === 'year') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, periodFilter, filterOverduePendingOnly, overduePendingOrders]);

  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'deleted');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Calculate costs
    let totalCost = 0;
    activeOrders.forEach(order => {
      order.items.forEach((item: any) => {
        const costPerUnit = calculateProductCost(item.name, productCosts, ingredients, recipes);
        totalCost += (costPerUnit * item.quantity);
      });
    });

    const netRevenue = totalRevenue - totalCost;
    const count = activeOrders.length;
    return { totalRevenue, netRevenue, count, totalCost };
  }, [orders, productCosts, ingredients, recipes]);

  // Today's active production count
  const todayProductionCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return orders.filter(o => o.status !== 'deleted' && o.status !== 'delivered' && o.date === todayStr).length;
  }, [orders]);

  const activeReadyBoxesCount = useMemo(() => {
    return readyBoxes.filter(b => b.active && b.quantityAvailable > 0).length;
  }, [readyBoxes]);

  const uniqueCustomersCount = useMemo(() => {
    const phoneSet = new Set<string>();
    orders.forEach(o => {
      if (o.customerPhone) phoneSet.add(o.customerPhone.replace(/\D/g, ''));
    });
    return phoneSet.size;
  }, [orders]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-brand-wine font-serif italic animate-pulse">Carregando dados adm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-serif text-brand-wine italic font-bold">Área Administrativa</h2>
            {onToggleAdminDarkMode && (
              <button
                type="button"
                onClick={onToggleAdminDarkMode}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer",
                  adminDarkMode 
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30" 
                    : "bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200"
                )}
                title={adminDarkMode ? "Alternar para Modo Diurno" : "Ativar Modo Noturno (Reduz o cansaço visual)"}
              >
                {adminDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Modo Noite</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">Modo Noite</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-neutral-500 text-sm">Gerencie pedidos, produção, pronta entrega, lucratividade e clientes.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap p-1.5 bg-neutral-100 rounded-2xl gap-1">
          <button 
            type="button"
            onClick={() => {
              setActiveTab('orders');
              if (filterOverduePendingOnly) setFilterOverduePendingOnly(false);
            }}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'orders' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Package className="w-3.5 h-3.5" />
            Pedidos ({orders.filter(o => o.status !== 'deleted').length})
            {overduePendingOrders.length > 0 && (
              <span 
                className="px-1.5 py-0.5 bg-rose-600 text-white font-black text-[9px] rounded-full animate-pulse flex items-center gap-0.5 shadow-xs"
                title={`${overduePendingOrders.length} pedido(s) pendente(s) há mais de 24h sem atualização`}
              >
                <AlertTriangle className="w-2.5 h-2.5 text-amber-200" />
                {overduePendingOrders.length}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('production')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'production' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <ChefHat className="w-3.5 h-3.5 text-brand-gold" />
            Produção
            {todayProductionCount > 0 && (
              <span className="px-1.5 py-0.5 bg-brand-gold text-brand-wine font-black text-[9px] rounded-full animate-pulse">
                {todayProductionCount}
              </span>
            )}
          </button>

          {/* Feature 4: Pronta Entrega / Doces de Hoje */}
          <button 
            type="button"
            onClick={() => setActiveTab('ready_boxes')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'ready_boxes' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Doces de Hoje
            {activeReadyBoxesCount > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white font-black text-[9px] rounded-full">
                {activeReadyBoxesCount}
              </span>
            )}
          </button>

          {/* Feature 2: Calculadora Reversa de Lucro & Panela */}
          <button 
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'calculator' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Calculator className="w-3.5 h-3.5 text-brand-gold" />
            Calc. Lucro Real
          </button>

          {/* Feature 5: CRM do Cliente & Histórico */}
          <button 
            type="button"
            onClick={() => setActiveTab('crm')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'crm' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            CRM Clientes
            {uniqueCustomersCount > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-black text-[9px] rounded-full">
                {uniqueCustomersCount}
              </span>
            )}
          </button>

          {/* Feature 7: Cupons & Descontos */}
          <button 
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'coupons' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Tag className="w-3.5 h-3.5 text-brand-gold" />
            Cupons
            {coupons.filter(c => c.active).length > 0 && (
              <span className="px-1.5 py-0.5 bg-brand-gold text-brand-wine font-black text-[9px] rounded-full">
                {coupons.filter(c => c.active).length}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'inventory' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Estoque
          </button>

          {/* Feature 1: Respostas Rápidas de WhatsApp */}
          <button 
            type="button"
            onClick={() => setActiveTab('quick_replies')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'quick_replies' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            WhatsApp
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'reviews' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Star className="w-3.5 h-3.5" />
            Avaliações
            {reviews.filter(r => r.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white font-black text-[8px] rounded-full">
                {reviews.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'settings' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            Configurações
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          {/* Alerta Visual: Pedidos Pendentes há mais de 24h sem atualização */}
          {overduePendingOrders.length > 0 && (
            <div className="p-5 bg-gradient-to-r from-rose-50 via-amber-50/70 to-rose-50 border-2 border-rose-400/80 rounded-3xl shadow-sm space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shrink-0 animate-bounce">
                    <AlertTriangle className="w-6 h-6 text-amber-200" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-rose-950 text-base sm:text-lg flex items-center gap-2">
                        <span>Atenção:</span>
                        <span className="text-rose-600 underline decoration-rose-400 underline-offset-4">
                          {overduePendingOrders.length} {overduePendingOrders.length === 1 ? 'pedido pendente' : 'pedidos pendentes'}
                        </span>
                        <span>sem atualização há mais de 24 horas!</span>
                      </h4>
                      <span className="px-2.5 py-0.5 bg-rose-200 text-rose-900 text-[10px] font-black uppercase tracking-wider rounded-full border border-rose-300 shadow-2xs">
                        Prioridade de Atendimento
                      </span>
                    </div>
                    <p className="text-xs text-rose-900/80 max-w-3xl">
                      Estes clientes enviaram o pedido e ainda não receberam confirmação ou mudança de status há mais de 24 horas. Verifique para garantir que nenhum cliente fique sem resposta!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setFilterOverduePendingOnly(prev => !prev)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-2",
                      filterOverduePendingOnly 
                        ? "bg-rose-950 text-white hover:bg-black ring-2 ring-rose-400" 
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
                    )}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                    <span>{filterOverduePendingOnly ? "Ver Todos os Pedidos" : `Filtrar (${overduePendingOrders.length}) Urgentes`}</span>
                  </button>
                </div>
              </div>

              {/* Lista dos clientes aguardando há mais de 24 horas */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-rose-200/70">
                <span className="text-[11px] font-black text-rose-900 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  Aguardando resposta:
                </span>
                {overduePendingOrders.map(o => {
                  let hoursAgo = 24;
                  const lastMs = o.updatedAt?.toDate ? o.updatedAt.toDate().getTime() 
                    : o.updatedAt?.seconds ? o.updatedAt.seconds * 1000 
                    : o.createdAt?.toDate ? o.createdAt.toDate().getTime()
                    : o.createdAt?.seconds ? o.createdAt.seconds * 1000
                    : Date.now() - 24 * 3600 * 1000;
                  hoursAgo = Math.floor((Date.now() - lastMs) / (3600 * 1000));
                  return (
                    <span 
                      key={o.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 border border-rose-200/90 rounded-xl text-xs text-rose-950 font-bold shadow-2xs"
                    >
                      <span>{o.customerName || 'Cliente'}</span>
                      <span className="text-[10px] text-rose-700 font-black bg-rose-100/90 px-1.5 py-0.5 rounded-md border border-rose-200">
                        {hoursAgo >= 48 ? `${Math.floor(hoursAgo / 24)}d atrás` : `+${hoursAgo}h atrás`}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Bar: Period Filters + Export Buttons (Item 4) */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm">
            {/* Period Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-neutral-400 mr-1">Período:</span>
              {(['all', 'week', 'month', 'year', 'trash'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodFilter(p)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5",
                    periodFilter === p 
                      ? "bg-brand-gold text-brand-wine border-brand-gold shadow-sm font-black" 
                      : (p === 'trash' ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100")
                  )}
                >
                  {p === 'trash' && <Trash2 className="w-3 h-3" />}
                  {p === 'all' ? 'Tudo' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : p === 'year' ? 'Ano' : 'Lixeira'}
                </button>
              ))}
            </div>

            {/* Item 4: Export Buttons (Excel .csv & Professional PDF) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportSalesToCsv({
                  orders: filteredOrders,
                  productCosts,
                  ingredients,
                  recipes,
                  periodName: periodFilter === 'all' ? 'Geral Completo' : periodFilter === 'week' ? 'Última Semana' : periodFilter === 'month' ? 'Mês Atual' : periodFilter === 'year' ? 'Ano Atual' : 'Lixeira',
                  globalSettings
                })}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                title="Exportar planilha compatível com Excel e Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Exportar Excel (.csv)
              </button>

              <button
                type="button"
                onClick={() => exportSalesToPdf({
                  orders: filteredOrders,
                  productCosts,
                  ingredients,
                  recipes,
                  periodName: periodFilter === 'all' ? 'Geral Completo' : periodFilter === 'week' ? 'Última Semana' : periodFilter === 'month' ? 'Mês Atual' : periodFilter === 'year' ? 'Ano Atual' : 'Lixeira',
                  globalSettings
                })}
                className="px-3.5 py-2 bg-brand-wine hover:bg-black text-brand-gold rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                title="Gerar Relatório Executivo e Financeiro em PDF"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar PDF (Relatório)
              </button>

              {globalSettings.enableConsolidatedReports !== false && (
                <button
                  type="button"
                  onClick={() => exportConsolidatedDREClosingReportPdf({
                    orders: filteredOrders,
                    productCosts,
                    ingredients,
                    recipes,
                    periodName: periodFilter === 'all' ? 'Geral Completo' : periodFilter === 'week' ? 'Última Semana' : periodFilter === 'month' ? 'Mês Atual' : periodFilter === 'year' ? 'Ano Atual' : 'Lixeira',
                    globalSettings
                  })}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                  title="Exportar Demonstrativo de Resultado (DRE) e Balanço Consolidado em PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-200" />
                  Fechamento DRE (PDF)
                </button>
              )}
            </div>
          </div>

          {periodFilter !== 'trash' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Faturamento Bruto" value={formatCurrency(stats.totalRevenue)} color="neutral" />
              <StatCard label="Lucro Líquido Real" value={formatCurrency(stats.netRevenue)} color="wine" />
              <StatCard label="Pedidos Concluídos" value={`${stats.count} pedidos`} color="gold" />
            </div>
          )}

          {periodFilter !== 'trash' && <AdminCharts orders={orders} productCosts={productCosts} ingredients={ingredients} recipes={recipes} />}

          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-[32px] bg-white">
                <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-400 font-serif italic">Nenhum pedido encontrado neste período.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <AdminOrderCard 
                  key={order.id} 
                  order={order} 
                  globalSettings={globalSettings}
                  onUpdateStatus={onUpdateStatus} 
                  onDeletePermanent={onDeletePermanent}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Item 3: AdminProductionTab (Ficha de Produção / Cozinha) */}
      {activeTab === 'production' && (
        <AdminProductionTab 
          orders={orders}
          catalog={catalog}
          onUpdateStatus={onUpdateStatus}
          enableProductionCalendar={globalSettings.enableProductionCalendar !== false}
          enablePredictiveStockAlerts={globalSettings.enablePredictiveStockAlerts !== false}
          ingredients={ingredients}
          recipes={recipes}
        />
      )}

      {/* Feature 4: Pronta Entrega / Doces de Hoje */}
      {activeTab === 'ready_boxes' && (
        <AdminReadyBoxesTab 
          readyBoxes={readyBoxes}
          onSaveBox={onSaveReadyBox || (async () => {})}
          onDeleteBox={onDeleteReadyBox || (async () => {})}
          onUpdateQuantity={onUpdateReadyBoxQuantity || (async () => {})}
          onToggleActive={onToggleReadyBoxActive || (async () => {})}
        />
      )}

      {/* Feature 2: Calculadora Reversa de Preço & Lucro Real */}
      {activeTab === 'calculator' && (
        <AdminBatchCostCalculator 
          ingredients={ingredients}
          catalog={catalog}
        />
      )}

      {/* Feature 5: CRM do Cliente & Histórico */}
      {activeTab === 'crm' && (
        <AdminCrmTab 
          orders={orders}
          customerNotes={customerNotes}
          onSaveCustomerNotes={onSaveCustomerNotes}
          globalSettings={globalSettings}
        />
      )}

      {/* Feature 7: Cupons de Desconto & Fidelidade */}
      {activeTab === 'coupons' && (
        <AdminCouponsTab 
          coupons={coupons}
          onSaveCoupon={onSaveCoupon || (async () => {})}
          onDeleteCoupon={onDeleteCoupon || (async () => {})}
          onToggleCouponActive={onToggleCouponActive || (async () => {})}
          globalSettings={globalSettings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {/* Item 1, 2, 5 & 6: AdminInventoryTab */}
      {activeTab === 'inventory' && (
        <AdminInventoryTab 
          orders={orders} 
          productCosts={productCosts} 
          onUpdateCost={onUpdateCost} 
          ingredients={ingredients} 
          onUpdateIngredient={onUpdateIngredient} 
          onDeleteIngredient={onDeleteIngredient} 
          recipes={recipes} 
          onUpdateRecipe={onUpdateRecipe} 
          catalog={catalog} 
          globalMinStockAlert={globalSettings.globalMinStockAlert}
          enablePredictiveStockAlerts={globalSettings.enablePredictiveStockAlerts !== false}
        />
      )}

      {/* Feature 1: Central de Respostas Rápidas de WhatsApp */}
      {activeTab === 'quick_replies' && (
        <AdminQuickRepliesTab 
          settings={globalSettings}
          onSaveSettings={onUpdateSettings}
        />
      )}

      {activeTab === 'reviews' && (
        <AdminReviewsTab 
          reviews={reviews} 
          onModerate={onModerateReview} 
          onDelete={onDeleteReview} 
          onReply={onReplyReview}
          globalSettings={globalSettings}
        />
      )}

      {activeTab === 'settings' && (
        <AdminSettingsTab 
          settings={globalSettings} 
          onSave={onUpdateSettings} 
          auditLogs={auditLogs}
          onDeleteLog={onDeleteAuditLog}
          onClearLogs={onClearAuditLogs}
          adminDarkMode={adminDarkMode}
          onToggleAdminDarkMode={onToggleAdminDarkMode}
        />
      )}
    </div>
  );
}

export default App;
