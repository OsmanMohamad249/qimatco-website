import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { db, auth } from "../firebase";
import {
  doc, setDoc, serverTimestamp, getDoc, collection, addDoc,
  getDocs, query, orderBy, updateDoc, deleteDoc
} from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

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
  id: "",
  status: "Pending",
  customerName: "",
  origin: "",
  destination: "",
  eta: "",
  notes: "",
};

const AdminPanel = () => {
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

  const [productForm, setProductForm] = useState({ name: "", category: "", description: "" });
  const [productImages, setProductImages] = useState([]);
  const [productVideo, setProductVideo] = useState(null);
  const [productSaveMessage, setProductSaveMessage] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [products, setProducts] = useState([]);

  const [clientForm, setClientForm] = useState({ name: "" });
  const [clientFile, setClientFile] = useState(null);
  const [clientMessage, setClientMessage] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientFileKey, setClientFileKey] = useState(0);
  const [clients, setClients] = useState([]);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState("");

  const [articleForm, setArticleForm] = useState({ title: "", body: "", imageUrl: "" });
  const [articles, setArticles] = useState([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleMessage, setArticleMessage] = useState("");

  const [newsForm, setNewsForm] = useState({ title: "", body: "", imageUrl: "" });
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsMessage, setNewsMessage] = useState("");

  // ── EFFECTS ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) setForm(initialForm);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { setMessagesError("تعذر تحميل الرسائل حالياً"); }
      finally { setMessagesLoading(false); }

      try {
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* ignore */ }

      try {
        const snap = await getDocs(collection(db, "clients"));
        setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* ignore */ }

      try {
        const snap = await getDocs(collection(db, "articles"));
        setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* ignore */ }

      try {
        const snap = await getDocs(collection(db, "news"));
        setNewsItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* ignore */ }
    };
    load();
  }, [user]);

  // ── HANDLERS ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleArticleChange = (e) => {
    const { name, value } = e.target;
    setArticleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewsChange = (e) => {
    const { name, value } = e.target;
    setNewsForm((prev) => ({ ...prev, [name]: value }));
  };

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
    if (!productForm.name.trim() || !productForm.category.trim() || !productForm.description.trim()) { setProductSaveMessage("Please fill all product fields."); return; }
    try {
      setProductLoading(true);
      const imageUrls = [];
      for (const file of productImages) {
        const url = await uploadToCloudinary(file);
        if (url) imageUrls.push(url);
      }
      let videoUrl = "";
      if (productVideo) { videoUrl = await uploadToCloudinary(productVideo); }
      await addDoc(collection(db, "products"), { name: productForm.name, category: productForm.category, description: productForm.description, imageUrls, videoUrl, createdAt: serverTimestamp() });
      setProductSaveMessage("Product saved successfully.");
      setProductForm({ name: "", category: "", description: "" }); setProductImages([]); setProductVideo(null);
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
    if (!clientForm.name.trim()) { setClientMessage("يرجى إدخال اسم العميل"); return; }
    if (!clientFile) { setClientMessage("يرجى اختيار شعار العميل"); return; }
    try {
      setClientLoading(true);
      const logoUrl = await uploadToCloudinary(clientFile);
      if (!logoUrl) throw new Error("Upload failed");
      await addDoc(collection(db, "clients"), { name: clientForm.name, logoUrl, createdAt: serverTimestamp() });
      setClientMessage("تم حفظ العميل بنجاح"); setClientForm({ name: "" }); setClientFile(null); setClientFileKey((k) => k + 1);
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
      await addDoc(collection(db, "articles"), { ...articleForm, createdAt: serverTimestamp() });
      setArticleForm({ title: "", body: "", imageUrl: "" });
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
      await addDoc(collection(db, "news"), { ...newsForm, createdAt: serverTimestamp() });
      setNewsForm({ title: "", body: "", imageUrl: "" });
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
        {message && <div className="alert alert-info mt-3">{message}</div>}
      </div>
    </div>
  );

  const renderProductsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: "var(--primary-color)" }}>إدارة المنتجات</h4>
          {productSaveMessage && <span className="small text-info">{productSaveMessage}</span>}
        </div>
        {products.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table align-middle">
              <thead><tr><th>الصورة</th><th>الاسم</th><th>الفئة</th><th></th></tr></thead>
              <tbody>{products.map((p) => (
                <tr key={p.id}>
                  <td>{p.imageUrls?.length ? <img src={p.imageUrls[0]} alt={p.name} style={{ maxHeight: 50 }} /> : "-"}</td>
                  <td>{p.name}</td><td>{p.category}</td>
                  <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(p.id)}>حذف</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <form className="row g-3" onSubmit={handleProductSave}>
          <div className="col-md-6"><label className="form-label">Product Name</label><input name="name" type="text" className="form-control" value={productForm.name} onChange={handleProductChange} required /></div>
          <div className="col-md-6"><label className="form-label">Category</label><input name="category" type="text" className="form-control" value={productForm.category} onChange={handleProductChange} required /></div>
          <div className="col-12"><label className="form-label">Description</label><textarea name="description" className="form-control" rows="3" value={productForm.description} onChange={handleProductChange} required></textarea></div>
          <div className="col-12"><label className="form-label">Product Images (multiple)</label><input name="images" type="file" accept="image/*" multiple className="form-control" onChange={handleProductChange} /></div>
          <div className="col-12"><label className="form-label">Promotional Video</label><input name="video" type="file" accept="video/*" className="form-control" onChange={handleProductChange} /></div>
          <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={productLoading}>{productLoading ? "جارٍ الرفع والحفظ..." : "حفظ المنتج"}</button></div>
        </form>
      </div>
    </div>
  );

  const renderClientsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: "var(--primary-color)" }}>إدارة العملاء</h4>
          {clientMessage && <span className="small text-info">{clientMessage}</span>}
        </div>
        {clients.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table align-middle">
              <thead><tr><th>الشعار</th><th>الاسم</th><th></th></tr></thead>
              <tbody>{clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.logoUrl ? <img src={c.logoUrl} alt={c.name} style={{ maxHeight: 50 }} /> : "-"}</td>
                  <td>{c.name}</td>
                  <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClient(c.id)}>حذف</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <form className="row g-3" onSubmit={handleClientSave}>
          <div className="col-md-6"><label className="form-label">اسم العميل</label><input name="name" type="text" className="form-control" value={clientForm.name} onChange={handleClientChange} required /></div>
          <div className="col-md-6"><label className="form-label">شعار العميل</label><input key={clientFileKey} name="clientLogo" type="file" accept="image/*" className="form-control" onChange={handleClientChange} required /></div>
          <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={clientLoading}>{clientLoading ? "جارٍ الرفع والحفظ..." : "حفظ العميل"}</button></div>
        </form>
      </div>
    </div>
  );

  const renderArticlesTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }}>إدارة المقالات</h4>
        {articleMessage && <div className="alert alert-info py-1 small">{articleMessage}</div>}
        <form className="row g-3" onSubmit={handleArticleSave}>
          <div className="col-md-6"><label className="form-label">العنوان</label><input name="title" type="text" className="form-control" value={articleForm.title} onChange={handleArticleChange} required /></div>
          <div className="col-md-6"><label className="form-label">صورة غلاف (رابط)</label><input name="imageUrl" type="text" className="form-control" value={articleForm.imageUrl} onChange={handleArticleChange} /></div>
          <div className="col-12"><label className="form-label">المحتوى</label><textarea name="body" className="form-control" rows="4" value={articleForm.body} onChange={handleArticleChange} required></textarea></div>
          <div className="col-12"><button type="submit" className="btn btn-primary" disabled={articleLoading}>{articleLoading ? "جارٍ الحفظ..." : "حفظ المقال"}</button></div>
        </form>
        {articles.length > 0 && (
          <div className="table-responsive mt-4">
            <table className="table align-middle"><thead><tr><th>العنوان</th><th></th></tr></thead>
              <tbody>{articles.map((a) => (<tr key={a.id}><td>{a.title}</td><td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteArticle(a.id)}>حذف</button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderNewsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }}>إدارة الأخبار</h4>
        {newsMessage && <div className="alert alert-info py-1 small">{newsMessage}</div>}
        <form className="row g-3" onSubmit={handleNewsSave}>
          <div className="col-md-6"><label className="form-label">العنوان</label><input name="title" type="text" className="form-control" value={newsForm.title} onChange={handleNewsChange} required /></div>
          <div className="col-md-6"><label className="form-label">صورة غلاف (رابط)</label><input name="imageUrl" type="text" className="form-control" value={newsForm.imageUrl} onChange={handleNewsChange} /></div>
          <div className="col-12"><label className="form-label">المحتوى</label><textarea name="body" className="form-control" rows="4" value={newsForm.body} onChange={handleNewsChange} required></textarea></div>
          <div className="col-12"><button type="submit" className="btn btn-primary" disabled={newsLoading}>{newsLoading ? "جارٍ الحفظ..." : "حفظ الخبر"}</button></div>
        </form>
        {newsItems.length > 0 && (
          <div className="table-responsive mt-4">
            <table className="table align-middle"><thead><tr><th>العنوان</th><th></th></tr></thead>
              <tbody>{newsItems.map((n) => (<tr key={n.id}><td>{n.title}</td><td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteNews(n.id)}>حذف</button></td></tr>))}</tbody>
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
          <h4 style={{ color: "var(--primary-color)" }}>الرسائل والطلبات</h4>
          {messagesLoading && <span className="text-muted small">جاري التحميل...</span>}
          {messagesError && <span className="text-danger small">{messagesError}</span>}
        </div>
        {!messagesLoading && messages.length === 0 && <div className="alert alert-info">لا توجد رسائل جديدة حالياً.</div>}
        {!messagesLoading && messages.length > 0 && (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-dark">
                <tr><th>الاسم</th><th>الهاتف</th><th>النوع</th><th>الرسالة</th><th>الحالة</th><th></th></tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id}>
                    <td>{msg.name || "-"}</td>
                    <td>{msg.phone || "-"}</td>
                    <td>{msg.type || msg.intent || "-"}</td>
                    <td style={{ maxWidth: 200 }}>{msg.message || "-"}</td>
                    <td><span className={`badge ${msg.status === "New" ? "bg-warning text-dark" : "bg-success"}`}>{msg.status === "New" ? "جديد" : "تم الرد"}</span></td>
                    <td>{msg.status !== "Read" && <button className="btn btn-sm btn-outline-primary" onClick={() => handleMarkRead(msg.id)}>تعليم كمقروء</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ── RETURN ──

  if (authLoading) {
    return <main id="main" className="py-5"><div className="container text-center"><div className="spinner-border text-primary" role="status"></div></div></main>;
  }

  if (!user) {
    return (
      <main id="main" className="py-5">
        <Helmet><title>Admin Login | Qimmah</title></Helmet>
        <div className="container" data-aos="fade-up">
          <div className="row justify-content-center">
            <div className="col-lg-5">
              <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                  <h3 className="mb-3" style={{ color: "var(--primary-color)" }}>تسجيل الدخول</h3>
                  <form onSubmit={handleLogin} className="row g-3">
                    <div className="col-12"><label className="form-label">Email</label><input type="email" className="form-control" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /></div>
                    <div className="col-12"><label className="form-label">Password</label><input type="password" className="form-control" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /></div>
                    {loginError && <div className="text-danger small">{loginError}</div>}
                    <div className="col-12"><button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={loginLoading}>{loginLoading ? "جارٍ الدخول..." : "دخول"}</button></div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="py-5">
      <Helmet><title>Admin Panel | Qimmah</title></Helmet>
      <div className="container" data-aos="fade-up">
        <div className="row">
          <div className="col-lg-3 mb-3 mb-lg-0">
            <div className="list-group shadow-sm">
              <button className={`list-group-item list-group-item-action ${activeTab === "shipments" ? "active" : ""}`} onClick={() => setActiveTab("shipments")}>إدارة الشحنات</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>إدارة المنتجات</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "clients" ? "active" : ""}`} onClick={() => setActiveTab("clients")}>إدارة العملاء</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "articles" ? "active" : ""}`} onClick={() => setActiveTab("articles")}>إدارة المقالات</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "news" ? "active" : ""}`} onClick={() => setActiveTab("news")}>إدارة الأخبار</button>
              <button className={`list-group-item list-group-item-action ${activeTab === "messages" ? "active" : ""}`} onClick={() => setActiveTab("messages")}>الرسائل والطلبات</button>
            </div>
          </div>
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 style={{ color: "var(--primary-color)" }}>لوحة الإدارة</h3>
                <p className="text-muted small mb-0">إدارة الشحنات، المنتجات، والمحتوى</p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">{user.email}</span>
                <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>خروج</button>
              </div>
            </div>
            {activeTab === "shipments" && renderShipmentsTab()}
            {activeTab === "products" && renderProductsTab()}
            {activeTab === "clients" && renderClientsTab()}
            {activeTab === "articles" && renderArticlesTab()}
            {activeTab === "news" && renderNewsTab()}
            {activeTab === "messages" && renderMessagesTab()}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPanel;

