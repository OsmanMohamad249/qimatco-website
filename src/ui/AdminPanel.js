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

const initialForm = {
  id: "", status: "Pending", customerName: "", origin: "", destination: "", eta: "", notes: "",
};

const DEFAULT_PERMS = {
  products: { add: false, edit: false, delete: false },
  clients: { add: false, edit: false, delete: false },
  messages: { view: false, markRead: false },
  news: { add: false, edit: false, delete: false },
  articles: { add: false, edit: false, delete: false },
  shipments: { add: false, edit: false, delete: false },
  admins: { view: false, add: false, delete: false },
};

const FULL_PERMS = {
  products: { add: true, edit: true, delete: true },
  clients: { add: true, edit: true, delete: true },
  messages: { view: true, markRead: true },
  news: { add: true, edit: true, delete: true },
  articles: { add: true, edit: true, delete: true },
  shipments: { add: true, edit: true, delete: true },
  admins: { view: true, add: true, delete: true },
};

const can = (perms, section, action) => {
  if (!perms || !perms[section]) return false;
  return !!perms[section][action];
};

const AdminPanel = () => {
  const { t, language } = useLanguage();
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

  const [productForm, setProductForm] = useState({ name_ar: "", name_en: "", category_ar: "", category_en: "", description_ar: "", description_en: "" });
  const [productImages, setProductImages] = useState([]);
  const [productVideo, setProductVideo] = useState(null);
  const [productSaveMessage, setProductSaveMessage] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [products, setProducts] = useState([]);

  const [clientForm, setClientForm] = useState({ name_ar: "", name_en: "" });
  const [clientFile, setClientFile] = useState(null);
  const [clientMessage, setClientMessage] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientFileKey, setClientFileKey] = useState(0);
  const [clients, setClients] = useState([]);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState("");

  const [articleForm, setArticleForm] = useState({ title_ar: "", title_en: "", body_ar: "", body_en: "", imageUrl: "" });
  const [articles, setArticles] = useState([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleMessage, setArticleMessage] = useState("");

  const [newsForm, setNewsForm] = useState({ title_ar: "", title_en: "", body_ar: "", body_en: "", imageUrl: "" });
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsMessage, setNewsMessage] = useState("");

  // Permission / Admin management state
  const [userPermissions, setUserPermissions] = useState(null); // null = not loaded yet
  const [accessDenied, setAccessDenied] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminForm, setAdminForm] = useState({ email: "" });
  const [adminPerms, setAdminPerms] = useState(JSON.parse(JSON.stringify(DEFAULT_PERMS)));
  const [adminSaveMsg, setAdminSaveMsg] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // Social links state
  const [socialLinks, setSocialLinks] = useState([]);
  const [socialForm, setSocialForm] = useState({ name: "", url: "", icon: "bi-globe", color: "#000000" });
  const [socialFile, setSocialFile] = useState(null);
  const [socialFileKey, setSocialFileKey] = useState(0);
  const [socialMsg, setSocialMsg] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);

  // WhatsApp settings state
  const [whatsappSettings, setWhatsappSettings] = useState({ phone: "", message: "", enabled: true });
  const [whatsappMsg, setWhatsappMsg] = useState("");
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  // ── EFFECTS ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        setForm(initialForm);
        setUserPermissions(null);
        setAccessDenied(false);
      }
    });
    return () => unsub();
  }, []);

  // Fetch current user's permissions from admins collection
  useEffect(() => {
    if (!user) return;
    const fetchPerms = async () => {
      try {
        const q = query(collection(db, "admins"), where("email", "==", user.email));
        const snap = await getDocs(q);
        if (snap.empty) {
          // Check if admins collection is empty (first-ever user = super admin)
          const allAdmins = await getDocs(collection(db, "admins"));
          if (allAdmins.empty) {
            // Auto-create first super admin
            await addDoc(collection(db, "admins"), {
              email: user.email,
              permissions: FULL_PERMS,
              role: "Super Admin",
              createdAt: serverTimestamp(),
            });
            setUserPermissions(FULL_PERMS);
            setAccessDenied(false);
          } else {
            setAccessDenied(true);
            setUserPermissions(null);
          }
        } else {
          const adminData = snap.docs[0].data();
          setUserPermissions(adminData.permissions || DEFAULT_PERMS);
          setAccessDenied(false);
        }
      } catch {
        setAccessDenied(true);
      }
    };
    fetchPerms();
  }, [user]);

  // Fetch all data once permissions are loaded
  useEffect(() => {
    if (!user || !userPermissions || accessDenied) return;
    const load = async () => {
      try {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { setMessagesError("تعذر تحميل الرسائل حالياً"); }
      finally { setMessagesLoading(false); }

      try { const snap = await getDocs(collection(db, "products")); setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { /* */ }
      try { const snap = await getDocs(collection(db, "clients")); setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { /* */ }
      try { const snap = await getDocs(collection(db, "articles")); setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { /* */ }
      try { const snap = await getDocs(collection(db, "news")); setNewsItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { /* */ }
      try { const snap = await getDocs(collection(db, "admins")); setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { /* */ }
      try { const snap = await getDocs(collection(db, "socialLinks")); setSocialLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch { /* */ }
      try {
        const waSnap = await getDoc(doc(db, "settings", "whatsapp"));
        if (waSnap.exists()) setWhatsappSettings(waSnap.data());
      } catch { /* */ }
    };
    load();
  }, [user, userPermissions, accessDenied]);

  // ── HANDLERS ──
  // Helper: get localized text from an object or string (backward compat)
  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val["ar"] || val["en"] || "";
  };

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

  const handleArticleChange = (e) => { const { name, value } = e.target; setArticleForm((prev) => ({ ...prev, [name]: value })); };
  const handleNewsChange = (e) => { const { name, value } = e.target; setNewsForm((prev) => ({ ...prev, [name]: value })); };

  const handleLoad = async () => {
    if (!form.id.trim()) { setMessage("Enter an ID to load."); return; }
    setLoading(true); setMessage("");
    try {
      const snapshot = await getDoc(doc(db, "shipments", form.id.trim()));
      if (snapshot.exists()) {
        const d = snapshot.data();
        setForm({ id: form.id.trim(), status: d.status || "Pending", customerName: d.customerName || "", origin: d.origin || "", destination: d.destination || "", eta: d.eta || "", notes: d.notes || "" });
        setMessage("Loaded existing shipment.");
      } else { setMessage("No shipment found. You can create a new one."); }
    } catch { setMessage("Error loading shipment."); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id.trim()) { setMessage("Tracking ID is required."); return; }
    setLoading(true); setMessage("");
    try {
      await setDoc(doc(db, "shipments", form.id.trim()), { status: form.status, customerName: form.customerName, origin: form.origin, destination: form.destination, eta: form.eta, notes: form.notes, updatedAt: serverTimestamp() }, { merge: true });
      setMessage("Saved successfully.");
    } catch { setMessage("Save failed."); }
    finally { setLoading(false); }
  };

  const handleReset = () => { setForm(initialForm); setMessage(""); };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError(""); setLoginLoading(true);
    try { await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword); setLoginEmail(""); setLoginPassword(""); }
    catch { setLoginError("Login failed. Check your credentials."); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = async () => { await signOut(auth); };

  const handleProductSave = async (e) => {
    e.preventDefault(); setProductSaveMessage("");
    if (!productForm.name_ar.trim() && !productForm.name_en.trim()) { setProductSaveMessage("Please fill the product name."); return; }
    try {
      setProductLoading(true);
      const imageUrls = [];
      for (const file of productImages) { const url = await uploadToCloudinary(file); if (url) imageUrls.push(url); }
      let videoUrl = "";
      if (productVideo) { videoUrl = await uploadToCloudinary(productVideo); }
      await addDoc(collection(db, "products"), {
        name: { ar: productForm.name_ar, en: productForm.name_en },
        category: { ar: productForm.category_ar, en: productForm.category_en },
        description: { ar: productForm.description_ar, en: productForm.description_en },
        imageUrls, videoUrl, createdAt: serverTimestamp()
      });
      setProductSaveMessage("Product saved successfully.");
      setProductForm({ name_ar: "", name_en: "", category_ar: "", category_en: "", description_ar: "", description_en: "" });
      setProductImages([]); setProductVideo(null);
      const snap = await getDocs(collection(db, "products"));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setProductSaveMessage("Save failed. Please try again."); }
    finally { setProductLoading(false); }
  };

  const handleDeleteProduct = async (id) => {
    try { await deleteDoc(doc(db, "products", id)); setProducts((prev) => prev.filter((p) => p.id !== id)); }
    catch { setProductSaveMessage("تعذر حذف المنتج"); }
  };

  const handleClientSave = async (e) => {
    e.preventDefault(); setClientMessage("");
    if (!clientForm.name_ar.trim() && !clientForm.name_en.trim()) { setClientMessage("يرجى إدخال اسم العميل"); return; }
    if (!clientFile) { setClientMessage("يرجى اختيار شعار العميل"); return; }
    try {
      setClientLoading(true);
      const logoUrl = await uploadToCloudinary(clientFile);
      if (!logoUrl) throw new Error("Upload failed");
      await addDoc(collection(db, "clients"), { name: { ar: clientForm.name_ar, en: clientForm.name_en }, logoUrl, createdAt: serverTimestamp() });
      setClientMessage("تم حفظ العميل بنجاح"); setClientForm({ name_ar: "", name_en: "" }); setClientFile(null); setClientFileKey((k) => k + 1);
      const snap = await getDocs(collection(db, "clients"));
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setClientMessage("تعذر حفظ العميل. حاول مرة أخرى."); }
    finally { setClientLoading(false); }
  };

  const handleDeleteClient = async (id) => {
    try { await deleteDoc(doc(db, "clients", id)); setClients((prev) => prev.filter((c) => c.id !== id)); }
    catch { setClientMessage("تعذر حذف العميل"); }
  };

  const handleArticleSave = async (e) => {
    e.preventDefault(); setArticleMessage("");
    try {
      setArticleLoading(true);
      await addDoc(collection(db, "articles"), {
        title: { ar: articleForm.title_ar, en: articleForm.title_en },
        body: { ar: articleForm.body_ar, en: articleForm.body_en },
        imageUrl: articleForm.imageUrl,
        createdAt: serverTimestamp()
      });
      setArticleForm({ title_ar: "", title_en: "", body_ar: "", body_en: "", imageUrl: "" });
      const snap = await getDocs(collection(db, "articles"));
      setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setArticleMessage("تم حفظ المقال");
    } catch { setArticleMessage("تعذر حفظ المقال"); }
    finally { setArticleLoading(false); }
  };

  const handleDeleteArticle = async (id) => {
    try { await deleteDoc(doc(db, "articles", id)); setArticles((prev) => prev.filter((a) => a.id !== id)); }
    catch { setArticleMessage("تعذر حذف المقال"); }
  };

  const handleNewsSave = async (e) => {
    e.preventDefault(); setNewsMessage("");
    try {
      setNewsLoading(true);
      await addDoc(collection(db, "news"), {
        title: { ar: newsForm.title_ar, en: newsForm.title_en },
        body: { ar: newsForm.body_ar, en: newsForm.body_en },
        imageUrl: newsForm.imageUrl,
        createdAt: serverTimestamp()
      });
      setNewsForm({ title_ar: "", title_en: "", body_ar: "", body_en: "", imageUrl: "" });
      const snap = await getDocs(collection(db, "news"));
      setNewsItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setNewsMessage("تم حفظ الخبر");
    } catch { setNewsMessage("تعذر حفظ الخبر"); }
    finally { setNewsLoading(false); }
  };

  const handleDeleteNews = async (id) => {
    try { await deleteDoc(doc(db, "news", id)); setNewsItems((prev) => prev.filter((n) => n.id !== id)); }
    catch { setNewsMessage("تعذر حذف الخبر"); }
  };

  const handleMarkRead = async (id) => {
    try { await updateDoc(doc(db, "messages", id), { status: "Read" }); setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "Read" } : m))); }
    catch { /* ignore */ }
  };

  // Admin management handlers
  const handleAdminPermToggle = (section, action) => {
    setAdminPerms((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[section][action] = !updated[section][action];
      return updated;
    });
  };

  const handleAdminSave = async (e) => {
    e.preventDefault(); setAdminSaveMsg("");
    if (!adminForm.email.trim()) { setAdminSaveMsg("يرجى إدخال البريد الإلكتروني"); return; }
    try {
      setAdminLoading(true);
      // Check if admin with this email already exists
      const q = query(collection(db, "admins"), where("email", "==", adminForm.email.trim()));
      const existing = await getDocs(q);
      if (!existing.empty) { setAdminSaveMsg("هذا البريد مسجل بالفعل كمشرف"); return; }
      await addDoc(collection(db, "admins"), {
        email: adminForm.email.trim(),
        permissions: adminPerms,
        role: "Admin",
        createdAt: serverTimestamp(),
      });
      setAdminSaveMsg("تم إضافة المشرف بنجاح");
      setAdminForm({ email: "" });
      setAdminPerms(JSON.parse(JSON.stringify(DEFAULT_PERMS)));
      const snap = await getDocs(collection(db, "admins"));
      setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setAdminSaveMsg("تعذر إضافة المشرف"); }
    finally { setAdminLoading(false); }
  };

  const handleDeleteAdmin = async (id, email) => {
    if (email === user.email) { setAdminSaveMsg("لا يمكنك حذف حسابك الخاص"); return; }
    try { await deleteDoc(doc(db, "admins", id)); setAdmins((prev) => prev.filter((a) => a.id !== id)); }
    catch { setAdminSaveMsg("تعذر حذف المشرف"); }
  };

  // Social links handlers
  const handleSocialChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "socialLogo") { setSocialFile(files && files[0] ? files[0] : null); return; }
    setSocialForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialSave = async (e) => {
    e.preventDefault(); setSocialMsg("");
    if (!socialForm.name.trim() || !socialForm.url.trim()) { setSocialMsg("يرجى ملء الاسم والرابط"); return; }
    try {
      setSocialLoading(true);
      let logoUrl = "";
      if (socialFile) { logoUrl = await uploadToCloudinary(socialFile); }
      await addDoc(collection(db, "socialLinks"), {
        name: socialForm.name, url: socialForm.url, icon: socialForm.icon,
        color: socialForm.color, logoUrl, createdAt: serverTimestamp(),
      });
      setSocialMsg("تم حفظ الرابط بنجاح");
      setSocialForm({ name: "", url: "", icon: "bi-globe", color: "#000000" });
      setSocialFile(null); setSocialFileKey((k) => k + 1);
      const snap = await getDocs(collection(db, "socialLinks"));
      setSocialLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch { setSocialMsg("تعذر حفظ الرابط"); }
    finally { setSocialLoading(false); }
  };

  const handleDeleteSocial = async (id) => {
    try { await deleteDoc(doc(db, "socialLinks", id)); setSocialLinks((prev) => prev.filter((s) => s.id !== id)); }
    catch { setSocialMsg("تعذر حذف الرابط"); }
  };

  // WhatsApp settings handlers
  const handleWhatsappChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWhatsappSettings((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleWhatsappSave = async (e) => {
    e.preventDefault(); setWhatsappMsg("");
    if (!whatsappSettings.phone.trim()) { setWhatsappMsg("يرجى إدخال رقم الواتساب"); return; }
    try {
      setWhatsappLoading(true);
      await setDoc(doc(db, "settings", "whatsapp"), {
        phone: whatsappSettings.phone, message: whatsappSettings.message,
        enabled: whatsappSettings.enabled, updatedAt: serverTimestamp(),
      });
      setWhatsappMsg("تم حفظ إعدادات الواتساب بنجاح");
    } catch { setWhatsappMsg("تعذر حفظ الإعدادات"); }
    finally { setWhatsappLoading(false); }
  };

  // ── RENDER TAB FUNCTIONS ──

  const renderShipmentsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: "var(--primary-color)" }}>إدارة الشحنات</h4>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleReset} disabled={loading}>مسح الحقول</button>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleLoad} disabled={loading}>تحميل</button>
          </div>
        </div>
        {can(userPermissions, "shipments", "add") && (
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6"><label className="form-label">Tracking ID</label><input name="id" type="text" className="form-control" value={form.id} onChange={handleChange} placeholder="QIM-123456" /></div>
            <div className="col-md-6"><label className="form-label">Status</label>
              <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option>Pending</option><option>Processing</option><option>In Transit</option><option>Clearing Customs</option><option>Delivered</option><option>On Hold</option>
              </select>
            </div>
            <div className="col-md-4"><label className="form-label">Customer Name</label><input name="customerName" type="text" className="form-control" value={form.customerName} onChange={handleChange} /></div>
            <div className="col-md-4"><label className="form-label">Origin</label><input name="origin" type="text" className="form-control" value={form.origin} onChange={handleChange} /></div>
            <div className="col-md-4"><label className="form-label">Destination</label><input name="destination" type="text" className="form-control" value={form.destination} onChange={handleChange} /></div>
            <div className="col-md-6"><label className="form-label">ETA</label><input name="eta" type="text" className="form-control" value={form.eta} onChange={handleChange} placeholder="YYYY-MM-DD" /></div>
            <div className="col-md-6"><label className="form-label">Notes</label><textarea name="notes" className="form-control" rows="3" value={form.notes} onChange={handleChange}></textarea></div>
            <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={loading}>{loading ? "جارٍ الحفظ..." : "حفظ / Save"}</button></div>
          </form>
        )}
        {!can(userPermissions, "shipments", "add") && <div className="alert alert-secondary">ليس لديك صلاحية إضافة/تعديل الشحنات</div>}
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
              <thead><tr><th>{t('trading_no_image')}</th><th>{t('admin_product_name_ar')}</th><th>{t('admin_product_name_en')}</th>{can(userPermissions, "products", "delete") && <th></th>}</tr></thead>
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
            <div className="col-12"><label className="form-label">{t('admin_product_images')}</label><input name="images" type="file" accept="image/*" multiple className="form-control" onChange={handleProductChange} /></div>
            <div className="col-12"><label className="form-label">{t('admin_product_video')}</label><input name="video" type="file" accept="video/*" className="form-control" onChange={handleProductChange} /></div>
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
          <div className="table-responsive mb-4">
            <table className="table align-middle">
              <thead><tr><th>{t('admin_client_logo')}</th><th>{t('admin_client_name_ar')}</th><th>{t('admin_client_name_en')}</th>{can(userPermissions, "clients", "delete") && <th></th>}</tr></thead>
              <tbody>{clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.logoUrl ? <img src={c.logoUrl} alt={loc(c.name)} style={{ maxHeight: 50 }} /> : "-"}</td>
                  <td>{typeof c.name === "object" ? c.name.ar : c.name}</td>
                  <td>{typeof c.name === "object" ? c.name.en : "-"}</td>
                  {can(userPermissions, "clients", "delete") && <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClient(c.id)}>{t('admin_delete')}</button></td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {can(userPermissions, "clients", "add") ? (
          <form className="row g-3" onSubmit={handleClientSave}>
            <div className="col-md-6"><label className="form-label">{t('admin_client_name_ar')}</label><input name="name_ar" type="text" className="form-control" dir="rtl" value={clientForm.name_ar} onChange={handleClientChange} required /></div>
            <div className="col-md-6"><label className="form-label">{t('admin_client_name_en')}</label><input name="name_en" type="text" className="form-control" dir="ltr" value={clientForm.name_en} onChange={handleClientChange} /></div>
            <div className="col-md-6"><label className="form-label">{t('admin_client_logo')}</label><input key={clientFileKey} name="clientLogo" type="file" accept="image/*" className="form-control" onChange={handleClientChange} required /></div>
            <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={clientLoading}>{clientLoading ? t('admin_uploading') : t('admin_client_save')}</button></div>
          </form>
        ) : <div className="alert alert-secondary mt-2">{t('admin_no_permission')}</div>}
      </div>
    </div>
  );

  const renderArticlesTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_articles')}</h4>
        {articleMessage && <div className="alert alert-info py-1 small">{articleMessage}</div>}
        {can(userPermissions, "articles", "add") ? (
          <form className="row g-3" onSubmit={handleArticleSave}>
            <div className="col-12"><h6 className="text-muted">🇸🇦 {language === 'ar' ? 'العربية' : 'Arabic'}</h6></div>
            <div className="col-md-6"><label className="form-label">{t('admin_article_title_ar')}</label><input name="title_ar" type="text" className="form-control" dir="rtl" value={articleForm.title_ar} onChange={handleArticleChange} required /></div>
            <div className="col-md-6"><label className="form-label">{t('admin_article_image')}</label><input name="imageUrl" type="text" className="form-control" value={articleForm.imageUrl} onChange={handleArticleChange} /></div>
            <div className="col-12"><label className="form-label">{t('admin_article_body_ar')}</label><textarea name="body_ar" className="form-control" rows="3" dir="rtl" value={articleForm.body_ar} onChange={handleArticleChange} required></textarea></div>
            <div className="col-12"><h6 className="text-muted">🇬🇧 {language === 'ar' ? 'الإنجليزية' : 'English'}</h6></div>
            <div className="col-md-6"><label className="form-label">{t('admin_article_title_en')}</label><input name="title_en" type="text" className="form-control" dir="ltr" value={articleForm.title_en} onChange={handleArticleChange} /></div>
            <div className="col-12"><label className="form-label">{t('admin_article_body_en')}</label><textarea name="body_en" className="form-control" rows="3" dir="ltr" value={articleForm.body_en} onChange={handleArticleChange}></textarea></div>
            <div className="col-12"><button type="submit" className="btn btn-primary" disabled={articleLoading}>{articleLoading ? t('admin_saving') : t('admin_article_save')}</button></div>
          </form>
        ) : <div className="alert alert-secondary">{t('admin_no_permission')}</div>}
        {articles.length > 0 && (
          <div className="table-responsive mt-4">
            <table className="table align-middle"><thead><tr><th>{t('admin_article_title_ar')}</th><th>{t('admin_article_title_en')}</th>{can(userPermissions, "articles", "delete") && <th></th>}</tr></thead>
              <tbody>{articles.map((a) => (
                <tr key={a.id}><td>{typeof a.title === "object" ? a.title.ar : a.title}</td><td>{typeof a.title === "object" ? a.title.en : "-"}</td>
                  {can(userPermissions, "articles", "delete") && <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteArticle(a.id)}>{t('admin_delete')}</button></td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderNewsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_news')}</h4>
        {newsMessage && <div className="alert alert-info py-1 small">{newsMessage}</div>}
        {can(userPermissions, "news", "add") ? (
          <form className="row g-3" onSubmit={handleNewsSave}>
            <div className="col-12"><h6 className="text-muted">🇸🇦 {language === 'ar' ? 'العربية' : 'Arabic'}</h6></div>
            <div className="col-md-6"><label className="form-label">{t('admin_news_title_ar')}</label><input name="title_ar" type="text" className="form-control" dir="rtl" value={newsForm.title_ar} onChange={handleNewsChange} required /></div>
            <div className="col-md-6"><label className="form-label">{t('admin_news_image')}</label><input name="imageUrl" type="text" className="form-control" value={newsForm.imageUrl} onChange={handleNewsChange} /></div>
            <div className="col-12"><label className="form-label">{t('admin_news_body_ar')}</label><textarea name="body_ar" className="form-control" rows="3" dir="rtl" value={newsForm.body_ar} onChange={handleNewsChange} required></textarea></div>
            <div className="col-12"><h6 className="text-muted">🇬🇧 {language === 'ar' ? 'الإنجليزية' : 'English'}</h6></div>
            <div className="col-md-6"><label className="form-label">{t('admin_news_title_en')}</label><input name="title_en" type="text" className="form-control" dir="ltr" value={newsForm.title_en} onChange={handleNewsChange} /></div>
            <div className="col-12"><label className="form-label">{t('admin_news_body_en')}</label><textarea name="body_en" className="form-control" rows="3" dir="ltr" value={newsForm.body_en} onChange={handleNewsChange}></textarea></div>
            <div className="col-12"><button type="submit" className="btn btn-primary" disabled={newsLoading}>{newsLoading ? t('admin_saving') : t('admin_news_save')}</button></div>
          </form>
        ) : <div className="alert alert-secondary">{t('admin_no_permission')}</div>}
        {newsItems.length > 0 && (
          <div className="table-responsive mt-4">
            <table className="table align-middle"><thead><tr><th>{t('admin_news_title_ar')}</th><th>{t('admin_news_title_en')}</th>{can(userPermissions, "news", "delete") && <th></th>}</tr></thead>
              <tbody>{newsItems.map((n) => (
                <tr key={n.id}><td>{typeof n.title === "object" ? n.title.ar : n.title}</td><td>{typeof n.title === "object" ? n.title.en : "-"}</td>
                  {can(userPermissions, "news", "delete") && <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteNews(n.id)}>{t('admin_delete')}</button></td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderMessagesTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: "var(--primary-color)" }}>{t('admin_tab_messages')}</h4>
          {messagesLoading && <span className="text-muted small">{t('admin_msg_loading')}</span>}
          {messagesError && <span className="text-danger small">{messagesError}</span>}
        </div>
        {!can(userPermissions, "messages", "view") && <div className="alert alert-secondary">{t('admin_no_permission')}</div>}
        {can(userPermissions, "messages", "view") && !messagesLoading && messages.length === 0 && <div className="alert alert-info">{t('admin_msg_empty')}</div>}
        {can(userPermissions, "messages", "view") && !messagesLoading && messages.length > 0 && (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-dark">
                <tr><th>{t('admin_msg_name')}</th><th>{t('admin_msg_phone')}</th><th>{t('admin_msg_type')}</th><th>{t('admin_msg_message')}</th><th>{t('admin_msg_status')}</th>{can(userPermissions, "messages", "markRead") && <th></th>}</tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id}>
                    <td>{msg.name || "-"}</td>
                    <td>{msg.phone || "-"}</td>
                    <td>{msg.type || msg.intent || "-"}</td>
                    <td style={{ maxWidth: 200 }}>{msg.message || "-"}</td>
                    <td><span className={`badge ${msg.status === "New" ? "bg-warning text-dark" : "bg-success"}`}>{msg.status === "New" ? t('admin_msg_new') : t('admin_msg_read')}</span></td>
                    {can(userPermissions, "messages", "markRead") && <td>{msg.status !== "Read" && <button className="btn btn-sm btn-outline-primary" onClick={() => handleMarkRead(msg.id)}>{t('admin_msg_mark_read')}</button>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const PERM_SECTIONS = [
    { key: "shipments", label: "الشحنات", actions: ["add", "edit", "delete"] },
    { key: "products", label: "المنتجات", actions: ["add", "edit", "delete"] },
    { key: "clients", label: "العملاء", actions: ["add", "edit", "delete"] },
    { key: "messages", label: "الرسائل", actions: ["view", "markRead"] },
    { key: "news", label: "الأخبار", actions: ["add", "edit", "delete"] },
    { key: "articles", label: "المقالات", actions: ["add", "edit", "delete"] },
    { key: "admins", label: "المشرفين", actions: ["view", "add", "delete"] },
  ];

  const ACTION_LABELS = { add: "إضافة", edit: "تعديل", delete: "حذف", view: "عرض", markRead: "تعليم كمقروء" };

  const SOCIAL_ICONS = [
    { value: "bi-facebook", label: "Facebook" },
    { value: "bi-twitter", label: "Twitter / X" },
    { value: "bi-instagram", label: "Instagram" },
    { value: "bi-linkedin", label: "LinkedIn" },
    { value: "bi-tiktok", label: "TikTok" },
    { value: "bi-youtube", label: "YouTube" },
    { value: "bi-snapchat", label: "Snapchat" },
    { value: "bi-telegram", label: "Telegram" },
    { value: "bi-whatsapp", label: "WhatsApp" },
    { value: "bi-globe", label: "Website" },
  ];

  const renderSocialTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }} className="mb-3">إدارة روابط التواصل الاجتماعي</h4>
        {socialMsg && <div className="alert alert-info py-1 small">{socialMsg}</div>}

        {/* Existing links */}
        {socialLinks.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table align-middle table-bordered">
              <thead className="table-light">
                <tr><th>الأيقونة</th><th>الاسم</th><th>الرابط</th><th>اللون</th><th>لوجو</th><th></th></tr>
              </thead>
              <tbody>
                {socialLinks.map((s) => (
                  <tr key={s.id}>
                    <td><i className={`bi ${s.icon}`} style={{ fontSize: 24, color: s.color || "#333" }}></i></td>
                    <td>{s.name}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a>
                    </td>
                    <td><span style={{ display: "inline-block", width: 24, height: 24, background: s.color || "#333", borderRadius: 4 }}></span></td>
                    <td>{s.logoUrl ? <img src={s.logoUrl} alt={s.name} style={{ maxHeight: 30 }} /> : "-"}</td>
                    <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSocial(s.id)}>حذف</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add new link */}
        <h5 className="mt-3 mb-3">إضافة رابط جديد</h5>
        <form className="row g-3" onSubmit={handleSocialSave}>
          <div className="col-md-4">
            <label className="form-label">اسم المنصة</label>
            <input name="name" type="text" className="form-control" value={socialForm.name} onChange={handleSocialChange} placeholder="مثال: Facebook" required />
          </div>
          <div className="col-md-4">
            <label className="form-label">الرابط (URL)</label>
            <input name="url" type="url" className="form-control" value={socialForm.url} onChange={handleSocialChange} placeholder="https://facebook.com/..." required />
          </div>
          <div className="col-md-4">
            <label className="form-label">الأيقونة</label>
            <select name="icon" className="form-select" value={socialForm.icon} onChange={handleSocialChange}>
              {SOCIAL_ICONS.map((ic) => (<option key={ic.value} value={ic.value}>{ic.label}</option>))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">اللون</label>
            <input name="color" type="color" className="form-control form-control-color" value={socialForm.color} onChange={handleSocialChange} />
          </div>
          <div className="col-md-8">
            <label className="form-label">لوجو مخصص (اختياري)</label>
            <input key={socialFileKey} name="socialLogo" type="file" accept="image/*" className="form-control" onChange={handleSocialChange} />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={socialLoading}>
              {socialLoading ? "جارٍ الحفظ..." : "حفظ الرابط"}
            </button>
          </div>
        </form>

        {/* WhatsApp Settings */}
        <hr className="my-4" />
        <h4 style={{ color: "var(--primary-color)" }} className="mb-3"><i className="bi bi-whatsapp me-2" style={{ color: "#25D366" }}></i>إعدادات زر الواتساب العائم</h4>
        {whatsappMsg && <div className="alert alert-info py-1 small">{whatsappMsg}</div>}
        <form className="row g-3" onSubmit={handleWhatsappSave}>
          <div className="col-md-6">
            <label className="form-label">رقم الواتساب (مع رمز الدولة)</label>
            <input name="phone" type="text" className="form-control" value={whatsappSettings.phone} onChange={handleWhatsappChange} placeholder="249123456789" required />
            <small className="text-muted">بدون + أو 00، مثال: 249123456789</small>
          </div>
          <div className="col-md-6">
            <label className="form-label">الرسالة الافتراضية</label>
            <input name="message" type="text" className="form-control" value={whatsappSettings.message} onChange={handleWhatsappChange} placeholder="مرحباً، أريد الاستفسار عن..." />
          </div>
          <div className="col-md-6">
            <div className="form-check form-switch mt-2">
              <input className="form-check-input" type="checkbox" id="waEnabled" name="enabled" checked={whatsappSettings.enabled} onChange={handleWhatsappChange} />
              <label className="form-check-label" htmlFor="waEnabled">تفعيل زر الواتساب العائم</label>
            </div>
          </div>
          <div className="col-md-6">
            <div className="p-2 border rounded d-flex align-items-center gap-2" style={{ background: "#f9f9f9" }}>
              <span>معاينة:</span>
              <a href={`https://wa.me/${whatsappSettings.phone}?text=${encodeURIComponent(whatsappSettings.message)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: "#25D366", color: "#fff", borderRadius: 50 }}>
                <i className="bi bi-whatsapp"></i> {whatsappSettings.phone || "---"}
              </a>
            </div>
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary w-100" style={{ background: "#25D366", border: "none" }} disabled={whatsappLoading}>
              {whatsappLoading ? "جارٍ الحفظ..." : "حفظ إعدادات الواتساب"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderAdminsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }} className="mb-3">إدارة المشرفين</h4>
        {adminSaveMsg && <div className="alert alert-info py-1 small">{adminSaveMsg}</div>}

        {/* Admin List */}
        {admins.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table align-middle table-bordered">
              <thead className="table-light">
                <tr><th>البريد الإلكتروني</th><th>الدور</th><th>الصلاحيات</th>{can(userPermissions, "admins", "delete") && <th></th>}</tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.email}</strong>{a.email === user.email && <span className="badge bg-primary ms-2">أنت</span>}</td>
                    <td><span className={`badge ${a.role === "Super Admin" ? "bg-danger" : "bg-secondary"}`}>{a.role || "Admin"}</span></td>
                    <td style={{ fontSize: "0.8rem" }}>
                      {a.permissions && PERM_SECTIONS.map((s) => {
                        const sectionPerms = a.permissions[s.key];
                        if (!sectionPerms) return null;
                        const activeActions = s.actions.filter((act) => sectionPerms[act]);
                        if (activeActions.length === 0) return null;
                        return <div key={s.key}><strong>{s.label}:</strong> {activeActions.map((act) => ACTION_LABELS[act]).join(", ")}</div>;
                      })}
                    </td>
                    {can(userPermissions, "admins", "delete") && (
                      <td>
                        {a.email !== user.email ? (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAdmin(a.id, a.email)}>حذف</button>
                        ) : <span className="text-muted small">-</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Admin Form */}
        {can(userPermissions, "admins", "add") ? (
          <>
            <h5 className="mt-4 mb-3">إضافة مشرف جديد</h5>
            <form className="row g-3" onSubmit={handleAdminSave}>
              <div className="col-12">
                <label className="form-label">البريد الإلكتروني</label>
                <input type="email" className="form-control" value={adminForm.email} onChange={(e) => setAdminForm({ email: e.target.value })} placeholder="admin@example.com" required />
                <small className="text-muted">يجب أن يكون لديه حساب في Firebase Auth مسبقاً</small>
              </div>

              <div className="col-12">
                <label className="form-label fw-bold mb-2">الصلاحيات</label>
                <div className="border rounded p-3" style={{ background: "#f9f9f9" }}>
                  {PERM_SECTIONS.map((section) => (
                    <div key={section.key} className="mb-3">
                      <div className="fw-bold mb-1" style={{ color: "var(--primary-color)" }}>{section.label}</div>
                      <div className="d-flex flex-wrap gap-3">
                        {section.actions.map((action) => (
                          <div className="form-check" key={`${section.key}-${action}`}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`perm-${section.key}-${action}`}
                              checked={adminPerms[section.key]?.[action] || false}
                              onChange={() => handleAdminPermToggle(section.key, action)}
                            />
                            <label className="form-check-label" htmlFor={`perm-${section.key}-${action}`}>{ACTION_LABELS[action]}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-12">
                <button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={adminLoading}>
                  {adminLoading ? "جارٍ الحفظ..." : "إضافة المشرف"}
                </button>
              </div>
            </form>
          </>
        ) : <div className="alert alert-secondary mt-3">ليس لديك صلاحية إضافة مشرفين</div>}
      </div>
    </div>
  );

  // ── RETURN ──

  if (authLoading) {
    return <main id="main" className="py-5"><div className="container text-center"><div className="spinner-border text-primary" role="status"></div></div></main>;
  }

  if (!user) {
    return (
      <main id="main" className="py-5" dir={isRTL ? 'rtl' : 'ltr'}>
        <Helmet><title>{t('admin_login_title')} | Qimmah</title></Helmet>
        <div className="container" data-aos="fade-up">
          <div className="row justify-content-center">
            <div className="col-lg-5">
              <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                  <h3 className="mb-3" style={{ color: "var(--primary-color)" }}>{t('admin_login_title')}</h3>
                  <form onSubmit={handleLogin} className="row g-3">
                    <div className="col-12"><label className="form-label">{t('admin_login_email')}</label><input type="email" className="form-control" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /></div>
                    <div className="col-12"><label className="form-label">{t('admin_login_password')}</label><input type="password" className="form-control" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /></div>
                    {loginError && <div className="text-danger small">{loginError}</div>}
                    <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={loginLoading}>{loginLoading ? t('admin_login_loading') : t('admin_login_btn')}</button></div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Still loading permissions
  if (userPermissions === null && !accessDenied) {
    return <main id="main" className="py-5"><div className="container text-center"><div className="spinner-border text-primary" role="status"></div><p className="mt-2 text-muted">{t('admin_checking_perms')}</p></div></main>;
  }

  // Access Denied
  if (accessDenied) {
    return (
      <main id="main" className="py-5" dir={isRTL ? 'rtl' : 'ltr'}>
        <Helmet><title>{t('admin_access_denied')} | Qimmah</title></Helmet>
        <div className="container text-center" data-aos="fade-up">
          <div className="card shadow-sm border-0 mx-auto" style={{ maxWidth: 500 }}>
            <div className="card-body p-5">
              <i className="bi bi-shield-lock" style={{ fontSize: 64, color: "var(--accent-color, #F4A900)" }}></i>
              <h3 className="mt-3" style={{ color: "var(--primary-color)" }}>{t('admin_access_denied')}</h3>
              <p className="text-muted">{t('admin_access_denied_msg')}</p>
              <p className="text-muted small">{user.email}</p>
              <button className="btn btn-outline-danger" onClick={handleLogout}>{t('admin_access_denied_logout')}</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="py-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <Helmet><title>{t('admin_panel_title')} | Qimmah</title></Helmet>
      <div className="container" data-aos="fade-up">
        <div className="row">
          <div className="col-lg-3 mb-3 mb-lg-0">
            <div className="list-group shadow-sm">
              <button className={`list-group-item list-group-item-action ${activeTab === "shipments" ? "active" : ""}`} onClick={() => setActiveTab("shipments")}>{t('admin_tab_shipments')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>{t('admin_tab_products')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "clients" ? "active" : ""}`} onClick={() => setActiveTab("clients")}>{t('admin_tab_clients')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "articles" ? "active" : ""}`} onClick={() => setActiveTab("articles")}>{t('admin_tab_articles')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "news" ? "active" : ""}`} onClick={() => setActiveTab("news")}>{t('admin_tab_news')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "messages" ? "active" : ""}`} onClick={() => setActiveTab("messages")}>{t('admin_tab_messages')}</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "social" ? "active" : ""}`} onClick={() => setActiveTab("social")}>
                <i className="bi bi-share me-1"></i>{t('admin_tab_social')}
              </button>
              {can(userPermissions, "admins", "view") && (
                <button className={`list-group-item list-group-item-action ${activeTab === "admins" ? "active" : ""}`} onClick={() => setActiveTab("admins")}>
                  <i className="bi bi-people-fill me-1"></i>{t('admin_tab_admins')}
                </button>
              )}
            </div>
          </div>
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 style={{ color: "var(--primary-color)" }}>{t('admin_panel_title')}</h3>
                <p className="text-muted small mb-0">{t('admin_panel_subtitle')}</p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">{user.email}</span>
                <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>{t('admin_logout')}</button>
              </div>
            </div>
            {activeTab === "shipments" && renderShipmentsTab()}
            {activeTab === "products" && renderProductsTab()}
            {activeTab === "clients" && renderClientsTab()}
            {activeTab === "articles" && renderArticlesTab()}
            {activeTab === "news" && renderNewsTab()}
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

