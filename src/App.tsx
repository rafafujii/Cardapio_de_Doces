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
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn, formatCurrency, removeAcentos, getProductUnitPrice } from './lib/utils';
import { generateOrderPdf } from './lib/pdfGenerator';
import { exportSalesToCsv, exportSalesToPdf } from './lib/exportReports';
import { playNewOrderNotification } from './lib/audioNotifier';
import { buildWhatsAppMessage, DEFAULT_WHATSAPP_TEMPLATE } from './lib/whatsappHelper';
import type { Product, CartItem, CategoryGroup, OrderDetails } from './types';
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
  where
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
import type { ReadyBox, CustomerNoteData, QuickReplyPhrase } from './types';

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
    globalMinStockAlert: 2
  });

  const isAdmin = user?.email === 'rafaelhirofujii17@gmail.com';
  const previousAdminOrdersCount = React.useRef<number | null>(null);

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
      await updateDoc(doc(db, 'settings', 'global'), {
        ...data,
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'global'), {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
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

  // Orders Listener for Admin with Real-time Sound Notification (Item 4)
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
          if (globalSettings.enableOrderSoundNotification) {
            playNewOrderNotification();
          }
          sendBrowserNotification("S.E Doces Gourmet", "🔔 Novo pedido recebido no painel de administração!");
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

      return () => {
        unsubInv();
        unsubIngredients();
        unsubRecipes();
        unsubReviews();
        unsubCustomerNotes();
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
      if (boxData.id) {
        const boxId = boxData.id;
        const { id, ...rest } = boxData;
        await setDoc(doc(db, 'ready_boxes', boxId), {
          ...rest,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await addDoc(collection(db, 'ready_boxes'), {
          ...boxData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
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
    } catch (err) {
      console.error("Failed to delete ready box", err);
    }
  };

  const handleUpdateReadyBoxQuantity = async (id: string, newQuantity: number) => {
    try {
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
      await setDoc(doc(db, 'customer_notes', cleanKey), {
        ...noteData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to save customer notes", err);
      throw err;
    }
  };

  const handleReadyBoxOrderSubmit = async (orderDetails: OrderDetails, items: any[], total: number) => {
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
      if (id) {
        await setDoc(doc(db, 'ingredients', id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await addDoc(collection(db, 'ingredients'), { ...data, updatedAt: serverTimestamp() });
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
        ingredients: recipeItems,
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

  const deleteReview = async (reviewId: string) => {
    if (!window.confirm("Excluir esta avaliação permanentemente?")) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      console.error("Failed to delete review", err);
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
      : Math.max(0, cartTotal - (orderDetails.discountAmount || 0) + (orderDetails.deliveryFee || 0));

    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        customerName: orderDetails.name,
        date: orderDetails.date,
        time: orderDetails.time,
        items,
        subtotal: cartTotal,
        discountAmount: orderDetails.discountAmount || 0,
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
      deliveryFee: orderDetails.deliveryFee || 0,
      pickupAddress: globalSettings.pickupAddress,
      pixKey: globalSettings.pixKey,
      template: globalSettings.customWhatsAppTemplate
    });

    window.open(`https://wa.me/${globalSettings.contactPhone}?text=${encodeURIComponent(msg)}`, '_blank');

    // Clear cart and close modals
    setCart({});
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
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-brand-wine/10 shadow-sm bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            onClick={() => setView('catalog')}
            className="flex flex-col cursor-pointer select-none"
          >
            <h1 className="text-lg md:text-2xl font-black text-brand-wine tracking-tighter leading-none">
              S.E DOCES<span className="text-brand-gold">GOURMET</span>
            </h1>
            <p className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest font-medium">Catálogo Exclusivo</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setView('tracking')}
              className={cn(
                "p-2 rounded-full transition-all flex items-center gap-2 px-3 text-xs font-bold",
                view === 'tracking' ? "bg-brand-wine text-white shadow-sm" : "text-brand-wine hover:bg-brand-wine/5"
              )}
              title="Meus Pedidos"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden md:inline">MEUS PEDIDOS</span>
            </button>

            {isAdmin && (
              <button 
                onClick={() => setView(view === 'catalog' ? 'admin' : 'catalog')}
                className="p-2 text-brand-wine hover:bg-brand-wine/5 rounded-full transition-all"
                title={view === 'catalog' ? "Painel Administrativo" : "Ver Catálogo"}
              >
                {view === 'catalog' ? <History className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
              </button>
            )}

            <a 
              href={globalSettings.instagramUrl || "https://instagram.com/s.e_docesgourmet"} 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-brand-wine hover:text-brand-gold transition-colors"
              title="Instagram Oficial"
            >
              <Instagram className="w-5 h-5" />
            </a>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-brand-wine hover:bg-brand-wine/5 rounded-full transition-all group"
              title="Ver Carrinho"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-brand-gold text-brand-wine text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </header>

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
          />
        ) : (
          <TrackingView orders={myOrders} onBack={() => setView('catalog')} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-32 py-20 bg-brand-wine text-white text-center">
        <div className="max-w-xl mx-auto px-4 space-y-8">
          <div className="space-y-4">
            <h3 className="text-3xl font-serif italic text-brand-gold">Acompanhe nosso trabalho!</h3>
            <p className="text-brand-cream/70 font-light">Siga a gente no Instagram para ver encomendas reais, bastidores e novidades diárias.</p>
          </div>
          
          <a 
            href="https://instagram.com/s.e_docesgourmet" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-gold text-brand-wine font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-wine/50"
          >
            <Instagram className="w-5 h-5" />
            SEGUIR NO INSTAGRAM
          </a>
          
          <div className="pt-12 border-t border-white/10 flex flex-col items-center gap-4">
            <div className="text-[10px] tracking-widest font-medium text-white/40">
              © {new Date().getFullYear()} S.E DOCES GOURMET • TODOS OS DIREITOS RESERVADOS
            </div>
            
            {!user ? (
              <button 
                onClick={handleLogin}
                className="text-[10px] text-white/30 hover:text-brand-gold transition-colors flex items-center gap-1 font-semibold"
              >
                <LogIn className="w-3 h-3" />
                ACESSO ADM
              </button>
            ) : (
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-white/40">{user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="text-white/30 hover:text-red-400 transition-colors flex items-center gap-1 font-semibold"
                >
                  <LogOut className="w-3 h-3" />
                  SAIR
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>

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

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-cream z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-brand-wine" />
                  <h2 className="text-xl font-serif text-brand-wine font-bold">Seu Pedido</h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {/* Info Alert */}
                <div className="bg-brand-gold/10 border border-brand-gold/30 p-4 rounded-2xl flex gap-3">
                  <Info className="w-5 h-5 text-brand-wine shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 text-brand-wine/80">
                    <p><strong>Atenção:</strong> Pedido de cento mínimo de 25 unidades por doce.</p>
                    <p>Todos os doces acompanham forminha de acetato (padrão).</p>
                  </div>
                </div>

                {cartCount === 0 ? (
                  <div className="text-center py-20 opacity-50">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-serif italic">Seu carrinho está vazio.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Minimum order guidance banner */}
                    <div className="p-3 bg-brand-cream/80 border border-brand-wine/15 rounded-xl text-xs text-brand-wine flex items-center justify-between font-semibold">
                      <span>📌 Pedido mín. de 25 un por doce</span>
                      <span className="text-[10px] bg-white/90 px-2 py-0.5 rounded-md border border-brand-wine/20">
                        Passo de 1 em 1
                      </span>
                    </div>

                    {(Object.values(cart) as CartItem[]).map(item => {
                      const price = getProductUnitPrice(item);
                      return (
                        <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                          <div className="flex-grow min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            <div className="flex items-baseline gap-2">
                              <p className="text-brand-wine font-black text-sm">{formatCurrency(price * item.quantity)}</p>
                              <span className="text-[11px] text-neutral-400">({formatCurrency(item.priceCento || price * 100)} / cento)</span>
                            </div>
                            
                            <div className="flex flex-col gap-2 mt-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 border border-neutral-200 rounded-lg p-1 bg-neutral-50">
                                  <button 
                                    onClick={() => {
                                      if (item.quantity <= 25) {
                                        removeFromCart(item.id);
                                      } else {
                                        updateQuantity(item.id, item.quantity - 1);
                                      }
                                    }}
                                    className="p-1.5 hover:bg-white rounded transition-colors text-neutral-500 active:scale-90"
                                    title={item.quantity <= 25 ? "Remover do pedido" : "Diminuir 1 unidade"}
                                  >
                                    {item.quantity <= 25 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                                  </button>
                                  <input 
                                    type="number" 
                                    min={25}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (!isNaN(val)) {
                                        if (val < 25) {
                                          updateQuantity(item.id, Math.max(0, val));
                                        } else {
                                          updateQuantity(item.id, val);
                                        }
                                      }
                                    }}
                                    onBlur={() => {
                                      if (item.quantity < 25) {
                                        updateQuantity(item.id, 25);
                                      }
                                    }}
                                    className="w-14 text-center text-xs font-black text-brand-wine bg-white border border-neutral-200 rounded px-1 py-0.5 outline-none"
                                    title="Digite a quantidade"
                                  />
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="p-1.5 hover:bg-white rounded transition-colors text-neutral-500 active:scale-90"
                                    title="Adicionar 1 unidade"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="text-xs text-brand-wine font-black">{item.quantity} un</span>
                              </div>

                              {/* Quick shortcuts in cart */}
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 25)}
                                  className={cn(
                                    "px-2 py-0.5 rounded border font-semibold transition-all",
                                    item.quantity === 25 ? "bg-brand-wine text-white border-brand-wine" : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                                  )}
                                >
                                  25 un
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 50)}
                                  className={cn(
                                    "px-2 py-0.5 rounded border font-semibold transition-all",
                                    item.quantity === 50 ? "bg-brand-wine text-white border-brand-wine" : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                                  )}
                                >
                                  50 un
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 100)}
                                  className={cn(
                                    "px-2 py-0.5 rounded border font-bold transition-all",
                                    item.quantity === 100 ? "bg-brand-wine text-brand-gold border-brand-wine" : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                                  )}
                                >
                                  1 Cento
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {cartCount > 0 && (
                <div className="p-6 bg-white border-t border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium tracking-wider text-xs uppercase">Subtotal</span>
                    <span className="text-2xl font-black text-brand-wine">{formatCurrency(cartTotal)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadCartPdf}
                    className="w-full py-2.5 bg-neutral-100 text-brand-wine hover:bg-neutral-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-neutral-200 shadow-sm"
                  >
                    <Download className="w-4 h-4 text-brand-wine" />
                    BAIXAR ORÇAMENTO EM PDF
                  </button>
                  
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-4 bg-brand-wine text-brand-gold font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-xl shadow-brand-wine/20"
                  >
                    CONTINUAR PARA ENTREGA
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

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
            onAddCustomCentoToCart={handleAddCustomItemToCart}
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
            onOrderCompleted={handleOrderCompleted}
          />
        )}
      </AnimatePresence>
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

function AdminCharts({ orders, productCosts, ingredients, recipes }: { orders: any[], productCosts: Record<string, number>, ingredients: any[], recipes: Record<string, any[]> }) {
  const chartData = useMemo(() => {
    // Basic daily aggregation for the last 14 days
    const activeOrders = orders.filter(o => o.status !== 'deleted');
    const dayMap: Record<string, { date: string, revenue: number, net: number, count: number }> = {};
    
    // Fill last 14 days with zeros
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dayMap[dateStr] = { date: dateStr, revenue: 0, net: 0, count: 0 };
    }

    activeOrders.forEach(order => {
      const date = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date();
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      if (dayMap[dateStr]) {
        dayMap[dateStr].revenue += (order.total || 0);
        dayMap[dateStr].count += 1;
        
        let cost = 0;
        order.items.forEach((item: any) => {
          cost += calculateProductCost(item.name, productCosts, ingredients, recipes) * item.quantity;
        });
        dayMap[dateStr].net += (order.total || 0) - cost;
      }
    });

    return Object.values(dayMap);
  }, [orders, productCosts, ingredients, recipes]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      <div className="bg-white p-6 rounded-[32px] border border-neutral-100 shadow-sm">
        <div className="flex items-center justify-between mb-6 px-2">
           <h3 className="text-sm font-black text-brand-wine uppercase tracking-widest">Faturamento Diário (14 d)</h3>
           <div className="flex gap-4">
              <div className="flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-brand-wine" />
                 <span className="text-[10px] text-neutral-400 font-bold uppercase">Bruto</span>
              </div>
              <div className="flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[10px] text-neutral-400 font-bold uppercase">Líquido</span>
              </div>
           </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#800020" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#800020" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#A3A3A3' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#A3A3A3' }}
                tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value, name) => [formatCurrency(Number(value)), name === 'revenue' ? 'Bruto' : 'Líquido']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#800020" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-neutral-100 shadow-sm">
        <h3 className="text-sm font-black text-brand-wine uppercase tracking-widest mb-6 px-2">Volume de Pedidos (14 d)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#A3A3A3' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#A3A3A3' }}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [value, 'Pedidos']}
              />
              <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
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
  catalog,
  globalSettings,
  onUpdateSettings,
  readyBoxes = [],
  onSaveReadyBox,
  onDeleteReadyBox,
  onUpdateReadyBoxQuantity,
  onToggleReadyBoxActive,
  customerNotes = {},
  onSaveCustomerNotes
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
  catalog: any[],
  globalSettings: any,
  onUpdateSettings: (data: any) => void,
  readyBoxes?: ReadyBox[],
  onSaveReadyBox?: (box: Partial<ReadyBox> & { id?: string }) => Promise<void>,
  onDeleteReadyBox?: (id: string) => Promise<void>,
  onUpdateReadyBoxQuantity?: (id: string, qty: number) => Promise<void>,
  onToggleReadyBoxActive?: (id: string, active: boolean) => Promise<void>,
  customerNotes?: Record<string, CustomerNoteData>,
  onSaveCustomerNotes?: (phoneKey: string, noteData: CustomerNoteData) => Promise<void>
}) {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'year' | 'trash'>('all');
  const [activeTab, setActiveTab] = useState<'orders' | 'production' | 'ready_boxes' | 'calculator' | 'crm' | 'inventory' | 'quick_replies' | 'reviews' | 'settings'>('orders');

  const filteredOrders = useMemo(() => {
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
  }, [orders, periodFilter]);

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
          <h2 className="text-3xl font-serif text-brand-wine italic font-bold">Área Administrativa</h2>
          <p className="text-neutral-500 text-sm">Gerencie pedidos, produção, pronta entrega, lucratividade e clientes.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap p-1.5 bg-neutral-100 rounded-2xl gap-1">
          <button 
            type="button"
            onClick={() => setActiveTab('orders')}
            className={cn(
              "px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              activeTab === 'orders' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Package className="w-3.5 h-3.5" />
            Pedidos ({orders.filter(o => o.status !== 'deleted').length})
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
        <ReviewsTab reviews={reviews} onModerate={onModerateReview} onDelete={onDeleteReview} />
      )}

      {activeTab === 'settings' && (
        <AdminSettingsTab settings={globalSettings} onSave={onUpdateSettings} />
      )}
    </div>
  );
}

function InventoryTab({ 
  orders, 
  productCosts, 
  onUpdateCost,
  ingredients,
  onUpdateIngredient,
  onDeleteIngredient,
  recipes,
  onUpdateRecipe,
  catalog
}: { 
  orders: any[], 
  productCosts: Record<string, number>, 
  onUpdateCost: (name: string, cost: number) => void,
  ingredients: any[],
  onUpdateIngredient: (id: string | null, data: any) => void,
  onDeleteIngredient: (id: string) => void,
  recipes: Record<string, any[]>,
  onUpdateRecipe: (productName: string, items: any[]) => void,
  catalog: CategoryGroup[]
}) {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'ingredients'>('products');
  const [bulkVal, setBulkVal] = useState('');
  
  // Ingredient Editor State
  const [editingIngredient, setEditingIngredient] = useState<any | null>(null);
  
  // Recipe Editor State
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);

  const inventoryProducts = useMemo(() => {
    // Collect unique product names from both orders (historical) and catalog (current)
    const set = new Set<string>();
    catalog.forEach(cat => cat.items.forEach(item => set.add(item.name)));
    orders.forEach(o => o.items.forEach((i: any) => set.add(i.name)));
    return Array.from(set).sort();
  }, [orders, catalog]);

  const applyBulk = () => {
    const val = parseFloat(bulkVal);
    if (isNaN(val)) return;
    if (!window.confirm(`Aplicar custo de R$${val.toFixed(2)} para todos os ${inventoryProducts.length} itens?`)) return;
    inventoryProducts.forEach(name => onUpdateCost(name, val));
    setBulkVal('');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-neutral-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveSubTab('products')}
          className={cn(
            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeSubTab === 'products' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400"
          )}
        >
          Doces (Produtos)
        </button>
        <button 
          onClick={() => setActiveSubTab('ingredients')}
          className={cn(
            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeSubTab === 'ingredients' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400"
          )}
        >
          Ingredientes Base
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
        {activeSubTab === 'products' ? (
          <>
            <div className="p-8 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-serif text-brand-wine italic">Controle de Custos</h3>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
                  {inventoryProducts.length} ITENS NO CATÁLOGO REGISTRADOS
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-neutral-50 p-2 rounded-2xl border border-neutral-100">
                 <p className="text-[10px] font-black text-neutral-400 uppercase px-2">Definir todos:</p>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">R$</span>
                   <input 
                    type="number" 
                    placeholder="0,00"
                    className="w-20 pl-7 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg outline-none focus:border-brand-wine"
                    value={bulkVal}
                    onChange={(e) => setBulkVal(e.target.value)}
                   />
                 </div>
                 <button 
                  onClick={applyBulk}
                  className="px-4 py-1.5 bg-brand-wine text-white text-[10px] font-black rounded-lg hover:bg-black transition-all"
                 >
                   APLICAR
                 </button>
              </div>
            </div>
            <div className="divide-y divide-neutral-100">
              {inventoryProducts.length === 0 && (
                <div className="p-20 text-center text-neutral-400 italic">Nenhum produto encontrado.</div>
              )}
              {inventoryProducts.map(name => {
                const hasRecipe = recipes[name] && recipes[name].length > 0;
                const calculatedCost = calculateProductCost(name, productCosts, ingredients, recipes);

                return (
                  <div key={name} className="p-6 flex flex-col gap-4 hover:bg-neutral-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-wine/5 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-brand-wine/50" />
                        </div>
                        <div>
                          <p className="font-serif italic text-neutral-800">{name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                              hasRecipe ? "bg-emerald-100 text-emerald-600" : "bg-neutral-100 text-neutral-400"
                            )}>
                              {hasRecipe ? 'Com Receita' : 'Sem Receita'}
                            </span>
                            <span className="text-[10px] text-brand-wine font-black">
                              Custo Unitário: {formatCurrency(calculatedCost)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {!hasRecipe && (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">R$</span>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="Fixo"
                              className="w-32 pl-8 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:border-brand-wine outline-none"
                              value={productCosts[name] || ''}
                              onChange={(e) => onUpdateCost(name, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        )}
                        <button 
                          onClick={() => setEditingRecipe(name)}
                          className="px-4 py-2 bg-neutral-100 hover:bg-brand-wine hover:text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest"
                        >
                          {hasRecipe ? 'Editar Receita' : 'Criar Receita'}
                        </button>
                      </div>
                    </div>

                    {editingRecipe === name && (
                      <RecipeEditor 
                        productName={name}
                        recipeItems={recipes[name] || []}
                        ingredients={ingredients}
                        onSave={(items) => {
                          onUpdateRecipe(name, items);
                          setEditingRecipe(null);
                        }}
                        onCancel={() => setEditingRecipe(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-xl font-serif text-brand-wine italic">Ingredientes Base</h3>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
                    Gerencie custos de matéria-prima
                  </p>
                </div>
                
                {ingredients.some(i => (i.quantity || 0) <= (i.lowStockThreshold || 0) && (i.lowStockThreshold || 0) > 0) && (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 animate-bounce">
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-[10px] font-black text-red-600 uppercase">
                      {ingredients.filter(i => (i.quantity || 0) <= (i.lowStockThreshold || 0) && (i.lowStockThreshold || 0) > 0).length} itens em falta
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setEditingIngredient({ name: '', unit: 'kg', costPerUnit: 0, quantity: 0, lowStockThreshold: 0 })}
                className="px-4 py-2 bg-brand-wine text-brand-gold text-[10px] font-black rounded-xl hover:bg-black transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                NOVO INGREDIENTE
              </button>
            </div>

            <div className="divide-y divide-neutral-100">
              {editingIngredient && (
                <div className="p-8 bg-brand-cream/30 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Nome</label>
                      <input 
                        type="text"
                        className="w-full p-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-brand-wine"
                        value={editingIngredient.name}
                        onChange={(e) => setEditingIngredient({ ...editingIngredient, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Unidade</label>
                      <select 
                        className="w-full p-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-brand-wine"
                        value={editingIngredient.unit}
                        onChange={(e) => setEditingIngredient({ ...editingIngredient, unit: e.target.value })}
                      >
                        <option value="kg">Quilogramas (kg)</option>
                        <option value="g">Gramas (g)</option>
                        <option value="L">Litros (L)</option>
                        <option value="ml">Mililitros (ml)</option>
                        <option value="un">Unidade (un)</option>
                        <option value="cx">Caixa (cx)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Custo/Un</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">R$</span>
                        <input 
                          type="number"
                          step="0.01"
                          className="w-full pl-8 p-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-brand-wine"
                          value={editingIngredient.costPerUnit}
                          onChange={(e) => setEditingIngredient({ ...editingIngredient, costPerUnit: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Estoque Atual</label>
                      <input 
                        type="number"
                        step="0.001"
                        className="w-full p-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-brand-wine font-mono"
                        value={editingIngredient.quantity || 0}
                        onChange={(e) => setEditingIngredient({ ...editingIngredient, quantity: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Alerta Mínimo</label>
                      <input 
                        type="number"
                        step="0.001"
                        className="w-full p-2 border border-neutral-200 rounded-xl text-sm outline-none focus:border-brand-wine font-mono text-brand-wine"
                        value={editingIngredient.lowStockThreshold || 0}
                        onChange={(e) => setEditingIngredient({ ...editingIngredient, lowStockThreshold: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setEditingIngredient(null)}
                      className="px-4 py-2 text-[10px] font-black text-neutral-400 uppercase hover:text-neutral-600"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        onUpdateIngredient(editingIngredient.id || null, editingIngredient);
                        setEditingIngredient(null);
                      }}
                      className="px-6 py-2 bg-brand-wine text-white text-[10px] font-black rounded-xl hover:bg-black transition-all"
                    >
                      SALVAR INGREDIENTE
                    </button>
                  </div>
                </div>
              )}

              {ingredients.length === 0 && !editingIngredient && (
                <div className="p-20 text-center text-neutral-400 italic">Nenhum ingrediente cadastrado.</div>
              )}

              {ingredients.map(ing => {
                const isLow = (ing.quantity || 0) <= (ing.lowStockThreshold || 0) && (ing.lowStockThreshold || 0) > 0;
                
                return (
                  <div key={ing.id} className={cn(
                    "p-6 flex items-center justify-between transition-colors group",
                    isLow ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-neutral-50/50"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isLow ? "bg-red-100 text-red-600 animate-pulse" : "bg-neutral-100 text-neutral-400"
                      )}>
                        {isLow ? <TrendingDown className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-serif italic text-neutral-800">{ing.name}</p>
                          {isLow && (
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-red-600 text-white rounded-full">
                              Estoque Baixo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] font-black text-neutral-400 uppercase">
                            Preço: {formatCurrency(ing.costPerUnit)}/{ing.unit}
                          </p>
                          <span className="text-neutral-200">•</span>
                          <p className={cn(
                            "text-[10px] font-black uppercase",
                            isLow ? "text-red-600" : "text-brand-wine"
                          )}>
                            Estoque: {ing.quantity || 0} {ing.unit}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingIngredient(ing)}
                        className="p-2 text-neutral-400 hover:text-brand-wine transition-all"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteIngredient(ing.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RecipeEditor({ productName, recipeItems, ingredients, onSave, onCancel }: { productName: string, recipeItems: any[], ingredients: any[], onSave: (items: any[]) => void, onCancel: () => void }) {
  const [items, setItems] = useState<any[]>(recipeItems);
  
  const addItem = () => {
    if (ingredients.length === 0) return;
    setItems([...items, { ingredientId: ingredients[0].id, quantity: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = useMemo(() => {
    return items.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return total + ((ing?.costPerUnit || 0) * item.quantity);
    }, 0);
  }, [items, ingredients]);

  return (
    <div className="mt-4 p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4 animate-in zoom-in-95 duration-200">
       <div className="flex items-center justify-between">
         <h4 className="text-[10px] font-black text-brand-wine uppercase tracking-widest">Composição da Receita</h4>
         <span className="text-xs font-bold text-emerald-600">Total: {formatCurrency(totalCost)}</span>
       </div>

       <div className="space-y-2">
         {items.map((item, idx) => (
           <div key={idx} className="flex gap-2">
             <select 
              className="flex-grow p-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-brand-wine"
              value={item.ingredientId}
              onChange={(e) => updateItem(idx, 'ingredientId', e.target.value)}
             >
               {ingredients.map(ing => (
                 <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
               ))}
             </select>
             <input 
              type="number"
              step="0.001"
              placeholder="Qtd"
              className="w-20 p-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-brand-wine"
              value={item.quantity}
              onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
             />
             <button onClick={() => removeItem(idx)} className="p-2 text-neutral-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
             </button>
           </div>
         ))}
       </div>

       <div className="flex justify-between gap-4 pt-2">
         <button 
           onClick={addItem}
           className="px-3 py-1.5 border border-dashed border-brand-wine/30 text-brand-wine text-[10px] font-black rounded-lg hover:bg-brand-wine/5 flex items-center gap-1"
         >
           <Plus className="w-3 h-3" />
           ADICIONAR ITEM
         </button>
         <div className="flex gap-2">
           <button onClick={onCancel} className="px-3 py-1.5 text-[10px] font-black text-neutral-400 uppercase">Cancelar</button>
           <button 
             onClick={() => onSave(items)}
             className="px-4 py-1.5 bg-brand-wine text-white text-[10px] font-black rounded-lg hover:bg-black transition-all"
           >
             SALVAR RECEITA
           </button>
         </div>
       </div>
    </div>
  );
}

function ReviewsTab({ reviews, onModerate, onDelete }: { reviews: any[], onModerate: (id: string, status: 'approved' | 'rejected') => void, onDelete: (id: string) => void }) {
  const pending = reviews.filter(r => r.status === 'pending');
  const moderated = reviews.filter(r => r.status !== 'pending');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="space-y-6">
        <h3 className="text-xl font-serif text-brand-wine italic ml-2">Moderação ({pending.length})</h3>
        {pending.length === 0 && (
          <div className="py-12 bg-white rounded-[32px] border-2 border-dashed border-neutral-100 text-center text-neutral-400 italic">
            Zero avaliações pendentes.
          </div>
        )}
        {pending.map(review => (
          <div key={review.id} className="bg-white p-6 rounded-[24px] border border-neutral-100 shadow-sm space-y-4">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-[10px] font-black text-brand-wine uppercase tracking-widest">{review.productName}</p>
                 <p className="text-sm font-serif italic text-neutral-800">{review.userName}</p>
                 <p className="text-[8px] text-neutral-400 font-bold uppercase mt-1">
                   {review.createdAt instanceof Timestamp ? review.createdAt.toDate().toLocaleString('pt-BR') : 'Agora'}
                 </p>
               </div>
               <div className="flex gap-0.5 text-brand-gold">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} className={cn("w-3 h-3 fill-current", i >= review.rating && "opacity-20")} />
                 ))}
               </div>
             </div>
             <p className="text-sm text-neutral-500 leading-relaxed">"{review.comment}"</p>
             <div className="flex gap-2">
               <button 
                 onClick={() => onModerate(review.id, 'approved')}
                 className="flex-grow py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 transition-all uppercase tracking-widest"
               >
                 Aprovar
               </button>
               <button 
                 onClick={() => onModerate(review.id, 'rejected')}
                 className="flex-grow py-2 bg-neutral-100 text-neutral-500 text-[10px] font-black rounded-lg hover:bg-neutral-200 transition-all uppercase tracking-widest"
               >
                 Ignorar
               </button>
               <button 
                 onClick={() => onDelete(review.id)}
                 className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all"
                 title="Excluir"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-serif text-brand-wine italic ml-2">Histórico</h3>
        <div className="divide-y divide-neutral-100 bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden">
          {moderated.length === 0 && (
             <div className="p-12 text-center text-neutral-400 italic">Nenhum histórico.</div>
          )}
          {moderated.map(review => (
            <div key={review.id} className="p-6 flex justify-between items-center group">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">{review.productName}</p>
                  <p className="text-[8px] text-neutral-300">
                    {review.createdAt instanceof Timestamp ? review.createdAt.toDate().toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
                <p className="text-xs font-medium text-neutral-800">"{review.comment.slice(0, 40)}..."</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                  review.status === 'approved' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                )}>
                  {review.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                </span>
                <button 
                  onClick={() => onDelete(review.id)}
                  className="p-2 text-red-400 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminOrderCard({ order, globalSettings, onUpdateStatus, onDeletePermanent }: { key?: React.Key, order: any, globalSettings?: any, onUpdateStatus: (id: string, status: string) => void, onDeletePermanent: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const isCompleted = order.status === 'completed';
  const isReady = order.status === 'ready';
  const isDeleted = order.status === 'deleted';

  const handleDownloadPdf = () => {
    generateOrderPdf({
      orderDetails: {
        name: order.customerName,
        date: order.date,
        time: order.time,
        paymentMethod: order.paymentMethod,
        changeAmount: order.changeAmount,
        notes: order.notes
      },
      items: order.items,
      total: order.total,
      pixKey: globalSettings?.pixKey || '03972289960',
      pickupAddress: globalSettings?.pickupAddress || 'Avenida Padre Jose Stefanello, n°340',
      contactPhone: globalSettings?.contactPhone || '5544998542446',
      orderNumber: order.id.slice(-6).toUpperCase(),
      isFormalProposal: false
    });
  };

  return (
    <div className={cn(
      "bg-white rounded-[24px] overflow-hidden border transition-all duration-300",
      isDeleted ? "border-red-100 bg-red-50/20" : (isCompleted ? "opacity-60 border-neutral-100 grayscale-[0.5]" : "border-neutral-100 shadow-sm hover:shadow-md"),
      isReady && !isDeleted && "ring-2 ring-emerald-500/20 border-emerald-500/30 shadow-emerald-100 shadow-lg"
    )}>
      {/* Summary Section */}
      <div className="p-6 flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-serif text-brand-wine italic">{order.customerName}</h3>
            <div className="flex gap-1">
              {order.status === 'pending' && <span className="text-[10px] font-black px-2 py-0.5 bg-brand-gold/10 text-brand-wine rounded-full border border-brand-gold/20">PENDENTE</span>}
              {order.status === 'ready' && <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">PRONTO!</span>}
              {order.status === 'completed' && <span className="text-[10px] font-black px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full border border-neutral-200">ENTREGUE</span>}
              {order.status === 'deleted' && <span className="text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-600 rounded-full border border-red-200">EXCLUÍDO</span>}
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 font-medium">#{order.id.slice(-6).toUpperCase()} {order.deletedAt && `• Excluído em: ${order.deletedAt.toDate().toLocaleDateString('pt-BR')}`}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 uppercase font-black mb-1">Total</p>
            <p className="text-xl font-black text-brand-wine leading-none">{formatCurrency(order.total)}</p>
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10px] font-black text-brand-wine hover:text-brand-gold transition-colors uppercase tracking-widest"
          >
            {isExpanded ? 'Esconder' : 'Ver Detalhes'}
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronRight className="w-4 h-4 ml-1 rotate-90" />
            </motion.div>
          </button>
        </div>
      </div>
      
      {/* Expandable Details Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 bg-brand-cream/30 border-t border-brand-wine/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                {/* Items List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-brand-wine uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Itens do Pedido
                  </h4>
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-brand-wine/5 last:border-0">
                        <span className="text-neutral-600 font-medium font-serif">
                          <span className="text-brand-wine font-black mr-2 not-italic">{item.quantity}x</span>
                          {item.name}
                        </span>
                        <span className="text-neutral-400 italic text-xs">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics & Payment */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-400 uppercase font-black">Data/Hora</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-wine" />
                        {order.date.split('-').reverse().join('/')}
                      </p>
                      <div className="flex items-center gap-1 pl-4.5">
                        <Clock className="w-3.5 h-3.5 text-brand-wine" />
                        <span className="text-sm font-medium">{order.time}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-400 uppercase font-black">Pagamento</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-brand-wine" />
                        {order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="p-3 bg-white/80 rounded-xl border border-brand-wine/10 text-xs italic text-neutral-500">
                      <span className="font-bold text-brand-wine not-italic mr-1">Obs:</span> {order.notes}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-end pt-4">
                    {/* Baixar PDF do Pedido */}
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-brand-wine text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 border border-neutral-200 shadow-sm"
                      title="Baixar Pedido/Orçamento em PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-wine" />
                      BAIXAR PDF
                    </button>

                    {/* Resposta Rápida WhatsApp */}
                    <button
                      type="button"
                      onClick={() => setIsQuickReplyOpen(true)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                      title="Enviar Resposta Rápida no WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WHATSAPP RÁPIDO
                    </button>

                    {/* Normal Actions */}
                    {!isDeleted && (
                      <>
                        <button 
                         onClick={() => onUpdateStatus(order.id, 'deleted')}
                         className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                         title="Excluir (Mover para Lixeira)"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        {order.status === 'pending' && (
                          <button 
                            onClick={() => onUpdateStatus(order.id, 'ready')}
                            className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2"
                          >
                            <Check className="w-3 h-3" /> MARCAR COMO PRONTO
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'ready') && (
                          <button 
                            onClick={() => onUpdateStatus(order.id, 'completed')}
                            className="px-4 py-2 bg-brand-wine text-brand-gold text-[10px] font-black rounded-lg shadow-lg shadow-brand-wine/20 hover:bg-black transition-all"
                          >
                            FINALIZAR ENTREGA
                          </button>
                        )}
                      </>
                    )}

                    {/* Trash Actions */}
                    {isDeleted && (
                      <>
                        <button 
                         onClick={() => onUpdateStatus(order.id, 'pending')}
                         className="px-4 py-2 bg-brand-wine text-white text-[10px] font-black rounded-lg transition-all"
                        >
                          RESTAURAR PEDIDO
                        </button>
                        <button 
                         onClick={() => onDeletePermanent(order.id)}
                         className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg transition-all"
                        >
                          EXCLUIR PERMANENTE
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-neutral-300 font-mono text-center pb-4">
                REGISTRADO EM: {order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleString('pt-BR') : 'Agora'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Reply Modal */}
      {isQuickReplyOpen && (
        <QuickReplyModal
          isOpen={isQuickReplyOpen}
          onClose={() => setIsQuickReplyOpen(false)}
          order={order}
          customPhrases={globalSettings?.quickReplyPhrases}
          globalSettings={globalSettings}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: string, color: 'wine' | 'gold' | 'neutral' }) {
  return (
    <div className={cn(
      "p-6 rounded-[24px] border border-neutral-100 shadow-sm",
      color === 'wine' && "bg-brand-wine text-white",
      color === 'gold' && "bg-brand-gold text-brand-wine",
      color === 'neutral' && "bg-white text-neutral-800"
    )}>
      <p className={cn(
        "text-[10px] uppercase font-black tracking-widest mb-1",
        color === 'wine' ? "text-brand-gold/60" : "text-neutral-400"
      )}>{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

function TrackingView({ orders, onBack }: { orders: any[], onBack: () => void }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif text-brand-wine italic">Meus Pedidos</h2>
        <button 
          onClick={onBack}
          className="text-xs font-black text-brand-wine hover:text-brand-gold transition-colors flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> VOLTAR AO CARDÁPIO
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-[32px]">
            <p className="text-neutral-400 font-serif italic mb-4">Você ainda não fez nenhum pedido no site.</p>
            <button onClick={onBack} className="px-6 py-2 bg-brand-wine text-brand-gold rounded-full text-xs font-black">
              FAZER MEU PRIMEIRO PEDIDO
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[24px] border border-neutral-100 shadow-sm p-6 overflow-hidden relative">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">PEDIDO #{order.id.slice(-6).toUpperCase()}</span>
                    {order.status === 'pending' && <span className="text-[10px] font-black px-3 py-1 bg-brand-gold/10 text-brand-wine rounded-full">AGUARDANDO FINALIZAÇÃO</span>}
                    {order.status === 'ready' && <span className="text-[10px] font-black px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full animate-pulse border border-emerald-200">SEU PEDIDO ESTÁ PRONTO!</span>}
                    {order.status === 'completed' && <span className="text-[10px] font-black px-3 py-1 bg-neutral-100 text-neutral-500 rounded-full">ENTREGUE</span>}
                  </div>
                  <h3 className="text-neutral-800 font-serif italic">{order.items.length} itens • {formatCurrency(order.total)}</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <p className="text-[10px] text-neutral-400 uppercase font-black">Data de Retirada</p>
                   <p className="text-sm font-black text-brand-wine">{order.date.split('-').reverse().join('/')}</p>
                </div>
              </div>

              <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: order.status === 'pending' ? '33%' : order.status === 'ready' ? '66%' : '100%',
                    backgroundColor: order.status === 'completed' ? '#800020' : '#D4AF37'
                  }}
                  className="h-full"
                />
              </div>
              <div className="flex justify-between text-[8px] font-black text-neutral-400 uppercase tracking-tighter">
                 <span className={cn(order.status === 'pending' && "text-brand-wine")}>Enviado</span>
                 <span className={cn(order.status === 'ready' && "text-emerald-600 scale-110")}>Pronto</span>
                 <span className={cn(order.status === 'completed' && "text-brand-wine")}>Entregue</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminSettingsTab({ settings, onSave }: { settings: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
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
    // Item 2: Entrega vs Retirada
    deliveryMode: "delivery_and_pickup" as 'pickup_only' | 'delivery_and_pickup',
    deliveryFeeType: "fixed" as 'fixed' | 'to_consult',
    deliveryFixedFee: 10,
    freeDeliveryThreshold: 0,
    // Item 3: Descontos Automáticos por Volume
    enableVolumeDiscount: true,
    volumeDiscountMinItems: 200,
    volumeDiscountPercent: 5,
    volumeDiscountMessage: "🎉 Parabéns! Desconto de 5% aplicado para pedidos acima de 200 doces.",
    // Item 4: Notificação Sonora
    enableOrderSoundNotification: true,
    // Item 5: Template de WhatsApp
    customWhatsAppTemplate: DEFAULT_WHATSAPP_TEMPLATE,
    // Item 6: Alerta de Estoque Mínimo Global
    globalMinStockAlert: 2,
    ...settings
  });

  const [newBlockedDate, setNewBlockedDate] = useState('');

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...settings,
      blockedDates: Array.isArray(settings?.blockedDates) ? settings.blockedDates : []
    }));
  }, [settings]);

  const handleAddBlockedDate = () => {
    if (!newBlockedDate) return;
    const current = Array.isArray(formData.blockedDates) ? formData.blockedDates : [];
    if (current.includes(newBlockedDate)) {
      alert("Esta data já está bloqueada!");
      return;
    }
    const updated = [...current, newBlockedDate].sort();
    setFormData({ ...formData, blockedDates: updated });
    setNewBlockedDate('');
  };

  const handleRemoveBlockedDate = (dateToRemove: string) => {
    const current = Array.isArray(formData.blockedDates) ? formData.blockedDates : [];
    const updated = current.filter(d => d !== dateToRemove);
    setFormData({ ...formData, blockedDates: updated });
  };

  const insertTagIntoTemplate = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      customWhatsAppTemplate: (prev.customWhatsAppTemplate || '') + tag
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-2 pb-16">
      <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif text-brand-wine italic flex items-center gap-2">
              <Settings className="w-6 h-6 text-brand-gold" />
              Painel de Configurações
            </h3>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
              Personalize regras de entrega, descontos, alertas sonoros, mensagens e estoque
            </p>
          </div>

          {/* Live Status Badge Preview */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-xs font-semibold self-start sm:self-auto">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              formData.storeStatusMode === 'open' ? "bg-emerald-500" : formData.storeStatusMode === 'limited' ? "bg-amber-500" : "bg-rose-500"
            )} />
            <span className="text-neutral-700">{formData.storeStatusText || "Status da Loja"}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 mt-6">
          {/* Seção 1: Horários & Status de Atendimento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
              <Clock className="w-4 h-4 text-brand-gold" />
              <span>1. Horários & Status da Loja</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Horário de Atendimento (Exibido no Banner)" icon={<Clock className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                  value={formData.businessHours}
                  onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                  placeholder="Ex: Ter a Dom • 10h às 18h"
                />
              </FormField>

              <FormField label="Texto do Status da Loja" icon={<Store className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                  value={formData.storeStatusText}
                  onChange={(e) => setFormData({ ...formData, storeStatusText: e.target.value })}
                  placeholder="Ex: Aceitando Encomendas & Pronta Entrega"
                />
              </FormField>
            </div>

            {/* Modo do Status da Loja (Indicador Visual) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-600 block">
                Indicador Visual do Status (Cor da Luzinha):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, storeStatusMode: 'open' })}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all",
                    formData.storeStatusMode === 'open' 
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm" 
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  )}
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Aberto / Normal</p>
                    <p className="text-[10px] font-normal text-emerald-700">Aceitando encomendas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, storeStatusMode: 'limited' })}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all",
                    formData.storeStatusMode === 'limited' 
                      ? "bg-amber-50 border-amber-300 text-amber-800 shadow-sm" 
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  )}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Vagas Limitadas</p>
                    <p className="text-[10px] font-normal text-amber-700">Agenda quase cheia</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, storeStatusMode: 'paused' })}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all",
                    formData.storeStatusMode === 'paused' 
                      ? "bg-rose-50 border-rose-300 text-rose-800 shadow-sm" 
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  )}
                >
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold">Fechado / Recesso</p>
                    <p className="text-[10px] font-normal text-rose-700">Pausa temporária</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Banner de Aviso no Topo */}
            <FormField label="Aviso Especial no Topo do Site (Opcional)" icon={<BellRing className="w-4 h-4" />}>
              <input 
                type="text" 
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm"
                value={formData.announcementBanner || ''}
                onChange={(e) => setFormData({ ...formData, announcementBanner: e.target.value })}
                placeholder="Ex: 🍫 Encomendas para Páscoa até 20/03! Deixe vazio para não exibir."
              />
            </FormField>
          </div>

          {/* Seção 2 (Item 2 Escolhido): Opções de Entrega vs. Retirada & Taxas */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <Truck className="w-4 h-4 text-brand-gold" />
                <span>2. Opções de Entrega vs. Retirada & Taxas</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 2</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 block">Modalidades Disponíveis no Checkout:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMode: 'pickup_only' })}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold transition-all text-left",
                      formData.deliveryMode === 'pickup_only'
                        ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                    )}
                  >
                    Somente Retirada
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMode: 'delivery_and_pickup' })}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold transition-all text-left",
                      formData.deliveryMode === 'delivery_and_pickup'
                        ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                    )}
                  >
                    Retirada & Entrega
                  </button>
                </div>
              </div>

              {formData.deliveryMode === 'delivery_and_pickup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 block">Cobrança da Taxa de Entrega:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryFeeType: 'fixed' })}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-bold transition-all text-left",
                        formData.deliveryFeeType === 'fixed'
                          ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                          : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                      )}
                    >
                      Taxa Fixa (R$)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryFeeType: 'to_consult' })}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-bold transition-all text-left",
                        formData.deliveryFeeType === 'to_consult'
                          ? "bg-brand-wine text-brand-gold border-brand-wine shadow-sm"
                          : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                      )}
                    >
                      A Combinar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {formData.deliveryMode === 'delivery_and_pickup' && formData.deliveryFeeType === 'fixed' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <FormField label="Valor da Taxa Fixa de Entrega (R$)" icon={<DollarSign className="w-4 h-4" />}>
                  <input 
                    type="number" 
                    step="0.50"
                    min="0"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-bold text-brand-wine"
                    value={formData.deliveryFixedFee ?? 10}
                    onChange={(e) => setFormData({ ...formData, deliveryFixedFee: parseFloat(e.target.value) || 0 })}
                    placeholder="10.00"
                  />
                </FormField>

                <FormField label="Frete Grátis a partir de (R$ - 0 para desativar)" icon={<Sparkles className="w-4 h-4" />}>
                  <input 
                    type="number" 
                    step="1"
                    min="0"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-bold text-emerald-700"
                    value={formData.freeDeliveryThreshold ?? 0}
                    onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 150 para compras acima de R$ 150"
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Seção 3 (Item 3 Escolhido): Descontos Automáticos por Volume / Centos */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <Percent className="w-4 h-4 text-brand-gold" />
                <span>3. Descontos Automáticos por Volume (Ex: Centos / Festas)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 3</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <p className="text-xs font-bold text-brand-wine">Ativar Regra de Desconto por Volume no Carrinho</p>
                <p className="text-[11px] text-neutral-500">Aplica desconto automaticamente quando a quantidade total de doces atinge a meta.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, enableVolumeDiscount: !formData.enableVolumeDiscount })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0",
                  formData.enableVolumeDiscount ? "bg-emerald-500" : "bg-neutral-300"
                )}
              >
                <span className={cn(
                  "block w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                  formData.enableVolumeDiscount ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>

            {formData.enableVolumeDiscount && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Quantidade Mínima de Doces no Pedido" icon={<Layers className="w-4 h-4" />}>
                    <input 
                      type="number" 
                      min="10"
                      step="10"
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-bold text-brand-wine"
                      value={formData.volumeDiscountMinItems ?? 200}
                      onChange={(e) => setFormData({ ...formData, volumeDiscountMinItems: parseInt(e.target.value) || 0 })}
                      placeholder="Ex: 200 (equivalente a 2 centos)"
                    />
                  </FormField>

                  <FormField label="Porcentagem de Desconto Aplicada (%)" icon={<Percent className="w-4 h-4" />}>
                    <input 
                      type="number" 
                      min="1"
                      max="100"
                      step="0.5"
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-bold text-emerald-700"
                      value={formData.volumeDiscountPercent ?? 5}
                      onChange={(e) => setFormData({ ...formData, volumeDiscountPercent: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 5"
                    />
                  </FormField>
                </div>

                <FormField label="Mensagem do Desconto (Exibida no Carrinho e WhatsApp)" icon={<Sparkles className="w-4 h-4" />}>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                    value={formData.volumeDiscountMessage || ''}
                    onChange={(e) => setFormData({ ...formData, volumeDiscountMessage: e.target.value })}
                    placeholder="Ex: 🎉 Parabéns! Desconto de 5% aplicado para pedidos acima de 200 doces."
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Seção 4 (Item 4 Escolhido): Notificação Sonora de Novo Pedido */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-brand-gold" />
                <span>4. Notificação Sonora de Novo Pedido</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 4</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <p className="text-xs font-bold text-brand-wine">Tocar Campainha Sonora ao Receber Pedido</p>
                <p className="text-[11px] text-neutral-500">Toca um alerta sonoro harmônico instantaneamente no navegador quando um novo pedido entra.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => playNewOrderNotification()}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                  title="Testar como soa o alerta de novo pedido"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Testar Som 🔔
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enableOrderSoundNotification: !formData.enableOrderSoundNotification })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative p-0.5",
                    formData.enableOrderSoundNotification ? "bg-emerald-500" : "bg-neutral-300"
                  )}
                >
                  <span className={cn(
                    "block w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                    formData.enableOrderSoundNotification ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Seção 5 (Item 5 Escolhido): Mensagem Padrão de WhatsApp Pré-formatada */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <MessageCircle className="w-4 h-4 text-brand-gold" />
                <span>5. Mensagem Padrão de WhatsApp Pré-formatada</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, customWhatsAppTemplate: DEFAULT_WHATSAPP_TEMPLATE })}
                  className="text-[10px] font-bold text-neutral-500 hover:text-brand-wine underline flex items-center gap-1"
                  title="Restaurar formato original"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restaurar Padrão
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 5</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-600 block">
                Template da Mensagem Enviada pelo Cliente no WhatsApp:
              </label>
              <textarea 
                rows={9}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all font-mono text-xs text-neutral-700 leading-relaxed"
                value={formData.customWhatsAppTemplate || DEFAULT_WHATSAPP_TEMPLATE}
                onChange={(e) => setFormData({ ...formData, customWhatsAppTemplate: e.target.value })}
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Tags dinâmicas disponíveis (clique para inserir):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '{saudacao}',
                    '{nome_cliente}',
                    '{bloco_itens}',
                    '{bloco_entrega}',
                    '{bloco_desconto}',
                    '{valor_total}',
                    '{data_formatada}',
                    '{horario}',
                    '{forma_pagamento}',
                    '{bloco_troco}',
                    '{bloco_pix}',
                    '{bloco_obs}'
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTagIntoTemplate(tag)}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-[10px] font-mono font-bold transition-all border border-neutral-200"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 6 (Item 6 Escolhido): Alerta de Estoque Mínimo Global */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>6. Alerta de Estoque Mínimo Global</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-wine">Item 6</span>
            </div>

            <FormField label="Quantidade Mínima de Segurança Padrão (Unidades ou Kg)" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  className="w-32 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all font-bold text-amber-800 text-base"
                  value={formData.globalMinStockAlert ?? 2}
                  onChange={(e) => setFormData({ ...formData, globalMinStockAlert: parseFloat(e.target.value) || 0 })}
                  placeholder="2"
                />
                <span className="text-xs text-neutral-500 font-medium leading-tight">
                  Quando o estoque de qualquer ingrediente/insumo estiver abaixo desse valor, o painel de estoque exibirá alertas visuais em vermelho e filtragem prioritária.
                </span>
              </div>
            </FormField>
          </div>

          {/* Seção 7: Contato, Endereço, PIX & Redes */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-brand-gold" />
              <span>7. Localização, Contato & Chave PIX</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="WhatsApp para Pedidos (com DDI e DDD)" icon={<MessageCircle className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-mono"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Ex: 5544998542446"
                />
              </FormField>

              <FormField label="Chave PIX Oficial" icon={<DollarSign className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  placeholder="Ex: 03972289960 ou seu e-mail"
                />
              </FormField>

              <FormField label="Endereço Completo de Retirada" icon={<MapPin className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm font-medium"
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  placeholder="Ex: Avenida Padre Jose Stefanello, n°340"
                />
              </FormField>

              <FormField label="Link do Instagram Oficial" icon={<Instagram className="w-4 h-4" />}>
                <input 
                  type="text" 
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-sm"
                  value={formData.instagramUrl || ''}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="Ex: https://instagram.com/s.e_docesgourmet"
                />
              </FormField>
            </div>
          </div>

          {/* Seção 8: Regras de Encomenda & Calendário */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-brand-gold" />
              <span>8. Regras de Encomenda & Bloqueio de Datas</span>
            </div>

            <FormField label="Antecedência Mínima para Encomendas (em Horas)" icon={<Clock className="w-4 h-4" />}>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min={0}
                  step={1}
                  className="w-32 p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all font-bold text-brand-wine text-base"
                  value={formData.minNoticeHours ?? 48}
                  onChange={(e) => setFormData({ ...formData, minNoticeHours: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 48"
                />
                <span className="text-xs text-neutral-500 font-medium">
                  {formData.minNoticeHours ? `(${Math.round(formData.minNoticeHours / 24 * 10) / 10} dias de antecedência no calendário do cliente)` : 'Sem antecedência mínima'}
                </span>
              </div>
            </FormField>

            <FormField label="Bloquear Datas no Calendário (Feriados / Dias Fechados / Lotados)" icon={<Calendar className="w-4 h-4" />}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all text-xs flex-grow"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddBlockedDate}
                    className="px-4 py-2 bg-brand-wine text-brand-gold font-bold text-xs rounded-xl hover:bg-brand-wine/90 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Bloquear Data
                  </button>
                </div>

                {/* Blocked Dates List */}
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 min-h-[60px] flex flex-wrap gap-2 items-center">
                  {(formData.blockedDates || []).length === 0 ? (
                    <span className="text-xs text-neutral-400 italic">Nenhuma data bloqueada no momento. Os clientes podem encomendar em qualquer data válida.</span>
                  ) : (
                    formData.blockedDates.map((dateStr: string) => (
                      <span
                        key={dateStr}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold shadow-2xs"
                      >
                        <Calendar className="w-3 h-3 text-red-500" />
                        {dateStr.split('-').reverse().join('/')}
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDate(dateStr)}
                          className="p-0.5 hover:bg-red-200/60 rounded-full transition-colors ml-1 text-red-500 hover:text-red-800"
                          title="Desbloquear esta data"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </FormField>
          </div>

          {/* Seção 9: Planilha do Cardápio */}
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-brand-wine uppercase tracking-wider">
              <LayoutGrid className="w-4 h-4 text-brand-gold" />
              <span>9. Integrações de Dados (Google Sheets)</span>
            </div>

            <FormField label="ID da Planilha do Google Sheets (Cardápio / Produtos)" icon={<LayoutGrid className="w-4 h-4" />}>
              <input 
                type="text" 
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all font-mono text-xs text-neutral-700"
                value={formData.googleSheetId}
                onChange={(e) => setFormData({ ...formData, googleSheetId: e.target.value })}
                placeholder="ID da sua planilha pública do Google Sheets"
              />
            </FormField>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-brand-wine text-brand-gold font-black rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-wine/25 text-sm tracking-wide cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-brand-gold" />
            SALVAR TODAS AS CONFIGURAÇÕES
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
