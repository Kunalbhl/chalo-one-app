import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, PlaySquare,
  StopCircle, PlusCircle, MinusCircle, FileText, Lock, Unlock, Key, Mail,
  Ticket, Plus, Trash2, Edit, Save, Check, Copy, Link, MapPin, Eye, Compass,
  Smartphone, Network, TrendingUp, History, Info, HelpCircle, Layers, Cpu,
  Server, Terminal, Radio, Shield, Clock, Search, Filter, RefreshCw, Download, 
  UserPlus, CreditCard, Bell, ChevronRight, MessageSquare, DollarSign, Users, 
  Percent, Star, Upload, FileUp, ListOrdered, ClipboardList, CheckCircle, ArrowLeft
} from 'lucide-react';
import { db, storage } from '../firebase';
import { WriteGuard } from '../services/WriteGuard';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot,
  query, where, orderBy, limit, serverTimestamp, writeBatch, arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile } from '../types';
import { NotificationService } from '../services/notificationService';
import { OrderService } from '../services/orderService';
import { DriverService } from '../services/driverService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

interface PartnerPortalProps {
  userProfile: UserProfile;
  overridePartnerId?: string;
  isAdminView?: boolean;
  onBack: () => void;
}

export default function PartnerPortal({ userProfile, overridePartnerId, isAdminView, onBack }: PartnerPortalProps) {
  const targetPartnerId = overridePartnerId || userProfile?.id;
  // General State
  const [partner, setPartner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Multi-step Registration form states
  const [regStep, setRegStep] = useState<number>(1);
  const [regForm, setRegForm] = useState<any>({
    businessName: '',
    ownerName: userProfile.name || '',
    category: 'Restaurant',
    subcategory: '',
    email: userProfile.email || '',
    phone: userProfile.phone || '',
    whatsApp: '',
    website: '',
    instagram: '',
    twitter: '',
    address: '',
    latitude: '12.9716',
    longitude: '77.5946',
    openingHours: '09:00 AM - 10:00 PM',
    holidaySchedule: 'None',
    deliveryRadius: 10,
    bankAccountNumber: '',
    bankIfsc: '',
    bankHolderName: '',
    upiId: '',
    settlementPreference: 'Daily',
    gstNumber: '',
    panNumber: '',
    fssaiNumber: '',
    businessLicenseNumber: ''
  });

  // Document states
  const [documents, setDocuments] = useState<any>({
    gst: { status: 'Pending', url: '' },
    pan: { status: 'Pending', url: '' },
    aadhaar: { status: 'Pending', url: '' },
    driving_license: { status: 'Pending', url: '' },
    trade_license: { status: 'Pending', url: '' },
    fssai: { status: 'Pending', url: '' },
    cancelled_cheque: { status: 'Pending', url: '' },
    bank_passbook: { status: 'Pending', url: '' },
    business_images: { status: 'Pending', url: '' },
    store_images: { status: 'Pending', url: '' },
    menu_images: { status: 'Pending', url: '' },
    certificates: { status: 'Pending', url: '' }
  });

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Multi-branch state
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [showAddBranch, setShowAddBranch] = useState<boolean>(false);
  const [branchForm, setBranchForm] = useState<any>({
    branchName: '',
    branchCode: '',
    manager: '',
    phone: '',
    email: '',
    address: '',
    latitude: 12.9716,
    longitude: 77.5946,
    openingHours: '09:00 AM - 10:00 PM',
    deliveryRadius: 10,
    status: 'Open',
    minOrderValue: 100,
    maxOrderValue: 5000,
    baseDeliveryCharge: 40,
    rainCharge: 0,
    nightCharge: 0,
    festivalCharge: 0
  });

  const [inventory, setInventory] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddStaff, setShowAddStaff] = useState<boolean>(false);
  const [staffForm, setStaffForm] = useState<any>({
    name: '',
    email: '',
    phone: '',
    role: 'Chef',
    password: '',
    status: 'Active'
  });

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewReplyText, setReviewReplyText] = useState<string>('');
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);

  const [coupons, setCoupons] = useState<any[]>([]);
  const [showAddCoupon, setShowAddCoupon] = useState<boolean>(false);
  const [couponForm, setCouponForm] = useState<any>({
    code: '',
    type: 'discount',
    discountType: 'Percentage',
    discountValue: 10,
    minOrder: 150,
    maxDiscount: 100,
    usageLimit: 1,
    happyHourStart: '',
    happyHourEnd: '',
    buyX: 0,
    getY: 0
  });

  // KDS & Inventory Operational UI states
  const [kdsSelectedOrderId, setKdsSelectedOrderId] = useState<string | null>(null);
  const [kdsDelayMinutes, setKdsDelayMinutes] = useState<number>(10);
  const [showReceiptOrderId, setShowReceiptOrderId] = useState<string | null>(null);
  const [showRestockItemId, setShowRestockItemId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(20);

  // Sub-modules state
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Search & filter states
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<string>('All');
  const [orderPage, setOrderPage] = useState<number>(1);
  const ordersPerPage = 5;

  // New product form states
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false);
  const [productForm, setProductForm] = useState<any>({
    name: '',
    description: '',
    category: '',
    basePrice: 0,
    offerPrice: '',
    packagingCharges: 0,
    gstRate: 5,
    preparationTime: 15,
    deliveryTime: 30,
    imageUrl: '',
    inStock: true,
    inventoryCount: 50,
    variants: [],
    addOns: [],
    // Dynamic Pricing Engine fields
    dynamicPricing: false,
    weekendMarkup: 0,
    festivalMarkup: 0,
    nightMarkup: 0,
    platformDiscount: 0,
    partnerDiscount: 0,
    bulkMinQty: 3,
    bulkDiscountPct: 10,
    scheduledSlots: 'All Day',
    comboMeals: ''
  });

  // Ticket Form States
  const [showAddTicket, setShowAddTicket] = useState<boolean>(false);
  const [ticketForm, setTicketForm] = useState<any>({
    subject: '',
    description: '',
    category: 'Billing',
    priority: 'Medium'
  });
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState<string>('');

  // Business Types
  const BUSINESS_TYPES = [
    "Restaurant", "Cloud Kitchen", "Cafe", "Bakery", "Sweet Shop", 
    "Grocery Store", "Pharmacy", "Hotel", "Homestay", "PG", 
    "Taxi Operator", "Rental Service", "Retail Shop", "Service Provider"
  ];

  // Load Partner Profile & Sub-collections
  useEffect(() => {
    if (!targetPartnerId) return;
    setIsLoading(true);

    const partnerDocRef = doc(db, 'partners', targetPartnerId);
    const unsubscribePartner = onSnapshot(partnerDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPartner({ id: snap.id, ...data });
        if (data.documents) {
          setDocuments(data.documents);
        }
      } else {
        setPartner(null);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Error watching partner profile:", err);
      setIsLoading(false);
    });

    return () => unsubscribePartner();
  }, [userProfile?.id]);

  // Once partner profile is active and verified, start listening to branches and auto-create default branch if empty
  useEffect(() => {
    if (!partner || partner.verificationStatus !== 'Approved') return;

    // A. Listen to branches
    const branchesQuery = query(collection(db, `partners/${partner.id}/branches`));
    const unsubscribeBranches = onSnapshot(branchesQuery, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setBranches(list);

      // Auto-select first branch if none selected
      if (list.length > 0 && !selectedBranchId) {
        setSelectedBranchId(list[0].branchId);
      }
    });

    // B. Trigger auto-initialization of default branch if database is empty
    const checkBranches = async () => {
      try {
        const branchesRef = collection(db, `partners/${partner.id}/branches`);
        const q = query(branchesRef, limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          const defaultBranchId = `b_${Date.now()}`;
          const defaultBranch = {
            branchId: defaultBranchId,
            branchName: partner.businessName + " (Main)",
            branchCode: partner.businessName.substring(0, 3).toUpperCase() + "-001",
            manager: partner.ownerName,
            phone: partner.phone || '',
            email: partner.email || '',
            address: partner.address || '',
            latitude: Number(partner.latitude) || 12.9716,
            longitude: Number(partner.longitude) || 77.5946,
            openingHours: partner.openingHours || '09:00 AM - 10:00 PM',
            deliveryRadius: Number(partner.deliveryRadius) || 10,
            status: 'Open',
            minOrderValue: 100,
            maxOrderValue: 5000,
            baseDeliveryCharge: 40,
            rainCharge: 0,
            nightCharge: 0,
            festivalCharge: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await WriteGuard.safeSet(`partners/${partner.id}/branches`, defaultBranchId, defaultBranch);
          
          // Mirror to public restaurants directory for client order system
          await WriteGuard.safeSet('restaurants', defaultBranchId, {
            id: defaultBranchId,
            partnerId: partner.id,
            name: defaultBranch.branchName,
            phone: defaultBranch.phone,
            email: defaultBranch.email,
            address: defaultBranch.address,
            cuisine: partner.subcategory || 'Specialty Cuisine',
            cuisines: partner.subcategory ? [partner.subcategory] : ['Specialty'],
            rating: 4.8,
            deliveryTime: 30,
            bannerImage: partner.banner || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
            tagline: partner.description || 'Welcome to our restaurant!',
            status: 'Open',
            openingHours: defaultBranch.openingHours,
            deliveryRadius: defaultBranch.deliveryRadius,
            latitude: defaultBranch.latitude,
            longitude: defaultBranch.longitude
          });
        }
      } catch (err) {
        console.error("Error auto-initializing branch:", err);
      }
    };
    checkBranches();

    return () => unsubscribeBranches();
  }, [partner, selectedBranchId]);

  // Once partner is active, and a branch is selected, listen to all branch-specific subcollections
  useEffect(() => {
    if (!partner || partner.verificationStatus !== 'Approved' || !selectedBranchId) return;

    // 1. Listen to products (for active branch menu)
    const productsQuery = query(collection(db, `restaurants/${selectedBranchId}/menu`));
    const unsubscribeProducts = onSnapshot(productsQuery, (snap) => {
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setProducts(items);

      // Extract unique categories
      const cats = Array.from(new Set(items.map(item => item.category).filter(Boolean)));
      setMenuCategories(cats);
    });

    // 2. Listen to orders of this specific branch
    const ordersQuery = query(
      collection(db, 'food_orders'),
      where('restaurantId', '==', selectedBranchId)
    );
    const unsubscribeOrders = onSnapshot(ordersQuery, (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({ id: d.id, ...data });
      });
      // Sort orders descending by createdAt
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime() || 0;
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });
      setOrders(list);

      // Extract customer metrics
      const customerMap = new Map<string, any>();
      list.forEach(ord => {
        const cId = ord.userId || 'Guest';
        if (!customerMap.has(cId)) {
          customerMap.set(cId, {
            name: ord.userName || ord.customerName || 'Premium Customer',
            ordersCount: 0,
            ratings: [],
            reviews: [],
            addresses: [ord.deliveryAddress || 'N/A'],
            favouriteProducts: [],
            orderHistory: []
          });
        }
        const cust = customerMap.get(cId);
        cust.ordersCount++;
        cust.orderHistory.push({
          id: ord.id,
          amount: ord.totalAmount || ord.totalPrice || 0,
          status: ord.status,
          date: ord.createdAt ? new Date(ord.createdAt.seconds ? ord.createdAt.seconds * 1000 : ord.createdAt).toLocaleDateString() : 'N/A'
        });
        if (ord.items) {
          ord.items.forEach((it: any) => {
            if (it.name) cust.favouriteProducts.push(it.name);
          });
        }
      });
      setCustomers(Array.from(customerMap.values()));
    });

    // 3. Listen to inventory of selected branch
    const unsubscribeInventory = onSnapshot(collection(db, `restaurants/${selectedBranchId}/inventory`), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setInventory(list);
    });

    // 4. Listen to staff of selected branch
    const unsubscribeStaff = onSnapshot(collection(db, `restaurants/${selectedBranchId}/staff`), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setStaff(list);
    });

    // 5. Listen to reviews of selected branch
    const unsubscribeReviews = onSnapshot(collection(db, `restaurants/${selectedBranchId}/reviews`), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setReviews(list);
    });

    // 6. Listen to coupons of selected branch
    const unsubscribeCoupons = onSnapshot(collection(db, `restaurants/${selectedBranchId}/coupons`), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setCoupons(list);
    });

    // 7. Listen to settlements of overall partner
    const settlementsQuery = query(
      collection(db, `partners/${partner.id}/settlements`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeSettlements = onSnapshot(settlementsQuery, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSettlements(list);
    }, (err) => {
      console.warn("Settlements query failed, using empty list fallback:", err);
    });

    // 8. Listen to support tickets
    const ticketsQuery = query(
      collection(db, 'support_tickets'),
      where('partnerId', '==', partner.id)
    );
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSupportTickets(list);
    });

    // 9. Listen to audit logs
    const auditQuery = query(
      collection(db, 'audit_logs'),
      where('details.partnerId', '==', partner.id),
      limit(20)
    );
    const unsubscribeAudits = onSnapshot(auditQuery, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setActivities(list);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeInventory();
      unsubscribeStaff();
      unsubscribeReviews();
      unsubscribeCoupons();
      unsubscribeSettlements();
      unsubscribeTickets();
      unsubscribeAudits();
    };
  }, [partner, selectedBranchId]);

  // Log Audit Action Helper
  const writeAuditLog = async (action: string, details: any) => {
    try {
      const logId = `AUDIT-${Date.now()}-${parseInt(crypto.randomUUID().slice(0, 4), 16)}`;
      await setDoc(doc(db, 'audit_logs', logId), {
        adminEmail: userProfile.email,
        userId: targetPartnerId,
        action,
        details: { ...details, partnerId: targetPartnerId },
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("Error logging audit:", e);
    }
  };

  // Onboarding submit
  const handleRegisterOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regStep < 3) {
      setRegStep(prev => prev + 1);
      return;
    }

    try {
      setIsLoading(true);
      const partnerData = {
        ...regForm,
        userId: targetPartnerId,
        verificationStatus: 'Submitted', // Submitted to review
        businessStatus: 'Inactive', // Starts inactive until reviewed
        documents,
        walletBalance: 0,
        pendingSettlements: 0,
        paidSettlements: 0,
        commissionRate: 10, // Default 10% platform fee
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create main partner entry in Firestore
      await setDoc(doc(db, 'partners', targetPartnerId), partnerData, { merge: true });
      await writeAuditLog('PARTNER_REGISTERED', { businessName: regForm.businessName, category: regForm.category });
      
      // Update User profile role to partner in Firestore & client side
      await updateDoc(doc(db, 'users', targetPartnerId), {
        role: 'partner'
      });

      // Send platform alert
      await NotificationService.addNotification(
        targetPartnerId,
        '🤝 Registration Received!',
        `Your application for ${regForm.businessName} has been submitted for review.`,
        'system',
        { icon: '💼' }
      );

      setRegStep(1);
    } catch (err: any) {
      console.error("Error submitting registration:", err);
      alert("Failed to submit: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Secure document upload
  const handleDocumentUpload = async (docType: string, file: File) => {
    if (!file) return;
    setUploadingDoc(docType);
    try {
      // 1. Storage upload attempt
      const storageRef = ref(storage, `partners/${targetPartnerId}/documents/${docType}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Save updated metadata inside local state and Firestore
      const updatedDocs = {
        ...documents,
        [docType]: {
          status: 'Pending',
          url: downloadURL,
          fileName: file.name,
          updatedAt: new Date().toISOString()
        }
      };
      setDocuments(updatedDocs);

      if (partner) {
        await updateDoc(doc(db, 'partners', targetPartnerId), {
          documents: updatedDocs,
          updatedAt: new Date().toISOString()
        });
      }

      await writeAuditLog('UPLOAD_DOCUMENT', { docType, fileName: file.name });

      // Notify user
      await NotificationService.addNotification(
        targetPartnerId,
        '📁 Document Uploaded',
        `Your ${docType.toUpperCase()} file has been secure uploaded and is pending review.`,
        'system'
      );
    } catch (err: any) {
      console.warn("Storage upload failed, executing robust local dataURL fallback:", err);
      
      // Fallback: Read as base64 to keep the onboarding and reviews completely functional
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result as string;
        const updatedDocs = {
          ...documents,
          [docType]: {
            status: 'Pending',
            url: base64Url,
            fileName: file.name,
            updatedAt: new Date().toISOString()
          }
        };
        setDocuments(updatedDocs);

        if (partner) {
          await updateDoc(doc(db, 'partners', targetPartnerId), {
            documents: updatedDocs,
            updatedAt: new Date().toISOString()
          });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingDoc(null);
    }
  };

  // Catalog/Product additions (with Branch support & automatic Inventory Sync)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      alert("Please select a branch first!");
      return;
    }
    if (!productForm.name || !productForm.category) {
      alert("Product Name and Category are required!");
      return;
    }

    try {
      const prodId = `PROD-${Date.now()}`;
      const productRef = doc(db, `restaurants/${selectedBranchId}/menu`, prodId);

      const data = {
        ...productForm,
        id: prodId,
        basePrice: Number(productForm.basePrice),
        offerPrice: productForm.offerPrice ? Number(productForm.offerPrice) : null,
        packagingCharges: Number(productForm.packagingCharges),
        gstRate: Number(productForm.gstRate),
        preparationTime: Number(productForm.preparationTime),
        deliveryTime: Number(productForm.deliveryTime),
        inventoryCount: Number(productForm.inventoryCount),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(productRef, data, { merge: true });
      
      // Auto-create initial inventory tracking sheet
      const inventoryRef = doc(db, `restaurants/${selectedBranchId}/inventory`, prodId);
      const inventoryData = {
        id: prodId,
        itemId: prodId,
        sku: `SKU-${productForm.name.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        barcode: `BC-${Date.now().toString().slice(-6)}`,
        purchasePrice: Math.round(Number(productForm.basePrice) * 0.6),
        sellingPrice: Number(productForm.basePrice),
        currentStock: Number(productForm.inventoryCount) || 50,
        minimumStock: 10,
        maximumStock: 500,
        supplier: 'Main Wholesaler Co.',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
        autoStockDeduction: true,
        lowStockAlerts: true,
        updatedAt: new Date().toISOString()
      };
      await setDoc(inventoryRef, inventoryData);

      await writeAuditLog('ADD_CATALOG_PRODUCT', { productName: productForm.name, category: productForm.category, branchId: selectedBranchId });

      // Low stock check trigger
      if (data.inventoryCount <= 5) {
        await NotificationService.addNotification(
          partner.id,
          '⚠️ Stock Alert Low!',
          `Your catalog item '${data.name}' has dropped below 5 units (${data.inventoryCount} left).`,
          'system',
          { icon: '📦' }
        );
      }

      setShowAddProduct(false);
      // Reset form
      setProductForm({
        name: '',
        description: '',
        category: '',
        basePrice: 0,
        offerPrice: '',
        packagingCharges: 0,
        gstRate: 5,
        preparationTime: 15,
        deliveryTime: 30,
        imageUrl: '',
        inStock: true,
        inventoryCount: 50,
        variants: [],
        addOns: [],
        dynamicPricing: false,
        weekendMarkup: 0,
        festivalMarkup: 0,
        nightMarkup: 0,
        platformDiscount: 0,
        partnerDiscount: 0,
        bulkMinQty: 3,
        bulkDiscountPct: 10,
        scheduledSlots: 'All Day',
        comboMeals: ''
      });
    } catch (err: any) {
      console.error("Error creating product:", err);
      alert("Failed to create product: " + err.message);
    }
  };

  // Branch administration actions
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.branchName || !branchForm.branchCode) {
      alert("Branch Name and Branch Code are required!");
      return;
    }
    try {
      const bId = `b_${Date.now()}`;
      const newBranch = {
        ...branchForm,
        branchId: bId,
        latitude: Number(branchForm.latitude) || 12.9716,
        longitude: Number(branchForm.longitude) || 77.5946,
        deliveryRadius: Number(branchForm.deliveryRadius) || 10,
        minOrderValue: Number(branchForm.minOrderValue) || 100,
        maxOrderValue: Number(branchForm.maxOrderValue) || 5000,
        baseDeliveryCharge: Number(branchForm.baseDeliveryCharge) || 40,
        rainCharge: Number(branchForm.rainCharge) || 0,
        nightCharge: Number(branchForm.nightCharge) || 0,
        festivalCharge: Number(branchForm.festivalCharge) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, `partners/${partner.id}/branches`, bId), newBranch);
      
      // Mirror to public restaurants directory
      await setDoc(doc(db, 'restaurants', bId), {
        id: bId,
        partnerId: partner.id,
        name: newBranch.branchName,
        phone: newBranch.phone,
        email: newBranch.email,
        address: newBranch.address,
        cuisine: partner.subcategory || 'Specialty Cuisine',
        cuisines: partner.subcategory ? [partner.subcategory] : ['Specialty'],
        rating: 4.8,
        deliveryTime: 30,
        bannerImage: partner.banner || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        tagline: partner.description || 'Welcome to our restaurant!',
        status: newBranch.status,
        openingHours: newBranch.openingHours,
        deliveryRadius: newBranch.deliveryRadius,
        latitude: newBranch.latitude,
        longitude: newBranch.longitude,
        minOrderValue: newBranch.minOrderValue,
        maxOrderValue: newBranch.maxOrderValue,
        baseDeliveryCharge: newBranch.baseDeliveryCharge,
        rainCharge: newBranch.rainCharge,
        nightCharge: newBranch.nightCharge,
        festivalCharge: newBranch.festivalCharge
      });
      
      await writeAuditLog('ADD_BRANCH', { branchName: newBranch.branchName, branchCode: newBranch.branchCode });
      setSelectedBranchId(bId);
      setShowAddBranch(false);
      setBranchForm({
        branchName: '',
        branchCode: '',
        manager: '',
        phone: '',
        email: '',
        address: '',
        latitude: 12.9716,
        longitude: 77.5946,
        openingHours: '09:00 AM - 10:00 PM',
        deliveryRadius: 10,
        status: 'Open',
        minOrderValue: 100,
        maxOrderValue: 5000,
        baseDeliveryCharge: 40,
        rainCharge: 0,
        nightCharge: 0,
        festivalCharge: 0
      });
      alert("New Branch created successfully!");
    } catch (err: any) {
      alert("Failed to create branch: " + err.message);
    }
  };

  const handleUpdateBranchSettings = async (updatedFields: any) => {
    if (!selectedBranchId) return;
    try {
      const branchRef = doc(db, `partners/${partner.id}/branches`, selectedBranchId);
      const publicRef = doc(db, 'restaurants', selectedBranchId);
      
      await updateDoc(branchRef, {
        ...updatedFields,
        updatedAt: new Date().toISOString()
      });
      
      await updateDoc(publicRef, {
        ...updatedFields,
        updatedAt: new Date().toISOString()
      });
      
      await writeAuditLog('UPDATE_BRANCH_SETTINGS', { branchId: selectedBranchId, ...updatedFields });
      alert("Branch settings updated successfully!");
    } catch (err: any) {
      alert("Failed to update branch settings: " + err.message);
    }
  };

  // Inventory actions
  const handleUpdateInventoryItem = async (itemId: string, updatedFields: any) => {
    if (!selectedBranchId) return;
    try {
      const invRef = doc(db, `restaurants/${selectedBranchId}/inventory`, itemId);
      await updateDoc(invRef, {
        ...updatedFields,
        updatedAt: new Date().toISOString()
      });
      
      // Sync catalog count if stock changes
      if (updatedFields.currentStock !== undefined) {
        const prodRef = doc(db, `restaurants/${selectedBranchId}/menu`, itemId);
        await updateDoc(prodRef, {
          inventoryCount: Number(updatedFields.currentStock),
          inStock: Number(updatedFields.currentStock) > 0,
          updatedAt: new Date().toISOString()
        });
      }
      
      await writeAuditLog('UPDATE_INVENTORY', { itemId, ...updatedFields });
    } catch (err: any) {
      alert("Failed to update inventory: " + err.message);
    }
  };

  // Staff action
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;
    if (!staffForm.name || !staffForm.role) {
      alert("Staff Name and Role are required!");
      return;
    }
    try {
      const sId = `STAFF-${Date.now()}`;
      await setDoc(doc(db, `restaurants/${selectedBranchId}/staff`, sId), {
        ...staffForm,
        id: sId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      await writeAuditLog('ADD_STAFF', { name: staffForm.name, role: staffForm.role, branchId: selectedBranchId });
      setShowAddStaff(false);
      setStaffForm({
        name: '',
        email: '',
        phone: '',
        role: 'Chef',
        password: '',
        status: 'Active'
      });
    } catch (err: any) {
      alert("Failed to add staff: " + err.message);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!selectedBranchId) return;
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await setDoc(doc(db, `restaurants/${selectedBranchId}/staff`, staffId), {
        status: 'Inactive',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await writeAuditLog('REMOVE_STAFF', { staffId, branchId: selectedBranchId });
    } catch (err: any) {
      alert("Failed to remove staff: " + err.message);
    }
  };

  // Reviews administrative reply
  const handleReplyReview = async (reviewId: string) => {
    if (!selectedBranchId || !reviewReplyText.trim()) return;
    try {
      const revRef = doc(db, `restaurants/${selectedBranchId}/reviews`, reviewId);
      const replyObj = {
        sender: 'partner_admin',
        text: reviewReplyText,
        timestamp: new Date().toISOString()
      };
      
      await updateDoc(revRef, {
        replies: arrayUnion(replyObj),
        updatedAt: new Date().toISOString()
      });
      
      await writeAuditLog('REPLY_REVIEW', { reviewId, reply: reviewReplyText, branchId: selectedBranchId });
      setReviewReplyText('');
      setReplyReviewId(null);
      alert("Reply posted successfully!");
    } catch (err: any) {
      alert("Failed to reply: " + err.message);
    }
  };

  // Coupons creation
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;
    if (!couponForm.code || !couponForm.discountValue) {
      alert("Coupon Code and Value are required!");
      return;
    }
    try {
      const cId = `COUPON-${Date.now()}`;
      await setDoc(doc(db, `restaurants/${selectedBranchId}/coupons`, cId), {
        ...couponForm,
        id: cId,
        code: couponForm.code.toUpperCase(),
        discountValue: Number(couponForm.discountValue),
        minOrder: Number(couponForm.minOrder),
        maxDiscount: Number(couponForm.maxDiscount),
        usageLimit: Number(couponForm.usageLimit),
        currentUsage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      await writeAuditLog('ADD_COUPON', { code: couponForm.code, branchId: selectedBranchId });
      setShowAddCoupon(false);
      setCouponForm({
        code: '',
        type: 'discount',
        discountType: 'Percentage',
        discountValue: 10,
        minOrder: 150,
        maxDiscount: 100,
        usageLimit: 1,
        happyHourStart: '',
        happyHourEnd: '',
        buyX: 0,
        getY: 0
      });
    } catch (err: any) {
      alert("Failed to add coupon: " + err.message);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!selectedBranchId) return;
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await setDoc(doc(db, `restaurants/${selectedBranchId}/coupons`, couponId), {
        status: 'Expired',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await writeAuditLog('DELETE_COUPON', { couponId, branchId: selectedBranchId });
    } catch (err: any) {
      alert("Failed to delete coupon: " + err.message);
    }
  };

  // Pricing engine computing (Enterprise Level - Part 6)
  const calculateCurrentPrice = (item: any, qty: number = 1) => {
    const today = new Date();
    const day = today.getDay();
    const hour = today.getHours();

    const isWeekend = day === 0 || day === 6; // Sunday or Saturday
    const isNight = hour >= 23 || hour <= 5; // 11 PM to 5 AM

    let finalPrice = item.basePrice;
    const discountBreakdowns: string[] = [];

    // Markup layer
    if (item.dynamicPricing) {
      if (isWeekend && item.weekendMarkup) {
        const markup = (item.basePrice * (item.weekendMarkup / 100));
        finalPrice += markup;
        discountBreakdowns.push(`Weekend dynamic surcharge (+${item.weekendMarkup}%)`);
      }
      if (isNight && item.nightMarkup) {
        const markup = (item.basePrice * (item.nightMarkup / 100));
        finalPrice += markup;
        discountBreakdowns.push(`Night rush premium (+${item.nightMarkup}%)`);
      }
    }

    // Offer price prioritised
    if (item.offerPrice && Number(item.offerPrice) < finalPrice) {
      finalPrice = Number(item.offerPrice);
      discountBreakdowns.push(`Standard promotional offer discount applied`);
    }

    // Discount Layering
    if (item.partnerDiscount) {
      const discount = (finalPrice * (item.partnerDiscount / 100));
      finalPrice -= discount;
      discountBreakdowns.push(`Co-op partner promo (-${item.partnerDiscount}%)`);
    }

    if (item.platformDiscount) {
      const discount = (finalPrice * (item.platformDiscount / 100));
      finalPrice -= discount;
      discountBreakdowns.push(`Chalo Super platform subsidization (-${item.platformDiscount}%)`);
    }

    if (qty >= (item.bulkMinQty || 3) && item.bulkDiscountPct) {
      const discount = (finalPrice * (item.bulkDiscountPct / 100));
      finalPrice -= discount;
      discountBreakdowns.push(`Tier-2 Wholesale bulk rebate (-${item.bulkDiscountPct}%)`);
    }

    // Final calculations
    const preTax = finalPrice * qty;
    const taxValue = preTax * ((item.gstRate || 5) / 100);
    const total = preTax + taxValue + (item.packagingCharges || 0);

    return {
      unitBasePrice: item.basePrice,
      unitFinalPrice: Math.max(1, finalPrice),
      subtotal: Math.max(1, preTax),
      gstValue: taxValue,
      packagingCharges: item.packagingCharges || 0,
      totalComputed: Math.round(total * 100) / 100,
      breakdowns: discountBreakdowns
    };
  };

  // Order workflow status transitions
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, 'food_orders', orderId);
      const centralOrderRef = doc(db, 'orders', orderId);

      // Status values: 'Incoming', 'Preparing', 'Ready', 'Out For Delivery', 'Completed', 'Cancelled', 'Refunded'
      batch.update(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Synchronize to centralized orders collection for unified lifecycle state
      batch.set(centralOrderRef, {
        id: orderId,
        status: newStatus,
        partnerId: partner.id,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Handle financial transactions & wallet credits upon successful order 'Completed' state
      if (newStatus === 'Completed') {
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const ord = orderSnap.data();
          const ordTotal = ord.totalAmount || ord.totalPrice || 0;
          
          // Calculate commission (e.g. 10%)
          const commissionRate = partner?.commissionRate || 10;
          const commissionAmount = ordTotal * (commissionRate / 100);
          const payoutAmount = ordTotal - commissionAmount;

          // Increment partner wallet balance in Firestore batch write
          const partnerRef = doc(db, 'partners', partner.id);
          batch.update(partnerRef, {
            walletBalance: (partner.walletBalance || 0) + payoutAmount,
            updatedAt: new Date().toISOString()
          });

          // Log payout record
          const settlementId = `SETTLE-${Date.now()}`;
          const settlementRef = doc(db, `partners/${partner.id}/settlements`, settlementId);
          batch.set(settlementRef, {
            id: settlementId,
            orderId,
            orderTotal: ordTotal,
            commissionPct: commissionRate,
            commissionDeducted: commissionAmount,
            tdsDeducted: payoutAmount * 0.01, // 1% TDS
            gstDeducted: commissionAmount * 0.18, // 18% GST on Commission
            netPayout: payoutAmount - (payoutAmount * 0.01) - (commissionAmount * 0.18),
            status: 'Pending', // Pending admin release
            createdAt: new Date().toISOString()
          });

          await NotificationService.addNotification(
            partner.id,
            '💰 Funds Credited!',
            `Order #${orderId.slice(-5)} complete. ₹${payoutAmount.toFixed(2)} added to settlement queue.`,
            'wallet',
            { icon: '💸' }
          );
        }
      }

      await batch.commit();
      
      // Log central state timeline event
      await OrderService.logOrderEvent(
        orderId, 
        newStatus, 
        'Partner', 
        `Order transitioned to ${newStatus} via KDS.`, 
        null, 
        'Merchant terminal transition'
      );

      // Automated Dispatch logic on Preparing/Ready
      if (newStatus === 'Preparing' || newStatus === 'Ready') {
        const branch = branches.find(b => b.branchId === selectedBranchId);
        const branchLat = branch ? branch.latitude : 12.9716;
        const branchLng = branch ? branch.longitude : 77.5946;
        
        const bestDriverId = await DriverService.findBestDriverForOrder(orderId, branchLat, branchLng);
        if (bestDriverId) {
          await DriverService.assignDriverToOrder(orderId, bestDriverId, 'Auto');
        }
      }

      await writeAuditLog('TRANSITION_ORDER_STATUS', { orderId, targetStatus: newStatus });

      // Notify customer (userId)
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const ord = orderSnap.data();
        if (ord.userId) {
          await NotificationService.addNotification(
            ord.userId,
            `Order Status: ${newStatus.toUpperCase()}`,
            `Your order from ${partner?.businessName || 'the partner'} is now ${newStatus.toLowerCase()}.`,
            'food',
            { icon: '🍔' }
          );
        }
      }
    } catch (e: any) {
      console.error("Order status update failed:", e);
      alert("Error: " + e.message);
    }
  };

  // Support ticket logged by partner
  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.description) return;

    try {
      const ticketId = `ST-${Date.now()}`;
      const ticketRef = doc(db, 'support_tickets', ticketId);

      await setDoc(ticketRef, {
        id: ticketId,
        partnerId: partner.id,
        businessName: partner.businessName,
        subject: ticketForm.subject,
        description: ticketForm.description,
        category: ticketForm.category,
        priority: ticketForm.priority,
        status: 'Open',
        messages: [{
          sender: 'partner',
          text: ticketForm.description,
          timestamp: new Date().toISOString(),
          attachments: []
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await writeAuditLog('CREATE_SUPPORT_TICKET', { subject: ticketForm.subject, category: ticketForm.category });
      setShowAddTicket(false);
      setTicketForm({ subject: '', description: '', category: 'Billing', priority: 'Medium' });
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  // Reply to support ticket
  const handleReplyTicket = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
      const newMessage = {
        sender: 'partner',
        text: replyText,
        timestamp: new Date().toISOString(),
        attachments: []
      };

      await updateDoc(ticketRef, {
        messages: arrayUnion(newMessage),
        updatedAt: new Date().toISOString()
      });

      setSelectedTicket((prev: any) => ({
        ...prev,
        messages: [...prev.messages, newMessage]
      }));
      setReplyText('');
    } catch (e: any) {
      alert("Reply error: " + e.message);
    }
  };

  // Downloadable payout invoicing report (Part 8 CSV Export)
  const downloadPayoutReport = () => {
    const headers = ["Settlement ID", "Order ID", "Gross Order Total", "Commission Deducted", "TDS (1%)", "Net Payout", "Status", "Date"];
    const rows = settlements.map(s => [
      s.id,
      s.orderId || 'N/A',
      s.orderTotal ? `₹${s.orderTotal.toFixed(2)}` : '₹0.00',
      s.commissionDeducted ? `₹${s.commissionDeducted.toFixed(2)}` : '₹0.00',
      s.tdsDeducted ? `₹${s.tdsDeducted.toFixed(2)}` : '₹0.00',
      s.netPayout ? `₹${s.netPayout.toFixed(2)}` : '₹0.00',
      s.status,
      s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", encodedUri);
    linkElement.setAttribute("download", `Payout_Report_${partner.businessName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
        (o.userName || o.customerName || '').toLowerCase().includes(orderSearch.toLowerCase());
      
      if (orderFilter === 'All') return matchesSearch;
      return matchesSearch && o.status === orderFilter;
    });
  }, [orders, orderSearch, orderFilter]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * ordersPerPage;
    return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [filteredOrders, orderPage]);

  // Analytics Computation (Part 9 Metrics)
    const analyticsData = useMemo(() => {
    const completed = orders.filter(o => o.status === 'Completed');
    const cancelled = orders.filter(o => o.status === 'Cancelled');
    const refunded = orders.filter(o => o.status === 'Refunded');
    
    const totalRev = completed.reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);
    const avgOrderValue = completed.length > 0 ? (totalRev / completed.length) : 0;
    const cancelRate = orders.length > 0 ? (cancelled.length / orders.length) * 100 : 0;
    const refundRate = orders.length > 0 ? (refunded.length / orders.length) * 100 : 0;

    // Customer calculation
    const customersMap: Record<string, number> = {};
    completed.forEach(o => {
      if (o.userId) {
        customersMap[o.userId] = (customersMap[o.userId] || 0) + 1;
      }
    });
    const uniqueCustomers = Object.keys(customersMap).length;
    const repeatCustomers = Object.values(customersMap).filter(v => v > 1).length;

    // Revenue per day chart data
    const dailyRev: { [date: string]: number } = {};
    completed.forEach(o => {
      const date = o.createdAt ? new Date(o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'N/A';
      dailyRev[date] = (dailyRev[date] || 0) + (o.totalAmount || o.totalPrice || 0);
    });

    const revChart = Object.keys(dailyRev).map(date => ({
      date,
      Revenue: Math.round(dailyRev[date] * 100) / 100
    })).slice(-10);

    // Hourly distribution (Peak Hours)
    const hourlyCounts = Array(24).fill(0);
    completed.forEach(o => {
      if(o.createdAt) {
        const d = new Date(o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt);
        if(!isNaN(d.getTime())) {
          hourlyCounts[d.getHours()]++;
        }
      }
    });
    const peakHoursChart = hourlyCounts.map((count, hour) => ({
      hour: hour + ":00",
      Orders: count
    }));

    // Top Selling Products counts
    const prodCounts: { [name: string]: number } = {};
    completed.forEach(o => {
      (o.items || []).forEach((item: any) => {
        prodCounts[item.name] = (prodCounts[item.name] || 0) + (item.quantity || 1);
      });
    });

    const topProductsChart = Object.keys(prodCounts).map(name => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      Sales: prodCounts[name]
    })).sort((a, b) => b.Sales - a.Sales).slice(0, 5);

    return { 
      totalRev, avgOrderValue, cancelRate, refundRate, uniqueCustomers, repeatCustomers,
      revChart, topProductsChart, peakHoursChart 
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px] text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">Syncing Partner Credentials...</p>
      </div>
    );
  }

  // Render Onboarding flow if not registered (partner == null)
  if (!partner) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-md space-y-6 animate-fade-in text-slate-800">
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
          <Building className="w-6 h-6 text-amber-600" />
          <div>
            <h3 className="font-display font-black text-gray-900 text-sm uppercase tracking-tight">Merchant Onboarding Portal</h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold">JOIN CHALO SUPER-APP ENTERPRISE PARTNERSHIP</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-gray-100">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center space-x-2">
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${
                regStep === step ? 'bg-amber-500 text-slate-950 font-black' : 
                regStep > step ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tight text-gray-600 hidden sm:inline">
                {step === 1 ? 'Core Profile' : step === 2 ? 'Documents (KYC)' : 'Schedules & Bank'}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleRegisterOnboard} className="space-y-4">
          {/* STEP 1: Core Details */}
          {regStep === 1 && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase text-amber-600 tracking-wider font-mono">Step 1 — Business Identity</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Business Registered Name *</label>
                  <input 
                    type="text" 
                    required
                    value={regForm.businessName}
                    onChange={(e) => setRegForm({...regForm, businessName: e.target.value})}
                    placeholder="Enter business brand name"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Owner Legal Name *</label>
                  <input 
                    type="text" 
                    required
                    value={regForm.ownerName}
                    onChange={(e) => setRegForm({...regForm, ownerName: e.target.value})}
                    placeholder="Enter owner legal name"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Primary Business Type *</label>
                  <select 
                    value={regForm.category}
                    onChange={(e) => setRegForm({...regForm, category: e.target.value})}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {BUSINESS_TYPES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Subcategory / Speciality</label>
                  <input 
                    type="text" 
                    value={regForm.subcategory}
                    onChange={(e) => setRegForm({...regForm, subcategory: e.target.value})}
                    placeholder="e.g. Organic, Fast-Food, Unisex, Sedan"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Official Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Contact Phone *</label>
                  <input 
                    type="tel" 
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({...regForm, phone: e.target.value})}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">WhatsApp Broadcast Line</label>
                  <input 
                    type="tel" 
                    value={regForm.whatsApp}
                    onChange={(e) => setRegForm({...regForm, whatsApp: e.target.value})}
                    placeholder="For dynamic customer alerts"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Business Physical Address *</label>
                <textarea 
                  required
                  value={regForm.address}
                  onChange={(e) => setRegForm({...regForm, address: e.target.value})}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Street name, landmark, building, city, pincode"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Latitude coordinate</label>
                  <input 
                    type="text" 
                    value={regForm.latitude}
                    onChange={(e) => setRegForm({...regForm, latitude: e.target.value})}
                    className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl font-mono text-[10px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Longitude coordinate</label>
                  <input 
                    type="text" 
                    value={regForm.longitude}
                    onChange={(e) => setRegForm({...regForm, longitude: e.target.value})}
                    className="w-full text-xs p-2 bg-slate-50 border border-gray-200 rounded-xl font-mono text-[10px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Document Management & KYC */}
          {regStep === 2 && (
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase text-amber-600 tracking-wider font-mono">Step 2 — Secure Documents Verification</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">GST Identification Number (GSTIN)</label>
                  <input 
                    type="text" 
                    value={regForm.gstNumber}
                    onChange={(e) => setRegForm({...regForm, gstNumber: e.target.value})}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 mb-2 uppercase"
                  />
                  <div className="flex items-center space-x-2">
                    <input 
                      type="file" 
                      id="upload_gst"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleDocumentUpload('gst', e.target.files[0]);
                      }}
                    />
                    <label 
                      htmlFor="upload_gst" 
                      className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold uppercase text-[9px] rounded-lg transition"
                    >
                      <Upload className="w-3 h-3" /> <span>{documents.gst.url ? 'Re-upload GST Document' : 'Upload GST Certificate'}</span>
                    </label>
                    {uploadingDoc === 'gst' && <span className="text-[9px] font-mono animate-pulse text-amber-600">Uploading...</span>}
                    {documents.gst.url && <span className="text-[9px] font-mono text-emerald-600 flex items-center"><Check className="w-3.5 h-3.5 mr-0.5" /> Ready</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Company PAN Number *</label>
                  <input 
                    type="text" 
                    required
                    value={regForm.panNumber}
                    onChange={(e) => setRegForm({...regForm, panNumber: e.target.value})}
                    placeholder="ABCDE1234F"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 mb-2 uppercase"
                  />
                  <div className="flex items-center space-x-2">
                    <input 
                      type="file" 
                      id="upload_pan"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleDocumentUpload('pan', e.target.files[0]);
                      }}
                    />
                    <label 
                      htmlFor="upload_pan" 
                      className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold uppercase text-[9px] rounded-lg transition"
                    >
                      <Upload className="w-3 h-3" /> <span>{documents.pan.url ? 'Re-upload PAN Card' : 'Upload PAN Card'}</span>
                    </label>
                    {uploadingDoc === 'pan' && <span className="text-[9px] font-mono animate-pulse text-amber-600">Uploading...</span>}
                    {documents.pan.url && <span className="text-[9px] font-mono text-emerald-600 flex items-center"><Check className="w-3.5 h-3.5 mr-0.5" /> Ready</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Aadhaar Document Card</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="file" 
                      id="upload_aadhaar"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleDocumentUpload('aadhaar', e.target.files[0]);
                      }}
                    />
                    <label 
                      htmlFor="upload_aadhaar" 
                      className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold uppercase text-[9px] rounded-lg transition"
                    >
                      <Upload className="w-3 h-3" /> <span>{documents.aadhaar.url ? 'Change Aadhaar File' : 'Upload Aadhaar File'}</span>
                    </label>
                    {uploadingDoc === 'aadhaar' && <span className="text-[9px] font-mono animate-pulse text-amber-600">Uploading...</span>}
                    {documents.aadhaar.url && <span className="text-[9px] font-mono text-emerald-600 flex items-center"><Check className="w-3.5 h-3.5 mr-0.5" /> Ready</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Trade License / Incorporation</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="file" 
                      id="upload_trade"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleDocumentUpload('trade_license', e.target.files[0]);
                      }}
                    />
                    <label 
                      htmlFor="upload_trade" 
                      className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold uppercase text-[9px] rounded-lg transition"
                    >
                      <Upload className="w-3 h-3" /> <span>{documents.trade_license.url ? 'Change Trade License' : 'Upload Trade License'}</span>
                    </label>
                    {uploadingDoc === 'trade_license' && <span className="text-[9px] font-mono animate-pulse text-amber-600">Uploading...</span>}
                    {documents.trade_license.url && <span className="text-[9px] font-mono text-emerald-600 flex items-center"><Check className="w-3.5 h-3.5 mr-0.5" /> Ready</span>}
                  </div>
                </div>
              </div>

              {regForm.category === 'Restaurant' || regForm.category === 'Cloud Kitchen' || regForm.category === 'Cafe' || regForm.category === 'Bakery' || regForm.category === 'Sweet Shop' ? (
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-amber-900 mb-1">Food Safety (FSSAI) License Number *</label>
                  <input 
                    type="text" 
                    required
                    value={regForm.fssaiNumber}
                    onChange={(e) => setRegForm({...regForm, fssaiNumber: e.target.value})}
                    placeholder="Enter 14-digit FSSAI license"
                    className="w-full text-xs p-2 bg-white border border-amber-200 rounded-xl focus:outline-none mb-1"
                  />
                  <div className="flex items-center space-x-2">
                    <input 
                      type="file" 
                      id="upload_fssai"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleDocumentUpload('fssai', e.target.files[0]);
                      }}
                    />
                    <label 
                      htmlFor="upload_fssai" 
                      className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold uppercase text-[9px] rounded-lg transition"
                    >
                      <Upload className="w-3 h-3" /> <span>Upload FSSAI License Doc</span>
                    </label>
                    {uploadingDoc === 'fssai' && <span className="text-[9px] font-mono animate-pulse text-amber-600">Uploading...</span>}
                    {documents.fssai.url && <span className="text-[9px] font-mono text-emerald-600 flex items-center"><Check className="w-3.5 h-3.5 mr-0.5" /> Ready</span>}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 3: Bank details and Schedules */}
          {regStep === 3 && (
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase text-amber-600 tracking-wider font-mono">Step 3 — Operations Schedule & Payout Routing</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Opening Hours (Weekly Schedule) *</label>
                  <input 
                    type="text" 
                    required
                    value={regForm.openingHours}
                    onChange={(e) => setRegForm({...regForm, openingHours: e.target.value})}
                    placeholder="e.g. 09:00 AM - 10:00 PM"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Weekly Holidays / Off Days</label>
                  <input 
                    type="text" 
                    value={regForm.holidaySchedule}
                    onChange={(e) => setRegForm({...regForm, holidaySchedule: e.target.value})}
                    placeholder="e.g. Sundays, None"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 space-y-3">
                <h5 className="text-[10px] font-bold uppercase text-emerald-900 tracking-wider font-mono">Verified Bank Account Information</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-emerald-800 mb-1">Account Holder Name *</label>
                    <input 
                      type="text" 
                      required
                      value={regForm.bankHolderName}
                      onChange={(e) => setRegForm({...regForm, bankHolderName: e.target.value})}
                      placeholder="As listed on Passbook"
                      className="w-full text-xs p-2 bg-white border border-emerald-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-emerald-800 mb-1">Bank Account Number *</label>
                    <input 
                      type="text" 
                      required
                      value={regForm.bankAccountNumber}
                      onChange={(e) => setRegForm({...regForm, bankAccountNumber: e.target.value})}
                      placeholder="00000000000"
                      className="w-full text-xs p-2 bg-white border border-emerald-200 rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-emerald-800 mb-1">IFSC Code Routing *</label>
                    <input 
                      type="text" 
                      required
                      value={regForm.bankIfsc}
                      onChange={(e) => setRegForm({...regForm, bankIfsc: e.target.value})}
                      placeholder="SBIN000001"
                      className="w-full text-xs p-2 bg-white border border-emerald-200 rounded-xl focus:outline-none font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-emerald-800 mb-1">Primary Settlement UPI VPA</label>
                    <input 
                      type="text" 
                      value={regForm.upiId}
                      onChange={(e) => setRegForm({...regForm, upiId: e.target.value})}
                      placeholder="e.g. brandname@okhdfcbank"
                      className="w-full text-xs p-2 bg-white border border-emerald-200 rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-emerald-800 mb-1">Settlement Frequency</label>
                    <select 
                      value={regForm.settlementPreference}
                      onChange={(e) => setRegForm({...regForm, settlementPreference: e.target.value})}
                      className="w-full text-xs p-2 bg-white border border-emerald-200 rounded-xl focus:outline-none"
                    >
                      <option value="Daily">Daily Payout</option>
                      <option value="Weekly">Weekly Payout</option>
                      <option value="Instant">Instant T+1 Hours (Enterprise Accrual)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-emerald-800 mb-1">Upload Cancelled Cheque / Passbook Copy</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="file" 
                      id="upload_cheque"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleDocumentUpload('cancelled_cheque', e.target.files[0]);
                      }}
                    />
                    <label 
                      htmlFor="upload_cheque" 
                      className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-bold uppercase text-[9px] rounded-lg transition"
                    >
                      <Upload className="w-3 h-3" /> <span>Upload Bank Proof</span>
                    </label>
                    {uploadingDoc === 'cancelled_cheque' && <span className="text-[9px] font-mono animate-pulse text-amber-600">Uploading...</span>}
                    {documents.cancelled_cheque.url && <span className="text-[9px] font-mono text-emerald-600 flex items-center"><Check className="w-3.5 h-3.5 mr-0.5" /> Ready</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            {regStep > 1 ? (
              <button 
                type="button"
                onClick={() => setRegStep(prev => prev - 1)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold uppercase text-gray-500 hover:bg-slate-50 transition"
              >
                Back
              </button>
            ) : (
              <button 
                type="button"
                onClick={onBack}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold uppercase text-gray-500 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            )}

            <button 
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-xs rounded-xl transition flex items-center space-x-2 shadow-sm"
            >
              <span>{regStep === 3 ? 'Submit Application' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Render review/progress dashboard if status is not 'Approved'
  if (partner.verificationStatus !== 'Approved') {
    return (
      <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 animate-fade-in font-sans">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <Building className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="font-display font-black text-white text-sm uppercase tracking-tight">{partner.businessName}</h3>
              <p className="text-[9.5px] text-slate-400 font-mono font-bold">{partner.category.toUpperCase()} / {partner.verificationStatus.toUpperCase()}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onBack}
            className="p-1.5 bg-slate-950 rounded-xl border border-slate-850 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="bg-slate-950 p-5 rounded-3xl border border-slate-850 space-y-4 text-center">
          <Clock className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Merchant Validation In Progress</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto">
            Our audit compliance officers are verifying your business profile, PAN/GST registration documents, and settlement UPI credentials.
          </p>

          <div className="max-w-xs mx-auto border-t border-slate-850 pt-4 space-y-2 text-left font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Legal Owner:</span>
              <span className="text-slate-300 font-bold">{partner.ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className={`font-bold ${
                partner.verificationStatus === 'Submitted' ? 'text-amber-400' :
                partner.verificationStatus === 'Pending Review' ? 'text-yellow-400' :
                partner.verificationStatus === 'Rejected' ? 'text-rose-500' : 'text-slate-400'
              }`}>{partner.verificationStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FSSAI / Tax:</span>
              <span className="text-slate-300 font-bold">{partner.fssaiNumber || 'Submitted (GST)'}</span>
            </div>
          </div>
        </div>

        {/* Resubmission area if Rejected */}
        {partner.verificationStatus === 'Rejected' && (
          <div className="bg-rose-500/10 p-4 rounded-3xl border border-rose-500/20 space-y-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h5 className="text-[11px] font-black uppercase text-rose-400">Application Rejection Appeal</h5>
            </div>
            <p className="text-[10px] text-slate-400">
              Please correct the uploaded documents and resubmit for immediate review. Common causes include blur images or incorrect IFSC codes.
            </p>
            <div className="flex justify-end">
              <button 
                onClick={async () => {
                  await updateDoc(doc(db, 'partners', partner.id), {
                    verificationStatus: 'Submitted',
                    updatedAt: new Date().toISOString()
                  });
                  await writeAuditLog('PARTNER_RESUBMIT', { businessName: partner.businessName });
                }}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-slate-950 font-black text-[9px] uppercase rounded-xl transition"
              >
                Re-submit Application
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER COMPLETE ENTERPRISE DASHBOARD FOR APPROVED PARTNERS
  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 animate-fade-in font-sans">
      
      {/* Dashboard Top Header bar */}
      <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center font-black text-sm uppercase">
            {partner.businessName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-display font-black text-white text-sm uppercase tracking-tight">{partner.businessName}</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[9.5px] text-slate-400 font-mono font-bold">
              <span>{partner.category.toUpperCase()}</span>
              <span>•</span>
              <span className="text-emerald-400 uppercase">Verified Merchant</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[9.5px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850">
            Wallet Bal: <strong className="text-emerald-400 font-black">₹{(partner.walletBalance || 0).toFixed(2)}</strong>
          </span>
          <button 
            type="button"
            onClick={onBack}
            className="p-1.5 bg-slate-950 rounded-xl border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Multi-Branch Selector and Creator Dropdown Widget */}
      <div className="flex flex-wrap items-center justify-between bg-slate-950 p-4 rounded-3xl border border-slate-850 gap-4">
        <div className="flex items-center space-x-3">
          <Building className="w-5 h-5 text-amber-400" />
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Active Outlet / Branch</label>
            <select
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-slate-900 text-white font-bold text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 mt-1 min-w-[240px]"
            >
              {branches.map(b => (
                <option key={b.branchId} value={b.branchId}>{b.branchName} ({b.branchCode})</option>
              ))}
              {branches.length === 0 && <option value="">No branches active...</option>}
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddBranch(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase text-[10px] rounded-xl transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Branch Outlet</span>
          </button>
        </div>
      </div>

      {/* BRANCH CREATION MODAL overlay */}
      {showAddBranch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-tight text-white font-display">Add New Branch Outlet</h3>
              <button 
                onClick={() => setShowAddBranch(false)}
                className="text-slate-400 hover:text-white font-bold text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Branch Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Indiranagar Outlet"
                    value={branchForm.branchName}
                    onChange={(e) => setBranchForm({...branchForm, branchName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Branch Code *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. IND-001"
                    value={branchForm.branchCode}
                    onChange={(e) => setBranchForm({...branchForm, branchCode: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Manager Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={branchForm.manager}
                    onChange={(e) => setBranchForm({...branchForm, manager: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Contact Phone</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 9876543210"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({...branchForm, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Contact Email</label>
                  <input 
                    type="email" 
                    placeholder="e.g. branch@brand.com"
                    value={branchForm.email}
                    onChange={(e) => setBranchForm({...branchForm, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Physical Address *</label>
                <textarea 
                  required
                  placeholder="Full branch layout location address..."
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({...branchForm, address: e.target.value})}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-850 pt-3">
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={branchForm.latitude}
                    onChange={(e) => setBranchForm({...branchForm, latitude: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={branchForm.longitude}
                    onChange={(e) => setBranchForm({...branchForm, longitude: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Delivery Radius (km)</label>
                  <input 
                    type="number" 
                    value={branchForm.deliveryRadius}
                    onChange={(e) => setBranchForm({...branchForm, deliveryRadius: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-850 pt-3">
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Min Order (₹)</label>
                  <input 
                    type="number" 
                    value={branchForm.minOrderValue}
                    onChange={(e) => setBranchForm({...branchForm, minOrderValue: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Base Delivery (₹)</label>
                  <input 
                    type="number" 
                    value={branchForm.baseDeliveryCharge}
                    onChange={(e) => setBranchForm({...branchForm, baseDeliveryCharge: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Rain Surge (₹)</label>
                  <input 
                    type="number" 
                    value={branchForm.rainCharge}
                    onChange={(e) => setBranchForm({...branchForm, rainCharge: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">Night Surge (₹)</label>
                  <input 
                    type="number" 
                    value={branchForm.nightCharge}
                    onChange={(e) => setBranchForm({...branchForm, nightCharge: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowAddBranch(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl uppercase font-bold text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl uppercase font-black text-[10px]"
                >
                  Create Outlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD TAB SUB-NAVIGATION */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-850 overflow-x-auto">
        {[
          { id: 'overview', label: '🏠 Overview' },
          { id: 'orders', label: `📦 Orders & Bookings (${orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length})` },
          { id: 'catalog', label: '🛒 Products & Menu' },
          { id: 'inventory', label: '📦 Inventory' },
          { id: 'branches', label: '🏢 Branches' },
          { id: 'staff', label: '👥 Employees' },
          { id: 'customers', label: '🤝 Customers' },
          { id: 'finance', label: '💳 Finance & Taxes' },
          { id: 'analytics', label: '📈 Analytics' },
          { id: 'growth', label: '🚀 Growth & Marketing' },
          { id: 'support', label: '🛎️ Support' },
          { id: 'profile', label: '👤 Business Profile' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition shrink-0 ${
              activeTab === tab.id ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 bg-slate-950 hover:bg-slate-800 border border-slate-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW BLOCK */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl">
              <span className="text-[8.5px] font-bold text-slate-500 uppercase block tracking-wider font-mono">Today's Revenue</span>
              <strong className="text-white text-sm font-black font-mono">₹{analyticsData.totalRev.toFixed(2)}</strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl">
              <span className="text-[8.5px] font-bold text-slate-500 uppercase block tracking-wider font-mono">Total Orders</span>
              <strong className="text-white text-sm font-black font-mono">{orders.length}</strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl">
              <span className="text-[8.5px] font-bold text-slate-500 uppercase block tracking-wider font-mono">Low Stock Alerts</span>
              <strong className="text-rose-400 text-sm font-black font-mono">
                {inventory.filter(item => (item.quantity || 0) <= (item.minThreshold || 5)).length} Items
              </strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl">
              <span className="text-[8.5px] font-bold text-slate-500 uppercase block tracking-wider font-mono">Customer Rating</span>
              <strong className="text-yellow-400 text-sm font-black font-mono flex items-center">
                {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : '4.9'} 
                <Star className="w-3.5 h-3.5 ml-1 fill-yellow-400 text-yellow-400" />
              </strong>
            </div>
          </div>

          {/* Quick Active Order Alert Panel */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ListOrdered className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black uppercase text-white font-display">Active Cooking & Dispense Queue</h4>
              </div>
              <button onClick={() => setActiveTab('kds')} className="text-[9px] text-amber-400 uppercase font-black hover:underline">Launch KDS</button>
            </div>

            <div className="divide-y divide-slate-850">
              {orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').slice(0, 3).map(order => (
                <div key={order.id} className="py-3 flex justify-between items-center gap-3 text-[11px]">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[9px] text-slate-500">#{order.id.slice(-5).toUpperCase()}</span>
                      <strong className="text-slate-200 font-bold uppercase">{order.userName || order.customerName || 'Premium Customer'}</strong>
                    </div>
                    <span className="text-slate-400 block text-[9.5px] font-mono leading-tight mt-0.5">
                      {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(", ") || 'General Services'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-400/10 text-amber-400 font-mono text-[8px] font-black px-2 py-0.5 rounded border border-amber-400/20 uppercase">{order.status}</span>
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-[9px] text-slate-300 font-bold uppercase rounded p-1"
                    >
                      <option value="Incoming">Accept</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Out For Delivery">Dispatch</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancel</option>
                    </select>
                  </div>
                </div>
              ))}
              {orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length === 0 && (
                <div className="py-4 text-center text-[10px] text-slate-500 font-mono uppercase">
                  All clean! No active pending orders.
                </div>
              )}
            </div>
          </div>

          {/* Active Branch Meta Card */}
          {branches.find(b => b.branchId === selectedBranchId) && (
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3">
              <h4 className="text-xs font-black uppercase text-white font-display flex items-center space-x-1.5">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Outlet General Settings & Live Status</span>
              </h4>
              
              {(() => {
                const b = branches.find(br => br.branchId === selectedBranchId);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[10px] text-slate-300">
                    <div className="space-y-1.5">
                      <div>Outlet Name: <strong className="text-white">{b.branchName}</strong></div>
                      <div>Code Identifier: <strong className="text-amber-400">{b.branchCode}</strong></div>
                      <div>Authorized Manager: <strong className="text-slate-100">{b.manager || 'N/A'}</strong></div>
                      <div>Duty Phone: <strong className="text-slate-100">{b.phone || 'N/A'}</strong></div>
                      <div>Status: <span className={`font-black uppercase ${
                        b.status === 'Open' ? 'text-emerald-400' : 'text-rose-500'
                      }`}>{b.status || 'Open'}</span></div>
                    </div>
                    <div className="space-y-1.5">
                      <div>Address Location: <strong className="text-slate-400 leading-tight block">{b.address}</strong></div>
                      <div>Delivery Radius: <strong className="text-white">{b.deliveryRadius || 5} km</strong></div>
                      <div>Operational Hours: <strong className="text-amber-400">{b.openingHours || '09:00 AM - 10:00 PM'}</strong></div>
                      <div>Coordinates: <strong className="text-slate-400">{b.latitude || '0.0000'}, {b.longitude || '0.0000'}</strong></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KITCHEN DISPLAY SYSTEM & ORDERS (KDS) */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex flex-wrap justify-between items-center gap-3">
            <div>
              <h4 className="text-xs font-black uppercase text-white font-display">Live Order Management</h4>
              <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Manage live orders, update statuses, and coordinate with delivery partners.</p>
            </div>
            
            <div className="flex space-x-1.5">
              {['All', 'Incoming', 'Preparing', 'Ready', 'Out For Delivery'].map(st => (
                <button
                  key={st}
                  onClick={() => { setOrderFilter(st); setOrderPage(1); }}
                  className={`px-2.5 py-1 text-[8.5px] font-black uppercase rounded transition ${
                    orderFilter === st ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Queue: Order Cards */}
            <div className="lg:col-span-7 space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').map(order => {
                const isSelected = kdsSelectedOrderId === order.id;
                return (
                  <div 
                    key={order.id} 
                    onClick={() => setKdsSelectedOrderId(order.id)}
                    className={`p-4 rounded-3xl border transition cursor-pointer ${
                      isSelected ? 'bg-slate-950 border-amber-400 shadow-lg' : 'bg-slate-950/60 border-slate-850 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex justify-between items-start pb-2 border-b border-slate-850/60">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[9px] text-amber-400 font-bold">#{order.id.slice(-5).toUpperCase()}</span>
                          <span className="text-[8.5px] text-slate-500 font-mono">
                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-white uppercase mt-1 font-display">{order.userName || order.customerName || 'Premium Customer'}</h5>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        order.status === 'Incoming' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                        order.status === 'Preparing' ? 'bg-amber-500/10 text-amber-400' :
                        order.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                      }`}>{order.status}</span>
                    </div>

                    <div className="py-2.5 text-[10.5px] font-mono text-slate-300 space-y-1">
                      {order.items?.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span>{it.quantity}x {it.name} {it.selectedVariant ? `(${it.selectedVariant})` : ''}</span>
                          <span className="text-slate-500">Qty: {it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-850/60">
                      <span className="text-[9px] font-mono text-slate-500">ETA: {order.deliveryTime || 30} mins remaining</span>
                      
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {order.status === 'Incoming' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Preparing')}
                            className="px-2 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[8px] uppercase rounded"
                          >
                            Mark Preparing
                          </button>
                        )}
                        {order.status === 'Preparing' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Ready')}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[8px] uppercase rounded"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.status === 'Ready' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Out For Delivery')}
                            className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-slate-950 font-black text-[8px] uppercase rounded"
                          >
                            Dispatch
                          </button>
                        )}
                        {order.status === 'Out For Delivery' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Completed')}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[8px] uppercase rounded"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length === 0 && (
                <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl text-center text-[10px] text-slate-500 font-mono uppercase">
                  All systems clean! No active orders in cook queue.
                </div>
              )}
            </div>

            {/* Right Pane: Selected Order Ticket Details & Actions */}
            <div className="lg:col-span-5 space-y-4">
              {(() => {
                const order = orders.find(o => o.id === kdsSelectedOrderId) || filteredOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled')[0];
                if (!order) {
                  return (
                    <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl text-center text-[10px] text-slate-500 font-mono uppercase">
                      Select an active card from cook queue to load operational parameters.
                    </div>
                  );
                }

                return (
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl space-y-4 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                      <h5 className="font-display font-black text-white uppercase tracking-tight">Active Ticket Details</h5>
                      <span className="font-mono text-[9px] text-slate-500">ID: #{order.id.toUpperCase()}</span>
                    </div>

                    <div className="font-mono space-y-2 text-[10px] text-slate-300">
                      <div>Customer: <strong className="text-white uppercase">{order.userName || order.customerName || 'Premium Customer'}</strong></div>
                      <div>Contact Phone: <strong className="text-white">{order.userPhone || 'N/A'}</strong></div>
                      <div>Drop-off Point: <strong className="text-slate-400 block leading-tight">{order.deliveryAddress || 'Pick-up Outlet Order'}</strong></div>
                      <div>Scheduled Slot: <strong className="text-amber-400">Instant Cook Queue</strong></div>
                    </div>

                    {/* Delay & Adjust ETA Form */}
                    <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-2xl space-y-2">
                      <label className="block text-[9px] font-black uppercase text-amber-400 font-mono">Delay Cooking / Surge Traffic</label>
                      <p className="text-[8.5px] text-slate-400 leading-normal font-mono">If kitchen is overloaded, declare custom prep time increments. This instantly triggers a live notification & ETA adjustment for the customer.</p>
                      
                      <div className="flex gap-2">
                        <select 
                          value={kdsDelayMinutes} 
                          onChange={(e) => setKdsDelayMinutes(Number(e.target.value))}
                          className="flex-1 bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-[10px] font-mono text-white focus:outline-none"
                        >
                          <option value="5">+5 Mins (Minor Overload)</option>
                          <option value="10">+10 Mins (Medium Backlog)</option>
                          <option value="15">+15 Mins (Severe Rush)</option>
                          <option value="20">+20 Mins (Critical Bottleneck)</option>
                          <option value="30">+30 Mins (Emergency Wait)</option>
                        </select>
                        <button 
                          onClick={async () => {
                            try {
                              const orderRef = doc(db, 'food_orders', order.id);
                              const currentPrep = order.preparationTime || 15;
                              const currentDeliv = order.deliveryTime || 30;
                              await updateDoc(orderRef, {
                                preparationTime: Number(currentPrep) + kdsDelayMinutes,
                                deliveryTime: Number(currentDeliv) + kdsDelayMinutes,
                                updatedAt: new Date().toISOString()
                              });
                              if (order.userId) {
                                await NotificationService.addNotification(
                                  order.userId,
                                  '⏳ Order Delayed!',
                                  `Your order has been adjusted by +${kdsDelayMinutes} mins due to high kitchen rush.`,
                                  'food',
                                  { icon: '⏳' }
                                );
                              }
                              await writeAuditLog('ORDER_ETA_DELAYED', { orderId: order.id, addedMinutes: kdsDelayMinutes });
                              alert(`Successfully delayed order by +${kdsDelayMinutes} mins. Customer notified!`);
                            } catch (err: any) {
                              alert("Failed to update delay: " + err.message);
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase text-[9px] rounded-lg transition shrink-0"
                        >
                          Notify Delay
                        </button>
                      </div>
                    </div>

                    {/* Print Receipt Trigger Button */}
                    <button 
                      onClick={() => setShowReceiptOrderId(order.id)}
                      className="w-full flex items-center justify-center space-x-1 px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold uppercase rounded-xl text-[9.5px] transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print Thermal Bill Receipt</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* MONOSPACE THERMAL RECEIPT MODAL POPUP */}
          {showReceiptOrderId && (() => {
            const ord = orders.find(o => o.id === showReceiptOrderId);
            const branch = branches.find(b => b.branchId === selectedBranchId) || { branchName: partner.businessName, branchCode: 'MAIN-01', phone: partner.phone, gstNumber: partner.gstNumber };
            if (!ord) return null;

            return (
              <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white text-slate-950 border border-gray-300 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                  
                  {/* Real printable invoice block */}
                  <div className="border border-slate-400 p-4 bg-amber-50/10 rounded-lg font-mono text-[9px] text-slate-900 space-y-2 leading-relaxed uppercase">
                    <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                      <h4 className="font-black text-[12px] tracking-tight">{branch.branchName}</h4>
                      <p className="text-[8px] text-slate-500">Outlet Code: {branch.branchCode}</p>
                      <p className="text-[8px] text-slate-500">Contact Duty: {branch.phone || partner.phone}</p>
                      <p className="text-[8px] text-slate-500">GST Registration: {partner.gstNumber || 'FSSAI-COMPLIANT'}</p>
                    </div>

                    <div className="border-b border-dashed border-slate-400 py-1.5 space-y-0.5 text-[8.5px]">
                      <div>Invoice ID: #{ord.id.toUpperCase()}</div>
                      <div>Timestamp: {ord.createdAt ? new Date(ord.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
                      <div>Customer Name: {ord.userName || ord.customerName || 'PREMIUM CLIENT'}</div>
                      <div>Delivery Mode: {ord.deliveryAddress ? 'DOORSTEP COURIER' : 'SELF PICK-UP OUTLET'}</div>
                    </div>

                    <div className="border-b border-dashed border-slate-400 py-1.5 space-y-1">
                      <div className="flex justify-between font-bold text-[8.5px]">
                        <span>Item SKU Detail</span>
                        <span>Amt (₹)</span>
                      </div>
                      {ord.items?.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between text-[8px] text-slate-800">
                          <span>{it.quantity}x {it.name} {it.selectedVariant ? `(${it.selectedVariant})` : ''}</span>
                          <span>₹{(it.price * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1.5 space-y-1 font-bold text-[8.5px]">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span>₹{(ord.totalAmount ? ord.totalAmount - 40 : 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST Tax (Standard Rate):</span>
                        <span>₹{((ord.totalAmount ? ord.totalAmount * 0.05 : 0)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Surcharge & Delivery Fees:</span>
                        <span>₹40.00</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-slate-400 pt-1.5 text-[10px] text-slate-950 font-black">
                        <span>Gross Bill Total:</span>
                        <span>₹{(ord.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="text-center border-t border-dashed border-slate-400 pt-3 space-y-1 text-[7.5px] text-slate-500">
                      <p>Thank you for ordering with Chalo Super-App!</p>
                      <p>For support claims, contact helpdesk.</p>
                      <p>*** DUPLICATE CUSTOMER COPY ***</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 justify-end">
                    <button 
                      onClick={() => setShowReceiptOrderId(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] uppercase rounded-xl transition"
                    >
                      Close Receipt
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9px] uppercase rounded-xl transition"
                    >
                      Print Slip
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: CATALOG & PRICING ENGINE */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex justify-between items-center">
            <div>
              <h4 className="text-xs font-black uppercase text-white font-display">Manage Menu & Inventory</h4>
              <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Setup products, pricing markup engines, and stock parameters</p>
            </div>
            <button 
              onClick={() => setShowAddProduct(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase text-[9px] rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" /> <span>Add Item</span>
            </button>
          </div>

          {/* Add product Modal */}
          {showAddProduct && (
            <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 text-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-black uppercase text-amber-400 font-display">Create Menu Product Catalog</h4>
                  <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-white"><XCircle className="w-4.5 h-4.5" /></button>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-3 text-[10.5px]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Product Name *</label>
                      <input 
                        type="text" 
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Menu Category *</label>
                      <input 
                        type="text" 
                        required
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        placeholder="e.g. Desserts, Starters"
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Description</label>
                    <textarea 
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Base Price *</label>
                      <input 
                        type="number" 
                        required
                        value={productForm.basePrice}
                        onChange={(e) => setProductForm({...productForm, basePrice: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Offer Price</label>
                      <input 
                        type="number" 
                        value={productForm.offerPrice}
                        onChange={(e) => setProductForm({...productForm, offerPrice: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Packaging Charges</label>
                      <input 
                        type="number" 
                        value={productForm.packagingCharges}
                        onChange={(e) => setProductForm({...productForm, packagingCharges: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* PRICING ENGINE PARAMETERS */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] font-bold uppercase text-amber-400 font-mono">Co-op Pricing Multipliers Engine</span>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={productForm.dynamicPricing}
                          onChange={(e) => setProductForm({...productForm, dynamicPricing: e.target.checked})}
                          className="rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-0"
                        />
                        <span className="text-[9px] font-mono text-slate-400">Dynamic Pricing</span>
                      </label>
                    </div>

                    {productForm.dynamicPricing && (
                      <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                        <div>
                          <span>Weekend %</span>
                          <input 
                            type="number" 
                            value={productForm.weekendMarkup} 
                            onChange={(e) => setProductForm({...productForm, weekendMarkup: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded mt-0.5"
                          />
                        </div>
                        <div>
                          <span>Festival %</span>
                          <input 
                            type="number" 
                            value={productForm.festivalMarkup} 
                            onChange={(e) => setProductForm({...productForm, festivalMarkup: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded mt-0.5"
                          />
                        </div>
                        <div>
                          <span>Night Premium %</span>
                          <input 
                            type="number" 
                            value={productForm.nightMarkup} 
                            onChange={(e) => setProductForm({...productForm, nightMarkup: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded mt-0.5"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-[9px] font-mono pt-1">
                      <div>
                        <span>Partner Discount %</span>
                        <input 
                          type="number" 
                          value={productForm.partnerDiscount} 
                          onChange={(e) => setProductForm({...productForm, partnerDiscount: Number(e.target.value)})}
                          className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded mt-0.5"
                        />
                      </div>
                      <div>
                        <span>Platform Subsidized %</span>
                        <input 
                          type="number" 
                          value={productForm.platformDiscount} 
                          onChange={(e) => setProductForm({...productForm, platformDiscount: Number(e.target.value)})}
                          className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded mt-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Stock Count</label>
                      <input 
                        type="number" 
                        value={productForm.inventoryCount}
                        onChange={(e) => setProductForm({...productForm, inventoryCount: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Prep Time (mins)</label>
                      <input 
                        type="number" 
                        value={productForm.preparationTime}
                        onChange={(e) => setProductForm({...productForm, preparationTime: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">GST Rate (%)</label>
                      <select 
                        value={productForm.gstRate}
                        onChange={(e) => setProductForm({...productForm, gstRate: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      >
                        <option value="0">0% Excluded</option>
                        <option value="5">5% Standard Food</option>
                        <option value="12">12% Luxury / Mart</option>
                        <option value="18">18% Services</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Product Image URL</label>
                    <input 
                      type="text" 
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none font-mono text-[9.5px]"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                    <button 
                      type="button" 
                      onClick={() => setShowAddProduct(false)} 
                      className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase rounded-xl"
                    >
                      Add to Catalog
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* List Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => {
              const currentPr = calculateCurrentPrice(p);
              return (
                <div key={p.id} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex justify-between gap-3 relative">
                  <div className="space-y-1 max-w-[70%]">
                    <span className="bg-slate-900 text-slate-400 font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded border border-slate-800">{p.category}</span>
                    <h4 className="text-xs font-black text-white uppercase font-display mt-2">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{p.description || 'Enterprise catalog service description parameters.'}</p>
                    
                    <div className="flex items-center space-x-2 pt-1 font-mono text-[9px]">
                      <span className="text-slate-500">Base: <strong className="text-slate-300">₹{p.basePrice}</strong></span>
                      {p.offerPrice && <span className="text-slate-500">Offer: <strong className="text-amber-400">₹{p.offerPrice}</strong></span>}
                      <span className="text-emerald-400 font-bold">Today: ₹{currentPr.unitFinalPrice}</span>
                    </div>

                    {currentPr.breakdowns.length > 0 && (
                      <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-[8px] font-mono text-amber-500 space-y-0.5 max-w-full">
                        {currentPr.breakdowns.map((b, i) => <div key={i}>• {b}</div>)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between items-end">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-14 h-14 object-cover rounded-xl border border-slate-800" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-14 h-14 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-xs font-black">BOX</div>
                    )}

                    <div className="text-right">
                      <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        p.inventoryCount > 5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400 animate-pulse'
                      }`}>
                        {p.inventoryCount > 0 ? `${p.inventoryCount} left` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {products.length === 0 && (
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl text-center text-[10px] text-slate-500 font-mono uppercase col-span-2">
                No items in your catalog yet. Click Add Item to start!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONAL INVENTORY & REAL-TIME STOCK */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-fade-in text-[11px]">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex justify-between items-center">
            <div>
              <h4 className="text-xs font-black uppercase text-white font-display">Real-Time Inventory & Ingredient Stock</h4>
              <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Monitor stock levels, configure low-stock warnings, and restock instantly.</p>
            </div>
            <button 
              onClick={() => setShowRestockItemId('NEW')}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase text-[9px] rounded-xl transition"
            >
              Add New Stock Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inventory.map(item => {
              const isLow = (item.quantity || 0) <= (item.minThreshold || 5);
              return (
                <div key={item.id} className={`bg-slate-950 border p-4 rounded-3xl space-y-3 transition ${
                  isLow ? 'border-rose-500/40 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'border-slate-850'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-display font-black text-white uppercase text-xs">{item.name}</h5>
                      <span className="font-mono text-[8.5px] text-slate-500 uppercase tracking-wider block mt-0.5">SKU: {item.sku || 'N/A'}</span>
                    </div>
                    {isLow && (
                      <span className="bg-rose-500/10 text-rose-400 font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded animate-pulse border border-rose-500/20">
                        CRITICAL LOW
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center font-mono text-[10.5px]">
                    <div className="space-y-0.5">
                      <div className="text-slate-400">Current Level: <strong className={isLow ? 'text-rose-400 font-black' : 'text-emerald-400 font-black'}>{item.quantity || 0} units</strong></div>
                      <div className="text-slate-500 text-[9px]">Alert Threshold: {item.minThreshold || 5} units</div>
                    </div>

                    <button 
                      onClick={() => { setShowRestockItemId(item.id); setRestockAmount(20); }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-amber-400 font-bold uppercase rounded text-[8.5px]"
                    >
                      Quick Restock
                    </button>
                  </div>
                </div>
              );
            })}
            {inventory.length === 0 && (
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl text-center text-[10px] text-slate-500 font-mono uppercase col-span-3">
                No inventory elements added to this branch. Click Add stock item to start.
              </div>
            )}
          </div>

          {/* Restock & Create Item Modal */}
          {showRestockItemId && (
            <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl max-w-sm w-full space-y-4 text-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-black uppercase text-amber-400 font-display">
                    {showRestockItemId === 'NEW' ? 'Register Stock Item' : 'Restock Raw Material'}
                  </h4>
                  <button onClick={() => setShowRestockItemId(null)} className="text-slate-400 hover:text-white"><XCircle className="w-4.5 h-4.5" /></button>
                </div>

                {showRestockItemId === 'NEW' ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = fd.get('name') as string;
                    const sku = fd.get('sku') as string;
                    const barcode = fd.get('barcode') as string;
                    const qty = Number(fd.get('qty'));
                    const thresh = Number(fd.get('thresh'));
                    const supplier = fd.get('supplier') as string;
                    const purchasePrice = Number(fd.get('purchasePrice'));
                    const sellingPrice = Number(fd.get('sellingPrice'));
                    const expiry = fd.get('expiry') as string;
                    if (!name || !sku) return;

                    try {
                      const newId = `INV-${Date.now()}`;
                      const invRef = doc(db, `partners/${partner.id}/branches/${selectedBranchId}/inventory`, newId);
                      await setDoc(invRef, {
                        id: newId,
                        name, sku, barcode,
                        quantity: qty,
                        minThreshold: thresh,
                        supplier, purchasePrice, sellingPrice, expiry,
                        updatedAt: new Date().toISOString()
                      });
                      await writeAuditLog('ADD_INVENTORY_ITEM', { name, sku, quantity: qty });
                      setShowRestockItemId(null);
                    } catch (err: any) {
                      alert("Error: " + err.message);
                    }
                  }} className="space-y-3 font-mono text-[10px]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Material Name *</label>
                        <input name="name" required placeholder="Item Name" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">SKU *</label>
                        <input name="sku" required placeholder="SKU-123" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Barcode</label>
                        <input name="barcode" placeholder="UPC/EAN" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Initial Stock</label>
                        <input type="number" name="qty" defaultValue={50} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Alert Threshold</label>
                        <input type="number" name="thresh" defaultValue={10} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Purchase Price</label>
                        <input type="number" step="0.01" name="purchasePrice" defaultValue={0} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Selling Price (Optional)</label>
                        <input type="number" step="0.01" name="sellingPrice" defaultValue={0} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Supplier</label>
                        <input name="supplier" placeholder="Supplier Name" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Expiry Date</label>
                        <input type="date" name="expiry" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase rounded-xl mt-2">
                      Register Stock SKU
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3 font-mono text-[10.5px]">
                    <p className="text-slate-400 leading-relaxed">Enter quantity to add to current stock for item: <strong className="text-white uppercase">{inventory.find(i => i.id === showRestockItemId)?.name}</strong></p>
                    <input 
                      type="number" 
                      value={restockAmount} 
                      onChange={(e) => setRestockAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none text-center text-lg font-black font-mono text-emerald-400"
                    />
                    <button 
                      onClick={async () => {
                        try {
                          const itemRef = doc(db, `partners/${partner.id}/branches/${selectedBranchId}/inventory`, showRestockItemId);
                          const curQty = inventory.find(i => i.id === showRestockItemId)?.quantity || 0;
                          await updateDoc(itemRef, {
                            quantity: curQty + restockAmount,
                            updatedAt: new Date().toISOString()
                          });
                          await writeAuditLog('RESTOCK_INVENTORY_ITEM', { itemId: showRestockItemId, addedUnits: restockAmount });
                          setShowRestockItemId(null);
                        } catch (err: any) {
                          alert("Error: " + err.message);
                        }
                      }}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase rounded-xl mt-2"
                    >
                      Commit Restock Update
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BOGO & HAPPY HOUR COUPON ENGINE */}
      {activeTab === 'growth' && (
        <div className="space-y-4 animate-fade-in text-[11px]">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex justify-between items-center">
            <div>
              <h4 className="text-xs font-black uppercase text-white font-display">Promo Code & BOGO Offer Engine</h4>
              <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Create percentage discounts, flat cashback, buy-one-get-one deals, or scheduling slots.</p>
            </div>
            <button 
              onClick={() => setShowAddCoupon(true)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase text-[9px] rounded-xl transition"
            >
              Add Promo Offer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map(cop => (
              <div key={cop.id} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl -mr-8 -mt-8" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-black text-amber-400 tracking-widest bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">{cop.code}</span>
                    <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mt-1.5">Branch Code: {selectedBranchId.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-200 block">{cop.discountType === 'Percentage' ? `${cop.discountValue}% OFF` : `₹${cop.discountValue} FLAT OFF`}</span>
                    <span className="text-[8.5px] font-mono text-slate-400 block mt-0.5">Min Order: ₹{cop.minOrder}</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2 rounded-xl font-mono text-[9px] text-slate-300 space-y-1">
                  <div>BOGO Active: <strong className="text-slate-100">{cop.type === 'bogo' ? `Buy ${cop.buyX} Get ${cop.getY} Free` : 'No (Standard Coupon)'}</strong></div>
                  <div>Happy Hour Restricted: <strong className="text-amber-400">{cop.happyHourStart ? `${cop.happyHourStart} - ${cop.happyHourEnd}` : 'No (24/7 Unlimited)'}</strong></div>
                  <div>Usage Limit per User: <strong className="text-slate-100">{cop.usageLimit} times</strong></div>
                </div>

                <button 
                  onClick={async () => {
                    try {
                      await deleteDoc(doc(db, `partners/${partner.id}/branches/${selectedBranchId}/coupons`, cop.id));
                      await writeAuditLog('DELETE_COUPON', { couponId: cop.id });
                    } catch (err: any) {
                      alert("Failed: " + err.message);
                    }
                  }}
                  className="w-full py-1 text-[8px] text-rose-400 font-bold uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition"
                >
                  Terminate Offer Code
                </button>
              </div>
            ))}
            {coupons.length === 0 && (
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl text-center text-[10px] text-slate-500 font-mono uppercase col-span-2">
                No dynamic codes initialized at this outlet. Click add promo offer to launch.
              </div>
            )}
          </div>

          {/* Add Coupon Modal */}
          {showAddCoupon && (
            <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl max-w-sm w-full space-y-4 text-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-black uppercase text-amber-400 font-display">Configure Promo Code</h4>
                  <button onClick={() => setShowAddCoupon(false)} className="text-slate-400 hover:text-white"><XCircle className="w-4.5 h-4.5" /></button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!couponForm.code) return;

                  try {
                    const cId = couponForm.code.toUpperCase();
                    const coupRef = doc(db, `partners/${partner.id}/branches/${selectedBranchId}/coupons`, cId);
                    await setDoc(coupRef, {
                      ...couponForm,
                      id: cId,
                      code: cId,
                      discountValue: Number(couponForm.discountValue),
                      minOrder: Number(couponForm.minOrder),
                      maxDiscount: Number(couponForm.maxDiscount),
                      usageLimit: Number(couponForm.usageLimit),
                      buyX: Number(couponForm.buyX),
                      getY: Number(couponForm.getY),
                      createdAt: new Date().toISOString()
                    });
                    await writeAuditLog('ADD_COUPON_OFFER', { code: cId });
                    setShowAddCoupon(false);
                  } catch (err: any) {
                    alert("Error: " + err.message);
                  }
                }} className="space-y-3 font-mono text-[10px]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Coupon Code *</label>
                      <input 
                        required 
                        placeholder="e.g. FESTIVE50" 
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({...couponForm, code: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white uppercase" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Offer Engine Type</label>
                      <select 
                        value={couponForm.type}
                        onChange={(e) => setCouponForm({...couponForm, type: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white"
                      >
                        <option value="discount">Direct Bill discount</option>
                        <option value="bogo">BOGO (Buy X Get Y)</option>
                      </select>
                    </div>
                  </div>

                  {couponForm.type === 'bogo' ? (
                    <div className="grid grid-cols-2 gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-amber-400 mb-1">Buy Quantity (X)</label>
                        <input type="number" value={couponForm.buyX} onChange={(e) => setCouponForm({...couponForm, buyX: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-amber-400 mb-1">Get Free (Y)</label>
                        <input type="number" value={couponForm.getY} onChange={(e) => setCouponForm({...couponForm, getY: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Type</label>
                        <select value={couponForm.discountType} onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-[9.5px] text-white">
                          <option value="Percentage">Pct (%)</option>
                          <option value="Flat">Flat (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Val</label>
                        <input type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({...couponForm, discountValue: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Limit (₹)</label>
                        <input type="number" value={couponForm.maxDiscount} onChange={(e) => setCouponForm({...couponForm, maxDiscount: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-white" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Min Order Bill (₹)</label>
                      <input type="number" value={couponForm.minOrder} onChange={(e) => setCouponForm({...couponForm, minOrder: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Usage Limit per user</label>
                      <input type="number" value={couponForm.usageLimit} onChange={(e) => setCouponForm({...couponForm, usageLimit: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-amber-400 mb-1">Happy Hour Start</label>
                      <input type="time" value={couponForm.happyHourStart} onChange={(e) => setCouponForm({...couponForm, happyHourStart: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white text-[9.5px]" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-amber-400 mb-1">Happy Hour End</label>
                      <input type="time" value={couponForm.happyHourEnd} onChange={(e) => setCouponForm({...couponForm, happyHourEnd: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white text-[9.5px]" />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase rounded-xl mt-2">
                    Inject Dynamic Promo Code
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: STAFF MEMBERS & ROLES */}
      
      {/* BRANCHES TAB */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase text-amber-400">Branch Management</h3>
              <p className="text-[10px] text-slate-400 font-mono">Manage operating hours, settings, and performance for each branch</p>
            </div>
            <button onClick={() => setShowAddBranch(true)} className="flex items-center space-x-1 bg-amber-400 text-slate-950 px-3 py-2 rounded-xl text-[10px] font-black uppercase">
              <Plus className="w-4 h-4" />
              <span>Add Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map(b => (
              <div key={b.branchId} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 relative overflow-hidden group">
                {b.status === 'Open' ? (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase rounded-bl-xl border-b border-l border-emerald-500/30">Online</div>
                ) : (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase rounded-bl-xl border-b border-l border-rose-500/30">Offline</div>
                )}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
                    <Building className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{b.branchName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Code: {b.branchCode}</p>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{b.address || 'Address not configured'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{b.openingHours || 'Not configured'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Manager: {b.manager || 'Not Assigned'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{b.phone || 'No phone'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-850 grid grid-cols-2 gap-2">
                  <button onClick={() => { setSelectedBranchId(b.branchId); setActiveTab('settings'); }} className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl text-[10px] text-white font-bold uppercase transition">
                    Manage Settings
                  </button>
                  <button onClick={() => { setSelectedBranchId(b.branchId); setActiveTab('analytics'); }} className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl text-[10px] text-amber-400 font-bold uppercase transition">
                    View Analytics
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="space-y-4 animate-fade-in text-[11px]">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex justify-between items-center">
            <div>
              <h4 className="text-xs font-black uppercase text-white font-display">Staff & Outlet Personnel roster</h4>
              <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Invite managers, kitchen chefs, cashier agents, or field couriers to operate independent terminals.</p>
            </div>
            <button 
              onClick={() => setShowAddStaff(true)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase text-[9px] rounded-xl transition"
            >
              Add Staff Member
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map(member => (
              <div key={member.id} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3 relative">
                <div className="flex justify-between items-start pb-2 border-b border-slate-850/60">
                  <div>
                    <h5 className="font-display font-black text-white uppercase text-xs">{member.name}</h5>
                    <span className="font-mono text-[8px] text-slate-500 block mt-0.5">{member.email}</span>
                  </div>
                  <span className="bg-amber-400/10 text-amber-400 font-mono text-[8px] font-black uppercase px-2.5 py-0.5 rounded border border-amber-400/20">{member.role}</span>
                </div>

                <div className="font-mono text-[10px] text-slate-300 space-y-1">
                  <div>Duty Phone: <strong className="text-white">{member.phone}</strong></div>
                  <div>Assigned: <strong className="text-slate-100">{selectedBranchId.slice(-6).toUpperCase()}</strong></div>
                  <div>Duty status: 
                    <span className={`ml-1 font-black uppercase ${member.status === 'Active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {member.status || 'Active'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-slate-850/60">
                  <button 
                    onClick={async () => {
                      try {
                        const mRef = doc(db, `partners/${partner.id}/branches/${selectedBranchId}/staff`, member.id);
                        await updateDoc(mRef, {
                          status: member.status === 'Active' ? 'Off Duty' : 'Active',
                          updatedAt: new Date().toISOString()
                        });
                        await writeAuditLog('TOGGLE_STAFF_STATUS', { memberId: member.id, targetStatus: member.status === 'Active' ? 'Off Duty' : 'Active' });
                      } catch (err: any) {
                        alert("Failed: " + err.message);
                      }
                    }}
                    className="flex-1 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold uppercase rounded-lg text-[8.5px] transition"
                  >
                    Toggle Duty
                  </button>
                  <button 
                    onClick={async () => {
                      if (!confirm("Remove this staff member?")) return;
                      try {
                        await deleteDoc(doc(db, `partners/${partner.id}/branches/${selectedBranchId}/staff`, member.id));
                        await writeAuditLog('REMOVE_STAFF_MEMBER', { memberId: member.id });
                      } catch (err: any) {
                        alert("Failed: " + err.message);
                      }
                    }}
                    className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold uppercase rounded-lg text-[8.5px] transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
            {staff.length === 0 && (
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl text-center text-[10px] text-slate-500 font-mono uppercase col-span-3">
                No active staff roster assigned to this outlet. Click add staff to provision accounts.
              </div>
            )}
          </div>

          {/* Add Staff Modal */}
          {showAddStaff && (
            <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl max-w-sm w-full space-y-4 text-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-black uppercase text-amber-400 font-display">Invite Staff Member</h4>
                  <button onClick={() => setShowAddStaff(false)} className="text-slate-400 hover:text-white"><XCircle className="w-4.5 h-4.5" /></button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!staffForm.name || !staffForm.email) return;

                  try {
                    const stId = `STAFF-${Date.now()}`;
                    const stRef = doc(db, `partners/${partner.id}/branches/${selectedBranchId}/staff`, stId);
                    await setDoc(stRef, {
                      ...staffForm,
                      id: stId,
                      createdAt: new Date().toISOString()
                    });
                    await writeAuditLog('INVITE_STAFF_MEMBER', { name: staffForm.name, email: staffForm.email, role: staffForm.role });
                    setShowAddStaff(false);
                  } catch (err: any) {
                    alert("Error: " + err.message);
                  }
                }} className="space-y-3 font-mono text-[10px]">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Full Legal Name *</label>
                    <input 
                      required 
                      placeholder="e.g. Chef Sanjay Kapoor" 
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Role Type</label>
                    <select 
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white"
                    >
                      <option value="Owner">Owner</option>
                      <option value="Manager">Manager</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Delivery Manager">Delivery Manager</option>
                      <option value="Inventory Manager">Inventory Manager</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="Finance">Finance</option>
                      <option value="Custom Role">Custom Role</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Phone *</label>
                      <input required value={staffForm.phone} onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})} placeholder="+91 9..." className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">E-mail *</label>
                      <input required type="email" value={staffForm.email} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} placeholder="staff@chalo.com" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase rounded-xl mt-2">
                    Authorize Staff Terminal
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: FEEDBACK HUB & CUSTOMER REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4 animate-fade-in text-[11px]">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl">
            <h4 className="text-xs font-black uppercase text-white font-display">Outlet Ratings & Sentiment Analysis</h4>
            <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Read complete verified feedback left by clients, view individual stars, and reply to grievances.</p>
          </div>

          <div className="space-y-3">
            {reviews.map(rev => (
              <div key={rev.id} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3">
                <div className="flex justify-between items-start pb-2 border-b border-slate-850/60">
                  <div>
                    <h5 className="font-display font-black text-white uppercase text-xs">{rev.customerName || 'Chalo Verified Eater'}</h5>
                    <span className="font-mono text-[8px] text-slate-500 block mt-0.5">{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Instant Order Review'}</span>
                  </div>
                  <div className="flex items-center space-x-1 font-mono text-[10.5px]">
                    <span className="text-yellow-400 font-bold">{rev.rating || 5}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(st => (
                        <Star key={st} className={`w-3.5 h-3.5 ${st <= (rev.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="font-mono text-[10px] text-slate-300 leading-relaxed italic">"{rev.comment || 'Outstanding service, quick logistics and pristine packing quality!'}"</p>

                {rev.reply ? (
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl space-y-1 ml-4 border-l-2 border-amber-400 font-mono text-[9.5px]">
                    <span className="text-amber-400 font-black block uppercase">Outlet response</span>
                    <p className="text-slate-300 leading-normal">{rev.reply}</p>
                    <span className="text-[7.5px] text-slate-500">{rev.repliedAt ? new Date(rev.repliedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                ) : (
                  <div className="flex space-x-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    {replyReviewId === rev.id ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          value={reviewReplyText}
                          onChange={(e) => setReviewReplyText(e.target.value)}
                          placeholder="Type customer reply message..."
                          className="flex-1 bg-slate-900 border border-slate-800 text-[10px] p-1.5 rounded text-white focus:outline-none"
                        />
                        <button 
                          onClick={async () => {
                            if (!reviewReplyText.trim()) return;
                            try {
                              const rRef = doc(db, `partners/${partner.id}/branches/${selectedBranchId}/reviews`, rev.id);
                              await updateDoc(rRef, {
                                reply: reviewReplyText,
                                repliedAt: new Date().toISOString()
                              });
                              setReplyReviewId(null);
                              setReviewReplyText('');
                            } catch (err: any) {
                              alert("Failed: " + err.message);
                            }
                          }}
                          className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[9px] uppercase rounded"
                        >
                          Send
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setReplyReviewId(rev.id); setReviewReplyText(''); }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white font-bold uppercase rounded text-[8.5px]"
                      >
                        Write Response
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl text-center text-[10px] text-slate-500 font-mono uppercase">
                No verified reviews registered on this branch yet. Feedback aggregates here upon delivery.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: METRICS & VISUAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          {orders.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-4">
              <TrendingUp className="w-12 h-12 text-slate-700 mx-auto" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">No Analytics Available</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                Analytics and reporting metrics will be generated once orders are processed at this branch. Check back after your first successful transaction.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <p className="text-[9px] font-bold uppercase text-slate-500 font-mono">Total Revenue</p>
              <p className="text-xl font-black text-amber-400 mt-1">₹{analyticsData.totalRev.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <p className="text-[9px] font-bold uppercase text-slate-500 font-mono">Unique Customers</p>
              <p className="text-xl font-black text-white mt-1">{analyticsData.uniqueCustomers}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <p className="text-[9px] font-bold uppercase text-slate-500 font-mono">Cancel/Refund Rate</p>
              <p className="text-xl font-black text-rose-400 mt-1">{(analyticsData.cancelRate + analyticsData.refundRate).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
              <p className="text-[9px] font-bold uppercase text-slate-500 font-mono">Repeat Cust Rate</p>
              <p className="text-xl font-black text-emerald-400 mt-1">{analyticsData.uniqueCustomers ? ((analyticsData.repeatCustomers / analyticsData.uniqueCustomers) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Revenue Area Chart */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-2 lg:col-span-2">
              <span className="text-[10px] font-bold uppercase text-white tracking-wider font-mono">Accumulated Daily Revenue (Last 10 days)</span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.revChart}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={8} />
                    <YAxis stroke="#64748b" fontSize={8} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: 10 }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#fbbf24" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak Hours Chart */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-2">
              <span className="text-[10px] font-bold uppercase text-white tracking-wider font-mono">Peak Order Hours</span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.peakHoursChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={8} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: 10 }} />
                    <Bar dataKey="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products Bar Chart */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-2 lg:col-span-3">
              <span className="text-[10px] font-bold uppercase text-white tracking-wider font-mono">Popular Menu Items Sold</span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.topProductsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={8} />
                    <YAxis stroke="#64748b" fontSize={8} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: 10 }} />
                    <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* TAB 9: BRANCH GEOGRAPHIC & SURGE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-4 animate-fade-in text-[11px]">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl">
            <h4 className="text-xs font-black uppercase text-white font-display">Branch Surge Configuration & Parameters</h4>
            <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Adjust precise GPS coordinates, radius zones, live closing status, and night surcharge rates.</p>
          </div>

          {branches.find(b => b.branchId === selectedBranchId) && (
            <div className="bg-slate-950 border border-slate-850 p-6 rounded-3xl space-y-4">
              {(() => {
                const b = branches.find(br => br.branchId === selectedBranchId);
                return (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const manager = fd.get('manager') as string;
                    const phone = fd.get('phone') as string;
                    const address = fd.get('address') as string;
                    const deliveryRadius = Number(fd.get('radius'));
                    const status = fd.get('status') as string;
                    const openingHours = fd.get('hours') as string;
                    const nightCharge = Number(fd.get('nightCharge'));
                    const rainCharge = Number(fd.get('rainCharge'));
                    const latitude = Number(fd.get('lat'));
                    const longitude = Number(fd.get('lng'));

                    try {
                      const branchRef = doc(db, `partners/${partner.id}/branches`, selectedBranchId);
                      const payload = {
                        manager,
                        phone,
                        address,
                        deliveryRadius,
                        status,
                        openingHours,
                        nightCharge,
                        rainCharge,
                        latitude,
                        longitude,
                        updatedAt: new Date().toISOString()
                      };
                      await updateDoc(branchRef, payload);

                      // Propagate to main restaurants collection for customer app visibility
                      const pubRef = doc(db, 'restaurants', selectedBranchId);
                      await setDoc(pubRef, {
                        ...b,
                        ...payload,
                        updatedAt: new Date().toISOString()
                      }, { merge: true });

                      await writeAuditLog('UPDATE_BRANCH_SETTINGS', { branchId: selectedBranchId });
                      alert("Outlet settings successfully synchronized with customer App database!");
                    } catch (err: any) {
                      alert("Error: " + err.message);
                    }
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold text-amber-400 uppercase font-mono pb-1 border-b border-slate-850">Core Contact Details</h5>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Outlet Manager Name</label>
                          <input name="manager" defaultValue={b.manager || ''} className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Outlet Contact Phone</label>
                          <input name="phone" defaultValue={b.phone || ''} className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Standard Delivery Hours</label>
                          <input name="hours" defaultValue={b.openingHours || '09:00 AM - 10:00 PM'} className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold text-amber-400 uppercase font-mono pb-1 border-b border-slate-850">Geographic Routing Parameters</h5>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Physical address</label>
                          <input name="address" defaultValue={b.address || ''} className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[8.5px] font-bold uppercase text-slate-400 mb-1">Lat Coordinate</label>
                            <input name="lat" type="number" step="any" defaultValue={b.latitude || 12.9716} className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono" />
                          </div>
                          <div>
                            <label className="block text-[8.5px] font-bold uppercase text-slate-400 mb-1">Lng Coordinate</label>
                            <input name="lng" type="number" step="any" defaultValue={b.longitude || 77.5946} className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono" />
                          </div>
                          <div>
                            <label className="block text-[8.5px] font-bold uppercase text-slate-400 mb-1">Radius (km)</label>
                            <input name="radius" type="number" defaultValue={b.deliveryRadius || 5} className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Live Store status</label>
                          <select name="status" defaultValue={b.status || 'Open'} className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-white font-mono">
                            <option value="Open">🟢 OPEN FOR COOKING & LOGISTICS</option>
                            <option value="Closed">🔴 CLOSED FOR THE DAY</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-850 space-y-3">
                      <span className="text-[9.5px] font-bold uppercase text-amber-400 font-mono block">Dynamic Surge Fee Engine Configuration</span>
                      <p className="text-[8.5px] text-slate-400 leading-normal font-mono">Set specific fee additions to combat harsh delivery weather or night operations. These surcharges are added instantly onto the baseline shipping fees for nearby customers.</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Night Operation Surge Fee (₹)</label>
                          <input type="number" name="nightCharge" defaultValue={b.nightCharge || 0} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-mono text-center text-amber-400 font-bold" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Heavy Rain Surcharge Fee (₹)</label>
                          <input type="number" name="rainCharge" defaultValue={b.rainCharge || 0} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-mono text-center text-rose-400 font-bold" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button type="submit" className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase text-[10px] rounded-xl">
                        Propagate Settings to Customer App
                      </button>
                    </div>
                  </form>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB 10: SETTLEMENTS & PAYOUTS */}
      
      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
            <h3 className="text-sm font-black uppercase text-amber-400 mb-2">Customer Base</h3>
            <p className="text-[10px] text-slate-400 font-mono">View your repeat customers and top spenders</p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-3xl">
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-white font-bold">No Customers Yet</p>
              <p className="text-xs text-slate-500 mt-1">Customers will appear here once you receive orders.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(
                orders.reduce((acc, order) => {
                  if (order.status !== 'Completed') return acc;
                  const cid = order.userId;
                  if (!acc[cid]) {
                    acc[cid] = {
                      id: cid,
                      name: order.customerName || 'Anonymous',
                      phone: order.customerPhone || 'N/A',
                      totalOrders: 0,
                      totalSpent: 0,
                      lastOrder: order.createdAt
                    };
                  }
                  acc[cid].totalOrders += 1;
                  acc[cid].totalSpent += (order.totalAmount || 0);
                  if (new Date(order.createdAt) > new Date(acc[cid].lastOrder)) {
                    acc[cid].lastOrder = order.createdAt;
                  }
                  return acc;
                }, {} as Record<string, any>)
              ).sort((a: any, b: any) => b.totalSpent - a.totalSpent).map((cust: any) => (
                <div key={cust.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-white font-bold">{cust.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{cust.phone}</p>
                    </div>
                    {cust.totalOrders > 3 && (
                      <span className="px-2 py-1 bg-amber-400/20 text-amber-400 text-[9px] font-black uppercase rounded-lg">Loyal</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-850 pt-3">
                    <div>
                      <p className="text-slate-500 font-mono uppercase text-[9px]">Total Spent</p>
                      <p className="text-white font-bold">₹{cust.totalSpent.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-mono uppercase text-[9px]">Total Orders</p>
                      <p className="text-white font-bold">{cust.totalOrders}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400 font-mono">
                    Last active: {new Date(cust.lastOrder).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Wallet Balance</span>
              <strong className="text-xl font-black text-emerald-400 font-mono">₹{(partner.walletBalance || 0).toFixed(2)}</strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Pending Settlement</span>
              <strong className="text-xl font-black text-amber-400 font-mono">
                ₹{settlements.filter(s => s.status === 'Pending').reduce((sum, s) => sum + s.netPayout, 0).toFixed(2)}
              </strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Settlements Paid</span>
              <strong className="text-xl font-black text-slate-100 font-mono">
                ₹{settlements.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.netPayout, 0).toFixed(2)}
              </strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Total Commission</span>
              <strong className="text-xl font-black text-rose-400 font-mono">
                ₹{settlements.reduce((sum, s) => sum + (s.platformFee || 0), 0).toFixed(2)}
              </strong>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Taxes Remitted</span>
              <strong className="text-xl font-black text-indigo-400 font-mono">
                ₹{settlements.reduce((sum, s) => sum + (s.totalTax || 0), 0).toFixed(2)}
              </strong>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button className="bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold text-slate-300 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition">
              Download GST Report
            </button>
            <button className="bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold text-slate-300 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition">
              Download CSV Ledger
            </button>
          </div>
          

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-white font-display">Payout settlements log</h4>
              <button 
                onClick={downloadPayoutReport}
                className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[9px] font-mono text-slate-300"
              >
                <Download className="w-3.5 h-3.5" /> <span>Download CSV Report</span>
              </button>
            </div>

            <div className="divide-y divide-slate-850 font-mono text-[10px]">
              {settlements.map(s => (
                <div key={s.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="text-slate-500">Invoice: #{s.id.slice(-6).toUpperCase()}</span>
                    <span className="text-slate-400 block text-[9px] mt-0.5">Order: {s.orderId ? s.orderId.slice(-6).toUpperCase() : 'N/A'} • Commission: {s.commissionPct}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-100 font-bold block">₹{s.netPayout.toFixed(2)}</span>
                    <span className={`text-[8px] font-bold uppercase ${s.status === 'Paid' ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}`}>{s.status}</span>
                  </div>
                </div>
              ))}
              {settlements.length === 0 && (
                <div className="py-4 text-center text-slate-500 font-mono uppercase">
                  No settlements registered yet. Complete an order to accrue balance!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: SUPPORT TICKETING SYSTEM */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex justify-between items-center">
            <div>
              <h4 className="text-xs font-black uppercase text-white font-display">Co-op Support Desk</h4>
              <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Open disputes, settlement clarifications, and terminal reviews</p>
            </div>
            <button 
              onClick={() => setShowAddTicket(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase text-[9px] rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" /> <span>Create Ticket</span>
            </button>
          </div>

          {/* Create support Ticket modal */}
          {showAddTicket && (
            <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl max-w-sm w-full space-y-4 text-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-black uppercase text-amber-400 font-display">Create Support Incident</h4>
                  <button onClick={() => setShowAddTicket(false)} className="text-slate-400 hover:text-white"><XCircle className="w-4.5 h-4.5" /></button>
                </div>

                <form onSubmit={handleCreateSupportTicket} className="space-y-3 text-[10.5px]">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Subject Title *</label>
                    <input 
                      type="text" 
                      required
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                      placeholder="e.g. Settlement Delay ID 104"
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Incident Category</label>
                      <select 
                        value={ticketForm.category}
                        onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      >
                        <option value="Billing">Billing & settlements</option>
                        <option value="Catalog">Catalog disputes</option>
                        <option value="Order Dispute">Order grievances</option>
                        <option value="System API">System terminal logs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Priority</label>
                      <select 
                        value={ticketForm.priority}
                        onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Elaborate Grievance details *</label>
                    <textarea 
                      required
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white focus:outline-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                    <button type="button" onClick={() => setShowAddTicket(false)} className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase rounded-xl">File Dispute</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Ticket Listing and Interactive Chat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3">
              <h5 className="text-[10px] font-bold uppercase text-white tracking-wider font-mono">Support Incident Logs</h5>
              
              <div className="divide-y divide-slate-850 max-h-[300px] overflow-y-auto">
                {supportTickets.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTicket(t)}
                    className={`py-2.5 flex justify-between items-center cursor-pointer transition ${selectedTicket?.id === t.id ? 'bg-slate-900/50 px-2 rounded-xl border-l-2 border-amber-400' : ''}`}
                  >
                    <div>
                      <strong className="text-slate-200 text-[11px] block uppercase font-display leading-tight">{t.subject}</strong>
                      <span className="text-[9px] font-mono text-slate-500">{t.category} • {t.priority} priority</span>
                    </div>
                    <span className={`text-[8.5px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                      t.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-500 animate-pulse'
                    }`}>{t.status}</span>
                  </div>
                ))}
                {supportTickets.length === 0 && (
                  <div className="py-4 text-center text-[10px] text-slate-500 font-mono uppercase">No active support tickets.</div>
                )}
              </div>
            </div>

            {/* Chat detail panel */}
            {selectedTicket ? (
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex flex-col justify-between min-h-[300px]">
                <div>
                  <h5 className="text-[10.5px] font-bold uppercase text-amber-400 tracking-wider font-mono pb-2 border-b border-slate-850">{selectedTicket.subject}</h5>
                  
                  <div className="space-y-3.5 my-3 overflow-y-auto max-h-[160px] pr-1">
                    {selectedTicket.messages?.map((msg: any, i: number) => (
                      <div key={i} className={`flex flex-col ${msg.sender === 'partner' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-2.5 rounded-2xl text-[10.5px] max-w-[85%] ${msg.sender === 'partner' ? 'bg-amber-400 text-slate-950 font-medium' : 'bg-slate-900 text-white border border-slate-850'}`}>
                          {msg.text}
                        </div>
                        <span className="text-[7.5px] text-slate-500 font-mono mt-0.5">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-1.5 border-t border-slate-850 pt-2">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type reply message..."
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs p-2 rounded-xl text-white focus:outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleReplyTicket(); }}
                  />
                  <button 
                    onClick={handleReplyTicket}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-black uppercase text-[10px] rounded-xl"
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex items-center justify-center text-center text-[10px] text-slate-500 font-mono uppercase">
                Select a support incident to display interactive logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 12: PROFILE INFO */}
      {activeTab === 'profile' && (
        <div className="space-y-4 text-[11px]">
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl">
            <h4 className="text-xs font-black uppercase text-white font-display">Manage Merchant parameters</h4>
            <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Verify registered GST, Bank payout accounts, and operation schedules</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Identity Profile Details */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3.5">
              <h5 className="text-[10px] font-bold uppercase text-amber-400 tracking-wider font-mono">Corporate Identity Details</h5>
              
              <div className="space-y-2 text-[10.5px] font-mono text-slate-300">
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Business Name:</span>
                  <span>{partner.businessName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Owner Legal:</span>
                  <span>{partner.ownerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Category / Type:</span>
                  <span>{partner.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">GST Identification:</span>
                  <span className="text-white font-bold">{partner.gstNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">PAN Registration:</span>
                  <span className="text-white font-bold">{partner.panNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">FSSAI License:</span>
                  <span className="text-white font-bold">{partner.fssaiNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Drug License:</span>
                  <span className="text-white font-bold">{partner.drugLicense || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Hotel/Taxi Reg:</span>
                  <span className="text-white font-bold">{partner.registrationNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="text-right max-w-[65%] leading-tight text-slate-400">{partner.address}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3.5">
              <h5 className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider font-mono">Settlement & Bank Details</h5>
              <div className="space-y-2 text-[10.5px] font-mono text-slate-300">
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Bank Name:</span>
                  <span>{partner.bankName || 'Not Set'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="text-white font-bold">{partner.bankAccountNumber ? '•••• ' + partner.bankAccountNumber.slice(-4) : 'Not Set'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span>{partner.bankIfsc || 'Not Set'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Account Holder:</span>
                  <span>{partner.bankHolderName || 'Not Set'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Settlement Frequency:</span>
                  <span>Daily (Next Day)</span>
                </div>
                <button className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold uppercase rounded-lg text-[9px] transition mt-2">
                  Update Bank Details
                </button>
              </div>
            </div>

            {/* Payout Bank Profile details */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3.5">
              <h5 className="text-[10px] font-bold uppercase text-amber-400 tracking-wider font-mono">Verified Payout Bank Account</h5>
              
              <div className="space-y-2 text-[10.5px] font-mono text-slate-300">
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Holder Legal Name:</span>
                  <span>{partner.bankHolderName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Account Routing:</span>
                  <span>XXXX-XXXX-{partner.bankAccountNumber?.slice(-4) || '0000'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">IFSC Routing code:</span>
                  <span>{partner.bankIfsc}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Verified UPI ID:</span>
                  <span>{partner.upiId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payout Periodicity:</span>
                  <span className="text-emerald-400 font-bold">{partner.settlementPreference} Settlements</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
