import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { db, auth } from "../firebase";
import { doc, setDoc, serverTimestamp, getDoc, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

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
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard tabs
  const [activeTab, setActiveTab] = useState("shipments");

  // Products form
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    description: "",
  });
  const [productImages, setProductImages] = useState([]);
  const [productVideo, setProductVideo] = useState(null);
  const [productSaveMessage, setProductSaveMessage] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Client form for Content & Ads tab
  const [clientForm, setClientForm] = useState({ name: "" });
  const [clientFile, setClientFile] = useState(null);
  const [clientMessage, setClientMessage] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [clientFileKey, setClientFileKey] = useState(0);

  // Messages tab state
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        setForm(initialForm);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchMessages = async () => {
        try {
          const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setMessages(list);
        } catch (err) {
          setMessagesError("تعذر تحميل الرسائل حالياً");
        } finally {
          setMessagesLoading(false);
        }
      };
      const fetchProducts = async () => {
        try {
          const snap = await getDocs(collection(db, "products"));
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setProducts(list);
        } catch (err) {
          setProductSaveMessage("تعذر تحميل المنتجات");
        }
      };
      fetchMessages();
      fetchProducts();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "images") {
      setProductImages(files ? Array.from(files) : []);
      return;
    }
    if (name === "video") {
      setProductVideo(files && files[0] ? files[0] : null);
      return;
    }
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClientChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "clientLogo") {
      setClientFile(files && files[0] ? files[0] : null);
      return;
    }
    setClientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoad = async () => {
    if (!form.id.trim()) {
      setMessage("Enter an ID to load.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const docRef = doc(db, "shipments", form.id.trim());
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setForm({
          id: form.id.trim(),
          status: data.status || "Pending",
          customerName: data.customerName || "",
          origin: data.origin || "",
          destination: data.destination || "",
          eta: data.eta || "",
          notes: data.notes || "",
        });
        setMessage("Loaded existing shipment.");
      } else {
        setMessage("No shipment found. You can create a new one.");
      }
    } catch (err) {
      setMessage("Error loading shipment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id.trim()) {
      setMessage("Tracking ID is required.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const docRef = doc(db, "shipments", form.id.trim());
      await setDoc(
        docRef,
        {
          status: form.status,
          customerName: form.customerName,
          origin: form.origin,
          destination: form.destination,
          eta: form.eta,
          notes: form.notes,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setMessage("Saved successfully.");
    } catch (err) {
      setMessage("Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setLoginEmail("");
      setLoginPassword("");
    } catch (err) {
      setLoginError("Login failed. Check your credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const renderShipmentsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: "var(--primary-color)" }}>إدارة الشحنات</h4>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleReset} disabled={loading}>
              مسح الحقول / Reset
            </button>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleLoad} disabled={loading}>
              تحميل / Load
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Tracking ID</label>
            <input
              name="id"
              type="text"
              className="form-control"
              value={form.id}
              onChange={handleChange}
              placeholder="مثال: QIM-123456"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Status</label>
            <select name="status" className="form-select" value={form.status} onChange={handleChange}>
              <option>Pending</option>
              <option>Processing</option>
              <option>In Transit</option>
              <option>Clearing Customs</option>
              <option>Delivered</option>
              <option>On Hold</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Customer Name</label>
            <input name="customerName" type="text" className="form-control" value={form.customerName} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label className="form-label">Origin</label>
            <input name="origin" type="text" className="form-control" value={form.origin} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label className="form-label">Destination</label>
            <input name="destination" type="text" className="form-control" value={form.destination} onChange={handleChange} />
          </div>

          <div className="col-md-6">
            <label className="form-label">ETA</label>
            <input name="eta" type="text" className="form-control" value={form.eta} onChange={handleChange} placeholder="YYYY-MM-DD" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Notes</label>
            <textarea name="notes" className="form-control" rows="3" value={form.notes} onChange={handleChange}></textarea>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={loading}>
              {loading ? "جارٍ الحفظ..." : "حفظ / Save"}
            </button>
          </div>
        </form>

        {message && (
          <div className="alert alert-info mt-3" role="alert">
            {message}
          </div>
        )}
      </div>
    </div>
  );

  const renderProductsTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: "var(--primary-color)" }}>إدارة المنتجات (تجارة)</h4>
          {productSaveMessage && <span className="text-success small">{productSaveMessage}</span>}
        </div>

        {products.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>الصورة</th>
                  <th>الاسم</th>
                  <th>الفئة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.imageUrls?.length ? <img src={p.imageUrls[0]} alt={p.name} style={{ maxHeight: 60 }} /> : '-'}</td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(p.id)}>
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form className="row g-3" onSubmit={handleProductSave}>
          <div className="col-md-6">
            <label className="form-label">Product Name</label>
            <input name="name" type="text" className="form-control" value={productForm.name} onChange={handleProductChange} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Category</label>
            <input name="category" type="text" className="form-control" value={productForm.category} onChange={handleProductChange} required />
          </div>
          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-control" rows="3" value={productForm.description} onChange={handleProductChange} required></textarea>
          </div>
          <div className="col-12">
            <label className="form-label">Product Images (multiple)</label>
            <input name="images" type="file" accept="image/*" multiple className="form-control" onChange={handleProductChange} />
          </div>
          <div className="col-12">
            <label className="form-label">Promotional Video</label>
            <input name="video" type="file" accept="video/*" className="form-control" onChange={handleProductChange} />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary w-100" style={{ background: "var(--secondary-color)", border: "none" }} disabled={productLoading}>
              {productLoading ? "جارٍ الحفظ..." : "حفظ المنتج / Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <h4 style={{ color: "var(--primary-color)" }}>إدارة المحتوى والإعلانات</h4>
        <p className="text-muted mb-3">Add client logos to appear in the clients carousel.</p>

        <form className="row g-3" onSubmit={handleClientSave}>
          <div className="col-md-6">
            <label className="form-label">اسم العميل / Client Name</label>
            <input
              name="name"
              type="text"
              className="form-control"
              value={clientForm.name}
              onChange={handleClientChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">شعار العميل / Client Logo</label>
            <input
              key={clientFileKey}
              name="clientLogo"
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleClientChange}
              required
            />
          </div>
          <div className="col-12">
            <button
              type="submit"
              className="btn btn-primary w-100"
              style={{ background: "var(--secondary-color)", border: "none" }}
              disabled={clientLoading}
            >
              {clientLoading ? "جارٍ الحفظ..." : "حفظ العميل / Save Client"}
            </button>
          </div>
        </form>

        {clientMessage && (
          <div className="alert alert-info mt-3" role="alert">
            {clientMessage}
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
        {!messagesLoading && messages.length === 0 && (
          <p className="text-muted">لا توجد رسائل حالياً</p>
        )}
        {!messagesLoading && messages.length > 0 && (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>النوع</th>
                  <th>الهاتف</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>الرسالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name || '-'}</td>
                    <td>{m.type || m.intent || '-'}</td>
                    <td>{m.phone || '-'}</td>
                    <td>{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : '-'}</td>
                    <td>
                      <span className={`badge ${m.status === 'New' ? 'bg-warning text-dark' : 'bg-success'}`}>
                        {m.status === 'New' ? 'جديد' : 'تم الرد'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <small className="text-muted">{m.message || '-'}</small>
                    </td>
                    <td>
                      {m.status !== 'Read' && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleMarkRead(m.id)}>
                          تعليم كمقروء / تم الرد
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const handleProductSave = async (e) => {
    e.preventDefault();
    setProductSaveMessage("");
    if (!productForm.name.trim() || !productForm.category.trim() || !productForm.description.trim()) {
      setProductSaveMessage("Please fill all product fields.");
      return;
    }
    try {
      setProductLoading(true);
      const imageUrls = [];
      for (const file of productImages) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "oiwrpbwq");
        const res = await fetch("https://api.cloudinary.com/v1_1/dmynksk5z/auto/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.secure_url) imageUrls.push(data.secure_url);
      }
      let videoUrl = "";
      if (productVideo) {
        const formData = new FormData();
        formData.append("file", productVideo);
        formData.append("upload_preset", "oiwrpbwq");
        const res = await fetch("https://api.cloudinary.com/v1_1/dmynksk5z/auto/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.secure_url) videoUrl = data.secure_url;
      }

      await addDoc(collection(db, "products"), {
        name: productForm.name,
        category: productForm.category,
        description: productForm.description,
        imageUrls,
        videoUrl,
        createdAt: serverTimestamp(),
      });

      setProductSaveMessage("Product saved successfully.");
      setProductForm({ name: "", category: "", description: "" });
      setProductImages([]);
      setProductVideo(null);
      const snap = await getDocs(collection(db, "products"));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setProductSaveMessage("Save failed. Please try again.");
    } finally {
      setProductLoading(false);
    }
  };

  const handleClientSave = async (e) => {
    e.preventDefault();
    setClientMessage("");
    if (!clientForm.name.trim()) {
      setClientMessage("يرجى إدخال اسم العميل");
      return;
    }
    if (!clientFile) {
      setClientMessage("يرجى اختيار شعار العميل");
      return;
    }
    try {
      setClientLoading(true);
      const storageRef = ref(storage, `clients/${Date.now()}-${clientFile.name}`);
      await uploadBytes(storageRef, clientFile);
      const logoUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, "clients"), {
        name: clientForm.name,
        logoUrl,
        createdAt: serverTimestamp(),
      });

      setClientMessage("تم حفظ العميل بنجاح");
      setClientForm({ name: "" });
      setClientFile(null);
      setClientFileKey((prev) => prev + 1);
    } catch (err) {
      setClientMessage("تعذر حفظ العميل. حاول مرة أخرى.");
    } finally {
      setClientLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await updateDoc(doc(db, "messages", id), { status: "Read" });
      setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, status: "Read" } : msg)));
    } catch (err) {
      // optional: handle error
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setProductSaveMessage("تعذر حذف المنتج");
    }
  };

  if (authLoading) {
    return (
      <main id="main" className="py-5">
        <div className="container text-center">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main id="main" className="py-5">
        <Helmet>
          <title>Admin Login | Qimmah Track & Trace</title>
        </Helmet>
        <div className="container" data-aos="fade-up">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                  <h3 className="mb-3" style={{ color: "var(--primary-color)" }}>تسجيل الدخول / Admin Login</h3>
                  <form onSubmit={handleLogin} className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    {loginError && <div className="text-danger small">{loginError}</div>}
                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-primary w-100"
                        style={{ background: "var(--secondary-color)", border: "none" }}
                        disabled={loginLoading}
                      >
                        {loginLoading ? "جارٍ الدخول..." : "دخول / Login"}
                      </button>
                    </div>
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
      <Helmet>
        <title>Admin Panel | Qimmah Track & Trace</title>
        <meta
          name="description"
          content="Manage shipments for Qimmah: create, update, and track statuses."
        />
      </Helmet>
      <div className="container" data-aos="fade-up">
        <div className="row">
          <div className="col-lg-3 mb-3 mb-lg-0">
            <div className="list-group shadow-sm">
              <button
                className={`list-group-item list-group-item-action ${activeTab === "shipments" ? "active" : ""}`}
                onClick={() => setActiveTab("shipments")}
              >
                إدارة الشحنات
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === "products" ? "active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                إدارة المنتجات (تجارة)
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === "content" ? "active" : ""}`}
                onClick={() => setActiveTab("content")}
              >
                إدارة المحتوى والإعلانات
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === "messages" ? "active" : ""}`}
                onClick={() => setActiveTab("messages")}
              >
                الرسائل والطلبات
              </button>
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
                <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                  خروج / Logout
                </button>
              </div>
            </div>

            {activeTab === "shipments" && renderShipmentsTab()}
            {activeTab === "products" && renderProductsTab()}
            {activeTab === "content" && renderContentTab()}
            {activeTab === "messages" && renderMessagesTab()}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPanel;

