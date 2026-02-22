import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { db, auth } from "../firebase";
import {
  doc, setDoc, serverTimestamp, getDoc, collection, addDoc,
  getDocs, query, orderBy, updateDoc, deleteDoc, where
} from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "../context/LanguageContext";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dmynksk5z/auto/upload";
const CLOUDINARY_PRESET = "oiwrpbwq";

const uploadToCloudinary = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: fd });
  const data = await res.json();
  return data.secure_url || "";
};

const uploadMultiple = async (files) => {
  const urls = [];
  for (const file of files) {
    const url = await uploadToCloudinary(file);
    if (url) urls.push(url);
  }
  return urls;
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
      try { const q = query(collection(db, "messages"), orderBy("createdAt", "desc")); const snap = await getDocs(q); setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { setMessagesError("تعذر تحميل الرسائل حالياً"); } finally { setMessagesLoading(false); }
      try { const snap = await getDocs(collection(db, "products")); setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "clients")); setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(query(collection(db, "blog"), orderBy("createdAt", "desc"))); setBlogPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"))); setNewsItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(query(collection(db, "ads"), orderBy("createdAt", "desc"))); setAdsList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "admins")); setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "socialLinks")); setSocialLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(collection(db, "services")); setServicesList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const waSnap = await getDoc(doc(db, "settings", "whatsapp")); if (waSnap.exists()) setWhatsappSettings(waSnap.data()); } catch {}
      try { const snap = await getDocs(query(collection(db, "jobs"), orderBy("createdAt", "desc"))); setJobsList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
      try { const snap = await getDocs(query(collection(db, "applications"), orderBy("createdAt", "desc"))); setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch {}
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

  // Job handlers
  const handleJobChange = (e) => {
    const { name, value } = e.target;
    setJobForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleJobSave = async (e) => {
    e.preventDefault();
    setJobMessage("");
    try {
      setJobLoading(true);
      if (editingJobId) {
        await updateDoc(doc(db, "jobs", editingJobId), { ...jobForm, updatedAt: serverTimestamp() });
        setJobMessage(language === 'ar' ? 'تم تحديث الوظيفة بنجاح' : 'Job updated successfully');
      } else {
        await addDoc(collection(db, "jobs"), { ...jobForm, createdAt: serverTimestamp() });
        setJobMessage(language === 'ar' ? 'تم نشر الوظيفة بنجاح' : 'Job posted successfully');
      }
      setJobForm({ title: "", department: "", type: "", location: "", description: "", deadline: "", status: "open" });
      setEditingJobId(null);
      const snap = await getDocs(query(collection(db, "jobs"), orderBy("createdAt", "desc")));
      setJobsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setJobMessage(language === 'ar' ? 'تعذر نشر الوظيفة' : 'Failed to post job');
    } finally {
      setJobLoading(false);
    }
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
      setJobsList((prev) => prev.map((j) => j.id === job.id ? { ...j, status: nextStatus } : j));
    } catch { }
  };

  const renderCareersTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_careers')}</h4>
        {jobMessage && <div className="alert alert-info py-1 small">{jobMessage}</div>}

        <form className="row g-3 mb-4" onSubmit={handleJobSave}>
          <div className="col-md-6"><label className="form-label">{t('admin_job_title')}</label><input name="title" type="text" className="form-control" value={jobForm.title} onChange={handleJobChange} required /></div>
          <div className="col-md-6"><label className="form-label">{t('admin_job_dept')}</label><input name="department" type="text" className="form-control" value={jobForm.department} onChange={handleJobChange} /></div>
          <div className="col-md-6"><label className="form-label">{t('admin_job_type')}</label><input name="type" type="text" className="form-control" value={jobForm.type} onChange={handleJobChange} /></div>
          <div className="col-md-6"><label className="form-label">{t('admin_job_location')}</label><input name="location" type="text" className="form-control" value={jobForm.location} onChange={handleJobChange} /></div>
          <div className="col-md-6"><label className="form-label">{t('admin_job_deadline')}</label><input name="deadline" type="date" className="form-control" value={jobForm.deadline} onChange={handleJobChange} required /></div>
          <div className="col-md-6"><label className="form-label">{t('admin_job_status')}</label><select name="status" className="form-select" value={jobForm.status} onChange={handleJobChange}><option value="open">open</option><option value="closed">closed</option></select></div>
          <div className="col-12"><label className="form-label">{t('admin_job_desc')}</label><textarea name="description" className="form-control" rows="3" value={jobForm.description} onChange={handleJobChange} /></div>
          <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={jobLoading}>{jobLoading ? t('admin_saving') : (editingJobId ? t('admin_job_update') : t('admin_job_save'))}</button></div>
        </form>

        <h5 className="mb-3" style={{ color: "var(--primary-color)" }}>{t('admin_jobs_list')}</h5>
        {jobsList.length === 0 ? (
          <div className="alert alert-secondary">{language === 'ar' ? 'لا توجد وظائف منشورة' : 'No jobs posted yet'}</div>
        ) : (
          <div className="table-responsive mb-4">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th>{t('admin_job_title')}</th>
                  <th>{t('admin_job_dept')}</th>
                  <th>{t('admin_job_deadline')}</th>
                  <th>{t('admin_job_status')}</th>
                  <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {jobsList.map((job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.department}</td>
                    <td>{job.deadline || '-'}</td>
                    <td><span className={`badge ${job.status === 'closed' ? 'bg-secondary' : 'bg-success'}`}>{job.status}</span></td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleJobEdit(job)}>{t('admin_job_edit')}</button>
                      <button className="btn btn-sm btn-outline-warning" onClick={() => handleJobToggle(job)}>{job.status === 'closed' ? t('admin_job_open') : t('admin_job_close')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <hr className="my-4" />
        <h5 className="mb-3" style={{ color: "var(--primary-color)" }}>{language === 'ar' ? 'طلبات التوظيف' : 'Applications'}</h5>
        {applicationsLoading ? (
          <div className="text-center"><div className="spinner-border text-primary"></div></div>
        ) : applications.length === 0 ? (
          <div className="alert alert-secondary">{language === 'ar' ? 'لا توجد طلبات حالياً' : 'No applications yet'}</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th>Email</th>
                  <th>{language === 'ar' ? 'الوظيفة' : 'Job'}</th>
                  <th>{t('career_linkedin')}</th>
                  <th>{t('career_experience')}</th>
                  <th>{t('career_education')}</th>
                  <th>{language === 'ar' ? 'السيرة الذاتية' : 'CV'}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.name}</td>
                    <td>{app.phone}</td>
                    <td>{app.email}</td>
                    <td>{app.jobTitle || app.jobId}</td>
                    <td>{app.linkedin || '-'}</td>
                    <td>{app.experience || '-'}</td>
                    <td>{app.education || '-'}</td>
                    <td>{app.cvUrl ? <a href={app.cvUrl} target="_blank" rel="noreferrer">{language === 'ar' ? 'عرض' : 'View'}</a> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

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
        ) : <div className="alert alert-secondary mt-2">{t('admin_no_permission')}</div>}
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
    {renderMediaForm({ sectionKey: "news", titleAr: t('admin_news_title_ar'), titleEn: t('admin_news_title_en'), formState: newsForm, onFormChange: handleNewsChange, imagesInputName: "newsImages", videosInputName: "newsVideos", onSubmit: handleNewsSave, isLoading: newsLoading, msgText: newsMessage, permKey: "news", fileKey: newsFileKey })}
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

  const PERM_SECTIONS = [
    { key: "shipments", label: "الشحنات", actions: ["add", "edit", "delete"] },
    { key: "services", label: "الخدمات", actions: ["add", "edit", "delete"] },
    { key: "products", label: "المنتجات", actions: ["add", "edit", "delete"] },
    { key: "clients", label: "العملاء", actions: ["add", "edit", "delete"] },
    { key: "messages", label: "الرسائل", actions: ["view", "markRead"] },
    { key: "blog", label: "المدونة", actions: ["add", "edit", "delete"] },
    { key: "news", label: "الأخبار", actions: ["add", "edit", "delete"] },
    { key: "ads", label: "الإعلانات", actions: ["add", "edit", "delete"] },
    { key: "admins", label: "المشرفين", actions: ["view", "add", "edit", "delete"] },
  ];
  const ACTION_LABELS = { add: "إضافة", edit: "تعديل", delete: "حذف", view: "عرض", markRead: "تعليم كمقروء" };

  const SOCIAL_ICONS = [{ value: "bi-facebook", label: "Facebook" },{ value: "bi-twitter", label: "Twitter / X" },{ value: "bi-instagram", label: "Instagram" },{ value: "bi-linkedin", label: "LinkedIn" },{ value: "bi-tiktok", label: "TikTok" },{ value: "bi-youtube", label: "YouTube" },{ value: "bi-snapchat", label: "Snapchat" },{ value: "bi-telegram", label: "Telegram" },{ value: "bi-whatsapp", label: "WhatsApp" },{ value: "bi-globe", label: "Website" }];

  const renderSocialTab = () => (
    <div className="card shadow-sm border-0"><div className="card-body p-4">
      <h4 style={{ color: "var(--primary-color)" }} className="mb-3">{t('admin_tab_social')}</h4>
      {socialMsg && <div className="alert alert-info py-1 small">{socialMsg}</div>}
      {socialLinks.length > 0 && (<div className="table-responsive mb-4"><table className="table align-middle table-bordered"><thead className="table-light"><tr><th>Icon</th><th>Name</th><th>URL</th><th></th></tr></thead><tbody>{socialLinks.map((s) => (<tr key={s.id}><td><i className={`bi ${s.icon}`} style={{ fontSize: 24, color: s.color || "#333" }}></i></td><td>{s.name}</td><td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a></td><td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSocial(s.id)}>{t('admin_delete')}</button></td></tr>))}</tbody></table></div>)}
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

      {/* Admin List */}
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

          {/* View mode – show current permissions summary */}
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

          {/* Edit mode – checkboxes for each permission */}
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

      {/* Add Admin Form */}
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
            {activeTab === "social" && renderSocialTab()}
            {activeTab === "admins" && renderAdminsTab()}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPanel;

