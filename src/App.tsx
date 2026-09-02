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
  Search, 
  ShoppingBag, 
  X, 
  Instagram, 
  MessageCircle, 
  Copy, 
  Check, 
  ChevronRight,
  Info,
  Clock,
  Calendar,
  User,
  CreditCard,
  DollarSign,
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
  Package
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn, formatCurrency, removeAcentos } from './lib/utils';
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

// ... resto das importações se necessário, mas foquemos na AdminView no final do arquivo

// Configuration placeholder - will be loaded from Firestore
const PRODUCT_IMAGES: Record<string, string> = {
  "Brigadeiro Tradicional": "https://images.unsplash.com/photo-1590004953392-5aba2e785943?q=80&w=800&auto=format&fit=crop",
  "Brigadeiro de Ninho com Nutella": "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=800&auto=format&fit=crop",
  "Beijinho": "https://images.unsplash.com/photo-1621255554746-d250873ec488?q=80&w=800&auto=format&fit=crop",
  "Bicho de Pé": "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=800&auto=format&fit=crop",
  "Brigadeiro de Churros": "https://images.unsplash.com/photo-1582294125863-718258356942?q=80&w=800&auto=format&fit=crop",
  "Casaninho": "https://images.unsplash.com/photo-1533038595180-f7ccc8967916?q=80&w=800&auto=format&fit=crop",
  "Brigadeiro de Paçoca": "https://images.unsplash.com/photo-1603532648955-039310d9ed75?q=80&w=800&auto=format&fit=crop",
  "Trufa": "https://images.unsplash.com/photo-1548907040-4baa42d10919?q=80&w=800&auto=format&fit=crop",
  "Cone": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=800&auto=format&fit=crop",
  "Pizza de Brownie": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=800&auto=format&fit=crop",
  "Fatia de Pizza": "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop",
  "Bebida": "https://images.unsplash.com/photo-1536939459926-301728717817?q=80&w=800&auto=format&fit=crop",
  "Coca-Cola": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop"
};

import { handleFirestoreError, OperationType } from './lib/firestoreErrors';

export default function App() {
  // State
  const [catalog, setCatalog] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('Todos');
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [view, setView] = useState<'catalog' | 'admin' | 'tracking'>('catalog');
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [productCosts, setProductCosts] = useState<Record<string, number>>({});
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<Record<string, any>>({});
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    contactPhone: "5544998542446",
    googleSheetId: "1LnFf7VKaV4CLedmpiLsWtgt_Z9bZJKuyLrPfevybQc0",
    pixKey: "03972289960",
    pickupAddress: "Avenida Padre Jose Stefanello, n°340"
  });

  const isAdmin = user?.email === 'rafaelhirofujii17@gmail.com';

  // Global Settings Listener
  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setGlobalSettings(prev => ({ ...prev, ...snap.data() }));
      }
    }, (err: any) => {
      // Missing or insufficient permissions expected initially if rules are not deployed properly.
      // We gracefully swallow it and handle the error internally.
      handleFirestoreError(err, OperationType.GET, 'settings/global');
    });
  }, []);

  const updateGlobalSettings = async (data: any) => {
    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        ...data,
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        if (err.message.includes('not-found') || err.message.includes('No document to update')) {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'settings', 'global'), {
            ...data,
            updatedAt: serverTimestamp()
          });
        }
      });
    } catch (err) {
      console.error("Failed to update global settings", err);
    }
  };

  // Solicitar permissão de notificação
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, { 
        body, 
        icon: '/favicon.ico' // O ícone pode ser ajustado conforme necessário
      });
    }
  };
  
  // Checkout Form State
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    name: localStorage.getItem('docesGourmetName') || '',
    date: '',
    time: '',
    paymentMethod: 'Pix',
    changeAmount: '',
    notes: ''
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u?.email !== 'rafaelhirofujii17@gmail.com') {
        setView('catalog');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Admin Orders (Real-time)
  useEffect(() => {
    let unsubscribe: any;

    if (view === 'admin' && user?.email === 'rafaelhirofujii17@gmail.com') {
      setLoadingOrders(true);
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      
      let initialLoad = true;
      unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Notificar apenas se for uma nova adição após o carregamento inicial
        if (!initialLoad && snapshot.docChanges().some(change => change.type === 'added')) {
          const newDoc = snapshot.docChanges().find(change => change.type === 'added')?.doc.data();
          if (newDoc) {
            sendBrowserNotification("🧁 Novo Pedido Recebido!", `Cliente: ${newDoc.customerName} - Total: ${formatCurrency(newDoc.total)}`);
            // Som de sino (opcional se houver arquivo)
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
          }
        }
        
        setAdminOrders(orders);
        setLoadingOrders(false);
        initialLoad = false;
      }, (error) => {
        console.error("Real-time listener failed", error);
        setLoadingOrders(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [view, user]);

  // Fetch and Monitor My Orders (Real-time tracking for customer)
  useEffect(() => {
    const savedOrderIds = JSON.parse(localStorage.getItem('myOrderIds') || '[]');
    if (savedOrderIds.length === 0) return;

    // We only listen if we have specific IDs to avoid "Permission Denied" on full collection list
    // Note: This requires the rule to allow get for these specific IDs or a query filter
    // Since our current rules only allow admin, even this will fail for guests.
    // If you want customers to track their orders, we need rules for it.
    
    // For now, only fetch if admin or if we explicitly allow it in rules.
    // To avoid the error console noise, we only run if we expect it to succeed or we handle it.
    if (!isAdmin && !auth.currentUser) return;

    // Instead of listening to all orders (which is denied), we listen to individual orders
    const unsubscribes: (() => void)[] = [];
    let initialLoad = true;
    
    savedOrderIds.forEach((id: string) => {
      const unsub = onSnapshot(doc(db, 'orders', id), (snap) => {
        if (snap.exists()) {
          const updated = { id: snap.id, ...snap.data() } as any;
          setMyOrders(prev => {
            const others = prev.filter(o => o.id !== id);
            const newList = [...others, updated].sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            });
            
            // Notification logic
            if (!initialLoad) {
              const statusMsg = updated.status === 'ready' ? "Seu pedido está pronto para retirada! 🥳" : 
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
        updates.deletedAt = null; // Clear if restoring
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
      // We need to import deleteDoc
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

  // Fetch Catalog
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const url = `https://docs.google.com/spreadsheets/d/${globalSettings.googleSheetId}/gviz/tq?tqx=out:csv`;
        const response = await fetch(url);
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data.slice(1) as string[][];
            const grouped: Record<string, CategoryGroup> = {};
            let idCounter = 1;

            rows.forEach((cols) => {
              // Clean columns (remove quotes and trim)
              const cleanCols = cols.map(col => col?.replace(/^"|"$/g, '').trim() || "");
              
              if (cleanCols.length >= 2 && cleanCols[1] !== "") {
                const category = cleanCols[0];
                const name = cleanCols[1];
                const priceCentoRaw = cleanCols[2]?.replace(',', '.');
                const unitPriceRaw = cleanCols[3]?.replace(',', '.');
                
                const priceCento = priceCentoRaw && priceCentoRaw !== "À Consultar" ? parseFloat(priceCentoRaw) : null;
                const unitPrice = unitPriceRaw && unitPriceRaw !== "À Consultar" ? parseFloat(unitPriceRaw) : null;
                
                // Image Mapping Logic
                let imageUrl = cleanCols[4] || "";
                if (!imageUrl || imageUrl === "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=200&auto=format&fit=crop") {
                   const matchedKey = Object.keys(PRODUCT_IMAGES).find(key => name.toLowerCase().includes(key.toLowerCase()));
                   imageUrl = matchedKey ? PRODUCT_IMAGES[matchedKey] : "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=200&auto=format&fit=crop";
                }

                const badge = cleanCols[5] || null;

                if (!grouped[category]) {
                  grouped[category] = { category, items: [] };
                }
                
                grouped[category].items.push({
                  id: idCounter++,
                  category,
                  name,
                  priceCento,
                  unitPrice,
                  imageUrl,
                  badge
                });
              }
            });

            setCatalog(Object.values(grouped));
            setLoading(false);
          },
          error: (err: any) => {
            console.error(err);
            setError("Erro ao carregar o catálogo. Tente novamente.");
            setLoading(false);
          }
        });
      } catch (err) {
        console.error(err);
        setError("Erro de conexão. Verifique sua internet.");
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Memoized Filtered Menu
  const filteredCatalog = useMemo(() => {
    return catalog.map(group => ({
      ...group,
      items: group.items.filter(item => {
        const matchesCategory = currentCategory === 'Todos' || group.category === currentCategory;
        const matchesSearch = removeAcentos(item.name).includes(removeAcentos(searchTerm));
        return matchesCategory && matchesSearch;
      })
    })).filter(group => group.items.length > 0);
  }, [catalog, currentCategory, searchTerm]);

  // Cart Operations
  const addToCart = (product: Product) => {
    const isUnitItem = !!(product.unitPrice && !product.priceCento);
    const increment = isUnitItem ? 1 : 25;

    setCart(prev => {
      const existing = prev[product.id];
      if (existing) {
        return {
          ...prev,
          [product.id]: {
            ...existing,
            quantity: existing.quantity + increment
          }
        };
      }
      return {
        ...prev,
        [product.id]: {
          ...product,
          quantity: increment,
          isUnitItem
        }
      };
    });
    
    // Tiny feedback
    if (!isCartOpen) {
      // Logic for mobile bounce or toast could go here
    }
  };

  const updateQuantity = (id: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;

      // Min quantity for cento items
      let finalQty = newQty;
      if (!item.isUnitItem && newQty < 25) {
        finalQty = 25;
      }

      return {
        ...prev,
        [id]: { ...item, quantity: finalQty }
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

      return () => {
        unsubInv();
        unsubIngredients();
        unsubRecipes();
        unsubReviews();
      };
    }
  }, [view, isAdmin]);

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
      const price = item.unitPrice ? item.unitPrice : (item.priceCento ? item.priceCento / 100 : 0);
      return acc + (price * item.quantity);
    }, 0);
  }, [cart]);

  const cartCount = Object.values(cart).length;

  // Checkout Operations
  const sendOrder = async () => {
    if (!orderDetails.name || !orderDetails.date || !orderDetails.time) {
      alert("Por favor, preencha todos os campos obrigatórios!");
      return;
    }

    localStorage.setItem('docesGourmetName', orderDetails.name);

    const items = (Object.values(cart) as CartItem[]).map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.unitPrice ? item.unitPrice : (item.priceCento ? item.priceCento / 100 : 0)
    }));

    // Save to Firestore
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        customerName: orderDetails.name,
        date: orderDetails.date,
        time: orderDetails.time,
        items,
        total: cartTotal,
        paymentMethod: orderDetails.paymentMethod,
        notes: orderDetails.notes,
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      // Save ID locally to track later
      const existingIds = JSON.parse(localStorage.getItem('myOrderIds') || '[]');
      localStorage.setItem('myOrderIds', JSON.stringify([docRef.id, ...existingIds]));
    } catch (err) {
      console.error("Failed to save order to db", err);
      // We continue anyway since WhatsApp is the main channel
    }

    const hour = new Date().getHours();
    const greeting = hour >= 5 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 18 ? "Boa tarde" : "Boa noite";
    
    const formattedDate = orderDetails.date.split('-').reverse().join('/');
    
    let msg = `${greeting}, Eduarda! Aqui é *${orderDetails.name}* e gostaria de fazer o seguinte pedido:\n\n`;

    items.forEach(item => {
      msg += `• ${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}\n`;
    });

    msg += `\n*🧁 Forminha:* Acetato (Padrão)`;
    msg += `\n\n*Total do Pedido: ${formatCurrency(cartTotal)}*`;
    msg += `\n\n*📍 Retirada:* Avenida Padre Jose Stefanello, n°340`;
    msg += `\n*📅 Data:* ${formattedDate}`;
    msg += `\n*⏰ Horário:* ${orderDetails.time}`;
    msg += `\n*💳 Pagamento:* ${orderDetails.paymentMethod}`;

    if (orderDetails.paymentMethod === 'Dinheiro' && orderDetails.changeAmount) {
      msg += `\n*💵 Troco para:* R$ ${orderDetails.changeAmount}`;
    }

    if (orderDetails.notes) {
      msg += `\n\n*📝 Obs:* ${orderDetails.notes}`;
    }

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#800020', '#D4AF37', '#ffffff']
    });

    window.open(`https://wa.me/${globalSettings.contactPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    
    // Clear cart and close everything
    setCart({});
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  const [copied, setCopied] = useState(false);

  const copyPix = () => {
    navigator.clipboard.writeText(globalSettings.pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-brand-wine/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg md:text-2xl font-black text-brand-wine tracking-tighter leading-none">
              S.E DOCES<span className="text-brand-gold">GOURMET</span>
            </h1>
            <p className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest font-medium">Catálogo Exclusivo</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('tracking')}
              className={cn(
                "p-2 rounded-full transition-all flex items-center gap-2 px-3",
                view === 'tracking' ? "bg-brand-wine text-white" : "text-brand-wine hover:bg-brand-wine/5"
              )}
              title="Meus Pedidos"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px] font-black hidden md:block">MEUS PEDIDOS</span>
            </button>

            {isAdmin && (
              <button 
                onClick={() => setView(view === 'catalog' ? 'admin' : 'catalog')}
                className="p-2 text-brand-wine hover:bg-brand-wine/5 rounded-full transition-all"
                title={view === 'catalog' ? "Ver Histórico" : "Ver Cardápio"}
              >
                {view === 'catalog' ? <History className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
              </button>
            )}

            <a 
              href="https://instagram.com/s.e_docesgourmet" 
              target="_blank" 
              className="p-2 text-brand-wine hover:text-brand-gold transition-colors"
              title="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-brand-wine hover:bg-brand-wine/5 rounded-full transition-all group"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-brand-gold text-brand-wine text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-8">
        {view === 'catalog' ? (
          <>
            {/* Search & Filters */}
            <section className="mb-12 space-y-6">
              <div className="relative group max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-brand-wine transition-colors" />
                <input 
                  type="text" 
                  placeholder="Qual doçura você procura? (ex: Brigadeiro)"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl focus:outline-none focus:border-brand-wine focus:ring-4 focus:ring-brand-wine/5 transition-all text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
                <FilterButton 
                  active={currentCategory === 'Todos'} 
                  onClick={() => setCurrentCategory('Todos')}
                >
                  Todos
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
            </section>

            {/* Product Grid */}
            <div className="space-y-16">
              {filteredCatalog.map(group => (
                <section key={group.category}>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl md:text-3xl font-serif text-brand-wine italic">{group.category}</h2>
                    <div className="h-px bg-brand-gold/30 flex-grow" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {group.items.map(item => (
                      <ProductCard 
                        key={item.id}
                        item={item}
                        onAdd={() => addToCart(item)}
                        onViewImage={() => setSelectedImage(item.imageUrl)}
                        contactPhone={globalSettings.contactPhone}
                      />
                    ))}
                  </div>
                </section>
              ))}
              
              {filteredCatalog.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-neutral-500 font-serif italic text-xl">Nenhuma doçura encontrada para "{searchTerm}"</p>
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
            <p className="text-brand-cream/70 font-light">Siga a gente no Instagram para ver encomendas reais e novidades diárias.</p>
          </div>
          
          <a 
            href="https://instagram.com/s.e_docesgourmet" 
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-3 bg-brand-gold text-brand-wine font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-wine/50"
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
                className="text-[10px] text-white/20 hover:text-brand-gold transition-colors flex items-center gap-1"
              >
                <LogIn className="w-3 h-3" />
                ACESSO ADM
              </button>
            ) : (
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-white/40">{user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="text-white/20 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  SAIR
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Floating Cart Button (Mobile) */}
      <div className="fixed bottom-6 right-6 md:hidden z-30">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex items-center gap-3 px-6 py-4 bg-brand-wine text-brand-gold font-black rounded-full shadow-2xl animate-float active:scale-90 transition-all border-2 border-brand-gold/20"
        >
          <ShoppingBag className="w-6 h-6" />
          VER PEDIDO ({cartCount})
        </button>
      </div>

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
                  <h2 className="text-xl font-serif text-brand-wine">Seu Pedido</h2>
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
                <div className="bg-brand-gold-light/40 border border-brand-gold/20 p-4 rounded-2xl flex gap-3">
                  <Info className="w-5 h-5 text-brand-wine shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 text-brand-wine/80">
                    <p><strong>Atenção:</strong> Pedido mínimo de 25 unidades por doce.</p>
                    <p>Encomendas com frutas requerem 4 dias de antecedência.</p>
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
                    {(Object.values(cart) as CartItem[]).map(item => {
                      const price = item.unitPrice ? item.unitPrice : (item.priceCento ? item.priceCento / 100 : 0);
                      return (
                        <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                          <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-grow min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            <p className="text-brand-wine font-black text-sm">{formatCurrency(price * item.quantity)}</p>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-1 border border-neutral-200 rounded-lg p-1 bg-neutral-50">
                                <button 
                                  onClick={() => {
                                    if (item.quantity <= (item.isUnitItem ? 1 : 25)) {
                                      removeFromCart(item.id);
                                    } else {
                                      updateQuantity(item.id, item.quantity - (item.isUnitItem ? 1 : 5));
                                    }
                                  }}
                                  className="p-1 hover:bg-white rounded transition-colors text-neutral-500"
                                >
                                  {item.quantity <= (item.isUnitItem ? 1 : 25) ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                                </button>
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                                  className="w-10 text-center text-xs font-bold bg-transparent outline-none"
                                />
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + (item.isUnitItem ? 1 : 5))}
                                  className="p-1 hover:bg-white rounded transition-colors text-neutral-500"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-[10px] text-neutral-400 font-medium">Qtd: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {cartCount > 0 && (
                <div className="p-6 bg-white border-t border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium tracking-wider text-xs uppercase">Subtotal</span>
                    <span className="text-2xl font-black text-brand-wine">{formatCurrency(cartTotal)}</span>
                  </div>
                  
                  <button 
                    onClick={() => setIsCheckoutOpen(true)}
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

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif text-brand-wine italic">Quase Pronto!</h2>
                  <p className="text-neutral-500 text-sm">Preencha os detalhes para agendarmos sua retirada.</p>
                </div>
                <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors shrink-0">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 pt-4 space-y-8">
                {/* Pickup Address */}
                <div className="p-4 bg-brand-cream border-l-4 border-brand-wine rounded-r-2xl space-y-1">
                  <div className="flex items-center gap-2 text-brand-wine font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    📍 LOCAL DE RETIRADA
                  </div>
                  <p className="text-neutral-600 text-sm">Avenida Padre Jose Stefanello, n°340</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Seu Nome" icon={<User className="w-4 h-4" />}>
                    <input 
                      type="text" 
                      placeholder="Ex: Maria Silva"
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine focus:ring-1 focus:ring-brand-wine/20 outline-none transition-all"
                      value={orderDetails.name}
                      onChange={(e) => setOrderDetails(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </FormField>

                  <FormField label="Data da Retirada" icon={<Calendar className="w-4 h-4" />}>
                    <input 
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all"
                      value={orderDetails.date}
                      onChange={(e) => setOrderDetails(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </FormField>

                  <FormField label="Horário" icon={<Clock className="w-4 h-4" />}>
                    <input 
                      type="time" 
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all"
                      value={orderDetails.time}
                      onChange={(e) => setOrderDetails(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </FormField>

                  <FormField label="Pagamento" icon={<CreditCard className="w-4 h-4" />}>
                    <select 
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all appearance-none"
                      value={orderDetails.paymentMethod}
                      onChange={(e) => setOrderDetails(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                    >
                      <option value="Pix">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </FormField>
                </div>

                {orderDetails.paymentMethod === 'Pix' && (
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-[24px] text-center space-y-4">
                    <div className="space-y-1">
                      <p className="text-blue-900/60 text-[10px] uppercase font-black tracking-widest">Chave PIX (CPF)</p>
                      <p className="text-xl font-black text-blue-900">039.722.899-60</p>
                    </div>
                    <button 
                      onClick={copyPix}
                      className={cn(
                        "inline-flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all",
                        copied ? "bg-emerald-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "COPIADO!" : "COPIAR CHAVE"}
                    </button>
                  </div>
                )}

                {orderDetails.paymentMethod === 'Dinheiro' && (
                  <FormField label="Troco para quanto?" icon={<DollarSign className="w-4 h-4" />}>
                    <input 
                      type="text" 
                      placeholder="Ex: 50, 100 (Ou deixe em branco)"
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all"
                      value={orderDetails.changeAmount}
                      onChange={(e) => setOrderDetails(prev => ({ ...prev, changeAmount: e.target.value }))}
                    />
                  </FormField>
                )}

                <FormField label="Observações Adicionais" icon={<Info className="w-4 h-4" />}>
                  <textarea 
                    rows={3}
                    placeholder="Ex: Sem granulado, embalagem de presente, etc..."
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all resize-none"
                    value={orderDetails.notes}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </FormField>
              </div>

              <div className="p-8 pt-4 bg-neutral-50 border-t border-neutral-100">
                <button 
                  onClick={sendOrder}
                  className="w-full py-5 bg-brand-wine text-brand-gold font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-brand-wine/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <MessageCircle className="w-6 h-6" />
                  ENVIAR PEDIDO VIA WHATSAPP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[300] bg-neutral-950/95 flex items-center justify-center p-4"
          >
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-2 border-brand-gold/50"
            />
            <button className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponents
const FilterButton: React.FC<{ children: React.ReactNode, active: boolean, onClick: () => void }> = ({ children, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all text-sm border",
        active 
          ? "bg-brand-wine text-brand-gold border-brand-wine shadow-lg shadow-brand-wine/20 scale-105" 
          : "bg-white text-neutral-500 border-neutral-200 hover:border-brand-wine/30 hover:bg-brand-wine/5"
      )}
    >
      {children}
    </button>
  );
};

const ProductCard: React.FC<{ item: Product, onAdd: () => void, onViewImage: () => void, contactPhone: string }> = ({ item, onAdd, onViewImage, contactPhone }) => {
  const [showReviews, setShowReviews] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pReviews, setPReviews] = useState<any[]>([]);

  // Load reviews for this product
  useEffect(() => {
    if (showReviews) {
      const q = query(
        collection(db, 'reviews'), 
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snap) => {
        setPReviews(snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((r: any) => r.productName === item.name)
        );
      }, (err) => {
        console.error("Error loading reviews for product:", err);
      });
    }
  }, [showReviews, item.name]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Você precisa estar logado para avaliar!");
      return;
    }
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productName: item.name,
        userName: auth.currentUser.displayName || 'Cliente',
        userEmail: auth.currentUser.email,
        rating,
        comment,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setComment('');
      alert("Sua avaliação foi enviada e está aguardando moderação. Obrigado!");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const isConsult = item.priceCento === null && item.unitPrice === null;
  const priceText = isConsult 
    ? 'À Consultar' 
    : (item.unitPrice && !item.priceCento 
        ? `${formatCurrency(item.unitPrice)} / Unidade` 
        : `${formatCurrency(item.priceCento || 0)} / Cento`);

  const avgRating = pReviews.length > 0 
    ? pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length 
    : 5;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
      >
        {item.badge && (
          <div className="absolute top-6 left-[-70px] z-20 w-[240px] bg-red-600 text-white text-[10px] font-black py-1.5 text-center shadow-lg shadow-red-600/30 uppercase tracking-wider transform -rotate-45 pointer-events-none border-y border-white/20">
            <span className="block w-full text-center drop-shadow-sm">{item.badge}</span>
          </div>
        )}
        
        <div className="relative aspect-square overflow-hidden bg-neutral-100 group-hover:scale-110 transition-transform duration-700">
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={onViewImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <button 
            onClick={() => setShowReviews(true)}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 text-xs font-black text-brand-wine hover:bg-white transition-colors"
          >
            <Star className="w-3 h-3 fill-brand-gold text-brand-gold" />
            {avgRating.toFixed(1)}
          </button>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <h3 className="font-serif text-lg leading-tight mb-2 group-hover:text-brand-wine transition-colors">{item.name}</h3>
          <p className="text-brand-wine font-black text-sm mb-6 flex-grow">{priceText}</p>

          {isConsult ? (
            <button 
              onClick={() => window.open(`https://wa.me/${contactPhone}?text=Olá! Gostaria de consultar o valor do doce: ${item.name}`, '_blank')}
              className="w-full py-3 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              CONSULTAR VALOR
            </button>
          ) : (
            <button 
              onClick={onAdd}
              className="w-full py-3 bg-brand-wine text-brand-gold font-black rounded-xl hover:bg-brand-wine/90 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 group-hover:gold-gradient group-hover:text-brand-wine"
            >
              <Plus className="w-4 h-4" />
              ADICIONAR AO PEDIDO
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showReviews && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviews(false)}
              className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl italic text-brand-wine">{item.name}</h3>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest tracking-widest mt-1">Avaliações dos Clientes</p>
                </div>
                <button onClick={() => setShowReviews(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 pt-4 space-y-8">
                {/* Review Form */}
                <div className="p-6 bg-brand-cream/50 rounded-3xl border border-brand-wine/5">
                  <h4 className="text-[10px] font-black text-brand-wine uppercase tracking-widest mb-4">Deixe seu feedback</h4>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button 
                          key={v}
                          type="button"
                          onClick={() => setRating(v)}
                          className={cn("p-1 transition-transform active:scale-90", rating >= v ? "text-brand-gold" : "text-neutral-200")}
                        >
                          <Star className={cn("w-6 h-6", rating >= v && "fill-current")} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="O que achou deste doce?"
                      className="w-full p-4 text-sm bg-white border border-brand-wine/10 rounded-2xl focus:border-brand-wine outline-none resize-none h-24"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-brand-wine text-white text-xs font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand-wine/20 disabled:opacity-50"
                    >
                      {submitting ? "ENVIANDO..." : "PUBLICAR AVALIAÇÃO"}
                    </button>
                  </form>
                </div>

                {/* List */}
                <div className="space-y-6">
                  {pReviews.length === 0 ? (
                    <div className="text-center py-10 text-neutral-400 italic font-serif">Seja o primeiro a avaliar este item!</div>
                  ) : (
                    pReviews.map((r: any) => (
                      <div key={r.id} className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-brand-wine">{r.userName}</span>
                          <span className="text-neutral-300">
                             {r.createdAt instanceof Timestamp ? r.createdAt.toDate().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Hoje'}
                          </span>
                        </div>
                        <div className="flex gap-0.5 text-brand-gold">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} className={cn("w-2.5 h-2.5 fill-current", i >= r.rating && "opacity-20")} />
                           ))}
                        </div>
                        <p className="text-sm text-neutral-600 font-serif leading-relaxed italic">"{r.comment}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

const ProductCardLegacy = ({ item, onAdd, onViewImage }: { item: Product, onAdd: () => void, onViewImage: () => void }) => {
  return null; // This is just to replace the old one correctly
};

function FormField({ label, children, icon }: { label: string, children: React.ReactNode, icon: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
        <span className="text-brand-wine">{icon}</span>
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
  onUpdateSettings
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
  onUpdateSettings: (data: any) => void
}) {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'year' | 'trash'>('all');
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'reviews' | 'settings'>('orders');

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

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-brand-wine font-serif italic animate-pulse">Carregando dados adm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif text-brand-wine italic">Área Administrativa</h2>
          <p className="text-neutral-500 text-sm">Gere o seu negócio com precisão.</p>
        </div>
        
        <div className="flex p-1 bg-neutral-100 rounded-2xl">
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'orders' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'inventory' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Estoque/Custos
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'reviews' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Avaliações
            {reviews.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] rounded-full">
                {reviews.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'settings' ? "bg-white text-brand-wine shadow-sm" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Configurações
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2 justify-end">
            {(['all', 'week', 'month', 'year', 'trash'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                  periodFilter === p 
                    ? "bg-brand-gold text-brand-wine border-brand-gold" 
                    : (p === 'trash' ? "bg-red-50 text-red-500 border-red-100" : "bg-white text-neutral-400 border-neutral-200")
                )}
              >
                {p === 'trash' && <Trash2 className="w-3 h-3" />}
                {p === 'all' ? 'Tudo' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : p === 'year' ? 'Ano' : 'Lixeira'}
              </button>
            ))}
          </div>

          {periodFilter !== 'trash' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Bruto" value={formatCurrency(stats.totalRevenue)} color="neutral" />
              <StatCard label="Líquido (Lucro)" value={formatCurrency(stats.netRevenue)} color="wine" />
              <StatCard label="Volume" value={`${stats.count} ped.`} color="gold" />
            </div>
          )}

          {periodFilter !== 'trash' && <AdminCharts orders={orders} productCosts={productCosts} ingredients={ingredients} recipes={recipes} />}

          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-[32px]">
                <p className="text-neutral-400 font-serif italic">Nenhum pedido aqui.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <AdminOrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={onUpdateStatus} 
                  onDeletePermanent={onDeletePermanent}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <InventoryTab 
          orders={orders} 
          productCosts={productCosts} 
          onUpdateCost={onUpdateCost} 
          ingredients={ingredients}
          onUpdateIngredient={onUpdateIngredient}
          onDeleteIngredient={onDeleteIngredient}
          recipes={recipes}
          onUpdateRecipe={onUpdateRecipe}
          catalog={catalog}
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

function AdminOrderCard({ order, onUpdateStatus, onDeletePermanent }: { key?: React.Key, order: any, onUpdateStatus: (id: string, status: string) => void, onDeletePermanent: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = order.status === 'completed';
  const isReady = order.status === 'ready';
  const isDeleted = order.status === 'deleted';

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
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert("Configurações atualizadas com sucesso!");
  };

  return (
    <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 p-8 max-w-2xl">
      <div className="mb-8">
        <h3 className="text-xl font-serif text-brand-wine italic">Configurações Gerais</h3>
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
          Ajuste as informações básicas do site
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <FormField label="WhatsApp para Contato" icon={<MessageCircle className="w-4 h-4" />}>
            <input 
              type="text" 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="Ex: 5544998542446"
            />
          </FormField>

          <FormField label="ID da Planilha (Google Sheets)" icon={<LayoutGrid className="w-4 h-4" />}>
            <input 
              type="text" 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all font-mono text-xs"
              value={formData.googleSheetId}
              onChange={(e) => setFormData({ ...formData, googleSheetId: e.target.value })}
              placeholder="ID da sua Google Sheets"
            />
          </FormField>

          <FormField label="Chave PIX" icon={<DollarSign className="w-4 h-4" />}>
            <input 
              type="text" 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all"
              value={formData.pixKey}
              onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
              placeholder="Ex: Seu CPF ou E-mail"
            />
          </FormField>

          <FormField label="Endereço de Retirada" icon={<Calendar className="w-4 h-4" />}>
            <input 
              type="text" 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:border-brand-wine outline-none transition-all"
              value={formData.pickupAddress}
              onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
              placeholder="Ex: Rua, Número, Bairro"
            />
          </FormField>
        </div>

        <button 
          type="submit"
          className="w-full py-4 bg-brand-wine text-brand-gold font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-wine/20"
        >
          SALVAR ALTERAÇÕES
        </button>
      </form>
    </div>
  );
}
