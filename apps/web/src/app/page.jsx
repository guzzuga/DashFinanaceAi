"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  PieChart as ChartIcon,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Zap,
  Search,
  Download,
  RefreshCcw,
  Send,
  User,
  MessageSquare,
  Bot,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Pencil,
  Trash2,
  CalendarDays,
  FileSpreadsheet,
  Plus,
  Tag,
  Camera,
  Factory,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Label,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";

const COLORS = [
  "#6366F1",
  "#3B82F6",
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#8B5CF6",
];

// Shared currency formatter for chart ticks
const fmtTick = (val) => {
  const v = Number(val) || 0;
  if (v >= 1000000) return `Rp${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}jt`;
  if (v >= 1000) return `Rp${(v / 1000).toFixed(0)}rb`;
  return `Rp${v}`;
};
// Full currency formatter for tooltips
const fmtFull = (v) => `Rp${Number(v || 0).toLocaleString("id-ID")}`;

const MARKETPLACE_COLORS = {
  "Shopee": "#EE4D2D",
  "Tokopedia": "#42B549",
  "Lazada": "#0F146D",
  "Bukalapak": "#E31E52",
  "TikTok Shop": "#000000",
  "Offline": "#6366F1",
};

const MARKETPLACE_LOGOS = {
  "Shopee": "/images/marketplace/shopee.jpg",
  "Tokopedia": "/images/marketplace/tokopedia.jpg",
  "Lazada": "/images/marketplace/lazada.jpg",
  "Bukalapak": "/images/marketplace/bukalapak.jpg",
  "TikTok Shop": "/images/marketplace/tiktok.jpg",
  "Offline": "/images/marketplace/offline.jpg",
  "Offline/Toko": "/images/marketplace/offline.jpg",
};

const getMarketplaceLogo = (name) => MARKETPLACE_LOGOS[name] || "/images/marketplace/offline.jpg";

// Custom pulsing dot for realtime chart feel
const PulsingDot = (props) => {
  const { cx, cy, index, dataLength } = props;
  if (index !== dataLength - 1) return <circle cx={cx} cy={cy} r={4} fill="#22C55E" />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#22C55E" opacity={0.3}>
        <animate attributeName="r" from="8" to="18" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={5} fill="#22C55E" />
    </g>
  );
};

// Custom bar shape with opacity variation (recent = more opaque)
const PulsingLiveDot = () => (
  <span className="relative flex size-2 ml-2">
    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
  </span>
);

const renderValueLabel = (props) => {
  const { height, value, y } = props;
  return (
    <text className="fill-white" dominantBaseline="middle" dx={-6} fontSize={13}
      textAnchor="end" x="100%" y={Number(y) + Number(height) / 2}>
      Rp {Number(value).toLocaleString("id-ID")}
    </text>
  );
};

// Custom tooltip style for all charts
const chartTooltipProps = {
  contentStyle: {
    backgroundColor: "#111827",
    borderColor: "#374151",
    borderRadius: "12px",
  },
  itemStyle: { fontSize: "12px" },
};

// Custom bar shape with opacity variation (recent = more opaque)
const OpacityBar = (props) => {
  const { x, y, width, height, index, dataLength } = props;
  const opacity = dataLength > 1 ? 0.4 + (0.6 * (index / (dataLength - 1))) : 1;
  return <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill="#22C55E" opacity={opacity} />;
};

// Custom label renderer for in-bar labels
const InBarLabel = ({ x, y, width, height, value, name }) => {
  if (width < 80) return null;
  return (
    <text x={x + 12} y={y + height / 2 + 4} fill="#fff" fontSize={12} fontWeight="bold">
      {name} — Rp {Number(value).toLocaleString("id-ID")}
    </text>
  );
};

const fetcher = async (url) => {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [konveksiTab, setKonveksiTab] = useState("overview");
  const [userId, setUserId] = useState(null);
  const [chatText, setChatText] = useState("");
  const [isAdminResetOpen, setIsAdminResetOpen] = useState(false);
  const [adminConfirmText, setAdminConfirmText] = useState("");
  const [adminStep, setAdminStep] = useState(1);
  const queryClient = useQueryClient();

  // Edit/Delete transaction state
  const [editTx, setEditTx] = useState(null);
  const [deleteTxId, setDeleteTxId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Date range filter
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Categories management
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("pengeluaran");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Chart period toggle
  const [chartPeriod, setChartPeriod] = useState("weekly");

  // Transaction type state for Input form radio highlight
  const [txType, setTxType] = useState("pemasukan");

  // Mobile sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Profile photo (localStorage + default)
  const [profilePhoto, setProfilePhoto] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("profilePhoto") || "/images/profile.jpg";
    }
    return "/images/profile.jpg";
  });
  const profileInputRef = useRef(null);

  const handleProfilePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      setProfilePhoto(dataUrl);
      try { localStorage.setItem("profilePhoto", dataUrl); } catch {}
    };
    reader.readAsDataURL(file);
  };

  // Touch tracking for pull-to-refresh & swipe navigation
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const mainRef = useRef(null);

  // Skeleton helper
  const SkeletonBox = ({ className = "" }) => (
    <div className={`bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-lg ${className}`} />
  );

  // Auth Check
  const { data: auth, isLoading: isAuthLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: () => fetcher("/api/auth/me"),
  });

  useEffect(() => {
    if (!isAuthLoading && auth && !auth.authenticated) {
      window.location.href = "/login";
    }
    // Set userId from auth session
    if (auth?.authenticated && auth?.user_id) {
      setUserId(auth.user_id);
    }
  }, [auth, isAuthLoading]);

  // Data Queries - use userId from auth session
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["summary", userId],
    queryFn: () => fetcher(`/api/reports/summary?user_id=${userId}`),
    enabled: !!userId,
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ["recent", userId],
    queryFn: () => fetcher(`/api/reports/recent?user_id=${userId}&limit=50`),
    enabled: !!userId,
  });

  const { data: cashFlow } = useQuery({
    queryKey: ["cash-flow", userId],
    queryFn: () => fetcher(`/api/reports/cash-flow?user_id=${userId}`),
    enabled: !!userId,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", userId],
    queryFn: () => fetcher(`/api/reports/categories?user_id=${userId}`),
    enabled: !!userId,
  });

  const { data: insight } = useQuery({
    queryKey: ["insight", userId],
    queryFn: () => fetcher(`/api/reports/insight?user_id=${userId}`),
    enabled: !!userId,
  });

  // New queries for Laporan tab
  const { data: monthlyData } = useQuery({
    queryKey: ["monthly", userId],
    queryFn: () => fetcher(`/api/reports/monthly?user_id=${userId}`),
    enabled: !!userId && activeTab === "reports",
  });

  const { data: profitData } = useQuery({
    queryKey: ["profit", userId],
    queryFn: () => fetcher(`/api/reports/profit?user_id=${userId}`),
    enabled: !!userId && activeTab === "reports",
  });

  const { data: dailyData } = useQuery({
    queryKey: ["daily", userId, dateFrom, dateTo],
    queryFn: () => {
      let url = `/api/reports/daily?user_id=${userId}`;
      if (dateFrom) url += `&from=${dateFrom}`;
      if (dateTo) url += `&to=${dateTo}`;
      return fetcher(url);
    },
    enabled: !!userId && activeTab === "reports",
  });

  // Categories management query (full list for settings & input form)
  const { data: allCategories } = useQuery({
    queryKey: ["all-categories", userId],
    queryFn: () => fetcher(`/api/categories?user_id=${userId}`),
    enabled: !!userId,
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: () =>
      fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  // Edit Transaction Mutation
  const editMutation = useMutation({
    mutationFn: (data) =>
      fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowEditModal(false);
      setEditTx(null);
    },
    onError: (err) => {
      showToast("Gagal update transaksi: " + err.message, "error");
    },
  });

  // Delete Transaction Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) =>
      fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowDeleteModal(false);
      setDeleteTxId(null);
    },
    onError: (err) => {
      showToast("Gagal menghapus: " + err.message, "error");
    },
  });

  // Add Category Mutation
  const addCategoryMutation = useMutation({
    mutationFn: (data) =>
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, name: data.name, type: data.type }),
        credentials: "same-origin",
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to add category");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      showToast("Kategori berhasil ditambahkan!");
    },
    onError: (err) => {
      showToast("Gagal tambah kategori: " + err.message, "error");
    },
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id) =>
      fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete category");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      showToast("Kategori berhasil dihapus");
    },
    onError: (err) => {
      showToast("Gagal hapus kategori: " + err.message, "error");
    },
  });

  const { data: comparison } = useQuery({
    queryKey: ["comparison", userId],
    queryFn: () => fetcher(`/api/reports/period-comparison?user_id=${userId}`),
    enabled: !!userId,
  });

  // Business Performance Queries
  const { data: profitMargin } = useQuery({
    queryKey: ["profit-margin", userId],
    queryFn: () => fetcher(`/api/reports/profit-margin?user_id=${userId}`),
    enabled: !!userId && activeTab === "dashboard",
  });

  const { data: revenueTrend } = useQuery({
    queryKey: ["revenue-trend", userId],
    queryFn: () => fetcher(`/api/reports/revenue-trend?user_id=${userId}`),
    enabled: !!userId && activeTab === "dashboard",
  });

  const { data: burnRate } = useQuery({
    queryKey: ["burn-rate", userId],
    queryFn: () => fetcher(`/api/reports/burn-rate?user_id=${userId}`),
    enabled: !!userId && activeTab === "dashboard",
  });

  const { data: cashRunway } = useQuery({
    queryKey: ["cash-runway", userId],
    queryFn: () => fetcher(`/api/reports/cash-runway?user_id=${userId}`),
    enabled: !!userId && activeTab === "dashboard",
  });

  const { data: healthScore } = useQuery({
    queryKey: ["health-score", userId],
    queryFn: () => fetcher(`/api/reports/health-score?user_id=${userId}`),
    enabled: !!userId && activeTab === "dashboard",
  });

  // Konveksi Queries
  const { data: konveksiProducts = [] } = useQuery({
    queryKey: ["konveksi-products"],
    queryFn: () => fetch(`/api/konveksi/products?user_id=${userId}`).then(r => r.json()),
    enabled: !!userId && activeTab === "konveksi",
  });

  const { data: konveksiMaterials = [] } = useQuery({
    queryKey: ["konveksi-materials"],
    queryFn: () => fetch(`/api/konveksi/materials?user_id=${userId}`).then(r => r.json()),
    enabled: !!userId && activeTab === "konveksi",
  });

  const { data: konveksiSales = [] } = useQuery({
    queryKey: ["konveksi-sales"],
    queryFn: () => fetch(`/api/konveksi/sales?user_id=${userId}&limit=50`).then(r => r.json()),
    enabled: !!userId && activeTab === "konveksi",
  });

  const { data: konveksiMarketplaces = [] } = useQuery({
    queryKey: ["konveksi-marketplaces"],
    queryFn: () => fetch(`/api/konveksi/marketplaces?user_id=${userId}`).then(r => r.json()),
    enabled: !!userId && activeTab === "konveksi",
  });

  const { data: productCategories = [], refetch: refetchProductCategories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => fetch("/api/konveksi/product-categories").then(r => r.json()),
    enabled: !!userId && activeTab === "konveksi",
  });

  const [newProdCatName, setNewProdCatName] = useState("");
  const [newProdCatIcon, setNewProdCatIcon] = useState("📦");

  const addProductCategoryMutation = useMutation({
    mutationFn: (data) => fetch("/api/konveksi/product-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      refetchProductCategories();
      setNewProdCatName("");
      showToast("Kategori produk ditambahkan!");
    },
    onError: () => showToast("Gagal tambah kategori", "error"),
  });

  const deleteProductCategoryMutation = useMutation({
    mutationFn: (id) => fetch(`/api/konveksi/product-categories?id=${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      refetchProductCategories();
      showToast("Kategori produk dihapus");
    },
    onError: () => showToast("Gagal hapus kategori", "error"),
  });

  const { data: konveksiReport = {} } = useQuery({
    queryKey: ["konveksi-report"],
    queryFn: () => fetch(`/api/konveksi/reports?user_id=${userId}`).then(r => r.json()),
    enabled: !!userId && activeTab === "konveksi",
  });

  // Inventory Queries
  const { data: inventoryDashboard = {} } = useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: () => fetch(`/api/inventory/dashboard?user_id=${userId}`).then(r => r.json()),
    enabled: !!userId && activeTab === "konveksi" && konveksiTab === "inventory",
  });

  const { data: inventoryBatches = [] } = useQuery({
    queryKey: ["inventory-batches"],
    queryFn: () => fetch(`/api/inventory/batches?user_id=${userId}`).then(r => r.json()),
    enabled: !!userId && activeTab === "konveksi" && konveksiTab === "inventory",
  });

  const { data: inventoryBoms = [] } = useQuery({
    queryKey: ["inventory-boms"],
    queryFn: () => fetch(`/api/inventory/boms?user_id=${userId}`).then(r => r.json()),
    enabled: !!userId && activeTab === "konveksi" && konveksiTab === "inventory",
  });

  // Chat Mutation
  const chatMutation = useMutation({
    mutationFn: (text) =>
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, user_id: userId }),
        credentials: "same-origin",
      }).then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      }),
  });

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    chatMutation.mutate(chatText);
    setChatText("");
  };

  const handleExport = () => {
    window.location.href = `/api/export/csv?user_id=${userId}`;
  };

  const handleExportExcel = () => {
    window.location.href = `/api/export/excel?user_id=${userId}`;
  };

  // Filter transactions by date range + search
  const filteredTransactions = useMemo(() => {
    if (!recentTransactions) return [];
    let filtered = recentTransactions;
    if (dateFrom) {
      filtered = filtered.filter((tx) => tx.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((tx) => tx.date <= dateTo);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          (tx.note && tx.note.toLowerCase().includes(q)) ||
          (tx.category && tx.category.toLowerCase().includes(q)) ||
          String(tx.amount).includes(q)
      );
    }
    return filtered;
  }, [recentTransactions, dateFrom, dateTo, searchQuery]);

  // Filter cash flow by chart period
  const filteredCashFlow = useMemo(() => {
    if (!cashFlow || !Array.isArray(cashFlow)) return [];
    if (chartPeriod === "daily") {
      return cashFlow.slice(-7);
    }
    return cashFlow.slice(-30);
  }, [cashFlow, chartPeriod]);

  const handleEditTx = (tx) => {
    setEditTx({ ...tx });
    setShowEditModal(true);
  };

  const handleDeleteTx = (id) => {
    setDeleteTxId(id);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editMutation.mutate({
      id: editTx.id,
      type: editTx.type,
      amount: Number(editTx.amount),
      note: editTx.note,
      category: editTx.category,
    });
  };

  if (isAuthLoading || !auth?.authenticated) {
    return (
      <div className="min-h-screen bg-[#06080F] flex items-center justify-center">
        <Loader2 size={48} className="text-[#6366F1] animate-spin" />
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "input", icon: PlusCircle, label: "Input Transaksi" },
    { id: "history", icon: History, label: "Riwayat" },
    { id: "reports", icon: ChartIcon, label: "Laporan" },
    { id: "konveksi", icon: Factory, label: "Konveksi" },
    { id: "settings", icon: SettingsIcon, label: "Settings" },
  ];

  const categoryOptions = [
    { value: "bahan_baku", label: "🧵 Bahan Baku" },
    { value: "biaya_produksi", label: "🏭 Biaya Produksi" },
    { value: "operasional", label: "⚙️ Operasional" },
    { value: "ongkir", label: "🚚 Ongkir" },
    { value: "packaging", label: "📦 Packaging" },
    { value: "marketplace_fee", label: "🏪 Marketplace Fee" },
    { value: "marketing", label: "📣 Marketing" },
    { value: "gaji_karyawan", label: "👷 Gaji Karyawan" },
    { value: "perlengkapan", label: "🔧 Perlengkapan" },
    { value: "lainnya_biaya", label: "📋 Lainnya" },
  ];

  return (
    <div className="min-h-screen bg-[#06080F] text-[#F9FAFB] flex font-inter overflow-hidden">
      {/* SVG Defs Block for premium chart effects */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#22c55e" floodOpacity="0.35" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="line-glow-blue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#3b82f6" floodOpacity="0.35" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
          <pattern id="stripe-pattern" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#3b82f6" fillOpacity="0.15" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#3b82f6" strokeWidth="1.25" strokeOpacity="0.40" />
          </pattern>
        </defs>
      </svg>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/60 z-[60] md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - hidden on mobile, toggle with hamburger */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`bg-[#050810] border-r border-white/5 flex-col h-screen sticky top-0 z-50 transition-all shadow-2xl hidden md:flex relative overflow-hidden`}
      >
        {/* Animated Wave Background */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none overflow-hidden"
          style={{ maskImage: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)' }}>
          <svg className="sidebar-wave-1 absolute bottom-0 left-0 w-[200%] h-48" viewBox="0 0 1440 192" preserveAspectRatio="none">
            <path d="M0,96 C360,160 720,32 1080,96 C1260,128 1380,80 1440,96 L1440,192 L0,192 Z" fill="rgba(99,102,241,0.12)" />
          </svg>
          <svg className="sidebar-wave-2 absolute bottom-0 left-0 w-[200%] h-48" viewBox="0 0 1440 192" preserveAspectRatio="none">
            <path d="M0,120 C240,64 480,160 720,112 C960,64 1200,144 1440,96 L1440,192 L0,192 Z" fill="rgba(59,130,246,0.10)" />
          </svg>
          <svg className="sidebar-wave-3 absolute bottom-0 left-0 w-[200%] h-48" viewBox="0 0 1440 192" preserveAspectRatio="none">
            <path d="M0,144 C180,100 360,160 540,128 C720,96 900,144 1080,112 C1260,80 1380,128 1440,104 L1440,192 L0,192 Z" fill="rgba(139,92,246,0.08)" />
          </svg>
        </div>
        <div className="p-6 flex items-center gap-3 overflow-hidden">
          <img
            src="/images/ac-logo.jpg"
            alt="Agus Collection"
            className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
            style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.15)' }}
          />
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col min-w-0"
            >
              <span
                className="text-[15px] text-white font-medium tracking-[0.04em] leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}
              >
                Agus Collection
              </span>
              <span className="text-[10px] text-[#8A8F98] tracking-[0.15em] uppercase mt-0.5 font-medium">
                Business OS
              </span>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group ${
                activeTab === item.id
                  ? "bg-[#6366F1]/10 text-[#6366F1]"
                  : "text-[#94A3B8] hover:bg-white/5 hover:text-[#F9FAFB]"
              }`}
            >
              <item.icon size={22} className="flex-shrink-0" />
              {isSidebarOpen && (
                <span className="font-medium">{item.label}</span>
              )}
              {activeTab === item.id && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#6366F1] rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all duration-300"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition-all group"
          >
            <LogOut size={22} className="flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar - slide in from left */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "tween", duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 left-0 w-[280px] bg-[#050810] border-r border-white/5 flex flex-col z-[70] md:hidden shadow-2xl relative overflow-hidden"
          >
            {/* Animated Wave Background */}
            <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none overflow-hidden"
              style={{ maskImage: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)' }}>
              <svg className="sidebar-wave-1 absolute bottom-0 left-0 w-[200%] h-48" viewBox="0 0 1440 192" preserveAspectRatio="none">
                <path d="M0,96 C360,160 720,32 1080,96 C1260,128 1380,80 1440,96 L1440,192 L0,192 Z" fill="rgba(99,102,241,0.15)" />
              </svg>
              <svg className="sidebar-wave-2 absolute bottom-0 left-0 w-[200%] h-48" viewBox="0 0 1440 192" preserveAspectRatio="none">
                <path d="M0,120 C240,64 480,160 720,112 C960,64 1200,144 1440,96 L1440,192 L0,192 Z" fill="rgba(59,130,246,0.13)" />
              </svg>
              <svg className="sidebar-wave-3 absolute bottom-0 left-0 w-[200%] h-48" viewBox="0 0 1440 192" preserveAspectRatio="none">
                <path d="M0,144 C180,100 360,160 540,128 C720,96 900,144 1080,112 C1260,80 1380,128 1440,104 L1440,192 L0,192 Z" fill="rgba(139,92,246,0.10)" />
              </svg>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/images/ac-logo.jpg"
                  alt="Agus Collection"
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.15)' }}
                />
                <div className="flex flex-col">
                  <span
                    className="text-[15px] text-white font-medium tracking-[0.04em] leading-tight"
                    style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}
                  >
                    Agus Collection
                  </span>
                  <span className="text-[10px] text-[#8A8F98] tracking-[0.15em] uppercase mt-0.5 font-medium">
                    Business OS
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="text-[#94A3B8] hover:text-[#F9FAFB]"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setTimeout(() => setIsMobileSidebarOpen(false), 200);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group ${
                    activeTab === item.id
                      ? "bg-[#6366F1]/10 text-[#6366F1]"
                      : "text-[#94A3B8] hover:bg-white/5 hover:text-[#F9FAFB]"
                  }`}
                >
                  <item.icon size={22} className="flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  {activeTab === item.id && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#6366F1] rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all duration-300"
                    />
                  )}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-white/5">
              <button
                onClick={() => logoutMutation.mutate()}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
              >
                <LogOut size={22} className="flex-shrink-0" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0"
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchMove={(e) => {
          const deltaY = e.touches[0].clientY - touchStartY.current;
          const deltaX = e.touches[0].clientX - touchStartX.current;
          // 3c: Pull-to-refresh - only when at top of scroll and pulling down
          if (e.currentTarget.scrollTop === 0 && deltaY > 0 && Math.abs(deltaX) < 30) {
            setPullDistance(Math.min(deltaY, 120));
          }
        }}
        onTouchEnd={(e) => {
          // Pull-to-refresh trigger
          if (pullDistance >= 80) {
            setIsRefreshing(true);
            queryClient.invalidateQueries();
            setTimeout(() => {
              setIsRefreshing(false);
              setPullDistance(0);
            }, 1500);
          } else {
            setPullDistance(0);
          }
        }}
      >
        {/* Top Bar */}
        <header className="bg-[#0D1220]/80 backdrop-blur-xl border-b border-white/5 h-16 md:h-20 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileSidebarOpen(!isMobileSidebarOpen);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="text-[#94A3B8] hover:text-[#F9FAFB] transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="relative group hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#6366F1] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari transaksi, kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111827] border border-white/5 rounded-full py-2 pl-10 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F9FAFB]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => queryClient.invalidateQueries()}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#F9FAFB] transition-all"
            >
              <RefreshCcw size={18} />
            </button>
            <div className="h-8 w-px bg-white/10 mx-1 md:mx-2 hidden sm:block" />
            <div className="flex items-center gap-2 md:gap-3 bg-white/5 px-3 md:px-4 py-2 rounded-full border border-white/5">
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                style={{ boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)' }}
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#F9FAFB]">
                  {auth.username}
                </p>
                <p className="text-[10px] text-[#94A3B8]">Production Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Pull-to-Refresh Indicator (3c) */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className="flex items-center justify-center py-2 md:hidden"
            style={{ minHeight: pullDistance > 0 ? Math.min(pullDistance * 0.5, 40) : 40 }}
          >
            <div className={`flex items-center gap-2 text-[#6366F1] ${isRefreshing ? "animate-spin" : ""}`}>
              <RefreshCcw size={18} />
              <span className="text-xs font-bold">
                {isRefreshing ? "Memuat..." : pullDistance >= 80 ? "Lepas untuk refresh" : "Tarik ke bawah"}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-10">
          <AnimatePresence mode="wait">
          {/* ========== DASHBOARD TAB ========== */}
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}>
              {/* KPI Section - Luxury Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {[
                  {
                    label: "Total Pemasukan",
                    value: summary?.total_income,
                    icon: TrendingUp,
                    color: "#22C55E",
                    gradientBg: "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.02) 100%)",
                    gradientBorder: "linear-gradient(135deg, rgba(34,197,94,0.4) 0%, rgba(34,197,94,0.05) 50%, rgba(34,197,94,0.0) 100%)",
                    growth: comparison?.income_growth,
                  },
                  {
                    label: "Total Pengeluaran",
                    value: summary?.total_expense,
                    icon: TrendingDown,
                    color: "#EF4444",
                    gradientBg: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.02) 100%)",
                    gradientBorder: "linear-gradient(135deg, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0.05) 50%, rgba(239,68,68,0.0) 100%)",
                    growth: comparison?.expense_growth,
                  },
                  {
                    label: "Saldo Akhir",
                    value: summary?.balance,
                    icon: DollarSign,
                    color: "#6366F1",
                    gradientBg: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.02) 100%)",
                    gradientBorder: "linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0.05) 50%, rgba(99,102,241,0.0) 100%)",
                    growth: comparison?.balance_growth,
                  },
                  {
                    label: "Jumlah Transaksi",
                    value: recentTransactions?.length,
                    icon: History,
                    color: "#3B82F6",
                    gradientBg: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.02) 100%)",
                    gradientBorder: "linear-gradient(135deg, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0.05) 50%, rgba(59,130,246,0.0) 100%)",
                    isCurrency: false,
                    growth: comparison?.count_growth,
                  },
                ].map((kpi, idx) => {
                  const growthVal = kpi.growth ?? 0;
                  const isPositive = growthVal > 0;
                  const isNeutral = growthVal === 0;
                  return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative group cursor-default"
                  >
                    {/* Outer gradient border */}
                    <div
                      className="absolute -inset-[1px] rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: kpi.gradientBorder }}
                    />
                    {/* Inner card with glass effect */}
                    <div className="relative h-full rounded-2xl p-5 md:p-6 overflow-hidden backdrop-blur-xl border border-white/[0.05]"
                      style={{ background: kpi.gradientBg }}>
                      {/* Top-right glow orb */}
                      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                        style={{ background: kpi.color }} />
                      {/* Bottom-left subtle glow */}
                      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity duration-500"
                        style={{ background: kpi.color }} />

                      <div className="relative flex justify-between items-start mb-4">
                        {/* Icon with glow ring */}
                        <div className="relative">
                          <div className="absolute inset-0 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity"
                            style={{ background: kpi.color }} />
                          <div
                            className="relative w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 transition-transform duration-300 group-hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${kpi.color}20, ${kpi.color}08)` }}
                          >
                            <kpi.icon size={20} style={{ color: kpi.color }} />
                          </div>
                        </div>
                        {/* Growth badge */}
                        {!isNeutral && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.1 + 0.3 }}
                            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                              isPositive
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-red-400 bg-red-500/10 border-red-500/20"
                            }`}
                          >
                            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {`${isPositive ? "+" : ""}${Math.abs(growthVal).toFixed(0)}%`}
                          </motion.div>
                        )}
                      </div>

                      {/* Label */}
                      <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                        {kpi.label}
                      </p>

                      {/* Value */}
                      <h3 className="text-2xl md:text-3xl font-extrabold text-[#F9FAFB] tabular-nums leading-none tracking-tight">
                        {isSummaryLoading ? (
                          <div className="h-9 w-36 bg-white/5 rounded-lg animate-pulse" />
                        ) : (
                          <CountUp
                            value={kpi.value || 0}
                            isCurrency={kpi.isCurrency !== false}
                          />
                        )}
                      </h3>

                      {/* Decorative bottom line */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)` }} />
                    </div>
                  </motion.div>
                  );
                })}
              </div>

              {/* Main Analytics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-6 md:mt-8">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  {/* Cash Flow Chart - Premium */}
                  <section className="relative bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5 overflow-hidden">
                    {/* Subtle background glow */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#6366F1]/5 rounded-full blur-3xl" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3">
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-[#F9FAFB] flex items-center">
                          Cash Flow Analysis
                          <PulsingLiveDot />
                        </h2>
                        <p className="text-sm text-[#94A3B8]">
                          Arus kas 30 hari terakhir
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setChartPeriod("daily")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${chartPeriod === "daily" ? "bg-[#6366F1] text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 border border-white/5 hover:bg-white/10"}`}
                        >
                          Daily
                        </button>
                        <button
                          onClick={() => setChartPeriod("weekly")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${chartPeriod === "weekly" ? "bg-[#6366F1] text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 border border-white/5 hover:bg-white/10"}`}
                        >
                          Weekly
                        </button>
                      </div>
                    </div>
                    <div className="h-[250px] md:h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredCashFlow}>
                          <defs>
                            <linearGradient
                              id="colorIncome"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#22C55E"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#22C55E"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="colorExpense"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#EF4444"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#EF4444"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feFlood floodColor="#22c55e" floodOpacity="0.4" />
                              <feComposite in2="blur" operator="in" />
                              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feFlood floodColor="#ef4444" floodOpacity="0.4" />
                              <feComposite in2="blur" operator="in" />
                              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1F2937"
                            vertical={false}
                            strokeOpacity={0.3}
                          />
                          <XAxis
                            dataKey="day"
                            stroke="#6B7280"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) =>
                              new Date(val).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })
                            }
                          />
                          <YAxis
                            stroke="#6B7280"
                            fontSize={10}
                            tickFormatter={fmtTick}
                          />
                          <Tooltip
                            formatter={(value, name) => [`Rp${Number(value).toLocaleString("id-ID")}`, name === "income" ? "Pemasukan" : "Pengeluaran"]}
                            contentStyle={{
                              backgroundColor: "#111827",
                              borderColor: "#374151",
                              borderRadius: "12px",
                            }}
                            itemStyle={{ fontSize: "12px" }}
                          />
                          <Area
                            type="natural"
                            dataKey="income"
                            stroke="#22C55E"
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                            strokeWidth={3}
                            filter="url(#glow-green)"
                            dot={false}
                            activeDot={{ r: 5, fill: '#fff', stroke: '#22C55E', strokeWidth: 2 }}
                          />
                          <Area
                            type="natural"
                            dataKey="expense"
                            stroke="#EF4444"
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                            strokeWidth={3}
                            filter="url(#glow-red)"
                            dot={false}
                            activeDot={{ r: 5, fill: '#fff', stroke: '#EF4444', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* ========== BUSINESS PERFORMANCE CHARTS ========== */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. Profit Margin Ring */}
                    <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                      <h2 className="text-lg font-bold text-[#F9FAFB] mb-2">
                        Profit Margin
                      </h2>
                      <p className="text-xs text-[#94A3B8] mb-4">30 hari terakhir</p>
                      {profitMargin ? (
                        profitMargin.income > 0 ? (
                          <div className="flex flex-col items-center">
                            <div className="relative w-40 h-40">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: "Profit", value: Math.max(0, profitMargin.margin_pct) },
                                      { name: "Cost", value: Math.max(0, 100 - Math.max(0, profitMargin.margin_pct)) },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={70}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    cornerRadius={6}
                                    paddingAngle={2}
                                    strokeWidth={5}
                                    stroke="#111827"
                                  >
                                    <Cell fill={profitMargin.margin_pct > 20 ? "#22C55E" : profitMargin.margin_pct > 10 ? "#F59E0B" : "#EF4444"} />
                                    <Cell fill="#1F2937" />
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-[#F9FAFB]">{profitMargin.margin_pct.toFixed(1)}%</span>
                              </div>
                            </div>
                            <span className={`mt-3 text-xs font-bold px-3 py-1 rounded-full ${
                              profitMargin.margin_pct > 20 ? "text-[#22C55E] bg-[#22C55E]/10" :
                              profitMargin.margin_pct > 10 ? "text-[#F59E0B] bg-[#F59E0B]/10" :
                              "text-[#EF4444] bg-[#EF4444]/10"
                            }`}>
                              {profitMargin.status === "sehat" ? "Sehat" : profitMargin.status === "cukup" ? "Cukup" : "Kritis"}
                            </span>
                            <div className="mt-4 w-full flex justify-between text-xs text-[#94A3B8]">
                              <span>Pemasukan: Rp{Number(profitMargin.income).toLocaleString("id-ID")}</span>
                              <span>Pengeluaran: Rp{Number(profitMargin.expense).toLocaleString("id-ID")}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-40 text-[#94A3B8] text-sm">Belum ada data</div>
                        )
                      ) : (
                        <div className="flex items-center justify-center h-40"><SkeletonBox className="h-32 w-32 rounded-full" /></div>
                      )}
                    </section>

                    {/* 2. Burn Rate Gauge */}
                    <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                      <h2 className="text-lg font-bold text-[#F9FAFB] mb-2">
                        Burn Rate
                      </h2>
                      <p className="text-xs text-[#94A3B8] mb-4">Rasio pengeluaran vs pemasukan</p>
                      {burnRate ? (
                        burnRate.monthly_burn > 0 || burnRate.income_monthly > 0 ? (
                          <div className="space-y-5">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-[#94A3B8]">Rasio Pengeluaran</span>
                                <span className={`font-bold ${
                                  burnRate.ratio_pct < 50 ? "text-[#22C55E]" :
                                  burnRate.ratio_pct < 80 ? "text-[#F59E0B]" :
                                  "text-[#EF4444]"
                                }`}>{burnRate.ratio_pct}%</span>
                              </div>
                              <div className="h-4 bg-[#1F2937] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    burnRate.ratio_pct < 50 ? "bg-[#22C55E]" :
                                    burnRate.ratio_pct < 80 ? "bg-[#F59E0B]" :
                                    "bg-[#EF4444]"
                                  }`}
                                  style={{ width: `${Math.min(100, burnRate.ratio_pct)}%` }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[#06080F]/50 rounded-xl p-3">
                                <p className="text-[10px] text-[#94A3B8] mb-1">Rata-rata Harian</p>
                                <p className="text-sm font-bold text-[#F9FAFB] tabular-nums">Rp{Number(burnRate.daily_avg).toLocaleString("id-ID")}</p>
                              </div>
                              <div className="bg-[#06080F]/50 rounded-xl p-3">
                                <p className="text-[10px] text-[#94A3B8] mb-1">Pengeluaran Bulanan</p>
                                <p className="text-sm font-bold text-[#F9FAFB] tabular-nums">Rp{Number(burnRate.monthly_burn).toLocaleString("id-ID")}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-40 text-[#94A3B8] text-sm">Belum ada data</div>
                        )
                      ) : (
                        <div className="flex items-center justify-center h-40"><SkeletonBox className="h-20 w-full" /></div>
                      )}
                    </section>
                  </div>

                  {/* Row 2: Revenue Trend + Health Score */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 3. Revenue vs Expense Trend */}
                    <section className="lg:col-span-2 bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                      <h2 className="text-lg font-bold text-[#F9FAFB] mb-2">
                        Tren Pendapatan vs Pengeluaran
                      </h2>
                      <p className="text-xs text-[#94A3B8] mb-4">6 bulan terakhir + 3 bulan forecast</p>
                      {revenueTrend && revenueTrend.length > 0 ? (
                        <div className="h-[250px] md:h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={revenueTrend}>
                              <defs>
                                <filter id="glow">
                                  <feGaussianBlur stdDeviation="3" result="blur"/>
                                  <feFlood floodColor="#22c55e" floodOpacity="0.3"/>
                                  <feComposite in2="blur" operator="in"/>
                                  <feMerge>
                                    <feMergeNode/>
                                    <feMergeNode in="SourceGraphic"/>
                                  </feMerge>
                                </filter>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} strokeOpacity={0.3} />
                              <XAxis
                                dataKey="month"
                                stroke="#6B7280"
                                fontSize={10}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => {
                                  const d = new Date(val + "-01");
                                  return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
                                }}
                              />
                              <YAxis stroke="#6B7280" fontSize={10} tickFormatter={fmtTick} />
                              <Tooltip
                                formatter={(value, name) => {
                                  const labels = {
                                    income: "Pemasukan",
                                    expense: "Pengeluaran",
                                    forecast_income: "Forecast Pemasukan",
                                    forecast_expense: "Forecast Pengeluaran",
                                  };
                                  return value != null ? [`Rp${Number(value).toLocaleString("id-ID")}`, labels[name] || name] : ["-", labels[name] || name];
                                }}
                                contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "12px" }}
                                itemStyle={{ fontSize: "12px" }}
                              />
                              <Bar type="natural" dataKey="expense" fill="#EF4444" fillOpacity={0.15} barSize={4} stroke="#EF4444" strokeWidth={1} radius={[4, 4, 0, 0]} name="expense" />
                              <Line type="natural" dataKey="income" stroke="#22C55E" strokeWidth={3} dot={false} activeDot={{ r: 4, fill: '#fff', stroke: '#22C55E', strokeWidth: 2 }} connectNulls={false} name="income" filter="url(#line-glow)" />
                              <Line type="natural" dataKey="forecast_income" stroke="#3B82F6" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} name="forecast_income" />
                              <Line type="natural" dataKey="forecast_expense" stroke="#EF4444" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} name="forecast_expense" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[250px] text-[#94A3B8] text-sm">Belum ada data</div>
                      )}
                    </section>

                    {/* 6. Business Health Score */}
                    <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                      <h2 className="text-lg font-bold text-[#F9FAFB] mb-2">
                        Health Score
                      </h2>
                      <p className="text-xs text-[#94A3B8] mb-4">Skor kesehatan bisnis</p>
                      {healthScore ? (
                        <div className="flex flex-col items-center">
                          <div className="relative w-36 h-36">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#1F2937" strokeWidth="10" />
                              <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke={healthScore.score > 70 ? "#22C55E" : healthScore.score > 40 ? "#F59E0B" : "#EF4444"}
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={`${(healthScore.score / 100) * 251.2} 251.2`}
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold text-[#F9FAFB]">{healthScore.score}</span>
                              <span className="text-[10px] text-[#94A3B8]">/ 100</span>
                            </div>
                          </div>
                          <div className="mt-5 w-full space-y-3">
                            {[
                              { label: "Margin", value: healthScore.factors.margin, weight: "40%" },
                              { label: "Growth", value: healthScore.factors.growth, weight: "30%" },
                              { label: "Stability", value: healthScore.factors.stability, weight: "30%" },
                            ].map((f, i) => (
                              <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-[#94A3B8]">{f.label} ({f.weight})</span>
                                  <span className="text-[#F9FAFB] font-bold">{f.value}</span>
                                </div>
                                <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${f.value}%`,
                                      backgroundColor: f.value > 70 ? "#22C55E" : f.value > 40 ? "#F59E0B" : "#EF4444",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-40"><SkeletonBox className="h-32 w-32 rounded-full" /></div>
                      )}
                    </section>
                  </div>

                  {/* Row 3: Cash Runway + Category Performance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 5. Cash Runway */}
                    <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                      <h2 className="text-lg font-bold text-[#F9FAFB] mb-2">
                        Cash Runway
                      </h2>
                      <p className="text-xs text-[#94A3B8] mb-4">Berapa lama saldo bertahan</p>
                      {cashRunway ? (
                        cashRunway.daily_spend > 0 ? (
                          <div className="space-y-5">
                            <div className="text-center">
                              <span className={`text-5xl font-bold ${
                                cashRunway.days_remaining < 30 ? "text-[#EF4444]" :
                                cashRunway.days_remaining < 90 ? "text-[#F59E0B]" :
                                "text-[#22C55E]"
                              }`}>
                                {cashRunway.days_remaining > 999 ? "∞" : cashRunway.days_remaining}
                              </span>
                              <p className="text-sm text-[#94A3B8] mt-1">
                                {cashRunway.days_remaining > 999 ? "hari (sangat aman)" : "hari tersisa"}
                              </p>
                            </div>
                            <div className="h-3 bg-[#1F2937] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  cashRunway.days_remaining < 30 ? "bg-[#EF4444]" :
                                  cashRunway.days_remaining < 90 ? "bg-[#F59E0B]" :
                                  "bg-[#22C55E]"
                                }`}
                                style={{ width: `${Math.min(100, (cashRunway.days_remaining / 365) * 100)}%` }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[#06080F]/50 rounded-xl p-3">
                                <p className="text-[10px] text-[#94A3B8] mb-1">Saldo Saat Ini</p>
                                <p className="text-sm font-bold text-[#F9FAFB] tabular-nums">Rp{Number(cashRunway.balance).toLocaleString("id-ID")}</p>
                              </div>
                              <div className="bg-[#06080F]/50 rounded-xl p-3">
                                <p className="text-[10px] text-[#94A3B8] mb-1">Pengeluaran Harian</p>
                                <p className="text-sm font-bold text-[#F9FAFB] tabular-nums">Rp{Number(cashRunway.daily_spend).toLocaleString("id-ID")}</p>
                              </div>
                            </div>
                          </div>
                        ) : cashRunway.balance > 0 ? (
                          <div className="flex flex-col items-center justify-center h-32">
                            <span className="text-4xl font-bold text-[#22C55E]">∞</span>
                            <p className="text-sm text-[#94A3B8] mt-2">Tidak ada pengeluaran</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-32 text-[#94A3B8] text-sm">Belum ada data</div>
                        )
                      ) : (
                        <div className="flex items-center justify-center h-40"><SkeletonBox className="h-20 w-full" /></div>
                      )}
                    </section>

                    {/* 4. Category Performance (Horizontal BarChart) */}
                    <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                      <h2 className="text-lg font-bold text-[#F9FAFB] mb-2">
                        Kategori Terbesar
                      </h2>
                      <p className="text-xs text-[#94A3B8] mb-4">Kontribusi per kategori</p>
                      {categories && categories.length > 0 ? (() => {
                        const totalAll = categories.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
                        const sorted = [...categories].sort((a, b) => Number(b.total) - Number(a.total)).slice(0, 6);
                        return (
                          <div className="space-y-3">
                            {sorted.map((cat, idx) => {
                              const pct = totalAll > 0 ? ((Number(cat.total) / totalAll) * 100) : 0;
                              return (
                                <div key={idx}>
                                  <div className="flex justify-between text-xs mb-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                      <span className="text-[#94A3B8]">{cat.category || "Tanpa Kategori"}</span>
                                    </div>
                                    <span className="text-[#F9FAFB] font-bold">{pct.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-2.5 bg-[#1F2937] rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-[#6B7280] mt-0.5 text-right">
                                    Rp{Number(cat.total).toLocaleString("id-ID")}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })() : (
                        <div className="flex items-center justify-center h-40 text-[#94A3B8] text-sm">Belum ada data</div>
                      )}
                    </section>
                  </div>
                  {/* ========== END BUSINESS PERFORMANCE CHARTS ========== */}

                  {/* AI Assistant Chat */}
                  <section className="bg-gradient-to-br from-[#0D1220] to-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Bot size={120} />
                    </div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <div className="w-10 h-10 bg-[#6366F1]/10 rounded-xl flex items-center justify-center text-[#6366F1]">
                          <Bot size={22} />
                        </div>
                        <div>
                          <h2 className="text-lg md:text-xl font-bold text-[#F9FAFB]">
                            AI Finance Assistant
                          </h2>
                          <p className="text-sm text-[#94A3B8]">
                            Tanyakan apapun tentang bisnis Anda
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#06080F]/50 rounded-2xl p-4 md:p-6 mb-4 md:mb-6 min-h-[100px] md:min-h-[120px] max-h-[400px] md:max-h-[500px] overflow-y-auto border border-white/5">
                        {chatMutation.isIdle && (
                          <p className="text-[#94A3B8] italic flex items-center gap-2 text-sm">
                            <Zap size={14} />
                            Coba: &quot;Berapa total keuntungan bulan ini?&quot;
                            atau &quot;Jual 50 pcs kaos&quot;
                          </p>
                        )}
                        {chatMutation.isPending && (
                          <div className="flex items-center gap-2 text-[#6366F1]">
                            <Loader2 className="animate-spin" size={16} />
                            <span>Menganalisis data...</span>
                          </div>
                        )}
                        {chatMutation.isSuccess && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[#F9FAFB] leading-relaxed text-sm whitespace-pre-wrap break-words"
                          >
                            {chatMutation.data.response}
                          </motion.div>
                        )}
                        {chatMutation.isError && (
                          <div className="text-red-400 text-sm">
                            ❌ Gagal memproses. Coba lagi.
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleChat} className="flex gap-2 md:gap-3">
                        <input
                          type="text"
                          value={chatText}
                          onChange={(e) => setChatText(e.target.value)}
                          placeholder="Ketik pesan..."
                          className="flex-1 min-w-0 bg-[#111827] border border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all text-sm md:text-base"
                        />
                        <button
                          type="submit"
                          disabled={chatMutation.isPending || !chatText.trim()}
                          className="bg-[#6366F1] hover:bg-[#4F46E5] text-white w-12 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
                        >
                          <Send size={20} />
                        </button>
                      </form>
                    </div>
                  </section>
                </div>

                <div className="space-y-6 md:space-y-8">
                  {/* Category Breakdown */}
                  <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                    <h2 className="text-lg font-bold text-[#F9FAFB] mb-4 md:mb-6">
                      Categories
                    </h2>
                    {(() => {
                      const sortedCats = [...(categories || [])].sort((a, b) => Number(b.total) - Number(a.total));
                      const totalAll = sortedCats.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
                      // Limit to top 6 + merge rest into "Lainnya" for clean donut
                      const topN = 5;
                      let donutData = sortedCats.slice(0, topN).map((c, i) => ({
                        name: c.category || "Tanpa Kategori",
                        value: Number(c.total) || 0,
                        color: COLORS[i % COLORS.length],
                      }));
                      if (sortedCats.length > topN) {
                        const restTotal = sortedCats.slice(topN).reduce((s, c) => s + (Number(c.total) || 0), 0);
                        donutData.push({ name: "Lainnya", value: restTotal, color: "#6B7280" });
                      }
                      return (
                        <>
                          <div className="h-[200px] md:h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={donutData}
                                  innerRadius={55}
                                  outerRadius={80}
                                  paddingAngle={3}
                                  dataKey="value"
                                  nameKey="name"
                                  cornerRadius={3}
                                  strokeWidth={2}
                                  stroke="#111827"
                                >
                                  {donutData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                  <Label content={({ viewBox }) => {
                                    if (!(viewBox && 'cx' in viewBox && 'cy' in viewBox)) return null;
                                    return (
                                      <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                                        <tspan className="fill-gray-400 text-xs" x={viewBox.cx} y={(viewBox.cy || 0) - 10}>Total</tspan>
                                        <tspan className="fill-white font-semibold text-base tabular-nums" x={viewBox.cx} y={(viewBox.cy || 0) + 12}>
                                          Rp{Number(totalAll).toLocaleString("id-ID")}
                                        </tspan>
                                      </text>
                                    );
                                  }} />
                                </Pie>
                                <Tooltip
                                  formatter={(value, name) => [`Rp${Number(value).toLocaleString("id-ID")}`, name]}
                                  contentStyle={{
                                    backgroundColor: "#111827",
                                    borderColor: "#374151",
                                    borderRadius: "12px",
                                    color: "#F9FAFB",
                                    fontSize: "12px",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-4 space-y-2.5">
                            {donutData.map((item, idx) => {
                              const pct = totalAll > 0 ? ((item.value / totalAll) * 100) : 0;
                              return (
                                <div key={idx} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm text-[#94A3B8] truncate max-w-[120px]">{item.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#6B7280]">{pct.toFixed(1)}%</span>
                                    <span className="text-sm font-bold text-[#F9FAFB] tabular-nums">
                                      Rp{Number(item.value).toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </section>

                  {/* AI Insight Card */}
                  <motion.section
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-[#6366F1] to-[#3B82F6] rounded-2xl md:rounded-[32px] p-5 md:p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30"
                  >
                    <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative flex flex-col gap-3 md:gap-4">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Zap size={20} />
                      </div>
                      <h3 className="font-bold text-lg md:text-xl">
                        Monthly Insight
                      </h3>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {insight?.insight ||
                          "Menganalisis performa bisnis Anda..."}
                      </p>
                      <button className="mt-2 w-full bg-white text-[#6366F1] font-bold py-3 rounded-xl hover:bg-white/90 transition-all active:scale-95">
                        {insight?.action || "Terapkan Sekarang"}
                      </button>
                    </div>
                  </motion.section>
                </div>
              </div>

              {/* Recent Transactions Table - Premium */}
              <section className="bg-[#111827] rounded-2xl md:rounded-[32px] border border-white/5 overflow-hidden">
                <div className="p-5 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 gap-3">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-[#F9FAFB]">
                      Recent Transactions
                    </h2>
                    <p className="text-sm text-[#94A3B8]">
                      Daftar transaksi terbaru bisnis Anda
                    </p>
                  </div>
                  <div className="flex gap-2 md:gap-3 flex-wrap">
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all"
                    >
                      <Download size={16} />
                      CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all"
                    >
                      <FileSpreadsheet size={16} />
                      Excel
                    </button>
                    <button
                      onClick={() => setActiveTab("input")}
                      className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                      <PlusCircle size={16} />
                      New
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 md:px-8 py-4 md:py-5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider w-12">
                          #
                        </th>
                        <th className="text-left px-5 md:px-8 py-4 md:py-5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Transaksi
                        </th>
                        <th className="text-left px-5 md:px-8 py-4 md:py-5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="text-left px-5 md:px-8 py-4 md:py-5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="text-right px-5 md:px-8 py-4 md:py-5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="text-center px-5 md:px-8 py-4 md:py-5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentTransactions?.map((tx, idx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-5 md:px-8 py-4 md:py-5 text-[10px] font-bold text-[#94A3B8]">
                            {idx + 1}
                          </td>
                          <td className="px-5 md:px-8 py-4 md:py-5">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div
                                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "pemasukan" ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#EF4444]/10 text-[#EF4444]"}`}
                              >
                                {tx.type === "pemasukan" ? (
                                  <TrendingUp size={16} />
                                ) : (
                                  <TrendingDown size={16} />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#F9FAFB] group-hover:text-[#6366F1] transition-colors">
                                  {tx.note || tx.category}
                                </p>
                                <p className="text-xs text-[#94A3B8]">
                                  TXID-{tx.id.toString().padStart(6, "0")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 md:px-8 py-4 md:py-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase ${
                              tx.type === "pemasukan"
                                ? "text-[#22C55E] bg-[#22C55E]/5 border-[#22C55E]/20"
                                : "text-[#EF4444] bg-[#EF4444]/5 border-[#EF4444]/20"
                            }`}>
                              {tx.category}
                            </span>
                          </td>
                          <td className="px-5 md:px-8 py-4 md:py-5 text-sm text-[#94A3B8]">
                            {new Date(tx.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </td>
                          <td
                            className={`px-5 md:px-8 py-4 md:py-5 text-right font-bold tabular-nums tracking-tight ${tx.type === "pemasukan" ? "text-[#22C55E]" : "text-[#F9FAFB]"}`}
                          >
                            {tx.type === "pemasukan" ? "+" : "-"}
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              maximumFractionDigits: 0,
                            }).format(tx.amount)}
                          </td>
                          <td className="px-5 md:px-8 py-4 md:py-5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-[#22C55E] bg-[#22C55E]/10">
                              <CheckCircle2 size={12} />
                              OK
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!recentTransactions || recentTransactions.length === 0) && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-[#94A3B8]"
                          >
                            Belum ada transaksi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          )}

          {/* ========== INPUT TRANSAKSI TAB ========== */}
          {activeTab === "input" && (
            <motion.div key="input" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}>
            <div className="max-w-2xl space-y-6 md:space-y-8">
              <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <div className="w-10 h-10 bg-[#6366F1]/10 rounded-xl flex items-center justify-center">
                    <PlusCircle size={22} className="text-[#6366F1]" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#F9FAFB]">
                      Input Transaksi
                    </h2>
                    <p className="text-sm text-[#94A3B8]">
                      Catat pemasukan atau pengeluaran baru
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target;
                    const type = txType;
                    const amount = parseInt(form.amount.value);
                    const note = form.note.value;
                    const category = form.category.value;

                    try {
                      const res = await fetch("/api/transactions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          user_id: userId,
                          type,
                          amount,
                          note,
                          category,
                        }),
                        credentials: "same-origin",
                      });
                      if (res.ok) {
                        queryClient.invalidateQueries();
                        form.reset();
                        setTxType("pemasukan");
                        showToast("Transaksi berhasil ditambahkan!");
                      } else {
                        const err = await res.json();
                        showToast(
                          err.error || "Gagal menambah transaksi",
                          "error"
                        );
                      }
                    } catch (err) {
                      showToast("Error: " + err.message, "error");
                    }
                  }}
                  className="space-y-5 md:space-y-6"
                >
                  <div>
                    <label className="text-sm font-semibold text-[#F9FAFB] mb-2 block">
                      Tipe Transaksi
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${txType === "pemasukan" ? "border-[#22C55E] bg-[#22C55E]/5" : "border-white/5 bg-white/5 hover:border-[#22C55E]/30"}`}>
                        <input
                          type="radio"
                          name="type"
                          value="pemasukan"
                          checked={txType === "pemasukan"}
                          onChange={(e) => setTxType(e.target.value)}
                          className="accent-[#22C55E]"
                        />
                        <div>
                          <p className="font-bold text-[#22C55E]">Pemasukan</p>
                          <p className="text-xs text-[#94A3B8]">Uang masuk</p>
                        </div>
                      </label>
                      <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${txType === "pengeluaran" ? "border-[#EF4444] bg-[#EF4444]/5" : "border-white/5 bg-white/5 hover:border-[#EF4444]/30"}`}>
                        <input
                          type="radio"
                          name="type"
                          value="pengeluaran"
                          checked={txType === "pengeluaran"}
                          onChange={(e) => setTxType(e.target.value)}
                          className="accent-[#EF4444]"
                        />
                        <div>
                          <p className="font-bold text-[#EF4444]">Pengeluaran</p>
                          <p className="text-xs text-[#94A3B8]">Uang keluar</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#F9FAFB] mb-2 block">
                      Jumlah (Rp)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      required
                      min="1"
                      placeholder="150000"
                      className="w-full bg-[#06080F] border border-white/10 rounded-xl px-4 py-3.5 text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#F9FAFB] mb-2 block">
                      Kategori
                    </label>
                    <select
                      name="category"
                      className="w-full bg-[#06080F] border border-white/10 rounded-xl px-4 py-3.5 text-[#F9FAFB] focus:outline-none focus:border-[#6366F1] transition-all"
                    >
                      <optgroup label="💰 Pemasukan">
                        {allCategories?.filter(c => c.type === 'pemasukan').map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="💸 Pengeluaran">
                        {allCategories?.filter(c => c.type === 'pengeluaran').map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#F9FAFB] mb-2 block">
                      Catatan
                    </label>
                    <input
                      type="text"
                      name="note"
                      required
                      placeholder="Jual kaos polo 3 pcs 150 ribu"
                      className="w-full bg-[#06080F] border border-white/10 rounded-xl px-4 py-3.5 text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:from-[#4F46E5] hover:to-[#2563EB] text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
                  >
                    Simpan Transaksi
                  </button>
                </form>
              </section>
            </div>
            </motion.div>
          )}

          {/* ========== RIWAYAT TAB ========== */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}>
            <div className="space-y-6 md:space-y-8">
              <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#F9FAFB]">
                      Riwayat Transaksi
                    </h2>
                    <p className="text-sm text-[#94A3B8]">
                      Semua transaksi bisnis Anda
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    {/* Mobile search toggle */}
                    <button
                      onClick={() => setShowMobileSearch(!showMobileSearch)}
                      className="flex items-center gap-2 px-3 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs md:text-sm font-bold transition-all md:hidden"
                    >
                      <Search size={16} />
                      {searchQuery && (
                        <span className="w-5 h-5 bg-[#6366F1] rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                          {filteredTransactions?.length || 0}
                        </span>
                      )}
                    </button>
                    {/* Mobile search input */}
                    {showMobileSearch && (
                      <div className="w-full sm:hidden">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                          <input
                            type="text"
                            placeholder="Cari catatan, kategori, jumlah..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#06080F] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:border-[#6366F1] transition-all"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F9FAFB]"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {searchQuery && (
                          <p className="text-xs text-[#94A3B8] mt-2">
                            Ditemukan {filteredTransactions?.length || 0} transaksi
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs md:text-sm font-bold transition-all"
                    >
                      <Download size={16} />
                      CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs md:text-sm font-bold transition-all"
                    >
                      <FileSpreadsheet size={16} />
                      Excel
                    </button>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 flex-1">
                    <CalendarDays size={16} className="text-[#94A3B8] flex-shrink-0" />
                    <label className="text-xs text-[#94A3B8] flex-shrink-0">
                      Dari:
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="flex-1 min-w-0 bg-[#06080F] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <CalendarDays size={16} className="text-[#94A3B8] flex-shrink-0" />
                    <label className="text-xs text-[#94A3B8] flex-shrink-0">
                      Sampai:
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="flex-1 min-w-0 bg-[#06080F] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:border-[#6366F1] transition-all"
                    />
                  </div>
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-[#EF4444]/10 text-[#EF4444] rounded-lg text-xs font-bold hover:bg-[#EF4444]/20 transition-all"
                    >
                      <X size={14} />
                      Reset
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto -mx-5 md:-mx-8 px-5 md:px-8 hidden sm:block">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Transaksi
                        </th>
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="text-left py-3 md:py-4 px-3 md:px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="text-right py-3 md:py-4 px-3 md:px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="text-center py-3 md:py-4 px-3 md:px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions?.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 md:py-4 px-3 md:px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === "pemasukan" ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#EF4444]/10 text-[#EF4444]"}`}
                              >
                                {tx.type === "pemasukan" ? (
                                  <TrendingUp size={14} />
                                ) : (
                                  <TrendingDown size={14} />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#F9FAFB]">
                                  {tx.note}
                                </p>
                                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                                  TXID-{tx.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4">
                            <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-[#94A3B8] uppercase">
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4 text-sm text-[#94A3B8]">
                            {new Date(tx.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td
                            className={`py-3 md:py-4 px-3 md:px-4 text-right font-bold text-sm ${tx.type === "pemasukan" ? "text-[#22C55E]" : "text-[#EF4444]"}`}
                          >
                            {tx.type === "pemasukan" ? "+" : "-"}Rp
                            {Number(tx.amount).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditTx(tx)}
                                className="p-2 rounded-lg bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteTx(tx.id)}
                                className="p-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!filteredTransactions ||
                        filteredTransactions.length === 0) && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-12 text-center text-[#94A3B8]"
                          >
                            {dateFrom || dateTo
                              ? "Tidak ada transaksi pada rentang tanggal ini"
                              : "Belum ada transaksi"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout for Transactions (2b) */}
                <div className="block sm:hidden space-y-3">
                  {filteredTransactions?.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === "pemasukan" ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#EF4444]/10 text-[#EF4444]"}`}
                      >
                        {tx.type === "pemasukan" ? (
                          <TrendingUp size={18} />
                        ) : (
                          <TrendingDown size={18} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F9FAFB] truncate">
                          {tx.note || tx.category}
                        </p>
                        <p className="text-[10px] text-[#94A3B8]">
                          {tx.category} &bull; {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${tx.type === "pemasukan" ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                          {tx.type === "pemasukan" ? "+" : "-"}Rp{Number(tx.amount).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditTx(tx)}
                          className="p-2 rounded-lg bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="p-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!filteredTransactions || filteredTransactions.length === 0) && (
                    <div className="py-8 text-center text-[#94A3B8] text-sm">
                      {dateFrom || dateTo || searchQuery
                        ? "Tidak ada transaksi yang cocok"
                        : "Belum ada transaksi"}
                    </div>
                  )}
                </div>
              </section>
            </div>
            </motion.div>
          )}

          {/* ========== LAPORAN TAB ========== */}
          {activeTab === "reports" && (
            <motion.div key="reports" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}>
            <div className="space-y-6 md:space-y-8">
              {/* Summary Cards */}
              <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                <h2 className="text-xl md:text-2xl font-bold text-[#F9FAFB] mb-2">
                  Laporan Keuangan
                </h2>
                <p className="text-sm text-[#94A3B8] mb-6 md:mb-8">
                  Ringkasan performa bisnis Anda
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 rounded-xl ring-1 ring-gray-200/10 divide-x divide-y divide-gray-200/10 overflow-hidden mb-6 md:mb-8">
                  <div className="p-5 md:p-6 bg-gradient-to-t from-green-50 to-white dark:from-green-950/20 dark:to-gray-900">
                    <p className="text-sm text-[#94A3B8] mb-1">
                      Total Pemasukan
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold text-[#22C55E]">
                      Rp
                      {Number(summary?.total_income || 0).toLocaleString(
                        "id-ID",
                      )}
                    </h3>
                  </div>
                  <div className="p-5 md:p-6 bg-gradient-to-t from-red-50 to-white dark:from-red-950/20 dark:to-gray-900">
                    <p className="text-sm text-[#94A3B8] mb-1">
                      Total Pengeluaran
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold text-[#EF4444]">
                      Rp
                      {Number(summary?.total_expense || 0).toLocaleString(
                        "id-ID",
                      )}
                    </h3>
                  </div>
                  <div className="p-5 md:p-6 bg-gradient-to-t from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
                    <p className="text-sm text-[#94A3B8] mb-1">Saldo Akhir</p>
                    <h3 className="text-xl md:text-2xl font-bold text-[#6366F1]">
                      Rp
                      {Number(summary?.balance || 0).toLocaleString("id-ID")}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[#F9FAFB] mb-4">
                      Cash Flow
                    </h3>
                    <div className="h-[220px] md:h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredCashFlow}>
                          <defs>
                            <linearGradient
                              id="rptIncome"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#22C55E"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#22C55E"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="rptExpense"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#EF4444"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#EF4444"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1F2937"
                            vertical={false}
                            strokeOpacity={0.3}
                          />
                          <XAxis
                            dataKey="day"
                            stroke="#6B7280"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) =>
                              new Date(val).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })
                            }
                          />
                          <YAxis
                            stroke="#6B7280"
                            fontSize={10}
                            tickFormatter={fmtTick}
                          />
                          <Tooltip
                            formatter={(value, name) => [`Rp${Number(value).toLocaleString("id-ID")}`, name === "income" ? "Pemasukan" : "Pengeluaran"]}
                            contentStyle={{
                              backgroundColor: "#111827",
                              borderColor: "#374151",
                              borderRadius: "12px",
                            }}
                          />
                          <Area
                            type="natural"
                            dataKey="income"
                            stroke="#22C55E"
                            fillOpacity={1}
                            fill="url(#fillGreen)"
                            strokeWidth={2}
                            filter="url(#line-glow)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#fff', stroke: '#22C55E', strokeWidth: 2 }}
                          />
                          <Area
                            type="natural"
                            dataKey="expense"
                            stroke="#EF4444"
                            fillOpacity={1}
                            fill="url(#fillRed)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: '#fff', stroke: '#EF4444', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[#F9FAFB] mb-4">
                      Kategori
                    </h3>
                    {(() => {
                      const sortedCats = [...(categories || [])].sort((a, b) => Number(b.total) - Number(a.total));
                      const totalAll = sortedCats.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
                      const topN = 5;
                      let donutData = sortedCats.slice(0, topN).map((c, i) => ({
                        name: c.category || "Tanpa Kategori",
                        value: Number(c.total) || 0,
                        color: COLORS[i % COLORS.length],
                      }));
                      if (sortedCats.length > topN) {
                        const restTotal = sortedCats.slice(topN).reduce((s, c) => s + (Number(c.total) || 0), 0);
                        donutData.push({ name: "Lainnya", value: restTotal, color: "#6B7280" });
                      }
                      return (
                        <div className="flex flex-col items-center">
                          <div className="h-[200px] w-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={donutData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={75}
                                  paddingAngle={3}
                                  cornerRadius={3}
                                  strokeWidth={2}
                                  stroke="#111827"
                                >
                                  {donutData.map((entry, idx) => (
                                    <Cell key={idx} fill={entry.color} />
                                  ))}
                                  <Label content={({ viewBox }) => {
                                    if (!(viewBox && 'cx' in viewBox && 'cy' in viewBox)) return null;
                                    return (
                                      <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                                        <tspan className="fill-gray-400 text-[10px]" x={viewBox.cx} y={(viewBox.cy || 0) - 8}>Total</tspan>
                                        <tspan className="fill-white font-semibold text-sm tabular-nums" x={viewBox.cx} y={(viewBox.cy || 0) + 10}>
                                          {totalAll >= 1000000 ? `${(totalAll / 1000000).toFixed(1)}jt` : `${(totalAll / 1000).toFixed(0)}rb`}
                                        </tspan>
                                      </text>
                                    );
                                  }} />
                                </Pie>
                                <Tooltip
                                  formatter={(value, name) => [`Rp${Number(value).toLocaleString("id-ID")}`, name]}
                                  contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "12px", color: "#F9FAFB", fontSize: "12px" }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-3 w-full space-y-1.5">
                            {donutData.map((item, idx) => {
                              const pct = totalAll > 0 ? (item.value / totalAll * 100) : 0;
                              return (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-[#94A3B8] truncate max-w-[80px]">{item.name}</span>
                                  </div>
                                  <span className="text-[#6B7280]">{pct.toFixed(1)}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </section>

              {/* Monthly Revenue & Profit Trend */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Monthly Revenue Bar Chart */}
                <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                  <h3 className="text-base md:text-lg font-bold text-[#F9FAFB] mb-4">
                    Pendapatan Bulanan
                  </h3>
                  <p className="text-xs text-[#94A3B8] mb-4">
                    Revenue per bulan
                  </p>
                  <div className="h-[220px] md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData || []}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1F2937"
                          vertical={false}
                          strokeOpacity={0.3}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="#6B7280"
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => {
                            const d = new Date(val);
                            return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
                          }}
                        />
                        <YAxis
                          stroke="#6B7280"
                          fontSize={10}
                          tickFormatter={fmtTick}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            borderColor: "#374151",
                            borderRadius: "12px",
                          }}
                          formatter={(value) => [
                            `Rp${Number(value).toLocaleString("id-ID")}`,
                            "Revenue",
                          ]}
                          labelFormatter={(val) => {
                            const d = new Date(val);
                            return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
                          }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#6366F1"
                          radius={[6, 6, 0, 0]}
                          fillOpacity={0.7}
                          background={{ fill: "url(#stripe-pattern)", radius: 6 }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Profit Trend Line Chart */}
                <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                  <h3 className="text-base md:text-lg font-bold text-[#F9FAFB] mb-4">
                    Tren Keuntungan
                  </h3>
                  <p className="text-xs text-[#94A3B8] mb-4">
                    Profit trend dari waktu ke waktu
                  </p>
                  <div className="h-[220px] md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profitData || []}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1F2937"
                          vertical={false}
                          strokeOpacity={0.3}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="#6B7280"
                          fontSize={10}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => {
                            const d = new Date(val);
                            return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
                          }}
                        />
                        <YAxis
                          stroke="#6B7280"
                          fontSize={10}
                          tickFormatter={fmtTick}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            borderColor: "#374151",
                            borderRadius: "12px",
                          }}
                          formatter={(value) => [
                            `Rp${Number(value).toLocaleString("id-ID")}`,
                            "Profit",
                          ]}
                          labelFormatter={(val) => {
                            const d = new Date(val);
                            return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
                          }}
                        />
                        <Line
                          type="natural"
                          dataKey="profit"
                          stroke="#22C55E"
                          strokeWidth={3}
                          filter="url(#line-glow)"
                          dot={false}
                          activeDot={{ r: 4, fill: '#fff', stroke: '#22C55e', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              {/* Income Source Breakdown Chart */}
              <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                <h3 className="text-base md:text-lg font-bold text-[#F9FAFB] mb-2">
                  Breakdown per Kategori
                </h3>
                <p className="text-xs text-[#94A3B8] mb-6">Kontribusi pemasukan dan pengeluaran per kategori</p>
                {categories && categories.length > 0 ? (() => {
                  // Group by category name to avoid duplicates
                  const grouped = {};
                  categories.forEach(c => {
                    const name = (c.category || "Tanpa Kategori").toLowerCase();
                    if (!grouped[name]) grouped[name] = { name: c.category || "Tanpa Kategori", pemasukan: 0, pengeluaran: 0 };
                    if (c.type === "pemasukan") grouped[name].pemasukan += Number(c.total) || 0;
                    else grouped[name].pengeluaran += Number(c.total) || 0;
                  });
                  const groupArr = Object.values(grouped);
                  const incomeList = groupArr.filter(g => g.pemasukan > 0).sort((a, b) => b.pemasukan - a.pemasukan);
                  const expenseList = groupArr.filter(g => g.pengeluaran > 0).sort((a, b) => b.pengeluaran - a.pengeluaran);
                  const maxIncome = Math.max(...incomeList.map(g => g.pemasukan), 1);
                  const maxExpense = Math.max(...expenseList.map(g => g.pengeluaran), 1);
                  const totalIncome = incomeList.reduce((s, g) => s + g.pemasukan, 0);
                  const totalExpense = expenseList.reduce((s, g) => s + g.pengeluaran, 0);
                  const fmtRupiah = (v) => v >= 1000000 ? `Rp${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `Rp${(v / 1000).toFixed(0)}rb` : `Rp${v}`;
                  return (
                    <div className="space-y-6">
                      {/* Pemasukan Section */}
                      {incomeList.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                            <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">Pemasukan</span>
                            <span className="text-xs text-[#6B7280] ml-auto">{fmtRupiah(totalIncome)}</span>
                          </div>
                          <div className="space-y-2">
                            {incomeList.map((item, idx) => {
                              const pct = totalIncome > 0 ? (item.pemasukan / totalIncome * 100) : 0;
                              const barWidth = maxIncome > 0 ? (item.pemasukan / maxIncome * 100) : 0;
                              const colors = ["#22C55E", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"];
                              const color = colors[idx % colors.length];
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  <span className="text-xs text-[#94A3B8] w-20 truncate text-right flex-shrink-0">{item.name}</span>
                                  <div className="flex-1 h-7 bg-[#1F2937] rounded-lg overflow-hidden relative">
                                    <div
                                      className="h-full rounded-lg transition-all duration-700 ease-out"
                                      style={{ width: `${Math.max(barWidth, 3)}%`, backgroundColor: color, opacity: 0.85 }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0 w-28 justify-end">
                                    <span className="text-[10px] text-[#6B7280] w-10 text-right">{pct.toFixed(1)}%</span>
                                    <span className="text-xs font-bold text-[#F9FAFB] tabular-nums w-16 text-right">{fmtRupiah(item.pemasukan)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Pengeluaran Section */}
                      {expenseList.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                            <span className="text-xs font-semibold text-[#EF4444] uppercase tracking-wider">Pengeluaran</span>
                            <span className="text-xs text-[#6B7280] ml-auto">{fmtRupiah(totalExpense)}</span>
                          </div>
                          <div className="space-y-2">
                            {expenseList.map((item, idx) => {
                              const pct = totalExpense > 0 ? (item.pengeluaran / totalExpense * 100) : 0;
                              const barWidth = maxExpense > 0 ? (item.pengeluaran / maxExpense * 100) : 0;
                              const colors = ["#EF4444", "#F87171", "#FCA5A5", "#FECACA", "#FEE2E2"];
                              const color = colors[idx % colors.length];
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  <span className="text-xs text-[#94A3B8] w-20 truncate text-right flex-shrink-0">{item.name}</span>
                                  <div className="flex-1 h-7 bg-[#1F2937] rounded-lg overflow-hidden relative">
                                    <div
                                      className="h-full rounded-lg transition-all duration-700 ease-out"
                                      style={{ width: `${Math.max(barWidth, 3)}%`, backgroundColor: color, opacity: 0.85 }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0 w-28 justify-end">
                                    <span className="text-[10px] text-[#6B7280] w-10 text-right">{pct.toFixed(1)}%</span>
                                    <span className="text-xs font-bold text-[#F9FAFB] tabular-nums w-16 text-right">{fmtRupiah(item.pengeluaran)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="flex items-center justify-center h-40 text-[#94A3B8] text-sm">Belum ada data kategori</div>
                )}
              </section>

              {/* Daily Report */}
              <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[#F9FAFB]">
                      Laporan Harian
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Transaksi dikelompokkan per hari
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <CalendarDays size={16} className="text-[#94A3B8]" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="bg-[#06080F] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#6366F1]"
                    />
                    <span className="text-[#94A3B8] text-xs">-</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="bg-[#06080F] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#F9FAFB] focus:outline-none focus:border-[#6366F1]"
                    />
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => {
                          setDateFrom("");
                          setDateTo("");
                        }}
                        className="p-1.5 bg-[#EF4444]/10 text-[#EF4444] rounded-lg hover:bg-[#EF4444]/20 transition-all"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto -mx-5 md:-mx-8 px-5 md:px-8 hidden sm:block">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-3 px-3 md:px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="text-right py-3 px-3 md:px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Pemasukan
                        </th>
                        <th className="text-right py-3 px-3 md:px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Pengeluaran
                        </th>
                        <th className="text-right py-3 px-3 md:px-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          Net
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData?.map((day, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 px-3 md:px-4 text-sm text-[#F9FAFB] font-medium">
                            {new Date(day.date).toLocaleDateString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-right text-sm font-bold text-[#22C55E]">
                            +Rp
                            {Number(day.income || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-right text-sm font-bold text-[#EF4444]">
                            -Rp
                            {Number(day.expense || 0).toLocaleString("id-ID")}
                          </td>
                          <td
                            className={`py-3 px-3 md:px-4 text-right text-sm font-bold ${(day.income || 0) - (day.expense || 0) >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}
                          >
                            {(day.income || 0) - (day.expense || 0) >= 0
                              ? "+"
                              : ""}
                            Rp
                            {Number(
                              (day.income || 0) - (day.expense || 0),
                            ).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                      {(!dailyData || dailyData.length === 0) && (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-8 text-center text-[#94A3B8]"
                          >
                            Tidak ada data harian
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout for Daily Report (2b) */}
                <div className="block sm:hidden space-y-3">
                  {dailyData?.map((day, idx) => (
                    <div
                      key={idx}
                      className="bg-white/[0.02] border border-white/5 rounded-xl p-4"
                    >
                      <p className="text-sm font-medium text-[#F9FAFB] mb-2">
                        {new Date(day.date).toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#94A3B8]">Pemasukan</span>
                        <span className="text-sm font-bold text-[#22C55E]">
                          +Rp{Number(day.income || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-[#94A3B8]">Pengeluaran</span>
                        <span className="text-sm font-bold text-[#EF4444]">
                          -Rp{Number(day.expense || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5">
                        <span className="text-xs text-[#94A3B8]">Net</span>
                        <span className={`text-sm font-bold ${(day.income || 0) - (day.expense || 0) >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                          {(day.income || 0) - (day.expense || 0) >= 0 ? "+" : ""}Rp{Number((day.income || 0) - (day.expense || 0)).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!dailyData || dailyData.length === 0) && (
                    <div className="py-8 text-center text-[#94A3B8] text-sm">
                      Tidak ada data harian
                    </div>
                  )}
                </div>
              </section>

              {/* AI Insight */}
              <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                <h3 className="text-base md:text-lg font-bold text-[#F9FAFB] mb-4">
                  AI Insight
                </h3>
                <div className="p-5 md:p-6 bg-[#6366F1]/5 rounded-xl md:rounded-2xl border border-[#6366F1]/10">
                  <p className="text-sm text-[#F9FAFB] leading-relaxed">
                    {insight?.insight || "Memuat insight..."}
                  </p>
                  {insight?.action && (
                    <button className="mt-4 px-4 py-2 bg-[#6366F1] text-white text-sm font-bold rounded-xl">
                      {insight.action}
                    </button>
                  )}
                </div>
              </section>
            </div>
            </motion.div>
          )}

          {/* ========== SETTINGS TAB ========== */}
          {activeTab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}>
            <div className="max-w-3xl space-y-6 md:space-y-8">
              {/* Account Info */}
              <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                <h2 className="text-xl md:text-2xl font-bold text-[#F9FAFB] mb-6 md:mb-8">
                  Account Settings
                </h2>
                <div className="space-y-5 md:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-5 md:p-6 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => profileInputRef.current?.click()}
                      className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 group/avatar cursor-pointer"
                    >
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <Camera size={18} className="text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
                      </div>
                    </button>
                    <input
                      ref={profileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhoto}
                      className="hidden"
                    />
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-[#F9FAFB]">
                        {auth.username}
                      </h3>
                      <p className="text-[#94A3B8] text-sm">
                        Garment Owner &bull; Production Level
                      </p>
                      <div className="mt-2 flex gap-2">
                        <span className="px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-bold rounded-full uppercase">
                          Verified
                        </span>
                        <span className="px-2 py-0.5 bg-[#6366F1]/10 text-[#6366F1] text-[10px] font-bold rounded-full uppercase">
                          Pro Admin
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                      <p className="text-xs text-[#94A3B8] mb-1">Platform</p>
                      <p className="text-sm font-bold text-[#F9FAFB]">
                        Telegram Integration
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                      <p className="text-xs text-[#94A3B8] mb-1">User ID</p>
                      <p className="text-sm font-bold text-[#F9FAFB]">
                        #{userId}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Categories Management */}
              <section className="bg-[#111827] rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#6366F1]/10 rounded-xl flex items-center justify-center">
                    <Tag size={20} className="text-[#6366F1]" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-[#F9FAFB]">
                      Kelola Kategori
                    </h2>
                    <p className="text-sm text-[#94A3B8]">
                      Tambah atau hapus kategori transaksi
                    </p>
                  </div>
                </div>

                {/* Add Category Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCategoryName.trim()) return;
                    addCategoryMutation.mutate({
                      name: newCategoryName.trim(),
                      type: newCategoryType,
                    });
                  }}
                  className="flex flex-col sm:flex-row gap-3 mb-6"
                >
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nama kategori baru"
                    className="flex-1 min-w-0 bg-[#06080F] border border-white/10 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:border-[#6366F1] transition-all text-sm"
                  />
                  <select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value)}
                    className="bg-[#06080F] border border-white/10 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#6366F1] transition-all text-sm"
                  >
                    <option value="pemasukan">Pemasukan</option>
                    <option value="pengeluaran">Pengeluaran</option>
                  </select>
                  <button
                    type="submit"
                    disabled={
                      addCategoryMutation.isPending || !newCategoryName.trim()
                    }
                    className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    {addCategoryMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    Tambah
                  </button>
                </form>

                {/* Categories List */}
                <div className="space-y-2">
                  {allCategories?.map((cat, idx) => (
                    <div
                      key={cat.id || idx}
                      className="flex items-center justify-between p-3 md:p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-[#F9FAFB]">
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-[#94A3B8] uppercase">
                            {cat.type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          deleteCategoryMutation.mutate(cat.id)
                        }
                        className="p-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all"
                        title="Hapus kategori"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(!allCategories || allCategories.length === 0) && (
                    <p className="text-center text-[#94A3B8] py-8 text-sm">
                      Belum ada kategori
                    </p>
                  )}
                </div>
              </section>

              {/* Danger Zone */}
              <section className="bg-[#EF4444]/5 rounded-2xl md:rounded-[32px] p-5 md:p-8 border border-[#EF4444]/10">
                <h2 className="text-lg md:text-xl font-bold text-[#EF4444] mb-4">
                  Danger Zone
                </h2>
                <p className="text-sm text-[#94A3B8] mb-6">
                  Aksi di bawah ini bersifat permanen dan tidak dapat
                  dibatalkan.
                </p>
                <button
                  onClick={() => setIsAdminResetOpen(true)}
                  className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Reset Dashboard Data
                </button>
              </section>
            </div>
            </motion.div>
          )}
          {/* ========== KONVEKSI TAB ========== */}
          {activeTab === "konveksi" && (
            <motion.div key="konveksi" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}>
            <div className="space-y-6">
              {/* Sub-tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "products", label: "Produk" },
                  { id: "sales", label: "Penjualan" },
                  { id: "marketplace", label: "Marketplace" },
                  { id: "inventory", label: "Inventory" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setKonveksiTab(t.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      konveksiTab === t.id
                        ? "bg-[#6366F1] text-white"
                        : "bg-white/5 text-[#94A3B8] hover:bg-white/10"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* OVERVIEW TAB */}
              {konveksiTab === "overview" && (
                <div className="space-y-6">
                  {/* KPI Cards - Unified Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl ring-1 ring-gray-200/10 divide-x divide-y divide-gray-200/10 overflow-hidden">
                    {[
                      { label: "Revenue", value: konveksiReport.total_revenue || 0, color: "#10B981", icon: "💰", cardGradient: "bg-gradient-to-t from-green-50 to-white dark:from-green-950/20 dark:to-gray-900" },
                      { label: "HPP", value: konveksiReport.total_hpp || 0, color: "#EF4444", icon: "📉", cardGradient: "bg-gradient-to-t from-red-50 to-white dark:from-red-950/20 dark:to-gray-900" },
                      { label: "Fee Marketplace", value: konveksiReport.total_fee || 0, color: "#F59E0B", icon: "🏪", cardGradient: "bg-gradient-to-t from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900" },
                      { label: "Laba Bersih", value: konveksiReport.total_profit || 0, color: "#6366F1", icon: "📈", cardGradient: "bg-gradient-to-t from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900" },
                    ].map((kpi) => (
                      <div key={kpi.label} className={`${kpi.cardGradient} p-5`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[#94A3B8] text-sm">{kpi.label}</span>
                          <span className="text-2xl">{kpi.icon}</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: kpi.color }}>
                          Rp {(kpi.value || 0).toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-[#94A3B8] mt-1">
                          {konveksiReport.total_orders || 0} order | {konveksiReport.total_qty_sold || 0} pcs terjual
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Margin & Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#0D1220] rounded-2xl p-5 border border-white/5">
                      <span className="text-[#94A3B8] text-sm">Margin</span>
                      <p className="text-3xl font-bold text-[#10B981] mt-1">
                        {konveksiReport.total_revenue > 0
                          ? ((konveksiReport.total_profit / konveksiReport.total_revenue) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div className="bg-[#0D1220] rounded-2xl p-5 border border-white/5">
                      <span className="text-[#94A3B8] text-sm">Produksi</span>
                      <p className="text-3xl font-bold text-[#F59E0B] mt-1">{konveksiReport.total_produced || 0} pcs</p>
                      <p className="text-xs text-[#94A3B8]">Biaya: Rp {(konveksiReport.total_production_cost || 0).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="bg-[#0D1220] rounded-2xl p-5 border border-white/5">
                      <span className="text-[#94A3B8] text-sm">Ongkir + Diskon</span>
                      <p className="text-3xl font-bold text-[#EF4444] mt-1">
                        Rp {((konveksiReport.total_shipping || 0) + (konveksiReport.total_discount || 0)).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Stock Level Gauge + Laba per Produk */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Semi-Circle Gauge for Stock Levels */}
                    <div className="bg-[#0D1220] rounded-2xl p-6 border border-white/5">
                      <h3 className="text-lg font-semibold mb-4">Status Stok Produk</h3>
                      {(() => {
                        const products = konveksiProducts || [];
                        const total = products.length;
                        if (total === 0) return <div className="flex items-center justify-center h-40 text-[#94A3B8] text-sm">Belum ada data produk</div>;
                        const inStock = products.filter(p => p.min_stock > 0 ? p.stock > p.min_stock : p.stock >= 10).length;
                        const lowStock = products.filter(p => p.min_stock > 0 ? p.stock > 0 && p.stock <= p.min_stock : p.stock > 0 && p.stock < 10).length;
                        const outOfStock = products.filter(p => p.stock <= 0).length;
                        const availablePct = total > 0 ? Math.round((inStock / total) * 100) : 0;
                        // Generate 32 discrete segments for digital gauge feel
                        const segCount = 32;
                        const segAngle = 180 / segCount;
                        const filledSegments = Math.round((availablePct / 100) * segCount);
                        const gaugeSegments = Array.from({ length: segCount }, (_, i) => ({
                          value: 1,
                          segIndex: i,
                        }));
                        return (
                          <div className="flex flex-col items-center">
                            <div className="relative w-64 h-36 overflow-hidden">
                              <ResponsiveContainer width="100%" height="200%">
                                <PieChart>
                                  <Pie
                                    data={gaugeSegments}
                                    dataKey="value"
                                    cx="50%"
                                    cy="100%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={70}
                                    outerRadius={100}
                                    cornerRadius={2}
                                    paddingAngle={1}
                                    stroke="var(--card, #0D1220)"
                                    strokeWidth={1}
                                  >
                                    {gaugeSegments.map((entry, index) => (
                                      <Cell
                                        key={index}
                                        fill={index < filledSegments
                                          ? (availablePct >= 70 ? "#22C55E" : availablePct >= 50 ? "#F59E0B" : "#EF4444")
                                          : "#1F2937"
                                        }
                                        fillOpacity={index < filledSegments ? 0.85 : 0.3}
                                      />
                                    ))}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                                <span className="text-2xl font-bold text-[#F9FAFB] tabular-nums">{availablePct}%</span>
                                <span className="text-xs text-[#94A3B8]">Tersedia</span>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-4 w-full">
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                                  <span className="text-xs text-[#94A3B8]">In Stock</span>
                                </div>
                                <span className="text-sm font-bold text-[#22C55E]">{inStock}</span>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                                  <span className="text-xs text-[#94A3B8]">Low</span>
                                </div>
                                <span className="text-sm font-bold text-[#F59E0B]">{lowStock}</span>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                                  <span className="text-xs text-[#94A3B8]">Out</span>
                                </div>
                                <span className="text-sm font-bold text-[#EF4444]">{outOfStock}</span>
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-[#94A3B8]">{total} produk total</p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Laba per Produk */}
                    {konveksiReport.product_breakdown?.length > 0 && (
                      <div className="bg-[#0D1220] rounded-2xl p-6 border border-white/5">
                        <h3 className="text-lg font-semibold mb-4">Laba per Produk</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={konveksiReport.product_breakdown} layout="vertical" barCategoryGap={12}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                            <XAxis type="number" stroke="#94A3B8" tickFormatter={fmtTick} />
                            <YAxis type="category" dataKey="name" stroke="#94A3B8" width={120} />
                            <Tooltip contentStyle={{ background: "#0D1220", border: "1px solid #1E293B", borderRadius: 12 }} formatter={(v) => `Rp ${v.toLocaleString("id-ID")}`} />
                            <Bar dataKey="profit" fill="#6366F1" radius={8} name="Laba" fillOpacity={0.5} background={{ fill: "url(#stripe-pattern)", radius: 8 }} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  {konveksiReport.marketplace_breakdown?.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Donut Chart with Center Label */}
                      <div className="bg-[#0D1220] rounded-2xl p-6 border border-white/5">
                        <h3 className="text-lg font-semibold mb-4">Laba per Marketplace</h3>
                        <div className="relative h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={konveksiReport.marketplace_breakdown}
                                dataKey="profit"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                cornerRadius={6}
                                strokeWidth={5}
                                stroke="#0D1220"
                              >
                                {konveksiReport.marketplace_breakdown.map((entry, index) => (
                                  <Cell key={index} fill={MARKETPLACE_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                ))}
                                <Label content={({ viewBox }) => {
                                  if (!(viewBox && 'cx' in viewBox && 'cy' in viewBox)) return null;
                                  const totalLaba = konveksiReport.marketplace_breakdown.reduce((s, m) => s + (m.profit || 0), 0);
                                  return (
                                    <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                                      <tspan className="fill-gray-400 text-xs" x={viewBox.cx} y={(viewBox.cy || 0) - 8}>Total Laba</tspan>
                                      <tspan className="fill-white font-medium text-lg tabular-nums" x={viewBox.cx} y={(viewBox.cy || 0) + 14}>
                                        Rp {totalLaba.toLocaleString("id-ID")}
                                      </tspan>
                                    </text>
                                  );
                                }} />
                              </Pie>
                              <Tooltip
                                formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Laba"]}
                                contentStyle={{ background: "#0D1220", border: "1px solid #1E293B", borderRadius: 12 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {konveksiReport.marketplace_breakdown.map((mp, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <img src={getMarketplaceLogo(mp.name)} alt={mp.name} className="w-4 h-4 rounded object-contain" />
                              <span className="text-[#94A3B8]">{mp.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Horizontal Bar with In-Bar Labels */}
                      <div className="bg-[#0D1220] rounded-2xl p-6 border border-white/5">
                        <h3 className="text-lg font-semibold mb-4">Marketplace Comparison</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={konveksiReport.marketplace_breakdown} layout="vertical" barCategoryGap={12}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                            <XAxis type="number" stroke="#94A3B8" tickFormatter={fmtTick} />
                            <YAxis type="category" dataKey="name" stroke="#94A3B8" width={90} />
                            <Tooltip contentStyle={{ background: "#0D1220", border: "1px solid #1E293B", borderRadius: 12 }} formatter={(v) => `Rp ${Number(v).toLocaleString("id-ID")}`} />
                            <Bar dataKey="profit" radius={8} name="Laba" fillOpacity={0.5} background={{ fill: "url(#stripe-pattern)", radius: 8 }}>
                              {konveksiReport.marketplace_breakdown.map((entry, index) => (
                                <Cell key={index} fill={MARKETPLACE_COLORS[entry.name] || COLORS[index % COLORS.length]} stroke={MARKETPLACE_COLORS[entry.name] || COLORS[index % COLORS.length]} strokeOpacity={0.1} strokeWidth={0.5} />
                              ))}
                              <LabelList dataKey="profit" content={renderValueLabel} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Category Breakdown Donut */}
                  {konveksiReport.category_breakdown?.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Donut Chart */}
                      <div className="bg-[#0D1220] rounded-2xl p-6 border border-white/5">
                        <h3 className="text-lg font-semibold mb-4">Penjualan per Kategori Produk</h3>
                        <div className="relative h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={konveksiReport.category_breakdown}
                                dataKey="revenue"
                                nameKey="category"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                cornerRadius={3}
                                strokeWidth={2}
                                stroke="#0D1220"
                              >
                                {konveksiReport.category_breakdown.map((entry, index) => (
                                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                                <Label content={({ viewBox }) => {
                                  if (!(viewBox && 'cx' in viewBox && 'cy' in viewBox)) return null;
                                  const totalRev = konveksiReport.category_breakdown.reduce((s, c) => s + (c.revenue || 0), 0);
                                  const totalQty = konveksiReport.category_breakdown.reduce((s, c) => s + (c.total_qty || 0), 0);
                                  return (
                                    <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                                      <tspan className="fill-gray-400 text-xs" x={viewBox.cx} y={(viewBox.cy || 0) - 12}>Total Revenue</tspan>
                                      <tspan className="fill-white font-medium text-base tabular-nums" x={viewBox.cx} y={(viewBox.cy || 0) + 10}>
                                        {totalRev >= 1000000 ? `Rp ${(totalRev / 1000000).toFixed(1)}jt` : totalRev >= 1000 ? `Rp ${(totalRev / 1000).toFixed(0)}rb` : `Rp ${totalRev}`}
                                      </tspan>
                                      <tspan className="fill-gray-500 text-xs" x={viewBox.cx} y={(viewBox.cy || 0) + 28}>{totalQty} pcs</tspan>
                                    </text>
                                  );
                                }} />
                              </Pie>
                              <Tooltip
                                formatter={(value, name) => {
                                  const totalRev = konveksiReport.category_breakdown.reduce((s, c) => s + (c.revenue || 0), 0);
                                  const pct = totalRev > 0 ? ((value / totalRev) * 100).toFixed(1) : 0;
                                  return [`Rp ${Number(value).toLocaleString("id-ID")} (${pct}%)`, name];
                                }}
                                contentStyle={{ background: "#0D1220", border: "1px solid #1E293B", borderRadius: 12 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Legend + Details */}
                      <div className="bg-[#0D1220] rounded-2xl p-6 border border-white/5">
                        <h3 className="text-lg font-semibold mb-4">Detail per Kategori</h3>
                        <div className="space-y-4">
                          {konveksiReport.category_breakdown.map((cat, idx) => {
                            const totalRev = konveksiReport.category_breakdown.reduce((s, c) => s + (c.revenue || 0), 0);
                            const pct = totalRev > 0 ? ((cat.revenue / totalRev) * 100) : 0;
                            return (
                              <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <p className="text-sm font-medium">{cat.category}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-white">{pct.toFixed(1)}%</span>
                                    <span className="text-xs text-[#94A3B8] ml-2">Rp {cat.revenue.toLocaleString("id-ID")}</span>
                                  </div>
                                </div>
                                <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, pct)}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                  />
                                </div>
                                <p className="text-xs text-[#94A3B8]">{cat.total_qty} pcs · {cat.orders} order</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* PRODUCTS TAB */}
              {konveksiTab === "products" && (
                <div className="space-y-4">
                  <div className="bg-[#0D1220] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-semibold">Produk Konveksi</h3>
                      <span className="text-sm text-[#94A3B8]">{konveksiProducts.length} produk</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left p-4 text-[#94A3B8] text-sm font-medium">Produk</th>
                            <th className="text-left p-4 text-[#94A3B8] text-sm font-medium">Kategori</th>
                            <th className="text-right p-4 text-[#94A3B8] text-sm font-medium">HPP</th>
                            <th className="text-right p-4 text-[#94A3B8] text-sm font-medium">Harga Jual</th>
                            <th className="text-right p-4 text-[#94A3B8] text-sm font-medium">Margin</th>
                            <th className="text-right p-4 text-[#94A3B8] text-sm font-medium">Stok</th>
                            <th className="text-center p-4 text-[#94A3B8] text-sm font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {konveksiProducts.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-[#94A3B8]">Belum ada produk. Tambah via Telegram: /tambah_produk</td></tr>
                          ) : konveksiProducts.map((p) => {
                            const margin = p.price - p.hpp;
                            const isLow = p.min_stock > 0 && p.stock <= p.min_stock;
                            // Resource meter: calculate stock percentage
                            const maxStock = p.min_stock > 0 ? Math.max(p.stock, p.min_stock * 2, 50) : Math.max(p.stock, 50);
                            const stockPct = maxStock > 0 ? (p.stock / maxStock) * 100 : 0;
                            const consumedPct = 100 - stockPct;
                            let meterColor = "#22C55E"; // green
                            if (consumedPct >= 70 || p.stock < 10) meterColor = "#EF4444"; // red
                            else if (consumedPct >= 55) meterColor = "#F59E0B"; // yellow
                            return (
                              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                  <p className="font-medium">{p.name}</p>
                                </td>
                                <td className="p-4">
                                  <span className="px-2 py-1 rounded-full text-xs bg-[#6366F1]/20 text-[#6366F1]">{p.category || 'Lainnya'}</span>
                                </td>
                                <td className="p-4 text-right text-[#EF4444]">Rp {p.hpp.toLocaleString("id-ID")}</td>
                                <td className="p-4 text-right text-[#10B981]">Rp {p.price.toLocaleString("id-ID")}</td>
                                <td className="p-4 text-right text-[#6366F1]">Rp {margin.toLocaleString("id-ID")}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-[60px]">
                                      <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stockPct)}%`, backgroundColor: meterColor }} />
                                      </div>
                                    </div>
                                    <span className={`text-xs font-bold whitespace-nowrap tabular-nums ${isLow ? "text-[#EF4444]" : "text-[#94A3B8]"}`}>
                                      {p.stock} {p.unit} <span style={{ color: meterColor }}>({Math.round(stockPct)}%)</span>
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  {isLow ? (
                                    <span className="px-2 py-1 rounded-full text-xs bg-[#EF4444]/20 text-[#EF4444]">Stok Rendah</span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs bg-[#10B981]/20 text-[#10B981]">OK</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Kelola Kategori Produk */}
                  <div className="bg-[#0D1220] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5">
                      <h3 className="font-semibold">Kelola Kategori Produk</h3>
                      <p className="text-xs text-[#94A3B8] mt-1">Tambah atau hapus kategori produk konveksi</p>
                    </div>
                    <div className="p-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newProdCatName.trim()) return;
                          addProductCategoryMutation.mutate({ name: newProdCatName.trim(), icon: newProdCatIcon });
                        }}
                        className="flex flex-col sm:flex-row gap-3 mb-4"
                      >
                        <input
                          type="text"
                          value={newProdCatName}
                          onChange={(e) => setNewProdCatName(e.target.value)}
                          placeholder="Nama kategori baru (contoh: Seragam Olahraga)"
                          className="flex-1 min-w-0 bg-[#06080F] border border-white/10 rounded-xl px-4 py-3 text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:border-[#6366F1] transition-all text-sm"
                        />
                        <select
                          value={newProdCatIcon}
                          onChange={(e) => setNewProdCatIcon(e.target.value)}
                          className="bg-[#06080F] border border-white/10 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#6366F1] transition-all text-sm"
                        >
                          {["📦","👕","👔","👖","🧥","🎓","🏕️","🎭","🤵","🧢","🦺","✂️","🧵","🪡"].map(e => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={addProductCategoryMutation.isPending || !newProdCatName.trim()}
                          className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex-shrink-0"
                        >
                          {addProductCategoryMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Plus size={16} />
                          )}
                          Tambah
                        </button>
                      </form>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {productCategories?.map((cat, idx) => (
                          <div
                            key={cat.id || idx}
                            className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{cat.icon || '📦'}</span>
                              <p className="text-sm font-medium text-[#F9FAFB]">{cat.name}</p>
                            </div>
                            <button
                              onClick={() => deleteProductCategoryMutation.mutate(cat.id)}
                              className="p-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all"
                              title="Hapus kategori"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {(!productCategories || productCategories.length === 0) && (
                          <p className="text-center text-[#94A3B8] py-4 text-sm col-span-2">Belum ada kategori produk</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SALES TAB */}
              {konveksiTab === "sales" && (
                <div className="space-y-4">
                  <div className="bg-[#0D1220] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-semibold">Penjualan Terakhir</h3>
                      <span className="text-sm text-[#94A3B8]">{konveksiSales.length} transaksi</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left p-4 text-[#94A3B8] text-sm font-medium">Tanggal</th>
                            <th className="text-left p-4 text-[#94A3B8] text-sm font-medium">Produk</th>
                            <th className="text-left p-4 text-[#94A3B8] text-sm font-medium">Marketplace</th>
                            <th className="text-right p-4 text-[#94A3B8] text-sm font-medium">Qty</th>
                            <th className="text-right p-4 text-[#94A3B8] text-sm font-medium">Revenue</th>
                            <th className="text-right p-4 text-[#94A3B8] text-sm font-medium">Fee</th>
                            <th className="text-right p-4 text-[#94A3B8] text-sm font-medium">Laba</th>
                          </tr>
                        </thead>
                        <tbody>
                          {konveksiSales.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-[#94A3B8]">Belum ada penjualan. Catat via Telegram: jual [produk] [qty]pcs di [marketplace] [harga]</td></tr>
                          ) : konveksiSales.map((s) => (
                            <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4 text-sm">{s.date}</td>
                              <td className="p-4 font-medium">{s.product_name || "-"}</td>
                              <td className="p-4">
                                <span className="px-2 py-1 rounded-lg text-xs bg-white/5 flex items-center gap-1.5">
                                  <img src={getMarketplaceLogo(s.marketplace_name)} alt={s.marketplace_name} className="w-3.5 h-3.5 rounded object-contain" />
                                  {s.marketplace_name}
                                </span>
                              </td>
                              <td className="p-4 text-right">{s.quantity} pcs</td>
                              <td className="p-4 text-right text-[#10B981]">Rp {s.total_revenue?.toLocaleString("id-ID")}</td>
                              <td className="p-4 text-right text-[#F59E0B]">Rp {s.marketplace_fee?.toLocaleString("id-ID")}</td>
                              <td className="p-4 text-right font-medium text-[#6366F1]">Rp {s.profit?.toLocaleString("id-ID")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MARKETPLACE TAB */}
              {konveksiTab === "marketplace" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {konveksiMarketplaces.map((mp) => (
                      <div key={mp.id} className="bg-[#0D1220] rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                          <img src={getMarketplaceLogo(mp.name)} alt={mp.name} className="w-10 h-10 rounded-lg bg-white/5 p-1.5 object-contain" />
                          <div>
                            <h4 className="font-semibold">{mp.name}</h4>
                            <p className="text-sm text-[#94A3B8]">Fee: {mp.fee_percent}%</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#94A3B8]">Settlement</span>
                          <span>{mp.settlement_days} hari</span>
                        </div>
                        {konveksiReport.marketplace_breakdown?.find(m => m.name === mp.name) && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#94A3B8]">Laba bulan ini</span>
                              <span className="text-[#10B981] font-medium">
                                Rp {konveksiReport.marketplace_breakdown.find(m => m.name === mp.name).profit.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INVENTORY TAB */}
              {konveksiTab === "inventory" && (
                <div className="space-y-6">
                  {/* Inventory KPI Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl ring-1 ring-gray-200/10 divide-x divide-y divide-gray-200/10 overflow-hidden">
                    {[
                      { label: "Total Bahan", value: inventoryDashboard.total_materials || 0, suffix: " item", color: "#6366F1" },
                      { label: "Total Batch", value: inventoryDashboard.total_batches || 0, suffix: "", color: "#10B981" },
                      { label: "Nilai Persediaan", value: `Rp ${(inventoryDashboard.total_inventory_value || 0).toLocaleString("id-ID")}`, suffix: "", color: "#F59E0B" },
                      { label: "Stok Rendah", value: inventoryDashboard.low_stock_count || 0, suffix: " item", color: "#EF4444" },
                    ].map((kpi, i) => (
                      <div key={i} className="p-4 text-center">
                        <p className="text-xs text-[#94A3B8]">{kpi.label}</p>
                        <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}{kpi.suffix}</p>
                      </div>
                    ))}
                  </div>

                  {/* Low Stock Alerts */}
                  {inventoryDashboard.low_stock_materials?.length > 0 && (
                    <div className="rounded-xl bg-red-500/5 ring-1 ring-red-500/20 p-4">
                      <h3 className="text-sm font-semibold text-red-400 mb-3">Stok Rendah</h3>
                      <div className="space-y-2">
                        {inventoryDashboard.low_stock_materials.map(m => (
                          <div key={m.id} className="flex items-center justify-between text-sm">
                            <span className="text-white">{m.name}</span>
                            <span className="text-red-400">{m.stock} / {m.min_stock} {m.unit} (kurang {m.deficit})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Can Produce */}
                  {inventoryDashboard.product_estimates?.length > 0 && (
                    <div className="rounded-xl bg-[#111827] ring-1 ring-gray-200/10 p-4">
                      <h3 className="text-sm font-semibold text-white mb-3">Estimasi Produksi</h3>
                      <div className="space-y-2">
                        {inventoryDashboard.product_estimates.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-white">{p.name}</span>
                              <span className="text-[#94A3B8] ml-2">(stok: {p.current_stock})</span>
                            </div>
                            <span className={`font-medium ${p.max_producible > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              Bisa buat: {p.max_producible} pcs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Without BOM */}
                  {inventoryDashboard.products_without_bom?.length > 0 && (
                    <div className="rounded-xl bg-yellow-500/5 ring-1 ring-yellow-500/20 p-4">
                      <h3 className="text-sm font-semibold text-yellow-400 mb-3">Produk Belum Ada BOM</h3>
                      <p className="text-xs text-[#94A3B8] mb-2">Buat BOM agar produksi otomatis kurangi stok bahan baku.</p>
                      <div className="flex flex-wrap gap-2">
                        {inventoryDashboard.products_without_bom.map(p => (
                          <span key={p.id} className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-300 text-xs">{p.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Batch Detail Table */}
                  <div className="rounded-xl bg-[#111827] ring-1 ring-gray-200/10 p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Batch Bahan Baku</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[#94A3B8] text-xs border-b border-white/5">
                            <th className="text-left py-2 px-2">Bahan</th>
                            <th className="text-left py-2 px-2">Batch</th>
                            <th className="text-left py-2 px-2">Warna</th>
                            <th className="text-right py-2 px-2">Sisa</th>
                            <th className="text-right py-2 px-2">Awal</th>
                            <th className="text-right py-2 px-2">Harga/unit</th>
                            <th className="text-left py-2 px-2">Tgl Masuk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryBatches.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-4 text-[#94A3B8]">Belum ada batch.</td></tr>
                          ) : inventoryBatches.map(b => (
                            <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-2 px-2 text-white">{b.material_name}</td>
                              <td className="py-2 px-2 text-[#94A3B8]">{b.batch_code}</td>
                              <td className="py-2 px-2 text-[#94A3B8]">{b.color || "-"}</td>
                              <td className="py-2 px-2 text-right text-green-400">{b.remaining_quantity?.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right text-[#94A3B8]">{b.initial_quantity?.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right text-white">Rp {(b.cost_per_unit || 0).toLocaleString("id-ID")}</td>
                              <td className="py-2 px-2 text-[#94A3B8]">{b.received_date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* BOM List */}
                  <div className="rounded-xl bg-[#111827] ring-1 ring-gray-200/10 p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Bill of Materials (BOM)</h3>
                    {inventoryBoms.length === 0 ? (
                      <p className="text-[#94A3B8] text-sm">Belum ada BOM. Buat via bot: /bom_tambah</p>
                    ) : (
                      <div className="space-y-4">
                        {inventoryBoms.map(bom => (
                          <div key={bom.id} className="rounded-lg bg-white/5 p-3">
                            <h4 className="text-sm font-medium text-white mb-2">{bom.product_name}</h4>
                            <div className="space-y-1">
                              {bom.items?.map(item => (
                                <div key={item.id} className="flex justify-between text-xs">
                                  <span className="text-[#94A3B8]">{item.material_name}</span>
                                  <span className="text-white">{item.quantity_per_unit} {item.material_unit}/pcs</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0D1220]/95 backdrop-blur-xl border-t border-white/5 z-50 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all relative ${
                activeTab === item.id
                  ? "bg-[#6366F1]/10 text-[#6366F1]"
                  : "text-[#94A3B8]"
              }`}
            >
              {activeTab === item.id && (
                <div
                  className="absolute top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-[#6366F1] rounded-full transition-all duration-300"
                />
              )}
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {showEditModal && editTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#06080F]/90 backdrop-blur-sm"
              onClick={() => {
                setShowEditModal(false);
                setEditTx(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#111827] border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 max-w-md w-full relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#6366F1]/10 rounded-xl flex items-center justify-center">
                    <Pencil size={20} className="text-[#6366F1]" />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-[#F9FAFB]">
                    Edit Transaksi
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditTx(null);
                  }}
                  className="text-[#94A3B8] hover:text-[#F9FAFB] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-[#F9FAFB] mb-2 block">
                    Tipe Transaksi
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${editTx.type === "pemasukan" ? "border-[#22C55E] bg-[#22C55E]/5" : "border-white/5 bg-white/5 hover:border-[#22C55E]/30"}`}>
                      <input
                        type="radio"
                        name="editType"
                        value="pemasukan"
                        checked={editTx.type === "pemasukan"}
                        onChange={(e) =>
                          setEditTx({ ...editTx, type: e.target.value })
                        }
                        className="accent-[#22C55E]"
                      />
                      <div>
                        <p className="font-bold text-sm text-[#22C55E]">
                          Pemasukan
                        </p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${editTx.type === "pengeluaran" ? "border-[#EF4444] bg-[#EF4444]/5" : "border-white/5 bg-white/5 hover:border-[#EF4444]/30"}`}>
                      <input
                        type="radio"
                        name="editType"
                        value="pengeluaran"
                        checked={editTx.type === "pengeluaran"}
                        onChange={(e) =>
                          setEditTx({ ...editTx, type: e.target.value })
                        }
                        className="accent-[#EF4444]"
                      />
                      <div>
                        <p className="font-bold text-sm text-[#EF4444]">
                          Pengeluaran
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#F9FAFB] mb-2 block">
                    Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    value={editTx.amount}
                    onChange={(e) =>
                      setEditTx({ ...editTx, amount: e.target.value })
                    }
                    required
                    min="1"
                    className="w-full bg-[#06080F] border border-white/10 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#F9FAFB] mb-2 block">
                    Kategori
                  </label>
                  <select
                    value={editTx.category}
                    onChange={(e) =>
                      setEditTx({ ...editTx, category: e.target.value })
                    }
                    className="w-full bg-[#06080F] border border-white/10 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#6366F1] transition-all"
                  >
                    <optgroup label="💰 Pemasukan">
                      {allCategories?.filter(c => c.type === 'pemasukan').map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="💸 Pengeluaran">
                      {allCategories?.filter(c => c.type === 'pengeluaran').map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#F9FAFB] mb-2 block">
                    Catatan
                  </label>
                  <input
                    type="text"
                    value={editTx.note}
                    onChange={(e) =>
                      setEditTx({ ...editTx, note: e.target.value })
                    }
                    required
                    className="w-full bg-[#06080F] border border-white/10 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#6366F1] transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditTx(null);
                    }}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="flex-1 px-4 py-3 bg-[#6366F1] hover:bg-[#4F46E5] rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {editMutation.isPending && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#06080F]/90 backdrop-blur-sm"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteTxId(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#111827] border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-sm w-full relative z-10 shadow-2xl"
            >
              <div className="w-14 h-14 bg-[#EF4444]/10 rounded-2xl flex items-center justify-center text-[#EF4444] mb-5 mx-auto">
                <AlertCircle size={28} />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-center text-[#F9FAFB] mb-2">
                Hapus Transaksi?
              </h2>
              <p className="text-sm text-[#94A3B8] text-center mb-6">
                Transaksi ini akan dihapus secara permanen. Aksi ini tidak
                dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTxId(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteTxId)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-3 bg-[#EF4444] hover:bg-[#DC2626] rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Reset Modal */}
      <AnimatePresence>
        {isAdminResetOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#06080F]/90 backdrop-blur-sm"
              onClick={() => setIsAdminResetOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#111827] border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-[#EF4444]/10 rounded-2xl flex items-center justify-center text-[#EF4444] mb-6 mx-auto">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-center text-[#F9FAFB] mb-2">
                Konfirmasi Reset
              </h2>

              {adminStep === 1 && (
                <div className="text-center">
                  <p className="text-[#94A3B8] mb-8">
                    Apakah Anda yakin ingin menghapus semua data transaksi? Ini
                    akan mengosongkan dashboard Anda.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsAdminResetOpen(false)}
                      className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => setAdminStep(2)}
                      className="flex-1 px-6 py-3 bg-[#EF4444] rounded-xl font-bold transition-all"
                    >
                      Lanjut
                    </button>
                  </div>
                </div>
              )}

              {adminStep === 2 && (
                <div className="text-center">
                  <p className="text-[#94A3B8] mb-6">
                    Konfirmasi Kedua: Data yang dihapus tidak dapat
                    dikembalikan.
                  </p>
                  <div className="space-y-4">
                    <div className="text-left">
                      <label className="text-xs font-bold text-[#94A3B8] uppercase ml-1">
                        Ketik &quot;RESET DATA&quot; untuk konfirmasi
                      </label>
                      <input
                        type="text"
                        value={adminConfirmText}
                        onChange={(e) => setAdminConfirmText(e.target.value)}
                        className="w-full mt-2 bg-[#06080F] border border-white/10 rounded-xl px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#EF4444] transition-all"
                        placeholder="RESET DATA"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setAdminStep(1)}
                        className="flex-1 px-6 py-3 bg-white/5 rounded-xl font-bold transition-all"
                      >
                        Kembali
                      </button>
                      <button
                        disabled={adminConfirmText !== "RESET DATA"}
                        onClick={() => {
                          fetch(
                            `/api/admin/reset?user_id=${userId}`,
                            { method: "POST", credentials: "same-origin" },
                          ).then(() => {
                            queryClient.invalidateQueries();
                            setIsAdminResetOpen(false);
                            setAdminStep(1);
                            setAdminConfirmText("");
                          });
                        }}
                        className="flex-1 px-6 py-3 bg-[#EF4444] rounded-xl font-bold transition-all disabled:opacity-50"
                      >
                        Reset Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl max-w-sm ${
              toast.type === "error"
                ? "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#FCA5A5]"
                : "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#86EFAC]"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle size={18} className="flex-shrink-0 text-[#EF4444]" />
            ) : (
              <CheckCircle2 size={18} className="flex-shrink-0 text-[#22C55E]" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #06080F;
        }
        ::-webkit-scrollbar-thumb {
          background: #1F2937;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #374151;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes wave-slide-1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }

        @keyframes wave-slide-2 {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }

        @keyframes wave-slide-3 {
          0% { transform: translateX(-25%); }
          100% { transform: translateX(-125%); }
        }

        .sidebar-wave-1 { animation: wave-slide-1 12s linear infinite; }
        .sidebar-wave-2 { animation: wave-slide-2 18s linear infinite; }
        .sidebar-wave-3 { animation: wave-slide-3 24s linear infinite; }

        .font-inter {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}

function Loader({ size = 24, className = "" }) {
  return (
    <div className={`animate-spin ${className}`}>
      <RefreshCcw size={size} />
    </div>
  );
}

function CountUp({ value, isCurrency }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  if (isCurrency) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(displayValue);
  }
  return displayValue;
}
