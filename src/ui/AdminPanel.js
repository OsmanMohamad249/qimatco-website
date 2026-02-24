import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { db, auth } from "../firebase";
import {
  doc, setDoc, serverTimestamp, getDoc, collection, addDoc,
  getDocs, query, orderBy, updateDoc, deleteDoc, where
} from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "../context/LanguageContext";
import { jsPDF } from "jspdf";
import logo from "../img/qimat-alaibtikar-logo.png";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dmynksk5z/auto/upload";
const CLOUDINARY_PRESET = "oiwrpbwq";

const ACTION_LABELS = {
  add: "إضافة",
  edit: "تعديل",
  delete: "حذف",
  view: "عرض",
  markRead: "تحديد كمقروء",
};

const PERM_SECTIONS = [
  { key: "services", label: "الخدمات", actions: ["add", "edit", "delete"] },
  { key: "products", label: "المنتجات", actions: ["add", "edit", "delete"] },
  { key: "clients", label: "العملاء", actions: ["add", "edit", "delete"] },
  { key: "messages", label: "الرسائل", actions: ["view", "markRead"] },
  { key: "news", label: "الأخبار", actions: ["add", "edit", "delete"] },
  { key: "blog", label: "المدونة", actions: ["add", "edit", "delete"] },
  { key: "ads", label: "الإعلانات", actions: ["add", "edit", "delete"] },
  { key: "shipments", label: "الشحنات", actions: ["add", "edit", "delete"] },
  { key: "admins", label: "المشرفون", actions: ["view", "add", "edit", "delete"] },
];

const SOCIAL_ICONS = [
  { value: "bi-globe", label: "Website" },
  { value: "bi-facebook", label: "Facebook" },
  { value: "bi-instagram", label: "Instagram" },
  { value: "bi-linkedin", label: "LinkedIn" },
  { value: "bi-twitter-x", label: "X" },
];

const uploadToCloudinary = async (file) => {
  if (!file) return "";
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: data });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || "Cloudinary upload failed");
  return json.secure_url || "";
};

const uploadMultiple = async (files) => {
  if (!files || files.length === 0) return [];
  const uploads = files.map((file) => uploadToCloudinary(file));
  return await Promise.all(uploads);
};

const initialForm = {
  id: "", status: "Pending", customerName: "", origin: "", destination: "", eta: "", notes: "",
};

const DEFAULT_PERMS = {
  services: { add: false, edit: false, delete: false },
  products: { add: false, edit: false, delete: false },
  clients: { add: false, edit: false, delete: false },
  messages: { view: false, markRead: false },
  news: { add: false, edit: false, delete: false },
  blog: { add: false, edit: false, delete: false },
  ads: { add: false, edit: false, delete: false },
  shipments: { add: false, edit: false, delete: false },
  admins: { view: false, add: false, edit: false, delete: false },
};

const FULL_PERMS = {
  services: { add: true, edit: true, delete: true },
  products: { add: true, edit: true, delete: true },
  clients: { add: true, edit: true, delete: true },
  messages: { view: true, markRead: true },
  news: { add: true, edit: true, delete: true },
  blog: { add: true, edit: true, delete: true },
  ads: { add: true, edit: true, delete: true },
  shipments: { add: true, edit: true, delete: true },
  admins: { view: true, add: true, edit: true, delete: true },
};

const can = (perms, section, action) => {
  if (!perms || !perms[section]) return false;
  return !!perms[section][action];
};

// Generate standardized quotation ID like Q-2026-0001
const formatQuoteID = (createdAt, index) => {
  if (!createdAt) return `Q-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`;
  const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
  const year = date.getFullYear();
  return `Q-${year}-${String(index + 1).padStart(4, '0')}`;
};

// Merge saved permissions with defaults so new keys are always present
const mergePerms = (saved, base) => {
  const merged = JSON.parse(JSON.stringify(base));
  if (!saved) return merged;
  for (const section of Object.keys(merged)) {
    if (saved[section]) {
      for (const action of Object.keys(merged[section])) {
        if (typeof saved[section][action] === "boolean") {
          merged[section][action] = saved[section][action];
        }
      }
    }
  }
  return merged;
};

const AdminPanel = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const isRTL = language === 'ar';
  const getLabel = (obj) => { if (!obj) return "---"; if (typeof obj === "string") return obj; const lang = (language || "ar").toLowerCase(); return obj[lang] || obj.ar || obj.en || "---"; };

  // ── STATE ──
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("shipments");

  // Products
  const [productForm, setProductForm] = useState({ name_ar: "", name_en: "", category_ar: "", category_en: "", description_ar: "", description_en: "" });
  const [productImages, setProductImages] = useState([]);
  const [productVideo, setProductVideo] = useState(null);
  const [productSaveMessage, setProductSaveMessage] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Clients
  const [clientForm, setClientForm] = useState({ name_ar: "", name_en: "" });
  const [clientFile, setClientFile] = useState(null);
  const [clientMessage, setClientMessage] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientFileKey, setClientFileKey] = useState(0);
  const [clients, setClients] = useState([]);

  // Messages
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState("");

  // Blog (was articles)
  const [blogForm, setBlogForm] = useState({ title_ar: "", title_en: "", body_ar: "", body_en: "" });
  const [blogImages, setBlogImages] = useState([]);
  const [blogVideos, setBlogVideos] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogMessage, setBlogMessage] = useState("");
  const [blogFileKey, setBlogFileKey] = useState(0);

  // News
  const [newsForm, setNewsForm] = useState({ title_ar: "", title_en: "", body_ar: "", body_en: "" });
  const [newsImages, setNewsImages] = useState([]);
  const [newsVideos, setNewsVideos] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsMessage, setNewsMessage] = useState("");
  const [newsFileKey, setNewsFileKey] = useState(0);

  // Ads
  const [adsForm, setAdsForm] = useState({ title_ar: "", title_en: "", body_ar: "", body_en: "" });
  const [adsImages, setAdsImages] = useState([]);
  const [adsVideos, setAdsVideos] = useState([]);
  const [adsList, setAdsList] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsMessage, setAdsMessage] = useState("");
  const [adsFileKey, setAdsFileKey] = useState(0);

  // Quotes
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("pending");
  const [quoteMsg, setQuoteMsg] = useState("");
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfQuote, setPdfQuote] = useState(null);
  const pdfRef = useRef(null);

  // Permission / Admin management
  const [userPermissions, setUserPermissions] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminForm, setAdminForm] = useState({ email: "" });
  const [adminPerms, setAdminPerms] = useState(JSON.parse(JSON.stringify(DEFAULT_PERMS)));
  const [adminSaveMsg, setAdminSaveMsg] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // Inline editing existing admin permissions
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editingAdminPerms, setEditingAdminPerms] = useState(null);
  const [editingAdminLoading, setEditingAdminLoading] = useState(false);

  // Social links
  const [socialLinks, setSocialLinks] = useState([]);
  const [socialForm, setSocialForm] = useState({ name: "", url: "", icon: "bi-globe", color: "#000000" });
  const [socialFile, setSocialFile] = useState(null);
  const [socialFileKey, setSocialFileKey] = useState(0);
  const [socialMsg, setSocialMsg] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);

  // WhatsApp settings
  const [whatsappSettings, setWhatsappSettings] = useState({ phone: "", message: "", enabled: true });
  const [whatsappMsg, setWhatsappMsg] = useState("");
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  // Services
  const [serviceForm, setServiceForm] = useState({ title_ar: "", title_en: "", short_ar: "", short_en: "", full_ar: "", full_en: "", icon: "bi-briefcase" });
  const [serviceFile, setServiceFile] = useState(null);
  const [servicesList, setServicesList] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceMsg, setServiceMsg] = useState("");
  const [serviceFileKey, setServiceFileKey] = useState(0);

  // Careers
  const [jobForm, setJobForm] = useState({ title: "", department: "", type: "", location: "", description: "", deadline: "", status: "open" });
  const [jobsList, setJobsList] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobMessage, setJobMessage] = useState("");
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);

  // Team management
  const [teamSubTab, setTeamSubTab] = useState("employees");

  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [titles, setTitles] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [deptForm, setDeptForm] = useState({ name_ar: "", name_en: "" });
  const [sectionForm, setSectionForm] = useState({ name_ar: "", name_en: "", departmentId: "" });
  const [titleForm, setTitleForm] = useState({ title_ar: "", title_en: "", sectionId: "", level: "staff" });
  const [employeeForm, setEmployeeForm] = useState({ name_ar: "", name_en: "", bio_ar: "", bio_en: "", resp_ar: "", resp_en: "", titleId: "", managerId: "" });

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);

  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  const [employeeImageFile, setEmployeeImageFile] = useState(null);
  const [employeeCvFile, setEmployeeCvFile] = useState(null);
  const [employeeFileKey, setEmployeeFileKey] = useState(0);

  const [teamLoading, setTeamLoading] = useState(false);
  const [teamMsg, setTeamMsg] = useState("");

  // ── EFFECTS ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) { setForm(initialForm); setUserPermissions(null); setAccessDenied(false); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchPerms = async () => {
      try {
        const q = query(collection(db, "admins"), where("email", "==", user.email));
        const snap = await getDocs(q);
        if (snap.empty) {
          const allAdmins = await getDocs(collection(db, "admins"));
          if (allAdmins.empty) {
            await addDoc(collection(db, "admins"), { email: user.email, permissions: FULL_PERMS, role: "Super Admin", createdAt: serverTimestamp() });
            setUserPermissions(FULL_PERMS); setAccessDenied(false);
          } else { setAccessDenied(true); setUserPermissions(null); }
        } else {
          const adminData = snap.docs[0].data();
          const isSuperAdmin = adminData.role === "Super Admin";
          // Merge with FULL_PERMS for Super Admin (auto-grant new permissions)
          // Merge with DEFAULT_PERMS for regular admins (new sections default to false)
          const base = isSuperAdmin ? FULL_PERMS : DEFAULT_PERMS;
          const merged = mergePerms(adminData.permissions, base);
          setUserPermissions(merged); setAccessDenied(false);
          // Auto-update Firestore if permissions were outdated
          if (JSON.stringify(merged) !== JSON.stringify(adminData.permissions)) {
            try { await updateDoc(doc(db, "admins", snap.docs[0].id), { permissions: merged }); } catch {}
          }
        }
      } catch { setAccessDenied(true); }
    };
    fetchPerms();
  }, [user]);

  useEffect(() => {
    if (!user || !userPermissions || accessDenied) return;
    const load = async () => {
      setApplicationsLoading(true);
      setQuotesLoading(true);
      try { const q = query(collection(db, "messages"), orderBy("createdAt", "desc")); const snap = await getDocs(q); setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { setMessagesError("تعذر تحميل الرسائل حالياً"); } finally { setMessagesLoading(false); }
      try { const snap = await getDocs(collection(db, "products")); setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "clients")); setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(query(collection(db, "blog"), orderBy("createdAt", "desc"))); setBlogPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"))); setNewsItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(query(collection(db, "ads"), orderBy("createdAt", "desc"))); setAdsList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "admins")); setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "socialLinks")); setSocialLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "services")); setServicesList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "team_departments")); setDepartments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "team_sections")); setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "team_titles")); setTitles(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "team_employees")); setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const waSnap = await getDoc(doc(db, "settings", "whatsapp")); if (waSnap.exists()) setWhatsappSettings(waSnap.data()); } catch {}
      try { const snap = await getDocs(query(collection(db, "jobs"), orderBy("createdAt", "desc"))); setJobsList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(query(collection(db, "applications"), orderBy("createdAt", "desc"))); setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {} finally { setApplicationsLoading(false); }
      try { const snap = await getDocs(query(collection(db, "quotes"), orderBy("createdAt", "desc"))); setQuotes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {} finally { setQuotesLoading(false); }
    };
    load();
  }, [user, userPermissions, accessDenied]);

  // ── HANDLERS ──
  const loc = (val) => { if (!val) return ""; if (typeof val === "string") return val; return val[language] || val["ar"] || val["en"] || ""; };
  const handleChange = (e) => { const { name, value } = e.target; setForm((prev) => ({ ...prev, [name]: value })); };

  const handleProductChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") { setProductImages(files ? Array.from(files) : []); return; }
    if (name === "video") { setProductVideo(files && files[0] ? files[0] : null); return; }
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleClientChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "clientLogo") { setClientFile(files && files[0] ? files[0] : null); return; }
    setClientForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleBlogChange = (e) => {
    const { name, files } = e.target;
    if (name === "blogImages") { setBlogImages(files ? Array.from(files) : []); return; }
    if (name === "blogVideos") { setBlogVideos(files ? Array.from(files) : []); return; }
    setBlogForm((prev) => ({ ...prev, [name]: e.target.value }));
  };
  const handleNewsChange = (e) => {
    const { name, files } = e.target;
    if (name === "newsImages") { setNewsImages(files ? Array.from(files) : []); return; }
    if (name === "newsVideos") { setNewsVideos(files ? Array.from(files) : []); return; }
    setNewsForm((prev) => ({ ...prev, [name]: e.target.value }));
  };
  const handleAdsChange = (e) => {
    const { name, files } = e.target;
    if (name === "adsImages") { setAdsImages(files ? Array.from(files) : []); return; }
    if (name === "adsVideos") { setAdsVideos(files ? Array.from(files) : []); return; }
    setAdsForm((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleLoad = async () => {
    if (!form.id.trim()) { setMessage("Enter an ID to load."); return; }
    setLoading(true); setMessage("");
    try {
      const snapshot = await getDoc(doc(db, "shipments", form.id.trim()));
      if (snapshot.exists()) { const d = snapshot.data(); setForm({ id: form.id.trim(), status: d.status || "Pending", customerName: d.customerName || "", origin: d.origin || "", destination: d.destination || "", eta: d.eta || "", notes: d.notes || "" }); setMessage("Loaded existing shipment."); }
      else { setMessage("No shipment found. You can create a new one."); }
    } catch { setMessage("Error loading shipment."); } finally { setLoading(false); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); if (!form.id.trim()) { setMessage("Tracking ID is required."); return; }
    setLoading(true); setMessage("");
    try { await setDoc(doc(db, "shipments", form.id.trim()), { status: form.status, customerName: form.customerName, origin: form.origin, destination: form.destination, eta: form.eta, notes: form.notes, updatedAt: serverTimestamp() }, { merge: true }); setMessage("Saved successfully."); }
    catch { setMessage("Save failed."); } finally { setLoading(false); }
  };
  const handleReset = () => { setForm(initialForm); setMessage(""); };
  const handleLogin = async (e) => { e.preventDefault(); setLoginError(""); setLoginLoading(true); try { await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword); setLoginEmail(""); setLoginPassword(""); } catch { setLoginError(t('admin_login_error')); } finally { setLoginLoading(false); } };
  const handleLogout = async () => { await signOut(auth); };

  // Product save
  const handleProductSave = async (e) => {
    e.preventDefault(); setProductSaveMessage("");
    if (!productForm.name_ar.trim() && !productForm.name_en.trim()) { setProductSaveMessage("Please fill the product name."); return; }
    try {
      setProductLoading(true);
      const imageUrls = await uploadMultiple(productImages);
      let videoUrl = ""; if (productVideo) { videoUrl = await uploadToCloudinary(productVideo); }
      await addDoc(collection(db, "products"), { name: { ar: productForm.name_ar, en: productForm.name_en }, category: { ar: productForm.category_ar, en: productForm.category_en }, description: { ar: productForm.description_ar, en: productForm.description_en }, imageUrls, videoUrl, createdAt: serverTimestamp() });
      setProductSaveMessage("Product saved."); setProductForm({ name_ar: "", name_en: "", category_ar: "", category_en: "", description_ar: "", description_en: "" }); setProductImages([]); setProductVideo(null);
      const snap = await getDocs(collection(db, "products")); setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setProductSaveMessage("Save failed."); } finally { setProductLoading(false); }
  };
  const handleDeleteProduct = async (id) => { try { await deleteDoc(doc(db, "products", id)); setProducts((prev) => prev.filter((p) => p.id !== id)); } catch {} };

  // Client save
  const handleClientSave = async (e) => {
    e.preventDefault(); setClientMessage("");
    if (!clientForm.name_ar.trim() && !clientForm.name_en.trim()) { setClientMessage("يرجى إدخال اسم العميل"); return; }
    if (!clientFile) { setClientMessage("يرجى اختيار شعار العميل"); return; }
    try {
      setClientLoading(true); const logoUrl = await uploadToCloudinary(clientFile);
      await addDoc(collection(db, "clients"), { name: { ar: clientForm.name_ar, en: clientForm.name_en }, logoUrl, createdAt: serverTimestamp() });
      setClientMessage("تم حفظ العميل بنجاح"); setClientForm({ name_ar: "", name_en: "" }); setClientFile(null); setClientFileKey((k) => k + 1);
      const snap = await getDocs(collection(db, "clients")); setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setClientMessage("تعذر حفظ العميل."); } finally { setClientLoading(false); }
  };
  const handleDeleteClient = async (id) => { try { await deleteDoc(doc(db, "clients", id)); setClients((prev) => prev.filter((c) => c.id !== id)); } catch {} };

  // Blog save (multi-media)
  const handleBlogSave = async (e) => {
    e.preventDefault(); setBlogMessage("");
    try {
      setBlogLoading(true);
      const imageUrls = await uploadMultiple(blogImages);
      const videoUrls = await uploadMultiple(blogVideos);
      await addDoc(collection(db, "blog"), { title: { ar: blogForm.title_ar, en: blogForm.title_en }, body: { ar: blogForm.body_ar, en: blogForm.body_en }, imageUrls, videoUrls, createdAt: serverTimestamp() });
      setBlogForm({ title_ar: "", title_en: "", body_ar: "", body_en: "" }); setBlogImages([]); setBlogVideos([]); setBlogFileKey((k) => k + 1);
      const snap = await getDocs(query(collection(db, "blog"), orderBy("createdAt", "desc"))); setBlogPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setBlogMessage(t('admin_blog_saved'));
    } catch { setBlogMessage("تعذر الحفظ"); } finally { setBlogLoading(false); }
  };
  const handleDeleteBlog = async (id) => { try { await deleteDoc(doc(db, "blog", id)); setBlogPosts((prev) => prev.filter((a) => a.id !== id)); } catch {} };

  // News save (multi-media)
  const handleNewsSave = async (e) => {
    e.preventDefault(); setNewsMessage("");
    try {
      setNewsLoading(true);
      const imageUrls = await uploadMultiple(newsImages);
      const videoUrls = await uploadMultiple(newsVideos);
      await addDoc(collection(db, "news"), { title: { ar: newsForm.title_ar, en: newsForm.title_en }, body: { ar: newsForm.body_ar, en: newsForm.body_en }, imageUrls, videoUrls, createdAt: serverTimestamp() });
      setNewsForm({ title_ar: "", title_en: "", body_ar: "", body_en: "" }); setNewsImages([]); setNewsVideos([]); setNewsFileKey((k) => k + 1);
      const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"))); setNewsItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setNewsMessage(t('admin_news_save'));
    } catch { setNewsMessage("تعذر الحفظ"); } finally { setNewsLoading(false); }
  };
  const handleDeleteNews = async (id) => { try { await deleteDoc(doc(db, "news", id)); setNewsItems((prev) => prev.filter((n) => n.id !== id)); } catch {} };

  // Ads save (multi-media)
  const handleAdsSave = async (e) => {
    e.preventDefault(); setAdsMessage("");
    try {
      setAdsLoading(true);
      const imageUrls = await uploadMultiple(adsImages);
      const videoUrls = await uploadMultiple(adsVideos);
      await addDoc(collection(db, "ads"), { title: { ar: adsForm.title_ar, en: adsForm.title_en }, body: { ar: adsForm.body_ar, en: adsForm.body_en }, imageUrls, videoUrls, createdAt: serverTimestamp() });
      setAdsForm({ title_ar: "", title_en: "", body_ar: "", body_en: "" }); setAdsImages([]); setAdsVideos([]); setAdsFileKey((k) => k + 1);
      const snap = await getDocs(query(collection(db, "ads"), orderBy("createdAt", "desc"))); setAdsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setAdsMessage(t('admin_ads_saved'));
    } catch { setAdsMessage("تعذر الحفظ"); } finally { setAdsLoading(false); }
  };
  const handleDeleteAd = async (id) => { try { await deleteDoc(doc(db, "ads", id)); setAdsList((prev) => prev.filter((a) => a.id !== id)); } catch {} };

  const handleMarkRead = async (id) => { try { await updateDoc(doc(db, "messages", id), { status: "Read" }); setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "Read" } : m))); } catch {} };

  // Admin handlers
  const handleAdminPermToggle = (section, action) => { setAdminPerms((prev) => { const u = JSON.parse(JSON.stringify(prev)); u[section][action] = !u[section][action]; return u; }); };
  const handleAdminSave = async (e) => {
    e.preventDefault(); setAdminSaveMsg("");
    if (!adminForm.email.trim()) { setAdminSaveMsg("يرجى إدخال البريد الإلكتروني"); return; }
    try {
      setAdminLoading(true);
      const q = query(collection(db, "admins"), where("email", "==", adminForm.email.trim())); const existing = await getDocs(q);
      if (!existing.empty) { setAdminSaveMsg("هذا البريد مسجل بالفعل كمشرف"); return; }
      await addDoc(collection(db, "admins"), { email: adminForm.email.trim(), permissions: adminPerms, role: "Admin", createdAt: serverTimestamp() });
      setAdminSaveMsg("تم إضافة المشرف بنجاح"); setAdminForm({ email: "" }); setAdminPerms(JSON.parse(JSON.stringify(DEFAULT_PERMS)));
      const snap = await getDocs(collection(db, "admins")); setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setAdminSaveMsg("تعذر إضافة المشرف"); } finally { setAdminLoading(false); }
  };
  const handleDeleteAdmin = async (id, email) => { if (email === user.email) { setAdminSaveMsg("لا يمكنك حذف حسابك الخاص"); return; } try { await deleteDoc(doc(db, "admins", id)); setAdmins((prev) => prev.filter((a) => a.id !== id)); } catch {} };

  // Edit existing admin permissions
  const handleEditAdmin = (admin) => {
    setEditingAdminId(admin.id);
    setEditingAdminPerms(JSON.parse(JSON.stringify(admin.permissions || DEFAULT_PERMS)));
    setAdminSaveMsg("");
  };
  const handleEditPermToggle = (section, action) => {
    setEditingAdminPerms((prev) => {
      const u = JSON.parse(JSON.stringify(prev));
      if (!u[section]) u[section] = {};
      u[section][action] = !u[section][action];
      return u;
    });
  };
  const handleCancelEdit = () => { setEditingAdminId(null); setEditingAdminPerms(null); };
  const handleUpdateAdminPerms = async () => {
    if (!editingAdminId || !editingAdminPerms) return;
    try {
      setEditingAdminLoading(true);
      await updateDoc(doc(db, "admins", editingAdminId), { permissions: editingAdminPerms });
      setAdmins((prev) => prev.map((a) => a.id === editingAdminId ? { ...a, permissions: editingAdminPerms } : a));
      setAdminSaveMsg(language === 'ar' ? "تم تحديث الصلاحيات بنجاح" : "Permissions updated successfully");
      setEditingAdminId(null); setEditingAdminPerms(null);
    } catch { setAdminSaveMsg(language === 'ar' ? "تعذر تحديث الصلاحيات" : "Failed to update permissions"); }
    finally { setEditingAdminLoading(false); }
  };

  // Social handlers
  const handleSocialChange = (e) => { const { name, value, files } = e.target; if (name === "socialLogo") { setSocialFile(files && files[0] ? files[0] : null); return; } setSocialForm((prev) => ({ ...prev, [name]: value })); };
  const handleSocialSave = async (e) => {
    e.preventDefault(); setSocialMsg("");
    if (!socialForm.name.trim() || !socialForm.url.trim()) { setSocialMsg("يرجى ملء الاسم والرابط"); return; }
    try { setSocialLoading(true); let logoUrl = ""; if (socialFile) { logoUrl = await uploadToCloudinary(socialFile); } await addDoc(collection(db, "socialLinks"), { name: socialForm.name, url: socialForm.url, icon: socialForm.icon, color: socialForm.color, logoUrl, createdAt: serverTimestamp() }); setSocialMsg("تم حفظ الرابط بنجاح"); setSocialForm({ name: "", url: "", icon: "bi-globe", color: "#000000" }); setSocialFile(null); setSocialFileKey((k) => k + 1); const snap = await getDocs(collection(db, "socialLinks")); setSocialLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { setSocialMsg("تعذر حفظ الرابط"); } finally { setSocialLoading(false); }
  };
  const handleDeleteSocial = async (id) => { try { await deleteDoc(doc(db, "socialLinks", id)); setSocialLinks((prev) => prev.filter((s) => s.id !== id)); } catch {} };
  const handleWhatsappChange = (e) => { const { name, value, type, checked } = e.target; setWhatsappSettings((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value })); };
  const handleWhatsappSave = async (e) => { e.preventDefault(); setWhatsappMsg(""); if (!whatsappSettings.phone.trim()) { setWhatsappMsg("يرجى إدخال رقم الواتساب"); return; } try { setWhatsappLoading(true); await setDoc(doc(db, "settings", "whatsapp"), { phone: whatsappSettings.phone, message: whatsappSettings.message, enabled: whatsappSettings.enabled, updatedAt: serverTimestamp() }); setWhatsappMsg("تم حفظ إعدادات الواتساب بنجاح"); } catch { setWhatsappMsg("تعذر حفظ الإعدادات"); } finally { setWhatsappLoading(false); } };

  // Service handlers
  const handleServiceChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "serviceImage") { setServiceFile(files && files[0] ? files[0] : null); return; }
    setServiceForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleServiceSave = async (e) => {
    e.preventDefault(); setServiceMsg("");
    try {
      setServiceLoading(true);
      let imageUrl = "";
      if (serviceFile) imageUrl = await uploadToCloudinary(serviceFile);
      await addDoc(collection(db, "services"), {
        title: { ar: serviceForm.title_ar, en: serviceForm.title_en },
        shortDesc: { ar: serviceForm.short_ar, en: serviceForm.short_en },
        fullDesc: { ar: serviceForm.full_ar, en: serviceForm.full_en },
        icon: serviceForm.icon,
        imageUrl,
        createdAt: serverTimestamp()
      });
      setServiceMsg("تم حفظ الخدمة بنجاح");
      setServiceForm({ title_ar: "", title_en: "", short_ar: "", short_en: "", full_ar: "", full_en: "", icon: "bi-briefcase" });
      setServiceFile(null); setServiceFileKey(k => k + 1);
      const snap = await getDocs(collection(db, "services")); setServicesList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setServiceMsg("تعذر حفظ الخدمة"); } finally { setServiceLoading(false); }
  };
  const handleDeleteService = async (id) => { try { await deleteDoc(doc(db, "services", id)); setServicesList(prev => prev.filter(s => s.id !== id)); } catch {} };

  // Team handlers
  const confirmDelete = () => window.confirm(t("admin_team_confirm_delete"));

  const resetTeamForms = () => {
    setDeptForm({ name_ar: "", name_en: "" });
    setSectionForm({ name_ar: "", name_en: "", departmentId: "" });
    setTitleForm({ title_ar: "", title_en: "", sectionId: "", level: "staff" });
    setEmployeeForm({ name_ar: "", name_en: "", bio_ar: "", bio_en: "", resp_ar: "", resp_en: "", titleId: "", managerId: "" });
    setEmployeeImageFile(null);
    setEmployeeCvFile(null);
    setEmployeeFileKey((k) => k + 1);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    try {
      setTeamLoading(true);
      setTeamMsg("");
      const payload = { name: { ar: deptForm.name_ar, en: deptForm.name_en }, updatedAt: serverTimestamp() };
      if (editingDeptId) {
        await updateDoc(doc(db, "team_departments", editingDeptId), payload);
      } else {
        await addDoc(collection(db, "team_departments"), { ...payload, createdAt: serverTimestamp() });
      }
      const snap = await getDocs(collection(db, "team_departments"));
      setDepartments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setDeptModalOpen(false);
      setEditingDeptId(null);
      setDeptForm({ name_ar: "", name_en: "" });
      setTeamMsg(t("admin_save"));
    } catch {
      setTeamMsg("تعذر الحفظ");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      setTeamLoading(true);
      setTeamMsg("");
      const payload = { name: { ar: sectionForm.name_ar, en: sectionForm.name_en }, departmentId: sectionForm.departmentId, updatedAt: serverTimestamp() };
      if (editingSectionId) {
        await updateDoc(doc(db, "team_sections", editingSectionId), payload);
      } else {
        await addDoc(collection(db, "team_sections"), { ...payload, createdAt: serverTimestamp() });
      }
      const snap = await getDocs(collection(db, "team_sections"));
      setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setSectionModalOpen(false);
      setEditingSectionId(null);
      setSectionForm({ name_ar: "", name_en: "", departmentId: "" });
      setTeamMsg(t("admin_save"));
    } catch {
      setTeamMsg("تعذر الحفظ");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleSaveTitle = async (e) => {
    e.preventDefault();
    try {
      setTeamLoading(true);
      setTeamMsg("");
      const payload = { title: { ar: titleForm.title_ar, en: titleForm.title_en }, sectionId: titleForm.sectionId, level: titleForm.level, updatedAt: serverTimestamp() };
      if (editingTitleId) {
        await updateDoc(doc(db, "team_titles", editingTitleId), payload);
      } else {
        await addDoc(collection(db, "team_titles"), { ...payload, createdAt: serverTimestamp() });
      }
      const snap = await getDocs(collection(db, "team_titles"));
      setTitles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTitleModalOpen(false);
      setEditingTitleId(null);
      setTitleForm({ title_ar: "", title_en: "", sectionId: "", level: "staff" });
      setTeamMsg(t("admin_save"));
    } catch {
      setTeamMsg("تعذر الحفظ");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      setTeamLoading(true);
      setTeamMsg("");
      const imageUrl = employeeImageFile ? await uploadToCloudinary(employeeImageFile) : "";
      const cvUrl = employeeCvFile ? await uploadToCloudinary(employeeCvFile) : "";
      const payload = {
        name: { ar: employeeForm.name_ar, en: employeeForm.name_en },
        bio: { ar: employeeForm.bio_ar, en: employeeForm.bio_en },
        responsibilities: { ar: employeeForm.resp_ar, en: employeeForm.resp_en },
        titleId: employeeForm.titleId,
        managerId: employeeForm.managerId || "",
        imageUrl,
        cvUrl,
        updatedAt: serverTimestamp(),
      };
      if (editingEmployeeId) {
        await updateDoc(doc(db, "team_employees", editingEmployeeId), payload);
      } else {
        await addDoc(collection(db, "team_employees"), { ...payload, createdAt: serverTimestamp() });
      }
      const snap = await getDocs(collection(db, "team_employees"));
      setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEmployeeModalOpen(false);
      setEditingEmployeeId(null);
      resetTeamForms();
      setTeamMsg(t("admin_save"));
    } catch {
      setTeamMsg("تعذر الحفظ");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleEditDepartment = (item) => { setEditingDeptId(item.id); setDeptForm({ name_ar: item.name?.ar || "", name_en: item.name?.en || "" }); setDeptModalOpen(true); };
  const handleEditSection = (item) => { setEditingSectionId(item.id); setSectionForm({ name_ar: item.name?.ar || "", name_en: item.name?.en || "", departmentId: item.departmentId || "" }); setSectionModalOpen(true); };
  const handleEditTitle = (item) => { setEditingTitleId(item.id); setTitleForm({ title_ar: item.title?.ar || "", title_en: item.title?.en || "", sectionId: item.sectionId || "", level: item.level || "staff" }); setTitleModalOpen(true); };
  const handleEditEmployee = (item) => {
    setEditingEmployeeId(item.id);
    setEmployeeForm({
      name_ar: item.name?.ar || "",
      name_en: item.name?.en || "",
      bio_ar: item.bio?.ar || "",
      bio_en: item.bio?.en || "",
      resp_ar: item.responsibilities?.ar || "",
      resp_en: item.responsibilities?.en || "",
      titleId: item.titleId || "",
      managerId: item.managerId || "",
    });
    setEmployeeModalOpen(true);
  };

  const handleDeleteDepartment = async (id) => {
    if (!confirmDelete()) return;
    try { await deleteDoc(doc(db, "team_departments", id)); setDepartments((prev) => prev.filter((d) => d.id !== id)); } catch {}
  };
  const handleDeleteSection = async (id) => {
    if (!confirmDelete()) return;
    try { await deleteDoc(doc(db, "team_sections", id)); setSections((prev) => prev.filter((d) => d.id !== id)); } catch {}
  };
  const handleDeleteTitle = async (id) => {
    if (!confirmDelete()) return;
    try { await deleteDoc(doc(db, "team_titles", id)); setTitles((prev) => prev.filter((d) => d.id !== id)); } catch {}
  };
  const handleDeleteEmployee = async (id) => {
    if (!confirmDelete()) return;
    try { await deleteDoc(doc(db, "team_employees", id)); setEmployees((prev) => prev.filter((d) => d.id !== id)); } catch {}
  };

  // Job handlers
  const handleJobChange = (e) => {
    const { name, value } = e.target;
    setJobForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleJobEdit = (job) => {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title || "",
      department: job.department || "",
      type: job.type || "",
      location: job.location || "",
      description: job.description || "",
      deadline: job.deadline || "",
      status: job.status || "open",
    });
  };

  const handleJobToggle = async (job) => {
    try {
      const nextStatus = job.status === "closed" ? "open" : "closed";
      await updateDoc(doc(db, "jobs", job.id), { status: nextStatus, updatedAt: serverTimestamp() });
      setJobsList((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j)));
    } catch {}
  };

  const handleJobSave = async (e) => {
    e.preventDefault();
    setJobMessage("");
    try {
      setJobLoading(true);
      if (editingJobId) {
        await updateDoc(doc(db, "jobs", editingJobId), { ...jobForm, updatedAt: serverTimestamp() });
        setJobsList((prev) => prev.map((j) => (j.id === editingJobId ? { ...j, ...jobForm } : j)));
      } else {
        const docRef = await addDoc(collection(db, "jobs"), { ...jobForm, createdAt: serverTimestamp() });
        setJobsList((prev) => [{ id: docRef.id, ...jobForm }, ...prev]);
      }
      setJobMessage(t("admin_save"));
      setEditingJobId(null);
      setJobForm({ title: "", department: "", type: "", location: "", description: "", deadline: "", status: "open" });
    } catch {
      setJobMessage("تعذر الحفظ");
    } finally {
      setJobLoading(false);
    }
  };

  // Quote handlers
  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote);
    setQuoteItems((quote.items || []).map((item) => ({ ...item })));
    setQuoteNotes(quote.adminNotes || "");
    setQuoteStatus(quote.status || "pending");
    setQuoteMsg("");
  };

  const handleQuoteItemPriceChange = (index, value) => {
    setQuoteItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, price: value } : item)));
  };

  const handleSaveQuote = async () => {
    if (!selectedQuote) return;
    try {
      setQuoteMsg("");
      await updateDoc(doc(db, "quotes", selectedQuote.id), {
        items: quoteItems,
        adminNotes: quoteNotes,
        status: quoteStatus,
        updatedAt: serverTimestamp(),
      });
      setQuoteMsg(language === 'ar' ? "تم حفظ عرض السعر" : "Quote saved");
      setQuotes((prev) => prev.map((q) => (q.id === selectedQuote.id ? { ...q, items: quoteItems, adminNotes: quoteNotes, status: quoteStatus } : q)));
    } catch {
      setQuoteMsg(language === 'ar' ? "تعذر حفظ عرض السعر" : "Failed to save quote");
    }
  };

  const generatePDF = async (quote) => {
    if (!quote) return;
    try {
      setPdfGenerating(true);

      // Calculate Quote Reference ID
      const quoteIndex = quotes.findIndex(q => q.id === quote.id);
      const refNumber = formatQuoteID(quote.createdAt, quoteIndex);

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Colors
      const navyBlue = [0, 28, 61];
      const cyanAccent = [0, 184, 176];
      const white = [255, 255, 255];

      // Header Background
      pdf.setFillColor(...navyBlue);
      pdf.rect(0, 0, pageW, 100, 'F');

      // Company Names - Based on Language Direction
      pdf.setTextColor(...white);

      if (isRTL) {
        // Arabic Primary (Right to Left)
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("QIMAT ALAIBTIKAR FOR INTEGRATED SOLUTIONS CO. LTD", pageW - 40, 35, { align: "right" });
        pdf.setFontSize(11);
        pdf.text("Trading - Import - Export - Logistics", pageW - 40, 50, { align: "right" });
        pdf.setFontSize(10);
        pdf.text("CR: 1010XXXXXX | VAT: 3XXXXXXXXXX003", pageW - 40, 65, { align: "right" });

        // English Sub (Left)
        pdf.setFontSize(12);
        pdf.text("Qimat AlAibtikar Co.", 40, 40);
        pdf.setFontSize(9);
        pdf.text("Riyadh, Saudi Arabia", 40, 55);
      } else {
        // English Primary (Left to Right)
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("QIMAT ALAIBTIKAR FOR INTEGRATED SOLUTIONS CO. LTD", 40, 35);
        pdf.setFontSize(11);
        pdf.text("Trading - Import - Export - Logistics", 40, 50);
        pdf.setFontSize(10);
        pdf.text("CR: 1010XXXXXX | VAT: 3XXXXXXXXXX003", 40, 65);

        // Arabic Sub (Right) - Using transliteration for compatibility
        pdf.setFontSize(12);
        pdf.text("Qimat AlAibtikar Co.", pageW - 40, 40, { align: "right" });
        pdf.setFontSize(9);
        pdf.text("Riyadh, KSA", pageW - 40, 55, { align: "right" });
      }

      // Cyan Separator Line
      pdf.setFillColor(...cyanAccent);
      pdf.rect(0, 100, pageW, 6, 'F');

      // Title: OFFICIAL QUOTATION - Bilingual
      pdf.setFontSize(22);
      pdf.setTextColor(...navyBlue);
      pdf.setFont("helvetica", "bold");

      const titleEN = "OFFICIAL QUOTATION";
      const titleAR = t('quote_title') || "Official Quotation";

      if (isRTL) {
        pdf.text(titleEN, pageW / 2, 135, { align: "center" });
        pdf.setFontSize(14);
        pdf.text(titleAR, pageW / 2, 155, { align: "center" });
      } else {
        pdf.text(titleEN, pageW / 2, 135, { align: "center" });
        pdf.setFontSize(14);
        pdf.text("Official Price Quotation", pageW / 2, 155, { align: "center" });
      }

      // Quote Info Box
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.setFont("helvetica", "normal");

      const infoY = 180;
      const clientLabel = isRTL ? "Client:" : "Client:";
      const phoneLabel = isRTL ? "Phone:" : "Phone:";
      const emailLabel = isRTL ? "Email:" : "Email:";
      const refLabel = isRTL ? "Ref No.:" : "Ref No.:";
      const dateLabel = isRTL ? "Date:" : "Date:";
      const entityLabel = isRTL ? "Entity:" : "Entity:";

      // Left Side - Client Info
      pdf.setFont("helvetica", "bold");
      pdf.text(clientLabel, 40, infoY);
      pdf.setFont("helvetica", "normal");
      pdf.text(quote.contactInfo?.fullName || quote.entityInfo?.companyName || "N/A", 90, infoY);

      pdf.setFont("helvetica", "bold");
      pdf.text(phoneLabel, 40, infoY + 15);
      pdf.setFont("helvetica", "normal");
      pdf.text(quote.contactInfo?.phone || "N/A", 90, infoY + 15);

      pdf.setFont("helvetica", "bold");
      pdf.text(emailLabel, 40, infoY + 30);
      pdf.setFont("helvetica", "normal");
      pdf.text(quote.contactInfo?.email || "N/A", 90, infoY + 30);

      // Right Side - Quote Info
      const dateStr = quote.createdAt?.seconds
        ? new Date(quote.createdAt.seconds * 1000).toLocaleDateString(isRTL ? 'ar-SA' : 'en-GB')
        : new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-GB');

      pdf.setFont("helvetica", "bold");
      pdf.text(refLabel, pageW - 180, infoY);
      pdf.setFont("helvetica", "normal");
      pdf.text(refNumber, pageW - 40, infoY, { align: "right" });

      pdf.setFont("helvetica", "bold");
      pdf.text(dateLabel, pageW - 180, infoY + 15);
      pdf.setFont("helvetica", "normal");
      pdf.text(dateStr, pageW - 40, infoY + 15, { align: "right" });

      pdf.setFont("helvetica", "bold");
      pdf.text(entityLabel, pageW - 180, infoY + 30);
      pdf.setFont("helvetica", "normal");
      const entityType = quote.entityInfo?.type === 'company' ? (isRTL ? 'Company' : 'Company') : (isRTL ? 'Individual' : 'Individual');
      pdf.text(entityType, pageW - 40, infoY + 30, { align: "right" });

      // Items Table
      const tableY = 240;
      const items = quote.id === selectedQuote?.id ? quoteItems : (quote.items || []);

      // Table Headers - Bilingual
      const colWidths = [40, 195, 85, 65, 100];
      const headers = [
        "No.",
        "Description",
        "Unit Price",
        "Qty",
        "Total"
      ];

      // Header Row
      pdf.setFillColor(...navyBlue);
      pdf.rect(40, tableY, pageW - 80, 28, 'F');
      pdf.setTextColor(...white);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");

      let xPos = 45;
      headers.forEach((header, i) => {
        pdf.text(header, xPos + 5, tableY + 18);
        xPos += colWidths[i];
      });

      // Table Rows
      pdf.setTextColor(30, 30, 30);
      pdf.setFont("helvetica", "normal");
      let rowY = tableY + 28;
      let grandTotal = 0;

      items.forEach((item, idx) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        const total = qty * price;
        grandTotal += total;

        // Alternate row colors
        if (idx % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(40, rowY, pageW - 80, 24, 'F');
        }

        // Row border
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(40, rowY, pageW - 80, 24, 'S');

        pdf.setFontSize(9);
        xPos = 45;
        pdf.text(String(idx + 1), xPos + 12, rowY + 16);
        xPos += colWidths[0];

        // Truncate long service names
        const serviceName = (item.serviceName || "N/A").substring(0, 35);
        pdf.text(serviceName, xPos + 5, rowY + 16);
        xPos += colWidths[1];

        pdf.text(`SAR ${price.toFixed(2)}`, xPos + 5, rowY + 16);
        xPos += colWidths[2];
        pdf.text(String(item.quantity || 0), xPos + 15, rowY + 16);
        xPos += colWidths[3];
        pdf.text(`SAR ${total.toFixed(2)}`, xPos + 5, rowY + 16);

        rowY += 24;
      });

      // Grand Total Row
      pdf.setFillColor(...cyanAccent);
      pdf.rect(40, rowY, pageW - 80, 32, 'F');
      pdf.setTextColor(...white);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      const totalLabel = isRTL ? "GRAND TOTAL" : "GRAND TOTAL";
      pdf.text(totalLabel, 55, rowY + 21);
      pdf.text(`SAR ${grandTotal.toFixed(2)}`, pageW - 55, rowY + 21, { align: "right" });

      // Notes Section
      const notesY = rowY + 55;
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(isRTL ? "Notes:" : "Notes:", 40, notesY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const notesText = quote.adminNotes || "No additional notes.";
      pdf.text(notesText.substring(0, 100), 40, notesY + 15);

      // Terms & Conditions
      const termsY = notesY + 45;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Terms & Conditions:", 40, termsY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("1. Prices are valid for 15 days from the date of issue.", 40, termsY + 14);
      pdf.text("2. Payment: 50% advance, 50% upon delivery.", 40, termsY + 26);
      pdf.text("3. Delivery time will be confirmed upon order confirmation.", 40, termsY + 38);
      pdf.text("4. All prices are in Saudi Riyals (SAR) and exclude VAT unless stated.", 40, termsY + 50);

      // Footer
      pdf.setFillColor(...navyBlue);
      pdf.rect(0, pageH - 55, pageW, 55, 'F');

      // Cyan accent line above footer
      pdf.setFillColor(...cyanAccent);
      pdf.rect(0, pageH - 55, pageW, 4, 'F');

      pdf.setTextColor(...white);
      pdf.setFontSize(9);
      pdf.text("Riyadh, Saudi Arabia", pageW / 2, pageH - 35, { align: "center" });
      pdf.setFontSize(8);
      pdf.text("www.qimatco.com | info@qimatco.com | +966 XX XXX XXXX", pageW / 2, pageH - 20, { align: "center" });

      // Watermark / Document ID
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(7);
      pdf.text(`Document ID: ${quote.id}`, 40, pageH - 65);
      pdf.text("This is a computer-generated document.", pageW - 40, pageH - 65, { align: "right" });

      // Save PDF
      pdf.save(`Quotation-${refNumber}.pdf`);
    } finally {
      setPdfGenerating(false);
      setPdfQuote(null);
    }
  };

  // ── GENERIC MEDIA FORM RENDERER ──
  const renderMediaForm = ({ sectionKey, titleAr, titleEn, formState, onFormChange, imagesInputName, videosInputName, onSubmit, isLoading, msgText, permKey, fileKey }) => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }}>{t(`admin_tab_${sectionKey}`)}</h4>
        {msgText && <div className="alert alert-info py-1 small">{msgText}</div>}
        {can(userPermissions, permKey, "add") ? (
          <form className="row g-3" onSubmit={onSubmit}>
            <div className="col-12"><h6 className="text-muted">🇸🇦 {language === 'ar' ? 'العربية' : 'Arabic'}</h6></div>
            <div className="col-md-12"><label className="form-label">{titleAr}</label><input name="title_ar" type="text" className="form-control" dir="rtl" value={formState.title_ar} onChange={onFormChange} required /></div>
            <div className="col-12"><label className="form-label">{t(`admin_${sectionKey}_body_ar`) || 'المحتوى (عربي)'}</label><textarea name="body_ar" className="form-control" rows="3" dir="rtl" value={formState.body_ar} onChange={onFormChange} required></textarea></div>
            <div className="col-12"><h6 className="text-muted">🇬🇧 {language === 'ar' ? 'الإنجليزية' : 'English'}</h6></div>
            <div className="col-md-12"><label className="form-label">{titleEn}</label><input name="title_en" type="text" className="form-control" dir="ltr" value={formState.title_en} onChange={onFormChange} /></div>
            <div className="col-12"><label className="form-label">{t(`admin_${sectionKey}_body_en`) || 'Content (English)'}</label><textarea name="body_en" className="form-control" rows="3" dir="ltr" value={formState.body_en} onChange={onFormChange}></textarea></div>
            <div className="col-md-6"><label className="form-label"><i className="bi bi-images me-1"></i>{t('admin_media_images')}</label><input key={`img-${fileKey}`} name={imagesInputName} type="file" accept="image/*" multiple className="form-control" onChange={onFormChange} /></div>
            <div className="col-md-6"><label className="form-label"><i className="bi bi-camera-video me-1"></i>{t('admin_media_videos')}</label><input key={`vid-${fileKey}`} name={videosInputName} type="file" accept="video/*" multiple className="form-control" onChange={onFormChange} /></div>
            <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={isLoading}>{isLoading ? t('admin_uploading') : t('admin_save')}</button></div>
          </form>
        ) : <div className="alert alert-secondary">{t('admin_no_permission')}</div>}
      </div>
    </div>
  );

  // ── GENERIC MEDIA LIST RENDERER ──
  const renderMediaList = (items, permKey, onDelete) => items.length > 0 && (
    <div className="table-responsive mt-4">
      <table className="table align-middle">
        <thead><tr><th>{t('admin_media_preview')}</th><th>AR</th><th>EN</th>{can(userPermissions, permKey, "delete") && <th></th>}</tr></thead>
        <tbody>{items.map((item) => (
          <tr key={item.id}>
            <td>{item.imageUrls?.length ? <img src={item.imageUrls[0]} alt="" style={{ maxHeight: 40 }} /> : item.videoUrls?.length ? <i className="bi bi-play-circle" style={{ fontSize: 24 }}></i> : "-"}</td>
            <td>{typeof item.title === "object" ? item.title.ar : item.title}</td>
            <td>{typeof item.title === "object" ? item.title.en : "-"}</td>
            {can(userPermissions, permKey, "delete") && <td><button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item.id)}>{t('admin_delete')}</button></td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  // ── RENDER TABS ──
  const renderShipmentsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_shipments')}</h4>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleReset} disabled={loading}>{t('admin_reset')}</button>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleLoad} disabled={loading}>{t('admin_load')}</button>
          </div>
        </div>
        {can(userPermissions, "shipments", "add") ? (
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6"><label className="form-label">Tracking ID</label><input name="id" type="text" className="form-control" value={form.id} onChange={handleChange} placeholder="QIM-123456" /></div>
            <div className="col-md-6"><label className="form-label">Status</label><select name="status" className="form-select" value={form.status} onChange={handleChange}><option>Pending</option><option>Processing</option><option>In Transit</option><option>Clearing Customs</option><option>Delivered</option><option>On Hold</option></select></div>
            <div className="col-md-4"><label className="form-label">Customer Name</label><input name="customerName" type="text" className="form-control" value={form.customerName} onChange={handleChange} /></div>
            <div className="col-md-4"><label className="form-label">Origin</label><input name="origin" type="text" className="form-control" value={form.origin} onChange={handleChange} /></div>
            <div className="col-md-4"><label className="form-label">Destination</label><input name="destination" type="text" className="form-control" value={form.destination} onChange={handleChange} /></div>
            <div className="col-md-6"><label className="form-label">ETA</label><input name="eta" type="text" className="form-control" value={form.eta} onChange={handleChange} placeholder="YYYY-MM-DD" /></div>
            <div className="col-md-6"><label className="form-label">Notes</label><textarea name="notes" className="form-control" rows="3" value={form.notes} onChange={handleChange}></textarea></div>
            <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={loading}>{loading ? t('admin_saving') : t('admin_save')}</button></div>
          </form>
        ) : <div className="alert alert-secondary">{t('admin_no_permission')}</div>}
        {message && <div className="alert alert-info mt-3">{message}</div>}
      </div>
    </div>
  );

  const renderProductsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_products')}</h4>
          {productSaveMessage && <span className="small text-info">{productSaveMessage}</span>}
        </div>
        {products.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table align-middle">
              <thead><tr><th>{t('admin_media_preview')}</th><th>AR</th><th>EN</th>{can(userPermissions, "products", "delete") && <th></th>}</tr></thead>
              <tbody>{products.map((p) => (
                <tr key={p.id}>
                  <td>{p.imageUrls?.length ? <img src={p.imageUrls[0]} alt={loc(p.name)} style={{ maxHeight: 50 }} /> : "-"}</td>
                  <td>{typeof p.name === "object" ? p.name.ar : p.name}</td>
                  <td>{typeof p.name === "object" ? p.name.en : "-"}</td>
                  {can(userPermissions, "products", "delete") && <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(p.id)}>{t('admin_delete')}</button></td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {can(userPermissions, "products", "add") ? (
          <form className="row g-3" onSubmit={handleProductSave}>
            <div className="col-12"><h6 className="text-muted">🇸🇦 {language === 'ar' ? 'العربية' : 'Arabic'}</h6></div>
            <div className="col-md-6"><label className="form-label">{t('admin_product_name_ar')}</label><input name="name_ar" type="text" className="form-control" dir="rtl" value={productForm.name_ar} onChange={handleProductChange} required /></div>
            <div className="col-md-6"><label className="form-label">{t('admin_product_category_ar')}</label><input name="category_ar" type="text" className="form-control" dir="rtl" value={productForm.category_ar} onChange={handleProductChange} /></div>
            <div className="col-12"><label className="form-label">{t('admin_product_desc_ar')}</label><textarea name="description_ar" className="form-control" rows="2" dir="rtl" value={productForm.description_ar} onChange={handleProductChange}></textarea></div>
            <div className="col-12"><h6 className="text-muted">🇬🇧 {language === 'ar' ? 'الإنجليزية' : 'English'}</h6></div>
            <div className="col-md-6"><label className="form-label">{t('admin_product_name_en')}</label><input name="name_en" type="text" className="form-control" dir="ltr" value={productForm.name_en} onChange={handleProductChange} /></div>
            <div className="col-md-6"><label className="form-label">{t('admin_product_category_en')}</label><input name="category_en" type="text" className="form-control" dir="ltr" value={productForm.category_en} onChange={handleProductChange} /></div>
            <div className="col-12"><label className="form-label">{t('admin_product_desc_en')}</label><textarea name="description_en" className="form-control" rows="2" dir="ltr" value={productForm.description_en} onChange={handleProductChange}></textarea></div>
            <div className="col-md-6"><label className="form-label">{t('admin_product_images')}</label><input name="images" type="file" accept="image/*" multiple className="form-control" onChange={handleProductChange} /></div>
            <div className="col-md-6"><label className="form-label">{t('admin_product_video')}</label><input name="video" type="file" accept="video/*" className="form-control" onChange={handleProductChange} /></div>
            <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={productLoading}>{productLoading ? t('admin_uploading') : t('admin_product_save')}</button></div>
          </form>
        ) : <div className="alert alert-secondary">{t('admin_no_permission')}</div>}
      </div>
    </div>
  );

  const renderClientsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_clients')}</h4>
          {clientMessage && <span className="small text-info">{clientMessage}</span>}
        </div>
        {clients.length > 0 && (
          <div className="table-responsive mb-4"><table className="table align-middle"><thead><tr><th>{t('admin_client_logo')}</th><th>AR</th><th>EN</th>{can(userPermissions, "clients", "delete") && <th></th>}</tr></thead>
            <tbody>{clients.map((c) => (<tr key={c.id}><td>{c.logoUrl ? <img src={c.logoUrl} alt={loc(c.name)} style={{ maxHeight: 50 }} /> : "-"}</td><td>{typeof c.name === "object" ? c.name.ar : c.name}</td><td>{typeof c.name === "object" ? c.name.en : "-"}</td>{can(userPermissions, "clients", "delete") && <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClient(c.id)}>{t('admin_delete')}</button></td>}</tr>))}</tbody></table></div>
        )}
        {can(userPermissions, "clients", "add") ? (
          <form className="row g-3" onSubmit={handleClientSave}>
            <div className="col-md-4"><label className="form-label">{t('admin_client_name_ar')}</label><input name="name_ar" type="text" className="form-control" dir="rtl" value={clientForm.name_ar} onChange={handleClientChange} required /></div>
            <div className="col-md-4"><label className="form-label">{t('admin_client_name_en')}</label><input name="name_en" type="text" className="form-control" dir="ltr" value={clientForm.name_en} onChange={handleClientChange} /></div>
            <div className="col-md-4"><label className="form-label">{t('admin_client_logo')}</label><input key={clientFileKey} name="clientLogo" type="file" accept="image/*" className="form-control" onChange={handleClientChange} required /></div>
            <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={clientLoading}>{clientLoading ? t('admin_uploading') : t('admin_client_save')}</button></div>
          </form>
        ) : <div className="alert alert-secondary mt-2">{t('admin_no_permission')}</div>}
      </div>
    </div>
  );

  const renderBlogTab = () => (<>
    {renderMediaForm({ sectionKey: "blog", titleAr: t('admin_blog_title_ar'), titleEn: t('admin_blog_title_en'), formState: blogForm, onFormChange: handleBlogChange, imagesInputName: "blogImages", videosInputName: "blogVideos", onSubmit: handleBlogSave, isLoading: blogLoading, msgText: blogMessage, permKey: "blog", fileKey: blogFileKey })}
    {renderMediaList(blogPosts, "blog", handleDeleteBlog)}
  </>);

  const renderServicesTab = () => (
    <div className="card shadow-sm border-0"><div className="card-body p-4">
      <h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_services')}</h4>
      {serviceMsg && <div className="alert alert-info py-1 small">{serviceMsg}</div>}

      {servicesList.length > 0 && (
        <div className="table-responsive mb-4"><table className="table align-middle"><thead><tr><th>صورة</th><th>الاسم</th><th>أيقونة</th>{can(userPermissions, "services", "delete") && <th></th>}</tr></thead>
          <tbody>{servicesList.map((s) => (<tr key={s.id}><td>{s.imageUrl ? <img src={s.imageUrl} alt="" style={{ maxHeight: 40 }} /> : "-"}</td><td>{s.title?.ar}</td><td><i className={`bi ${s.icon} fs-4`}></i></td>{can(userPermissions, "services", "delete") && <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteService(s.id)}>حذف</button></td>}</tr>))}</tbody></table></div>
      )}

      {can(userPermissions, "services", "add") && (
        <form className="row g-3" onSubmit={handleServiceSave}>
          <div className="col-12"><h6 className="text-muted">🇸🇦 العربية</h6></div>
          <div className="col-md-12"><label className="form-label">اسم الخدمة</label><input name="title_ar" type="text" className="form-control" dir="rtl" value={serviceForm.title_ar} onChange={handleServiceChange} required /></div>
          <div className="col-md-12"><label className="form-label">وصف قصير (للبطاقة)</label><textarea name="short_ar" className="form-control" rows="2" dir="rtl" value={serviceForm.short_ar} onChange={handleServiceChange} required></textarea></div>
          <div className="col-md-12"><label className="form-label">وصف كامل (لصفحة التفاصيل)</label><textarea name="full_ar" className="form-control" rows="4" dir="rtl" value={serviceForm.full_ar} onChange={handleServiceChange}></textarea></div>

          <div className="col-12"><h6 className="text-muted">🇬🇧 English</h6></div>
          <div className="col-md-12"><label className="form-label">Service Name</label><input name="title_en" type="text" className="form-control" dir="ltr" value={serviceForm.title_en} onChange={handleServiceChange} /></div>
          <div className="col-md-12"><label className="form-label">Short Description</label><textarea name="short_en" className="form-control" rows="2" dir="ltr" value={serviceForm.short_en} onChange={handleServiceChange}></textarea></div>
          <div className="col-md-12"><label className="form-label">Full Description</label><textarea name="full_en" className="form-control" rows="4" dir="ltr" value={serviceForm.full_en} onChange={handleServiceChange}></textarea></div>

          <div className="col-md-6"><label className="form-label">أيقونة (Bootstrap Class)</label><input name="icon" type="text" className="form-control" value={serviceForm.icon} onChange={handleServiceChange} placeholder="bi-truck" /></div>
          <div className="col-md-6"><label className="form-label">صورة الغلاف</label><input key={serviceFileKey} name="serviceImage" type="file" accept="image/*" className="form-control" onChange={handleServiceChange} required /></div>
          <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={serviceLoading}>{serviceLoading ? "جاري الحفظ..." : "حفظ الخدمة"}</button></div>
        </form>
      )}
    </div></div>
  );

  const renderNewsTab = () => (<>
    {renderMediaForm({ sectionKey: "news", titleAr: t('admin_news_title_ar'), titleEn: t('admin_news_title_en'), formState: newsForm, onFormChange: handleNewsChange, imagesInputName: "newsImages", videosInputName: "adsVideos", onSubmit: handleNewsSave, isLoading: newsLoading, msgText: newsMessage, permKey: "news", fileKey: newsFileKey })}
    {renderMediaList(newsItems, "news", handleDeleteNews)}
  </>);

  const renderAdsTab = () => (<>
    {renderMediaForm({ sectionKey: "ads", titleAr: t('admin_ads_title_ar'), titleEn: t('admin_ads_title_en'), formState: adsForm, onFormChange: handleAdsChange, imagesInputName: "adsImages", videosInputName: "adsVideos", onSubmit: handleAdsSave, isLoading: adsLoading, msgText: adsMessage, permKey: "ads", fileKey: adsFileKey })}
    {renderMediaList(adsList, "ads", handleDeleteAd)}
  </>);

  const renderMessagesTab = () => (
    <div className="card shadow-sm border-0"><div className="card-body p-4">
      <div className="d-flex justify-content-between align-items-center mb-3"><h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_messages')}</h4>{messagesLoading && <span className="text-muted small">{t('admin_msg_loading')}</span>}{messagesError && <span className="text-danger small">{messagesError}</span>}</div>
      {!can(userPermissions, "messages", "view") && <div className="alert alert-secondary">{t('admin_no_permission')}</div>}
      {can(userPermissions, "messages", "view") && !messagesLoading && messages.length === 0 && <div className="alert alert-info">{t('admin_msg_empty')}</div>}
      {can(userPermissions, "messages", "view") && !messagesLoading && messages.length > 0 && (
        <div className="table-responsive"><table className="table table-bordered table-striped align-middle"><thead className="table-dark"><tr><th>{t('admin_msg_name')}</th><th>{t('admin_msg_phone')}</th><th>{t('admin_msg_type')}</th><th>{t('admin_msg_message')}</th><th>{t('admin_msg_status')}</th>{can(userPermissions, "messages", "markRead") && <th></th>}</tr></thead>
          <tbody>{messages.map((msg) => (<tr key={msg.id}><td>{msg.name || "-"}</td><td>{msg.phone || "-"}</td><td>{msg.type || msg.intent || "-"}</td><td style={{ maxWidth: 200 }}>{msg.message || "-"}</td><td><span className={`badge ${msg.status === "New" ? "bg-warning text-dark" : "bg-success"}`}>{msg.status === "New" ? t('admin_msg_new') : t('admin_msg_read')}</span></td>{can(userPermissions, "messages", "markRead") && <td>{msg.status !== "Read" && <button className="btn btn-sm btn-outline-primary" onClick={() => handleMarkRead(msg.id)}>{t('admin_msg_mark_read')}</button>}</td>}</tr>))}</tbody></table></div>
      )}
    </div></div>
  );

  const renderTeamTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <h4 style={{ color: "var(--primary-color)" }}>{t("admin_tab_team")}</h4>
            <small className="text-muted">{teamMsg}</small>
          </div>
          <div className="btn-group">
            <button className={`btn btn-outline-primary ${teamSubTab === "departments" ? "active" : ""}`} onClick={() => setTeamSubTab("departments")}>{t("admin_team_departments")}</button>
            <button className={`btn btn-outline-primary ${teamSubTab === "sections" ? "active" : ""}`} onClick={() => setTeamSubTab("sections")}>{t("admin_team_sections")}</button>
            <button className={`btn btn-outline-primary ${teamSubTab === "titles" ? "active" : ""}`} onClick={() => setTeamSubTab("titles")}>{t("admin_team_titles")}</button>
            <button className={`btn btn-outline-primary ${teamSubTab === "employees" ? "active" : ""}`} onClick={() => setTeamSubTab("employees")}>{t("admin_tab_employees")}</button>
          </div>
        </div>

        {teamSubTab === "departments" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>{t("admin_team_departments")}</h6>
              <button className="btn btn-primary" onClick={() => { setEditingDeptId(null); setDeptModalOpen(true); }}>{t("admin_team_add")}</button>
            </div>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead><tr><th>AR</th><th>EN</th><th></th></tr></thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.id}>
                      <td>{d.name?.ar}</td>
                      <td>{d.name?.en}</td>
                      <td className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditDepartment(d)}>{t("admin_team_edit")}</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteDepartment(d.id)}>{t("admin_team_delete")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {teamSubTab === "sections" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>{t("admin_team_sections")}</h6>
              <button className="btn btn-primary" onClick={() => { setEditingSectionId(null); setSectionModalOpen(true); }}>{t("admin_team_add")}</button>
            </div>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead><tr><th>AR</th><th>EN</th><th>{t("admin_team_department")}</th><th></th></tr></thead>
                <tbody>
                  {sections.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name?.ar}</td>
                      <td>{s.name?.en}</td>
                      <td>{getLabel(departments.find((d) => d.id === s.departmentId)?.name)}</td>
                      <td className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditSection(s)}>{t("admin_team_edit")}</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSection(s.id)}>{t("admin_team_delete")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {teamSubTab === "titles" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>{t("admin_team_titles")}</h6>
              <button className="btn btn-primary" onClick={() => { setEditingTitleId(null); setTitleModalOpen(true); }}>{t("admin_team_add")}</button>
            </div>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead><tr><th>AR</th><th>EN</th><th>{t("admin_team_section")}</th><th>{t("admin_team_level")}</th><th></th></tr></thead>
                <tbody>
                  {titles.map((ti) => (
                    <tr key={ti.id}>
                      <td>{ti.title?.ar}</td>
                      <td>{ti.title?.en}</td>
                      <td>{getLabel(sections.find((s) => s.id === ti.sectionId)?.name)}</td>
                      <td>{ti.level}</td>
                      <td className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditTitle(ti)}>{t("admin_team_edit")}</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTitle(ti.id)}>{t("admin_team_delete")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {teamSubTab === "employees" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>{t("admin_tab_employees")}</h6>
              <button className="btn btn-primary" onClick={() => { setEditingEmployeeId(null); resetTeamForms(); setEmployeeModalOpen(true); }}>{t("admin_team_add")}</button>
            </div>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead><tr><th>{t("admin_team_name_ar")}</th><th>{t("admin_team_title")}</th><th>{t("admin_team_manager")}</th><th></th></tr></thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{getLabel(emp.name)}</td>
                      <td>{getLabel(titles.find((t) => t.id === emp.titleId)?.title)}</td>
                      <td>{getLabel(employees.find((m) => m.id === emp.managerId)?.name)}</td>
                      <td className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditEmployee(emp)}>{t("admin_team_edit")}</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteEmployee(emp.id)}>{t("admin_team_delete")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Department Modal */}
        {deptModalOpen && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, position: 'fixed', inset: 0 }} onClick={() => setDeptModalOpen(false)}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="modal-content shadow-lg border-0" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="modal-header bg-light" style={{ flexShrink: 0 }}>
                  <h5 className="modal-title fw-bold" style={{ color: "var(--primary-color)" }}>
                    {t("admin_team_departments")}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setDeptModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4" style={{ overflowY: 'auto', flex: 1 }}>
                  <form className="row g-3" onSubmit={handleSaveDepartment}>
                    <div className="col-12"><label className="form-label">{t("admin_team_name_ar")}</label><input className="form-control" value={deptForm.name_ar} onChange={(e) => setDeptForm({ ...deptForm, name_ar: e.target.value })} required /></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_name_en")}</label><input className="form-control" value={deptForm.name_en} onChange={(e) => setDeptForm({ ...deptForm, name_en: e.target.value })} /></div>
                    <div className="col-12"><button type="submit" className="btn btn-primary w-100" disabled={teamLoading}>{t("admin_save")}</button></div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Modal */}
        {sectionModalOpen && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, position: 'fixed', inset: 0 }} onClick={() => setSectionModalOpen(false)}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="modal-content shadow-lg border-0" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="modal-header bg-light" style={{ flexShrink: 0 }}>
                  <h5 className="modal-title fw-bold" style={{ color: "var(--primary-color)" }}>
                    {t("admin_team_sections")}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setSectionModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4" style={{ overflowY: 'auto', flex: 1 }}>
                  <form className="row g-3" onSubmit={handleSaveSection}>
                    <div className="col-12"><label className="form-label">{t("admin_team_name_ar")}</label><input className="form-control" value={sectionForm.name_ar} onChange={(e) => setSectionForm({ ...sectionForm, name_ar: e.target.value })} required /></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_name_en")}</label><input className="form-control" value={sectionForm.name_en} onChange={(e) => setSectionForm({ ...sectionForm, name_en: e.target.value })} /></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_department")}</label><select className="form-select" value={sectionForm.departmentId} onChange={(e) => setSectionForm({ ...sectionForm, departmentId: e.target.value })} required><option value="">--</option>{departments.map((d) => (<option key={d.id} value={d.id}>{getLabel(d.name)}</option>))}</select></div>
                    <div className="col-12"><button type="submit" className="btn btn-primary w-100" disabled={teamLoading}>{t("admin_save")}</button></div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Title Modal */}
        {titleModalOpen && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, position: 'fixed', inset: 0 }} onClick={() => setTitleModalOpen(false)}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="modal-content shadow-lg border-0" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="modal-header bg-light" style={{ flexShrink: 0 }}>
                  <h5 className="modal-title fw-bold" style={{ color: "var(--primary-color)" }}>
                    {t("admin_team_titles")}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setTitleModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4" style={{ overflowY: 'auto', flex: 1 }}>
                  <form className="row g-3" onSubmit={handleSaveTitle}>
                    <div className="col-12"><label className="form-label">{t("admin_team_name_ar")}</label><input className="form-control" value={titleForm.title_ar} onChange={(e) => setTitleForm({ ...titleForm, title_ar: e.target.value })} required /></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_name_en")}</label><input className="form-control" value={titleForm.title_en} onChange={(e) => setTitleForm({ ...titleForm, title_en: e.target.value })} /></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_section")}</label><select className="form-select" value={titleForm.sectionId} onChange={(e) => setTitleForm({ ...titleForm, sectionId: e.target.value })} required><option value="">--</option>{sections.map((s) => (<option key={s.id} value={s.id}>{getLabel(s.name)}</option>))}</select></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_level")}</label><select className="form-select" value={titleForm.level} onChange={(e) => setTitleForm({ ...titleForm, level: e.target.value })}><option value="top">{t("admin_team_level_top")}</option><option value="executive">{t("admin_team_level_exec")}</option><option value="management">{t("admin_team_level_mgmt")}</option><option value="staff">{t("admin_team_level_staff")}</option></select></div>
                    <div className="col-12"><button type="submit" className="btn btn-primary w-100" disabled={teamLoading}>{t("admin_save")}</button></div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employee Modal */}
        {employeeModalOpen && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, position: 'fixed', inset: 0 }} onClick={() => setEmployeeModalOpen(false)}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="modal-content shadow-lg border-0" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="modal-header bg-light" style={{ flexShrink: 0 }}>
                  <h5 className="modal-title fw-bold" style={{ color: "var(--primary-color)" }}>
                    {t("admin_team_employees")}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setEmployeeModalOpen(false)}></button>
                </div>
                <div className="modal-body p-4" style={{ overflowY: 'auto', flex: 1 }}>
                  <form className="row g-3" onSubmit={handleSaveEmployee}>
                    <div className="col-12"><label className="form-label">{t("admin_team_name_ar")}</label><input className="form-control" value={employeeForm.name_ar} onChange={(e) => setEmployeeForm({ ...employeeForm, name_ar: e.target.value })} required /></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_name_en")}</label><input className="form-control" value={employeeForm.name_en} onChange={(e) => setEmployeeForm({ ...employeeForm, name_en: e.target.value })} /></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_bio_ar")}</label><textarea className="form-control" rows="2" value={employeeForm.bio_ar} onChange={(e) => setEmployeeForm({ ...employeeForm, bio_ar: e.target.value })}></textarea></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_bio_en")}</label><textarea className="form-control" rows="2" value={employeeForm.bio_en} onChange={(e) => setEmployeeForm({ ...employeeForm, bio_en: e.target.value })}></textarea></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_resp_ar")}</label><textarea className="form-control" rows="2" value={employeeForm.resp_ar} onChange={(e) => setEmployeeForm({ ...employeeForm, resp_ar: e.target.value })}></textarea></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_resp_en")}</label><textarea className="form-control" rows="2" value={employeeForm.resp_en} onChange={(e) => setEmployeeForm({ ...employeeForm, resp_en: e.target.value })}></textarea></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_title")}</label><select className="form-select" value={employeeForm.titleId} onChange={(e) => setEmployeeForm({ ...employeeForm, titleId: e.target.value })} required><option value="">--</option>{titles.map((ti) => (<option key={ti.id} value={ti.id}>{getLabel(ti.title)}</option>))}</select></div>
                    <div className="col-12"><label className="form-label">{t("admin_team_manager")}</label><select className="form-select" value={employeeForm.managerId} onChange={(e) => setEmployeeForm({ ...employeeForm, managerId: e.target.value })}><option value="">--</option>{employees.map((emp) => (<option key={emp.id} value={emp.id}>{getLabel(emp.name)}</option>))}</select></div>
                    <div className="col-md-6"><label className="form-label">{t("admin_team_image")}</label><input key={employeeFileKey} type="file" accept="image/*" className="form-control" onChange={(e) => setEmployeeImageFile(e.target.files?.[0] || null)} /></div>
                    <div className="col-md-6"><label className="form-label">{t("admin_team_cv")}</label><input key={`cv-${employeeFileKey}`} type="file" accept="application/pdf" className="form-control" onChange={(e) => setEmployeeCvFile(e.target.files?.[0] || null)} /></div>
                    <div className="col-12"><button type="submit" className="btn btn-primary w-100" disabled={teamLoading}>{t("admin_save")}</button></div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCareersTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_careers')}</h4>
        <div className="row g-4 mt-2">
          <div className="col-lg-6">
            <h6 className="mb-3">{t('admin_jobs_list') || (language === 'ar' ? 'قائمة الوظائف المنشورة' : 'Posted Jobs List')}</h6>
            {jobsList.length === 0 ? (
              <div className="alert alert-secondary">{language === 'ar' ? 'لا توجد وظائف حالياً' : 'No jobs posted yet'}</div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>{t('admin_job_title')}</th>
                      <th>{t('admin_job_dept')}</th>
                      <th>{t('admin_job_deadline')}</th>
                      <th>{t('admin_job_status')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobsList.map((job) => (
                      <tr key={job.id}>
                        <td>{job.title}</td>
                        <td>{job.department}</td>
                        <td>{job.deadline || '-'}</td>
                        <td>{job.status || 'open'}</td>
                        <td className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handleJobEdit(job)}>{t('admin_job_edit')}</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => handleJobToggle(job)}>
                            {job.status === "closed" ? t('admin_job_open') : t('admin_job_close')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="col-lg-6">
            <h6 className="mb-3">{editingJobId ? t('admin_job_update') : t('admin_job_save')}</h6>
            <form className="row g-3" onSubmit={handleJobSave}>
              <div className="col-12"><label className="form-label">{t('admin_job_title')}</label><input name="title" className="form-control" value={jobForm.title} onChange={handleJobChange} required /></div>
              <div className="col-md-6"><label className="form-label">{t('admin_job_dept')}</label><input name="department" className="form-control" value={jobForm.department} onChange={handleJobChange} required /></div>
              <div className="col-md-6"><label className="form-label">{t('admin_job_type')}</label><input name="type" className="form-control" value={jobForm.type} onChange={handleJobChange} required /></div>
              <div className="col-md-6"><label className="form-label">{t('admin_job_location')}</label><input name="location" className="form-control" value={jobForm.location} onChange={handleJobChange} required /></div>
              <div className="col-md-6"><label className="form-label">{t('admin_job_deadline')}</label><input name="deadline" type="date" className="form-control" value={jobForm.deadline} onChange={handleJobChange} required /></div>
              <div className="col-12"><label className="form-label">{t('admin_job_desc')}</label><textarea name="description" rows="3" className="form-control" value={jobForm.description} onChange={handleJobChange} required></textarea></div>
              <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={jobLoading}>{jobLoading ? t('admin_saving') : (editingJobId ? t('admin_job_update') : t('admin_job_save'))}</button></div>
              {jobMessage && <div className="alert alert-info py-1 small">{jobMessage}</div>}
            </form>
          </div>
        </div>

        <hr className="my-4" />
        <h6 className="mb-3">{language === 'ar' ? 'طلبات التوظيف' : 'Applications'}</h6>
        {applicationsLoading ? (
          <div className="text-center"><div className="spinner-border text-primary"></div></div>
        ) : applications.length === 0 ? (
          <div className="alert alert-secondary">{language === 'ar' ? 'لا توجد طلبات حالياً' : 'No applications yet'}</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th>Email</th>
                  <th>{t('career_linkedin')}</th>
                  <th>{t('career_experience')}</th>
                  <th>{t('career_education')}</th>
                  <th>CV</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.name}</td>
                    <td>{app.phone}</td>
                    <td>{app.email}</td>
                    <td>{app.linkedin || '-'}</td>
                    <td>{app.experience || '-'}</td>
                    <td>{app.education || '-'}</td>
                    <td>{app.cvUrl ? <a href={app.cvUrl} target="_blank" rel="noopener noreferrer">CV</a> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderQuotesTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }}>{language === 'ar' ? 'عروض الأسعار' : 'Quotes'}</h4>
        {pdfQuote && (
          <div
            ref={pdfRef}
            style={{
              position: "fixed",
              top: 0,
              left: "-10000px",
              width: "794px",
              background: "#ffffff",
              color: "#0B2C5C",
              fontFamily: "'Cairo', sans-serif",
              padding: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <img src={logo} alt="Qimat AlAibtikar" style={{ height: "70px" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "20pt", fontWeight: 800 }}>شركة قمة الابتكار للحلول المتكاملة المحدودة</div>
                <div style={{ fontSize: "18pt", fontWeight: 800 }}>QIMAT ALAIBTIKAR FOR INTEGRATED SOLUTIONS CO. LTD</div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: "18pt", fontWeight: 800, margin: "12px 0 20px" }}>عـرض سـعر رسـمي / OFFICIAL QUOTATION</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "11pt" }}>
              <div><strong>العميل:</strong> {pdfQuote.contactInfo?.fullName || pdfQuote.entityInfo?.companyName || ""}</div>
              <div><strong>{t('quote_ref_number')}:</strong> {formatQuoteID(pdfQuote.createdAt, quotes.findIndex(q => q.id === pdfQuote.id))}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "10pt" }}>
              <div><strong>{t('quote_date')}:</strong> {pdfQuote.createdAt?.seconds ? new Date(pdfQuote.createdAt.seconds * 1000).toLocaleDateString('ar-SA') : ''}</div>
              <div><strong>{t('quote_entity_type')}:</strong> {pdfQuote.entityInfo?.type === 'company' ? t('quote_company') : t('quote_individual')}</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5pt" }}>
              <thead>
                <tr style={{ background: "#00B4FF", color: "#ffffff" }}>
                  <th style={{ padding: "8px", border: "1px solid #e5e5e5" }}>No</th>
                  <th style={{ padding: "8px", border: "1px solid #e5e5e5" }}>Description / الصنف</th>
                  <th style={{ padding: "8px", border: "1px solid #e5e5e5" }}>Price / السعر</th>
                  <th style={{ padding: "8px", border: "1px solid #e5e5e5" }}>Qty / الكمية</th>
                  <th style={{ padding: "8px", border: "1px solid #e5e5e5" }}>Total / الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {(pdfQuote.id === selectedQuote?.id ? quoteItems : pdfQuote.items || []).map((item, idx) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.price) || 0;
                  const total = qty * price;
                  return (
                    <tr key={`pdf-item-${idx}`}>
                      <td style={{ padding: "6px", border: "1px solid #e5e5e5", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ padding: "6px", border: "1px solid #e5e5e5" }}>{item.serviceName}</td>
                      <td style={{ padding: "6px", border: "1px solid #e5e5e5" }}>SAR {price.toFixed(2)} (ر.س)</td>
                      <td style={{ padding: "6px", border: "1px solid #e5e5e5" }}>{item.quantity}</td>
                      <td style={{ padding: "6px", border: "1px solid #e5e5e5" }}>SAR {total.toFixed(2)} (ر.س)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: "16px", fontSize: "10pt" }}>
              <div><strong>ملاحظات وشروط:</strong> {pdfQuote.adminNotes}</div>
              <div><strong>العنوان:</strong> Riyadh, Saudi Arabia</div>
            </div>
            <div style={{ marginTop: "18px", fontSize: "10pt", color: "#666" }}>هذا مستند مستخرج آلياً / This is a computer-generated document</div>
          </div>
        )}
        <div className="row g-4 mt-2">
          <div className="col-lg-5">
            <h6 className="mb-3">{language === 'ar' ? 'القائمة' : 'List'}</h6>
            {quotesLoading ? (
              <div className="text-center"><div className="spinner-border text-primary"></div></div>
            ) : quotes.length === 0 ? (
              <div className="alert alert-secondary">{language === 'ar' ? 'لا توجد عروض أسعار' : 'No quotes yet'}</div>
            ) : (
              <div className="list-group">
                {quotes.map((q, idx) => (
                  <button key={q.id} type="button" className={`list-group-item list-group-item-action ${selectedQuote?.id === q.id ? 'active' : ''}`} onClick={() => handleSelectQuote(q)}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{q.contactInfo?.fullName || q.entityInfo?.companyName || q.id}</div>
                        <small className="text-muted">{formatQuoteID(q.createdAt, idx)}</small>
                      </div>
                      <small>{q.createdAt?.seconds ? new Date(q.createdAt.seconds * 1000).toLocaleDateString() : ''}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="col-lg-7">
            {!selectedQuote ? (
              <div className="alert alert-info">{language === 'ar' ? 'اختر عرض سعر لعرض التفاصيل' : 'Select a quote to view details'}</div>
            ) : (
              <>
                <div className="mb-3">
                  <h6 className="fw-bold">{language === 'ar' ? 'بيانات العميل' : 'Client Info'}</h6>
                  <div className="small text-muted">{selectedQuote.contactInfo?.fullName} | {selectedQuote.contactInfo?.email} | {selectedQuote.contactInfo?.phone}</div>
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold">{language === 'ar' ? 'بيانات الجهة' : 'Entity Info'}</h6>
                  <div className="small text-muted">{selectedQuote.entityInfo?.type} | {selectedQuote.entityInfo?.companyName} | {selectedQuote.entityInfo?.crNumber}</div>
                  <div className="small text-muted">{selectedQuote.entityInfo?.address}</div>
                </div>

                <div className="table-responsive mb-3">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>{language === 'ar' ? 'الخدمة / المنتج' : 'Item'}</th>
                        <th>{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                        <th>{language === 'ar' ? 'التسليم' : 'Delivery'}</th>
                        <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteItems.map((it, idx) => {
                        return (
                          <tr key={`qi-${idx}`}>
                            <td>{it.serviceName}</td>
                            <td>{it.quantity}</td>
                            <td>{it.deliveryLocation}</td>
                            <td><input className="form-control" value={it.price || ""} onChange={(e) => handleQuoteItemPriceChange(idx, e.target.value)} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mb-3">
                  <label className="form-label">{language === 'ar' ? 'ملاحظات للعميل' : 'Notes for Client'}</label>
                  <textarea className="form-control" rows="3" value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} />
                </div>

                <div className="mb-3">
                  <label className="form-label">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                  <select className="form-select" value={quoteStatus} onChange={(e) => setQuoteStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                  </select>
                </div>

                {quoteMsg && <div className="alert alert-info">{quoteMsg}</div>}
                <div className="d-flex flex-wrap gap-2">
                  <button className="btn btn-primary" style={{ background: "var(--secondary-color)", border: "none" }} onClick={handleSaveQuote}>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</button>
                  <button className="btn btn-outline-primary" onClick={() => generatePDF(selectedQuote)} disabled={pdfGenerating}>
                    {language === 'ar' ? 'تحميل عرض السعر الرسمي (PDF)' : 'Download Official Quotation (PDF)'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="card shadow-sm border-0"><div className="card-body p-4">
      <h4 style={{ color: "var(--primary-color)" }} className="mb-3">{t('admin_tab_social')}</h4>
      {socialMsg && <div className="alert alert-info py-1 small">{socialMsg}</div>}
      {socialLinks.length > 0 && (
        <div className="table-responsive mb-4"><table className="table align-middle table-bordered"><thead className="table-light"><tr><th>Icon</th><th>Name</th><th>URL</th><th></th></tr></thead><tbody>{socialLinks.map((s) => (
          <tr key={s.id}><td><i className={`bi ${s.icon}`} style={{ fontSize: 24, color: s.color || "#333" }}></i></td><td>{s.name}</td><td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a></td><td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSocial(s.id)}>{t('admin_delete')}</button></td></tr>
        ))}</tbody></table></div>
      )}
      <form className="row g-3" onSubmit={handleSocialSave}>
        <div className="col-md-4"><label className="form-label">Name</label><input name="name" type="text" className="form-control" value={socialForm.name} onChange={handleSocialChange} required /></div>
        <div className="col-md-4"><label className="form-label">URL</label><input name="url" type="url" className="form-control" value={socialForm.url} onChange={handleSocialChange} required /></div>
        <div className="col-md-4"><label className="form-label">Icon</label><select name="icon" className="form-select" value={socialForm.icon} onChange={handleSocialChange}>{SOCIAL_ICONS.map((ic) => (<option key={ic.value} value={ic.value}>{ic.label}</option>))}</select></div>
        <div className="col-md-3"><label className="form-label">Color</label><input name="color" type="color" className="form-control form-control-color" value={socialForm.color} onChange={handleSocialChange} /></div>
        <div className="col-md-5"><label className="form-label">Custom Logo</label><input key={socialFileKey} name="socialLogo" type="file" accept="image/*" className="form-control" onChange={handleSocialChange} /></div>
        <div className="col-md-4 d-flex align-items-end"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={socialLoading}>{socialLoading ? t('admin_saving') : t('admin_save')}</button></div>
      </form>
      <hr className="my-4" />
      <h4 style={{ color: "var(--primary-color)" }} className="mb-3"><i className="bi bi-whatsapp me-2" style={{ color: "#25D366" }}></i>WhatsApp</h4>
      {whatsappMsg && <div className="alert alert-info py-1 small">{whatsappMsg}</div>}
      <form className="row g-3" onSubmit={handleWhatsappSave}>
        <div className="col-md-5"><label className="form-label">Phone</label><input name="phone" type="text" className="form-control" value={whatsappSettings.phone} onChange={handleWhatsappChange} placeholder="249123456789" required /></div>
        <div className="col-md-5"><label className="form-label">Default Message</label><input name="message" type="text" className="form-control" value={whatsappSettings.message} onChange={handleWhatsappChange} /></div>
        <div className="col-md-2 d-flex align-items-end"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="waEnabled" name="enabled" checked={whatsappSettings.enabled} onChange={handleWhatsappChange} /><label className="form-check-label" htmlFor="waEnabled">Active</label></div></div>
        <div className="col-12"><button type="submit" className="btn w-100" style={{ background: "#25D366", color: "#fff", border: "none" }} disabled={whatsappLoading}>{whatsappLoading ? t('admin_saving') : t('admin_save')}</button></div>
      </form>
    </div></div>
  );

  const renderAdminsTab = () => (
    <div className="card shadow-sm border-0"><div className="card-body p-4">
      <h4 style={{ color: "var(--primary-color)" }} className="mb-3">{t('admin_tab_admins')}</h4>
      {adminSaveMsg && <div className="alert alert-info py-1 small">{adminSaveMsg}</div>}

      {admins.length > 0 && admins.map((a) => (
        <div key={a.id} className="border rounded p-3 mb-3" style={{ background: editingAdminId === a.id ? "#fffbe6" : "#fff" }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <strong>{a.email}</strong>
              {a.email === user.email && <span className="badge bg-primary ms-2">{language === 'ar' ? 'أنت' : 'You'}</span>}
              <span className={`badge ms-2 ${a.role === "Super Admin" ? "bg-danger" : "bg-secondary"}`}>{a.role || "Admin"}</span>
            </div>
            <div className="d-flex gap-2">
              {can(userPermissions, "admins", "edit") && editingAdminId !== a.id && (
                <button className="btn btn-sm btn-outline-warning" onClick={() => handleEditAdmin(a)}>
                  <i className="bi bi-pencil-square me-1"></i>{language === 'ar' ? 'تعديل الصلاحيات' : 'Edit Permissions'}
                </button>
              )}
              {can(userPermissions, "admins", "delete") && a.email !== user.email && editingAdminId !== a.id && (
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAdmin(a.id, a.email)}>
                  <i className="bi bi-trash me-1"></i>{t('admin_delete')}
                </button>
              )}
            </div>
          </div>

          {editingAdminId !== a.id && a.permissions && (
            <div style={{ fontSize: "0.85rem" }}>
              {PERM_SECTIONS.map((s) => {
                const sp = a.permissions[s.key];
                if (!sp) return null;
                const aa = s.actions.filter((act) => sp[act]);
                if (!aa.length) return null;
                return <span key={s.key} className="me-3"><strong>{s.label}:</strong> {aa.map((act) => ACTION_LABELS[act]).join("، ")}</span>;
              })}
            </div>
          )}

          {editingAdminId === a.id && editingAdminPerms && (
            <div className="mt-3">
              <div className="border rounded p-3" style={{ background: "#f9f9f9" }}>
                {PERM_SECTIONS.map((section) => (
                  <div key={section.key} className="mb-3">
                    <div className="fw-bold mb-1" style={{ color: "var(--primary-color)" }}>{section.label}</div>
                    <div className="d-flex flex-wrap gap-3">
                      {section.actions.map((action) => (
                        <div className="form-check" key={`edit-${section.key}-${action}`}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`edit-perm-${a.id}-${section.key}-${action}`}
                            checked={editingAdminPerms[section.key]?.[action] || false}
                            onChange={() => handleEditPermToggle(section.key, action)}
                          />
                          <label className="form-check-label" htmlFor={`edit-perm-${a.id}-${section.key}-${action}`}>{ACTION_LABELS[action]}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-success" onClick={handleUpdateAdminPerms} disabled={editingAdminLoading}>
                  <i className="bi bi-check-lg me-1"></i>{editingAdminLoading ? (language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                </button>
                <button className="btn btn-outline-secondary" onClick={handleCancelEdit}>
                  <i className="bi bi-x-lg me-1"></i>{language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {can(userPermissions, "admins", "add") ? (<>
        <hr className="my-4" />
        <h5 className="mb-3"><i className="bi bi-person-plus me-2"></i>{language === 'ar' ? 'إضافة مشرف جديد' : 'Add New Admin'}</h5>
        <form className="row g-3" onSubmit={handleAdminSave}>
          <div className="col-12"><label className="form-label">Email</label><input type="email" className="form-control" value={adminForm.email} onChange={(e) => setAdminForm({ email: e.target.value })} required /><small className="text-muted">{language === 'ar' ? 'يجب أن يكون لديه حساب في Firebase Auth مسبقاً' : 'Must have a Firebase Auth account'}</small></div>
          <div className="col-12"><label className="form-label fw-bold mb-2">{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</label>
            <div className="border rounded p-3" style={{ background: "#f9f9f9" }}>{PERM_SECTIONS.map((section) => (<div key={section.key} className="mb-3"><div className="fw-bold mb-1" style={{ color: "var(--primary-color)" }}>{section.label}</div><div className="d-flex flex-wrap gap-3">{section.actions.map((action) => (<div className="form-check" key={`${section.key}-${action}`}><input className="form-check-input" type="checkbox" id={`perm-${section.key}-${action}`} checked={adminPerms[section.key]?.[action] || false} onChange={() => handleAdminPermToggle(section.key, action)} /><label className="form-check-label" htmlFor={`perm-${section.key}-${action}`}>{ACTION_LABELS[action]}</label></div>))}</div></div>))}</div>
          </div>
          <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={adminLoading}>{adminLoading ? t('admin_saving') : t('admin_save')}</button></div>
        </form>
      </>) : <div className="alert alert-secondary mt-3">{t('admin_no_permission')}</div>}
    </div></div>
  );

  // ── RETURN ──
  if (authLoading) return <main id="main" className="py-5"><div className="container text-center"><div className="spinner-border text-primary" role="status"></div></div></main>;

  if (!user) return (
    <main id="main" className="py-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <Helmet><title>{t('admin_login_title')} | Qimmah</title></Helmet>
      <div className="container" data-aos="fade-up"><div className="row justify-content-center"><div className="col-lg-5"><div className="card shadow-sm border-0"><div className="card-body p-4">
        <h3 className="mb-3" style={{ color: "var(--primary-color)" }}>{t('admin_login_title')}</h3>
        <form onSubmit={handleLogin} className="row g-3">
          <div className="col-12"><label className="form-label">{t('admin_login_email')}</label><input type="email" className="form-control" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /></div>
          <div className="col-12"><label className="form-label">{t('admin_login_password')}</label><input type="password" className="form-control" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /></div>
          {loginError && <div className="text-danger small">{loginError}</div>}
          <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={loginLoading}>{loginLoading ? t('admin_login_loading') : t('admin_login_btn')}</button></div>
        </form>
      </div></div></div></div></div>
    </main>
  );

  if (userPermissions === null && !accessDenied) return <main id="main" className="py-5"><div className="container text-center"><div className="spinner-border text-primary" role="status"></div><p className="mt-2 text-muted">{t('admin_checking_perms')}</p></div></main>;

  if (accessDenied) return (
    <main id="main" className="py-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <Helmet><title>{t('admin_access_denied')} | Qimmah</title></Helmet>
      <div className="container text-center" data-aos="fade-up"><div className="card shadow-sm border-0 mx-auto" style={{ maxWidth: 500 }}><div className="card-body p-5">
        <i className="bi bi-shield-lock" style={{ fontSize: 64, color: "var(--accent-color, #F4A900)" }}></i>
        <h3 className="mt-3" style={{ color: "var(--primary-color)" }}>{t('admin_access_denied')}</h3>
        <p className="text-muted">{t('admin_access_denied_msg')}</p><p className="text-muted small">{user.email}</p>
        <button className="btn btn-outline-danger" onClick={handleLogout}>{t('admin_access_denied_logout')}</button>
      </div></div></div>
    </main>
  );

  return (
    <main id="main" className="py-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <Helmet><title>{t('admin_panel_title')} | Qimmah</title></Helmet>
      <div className="container" data-aos="fade-up">
        <div className="row">
          <div className="col-lg-3 mb-3 mb-lg-0">
            <div className="list-group shadow-sm">
              <button className={`list-group-item list-group-item-action ${activeTab === "shipments" ? "active" : ""}`} onClick={() => setActiveTab("shipments")}><i className="bi bi-truck me-1"></i>{t('admin_tab_shipments')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}><i className="bi bi-box-seam me-1"></i>{t('admin_tab_products')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "clients" ? "active" : ""}`} onClick={() => setActiveTab("clients")}><i className="bi bi-building me-1"></i>{t('admin_tab_clients')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "services" ? "active" : ""}`} onClick={() => setActiveTab("services")}><i className="bi bi-briefcase me-1"></i>{t('admin_tab_services')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "careers" ? "active" : ""}`} onClick={() => setActiveTab("careers")}><i className="bi bi-briefcase me-1"></i>{t('admin_tab_careers') || 'Careers'}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "blog" ? "active" : ""}`} onClick={() => setActiveTab("blog")}><i className="bi bi-journal-richtext me-1"></i>{t('admin_tab_blog')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "news" ? "active" : ""}`} onClick={() => setActiveTab("news")}><i className="bi bi-newspaper me-1"></i>{t('admin_tab_news')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "ads" ? "active" : ""}`} onClick={() => setActiveTab("ads")}><i className="bi bi-megaphone me-1"></i>{t('admin_tab_ads')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "messages" ? "active" : ""}`} onClick={() => setActiveTab("messages")}><i className="bi bi-envelope me-1"></i>{t('admin_tab_messages')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "team" ? "active" : ""}`} onClick={() => setActiveTab("team")}><i className="bi bi-diagram-3 me-1"></i>{t("admin_tab_team")}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "quotes" ? "active" : ""}`} onClick={() => setActiveTab("quotes")}><i className="bi bi-receipt me-1"></i>{language === 'ar' ? 'عروض الأسعار' : 'Quotes'}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "social" ? "active" : ""}`} onClick={() => setActiveTab("social")}><i className="bi bi-share me-1"></i>{t('admin_tab_social')}</button>
              {can(userPermissions, "admins", "view") && (<button className={`list-group-item list-group-item-action ${activeTab === "admins" ? "active" : ""}`} onClick={() => setActiveTab("admins")}><i className="bi bi-people-fill me-1"></i>{t('admin_tab_admins')}</button>)}
            </div>
          </div>
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div><h3 style={{ color: "var(--primary-color)" }}>{t('admin_panel_title')}</h3><p className="text-muted small mb-0">{t('admin_panel_subtitle')}</p></div>
              <div className="d-flex align-items-center gap-2"><span className="text-muted small">{user.email}</span><button className="btn btn-outline-primary btn-sm" onClick={toggleLanguage} style={{ direction: 'ltr' }}>{language === 'ar' ? 'English' : 'العربية'}</button><button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>{t('admin_logout')}</button></div>
            </div>
            {activeTab === "shipments" && renderShipmentsTab()}
            {activeTab === "products" && renderProductsTab()}
            {activeTab === "clients" && renderClientsTab()}
            {activeTab === "services" && renderServicesTab()}
            {activeTab === "careers" && renderCareersTab()}
            {activeTab === "blog" && renderBlogTab()}
            {activeTab === "news" && renderNewsTab()}
            {activeTab === "ads" && renderAdsTab()}
            {activeTab === "messages" && renderMessagesTab()}
            {activeTab === "team" && renderTeamTab()}
            {activeTab === "quotes" && renderQuotesTab()}
            {activeTab === "social" && renderSocialTab()}
            {activeTab === "admins" && renderAdminsTab()}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPanel;
