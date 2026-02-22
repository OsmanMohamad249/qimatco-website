import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";

const ProductDetail = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loc = (val) => val ? (typeof val === "string" ? val : val[language] || val["ar"] || val["en"] || "") : "";

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, "products", id));
        if (docSnap.exists()) setProduct({ id: docSnap.id, ...docSnap.data() }); else navigate('/#trading');

        const snap = await getDocs(collection(db, "products"));
        setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); window.scrollTo(0, 0); }
    };
    fetchProduct();
  }, [id, navigate]);

  if (loading) return <div className="py-5 text-center"><div className="spinner-border text-primary"></div></div>;
  if (!product) return null;

  const mainImg = product.imageUrls?.length > 0 ? product.imageUrls[0] : "https://via.placeholder.com/1920x600";

  return (
    <>
      <Helmet><title>{loc(product.name)} | Qimat AlAibtikar</title></Helmet>
      <InnerHeader />

      {/* Dynamic Banner */}
      <div className="detail-banner" style={{ backgroundImage: `url(${mainImg})`, padding: "120px 0", position: "relative", backgroundSize: "cover", backgroundPosition: "center", marginTop: "70px" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.85)" }}></div>
        <div className="container position-relative text-white" style={{ zIndex: 2 }}>
          {loc(product.category) && <span className="badge bg-warning text-dark mb-3 fs-6 px-3 py-2 rounded-pill">{loc(product.category)}</span>}
          <h1 style={{ fontWeight: "800", margin: 0, color: "#fff" }}>{loc(product.name)}</h1>
        </div>
      </div>

      <main className="py-5" style={{ backgroundColor: "var(--bg-main)" }}>
        <div className="container">
          <div className="row g-5">
            {/* Main Content */}
            <div className="col-lg-8">
              <div className="enterprise-card p-4 p-md-5 mb-4">
                <h3 style={{ color: "var(--primary-color)", fontWeight: "700", borderBottom: "3px solid var(--accent-color)", paddingBottom: "15px", display: "inline-block" }}>
                  {language === 'ar' ? 'تفاصيل المنتج' : 'Product Details'}
                </h3>
                <p className="mt-4" style={{ fontSize: "1.1rem", lineHeight: "2", whiteSpace: "pre-wrap" }}>
                  {loc(product.description)}
                </p>

                {/* Media Gallery */}
                {(product.videoUrls?.length > 0 || product.imageUrls?.length > 1) && (
                  <div className="mt-5">
                    <h4 style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "20px" }}>{language === 'ar' ? 'معرض الوسائط' : 'Media Gallery'}</h4>
                    <div className="row g-3">
                      {product.videoUrls?.map((vid, idx) => (
                        <div className="col-12" key={`vid-${idx}`}>
                          <video controls className="w-100 rounded shadow-sm" style={{ maxHeight: "400px", objectFit: "cover", backgroundColor: "#000" }}>
                            <source src={vid} type="video/mp4" />
                          </video>
                        </div>
                      ))}
                      {product.imageUrls?.slice(1).map((img, idx) => (
                        <div className="col-md-6" key={`img-${idx}`}>
                          <img src={img} alt="Gallery" className="img-fluid rounded shadow-sm w-100" style={{ height: "250px", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 bg-light p-4 rounded" style={{ borderRight: language === 'ar' ? "4px solid var(--accent-color)" : "none", borderLeft: language !== 'ar' ? "4px solid var(--accent-color)" : "none" }}>
                  <h4 style={{ color: "var(--primary-color)" }}>{language === 'ar' ? 'هل أنت مهتم بهذا المنتج؟' : 'Interested in this product?'}</h4>
                  <Link to="/contact" className="btn enterprise-cta-btn px-4 mt-3 d-inline-flex">{t('nav_contact')} <i className="bi bi-arrow-up-right-circle ms-2"></i></Link>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="enterprise-card p-4 mb-4">
                <h4 style={{ color: "var(--primary-color)", fontWeight: "700", marginBottom: "20px" }}>
                  {language === 'ar' ? 'منتجات أخرى' : 'Other Products'}
                </h4>
                <ul className="list-unstyled mb-0">
                  {allProducts.filter(p => p.id !== id).slice(0, 6).map((p) => (
                    <li key={p.id} className="mb-3">
                      <Link to={`/products/${p.id}`} className="d-flex align-items-center p-2 rounded text-decoration-none" style={{ backgroundColor: "var(--bg-main)", color: "var(--primary-color)", fontWeight: "600", transition: "all 0.3s" }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-color)"; e.currentTarget.style.color = "#fff"; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-main)"; e.currentTarget.style.color = "var(--primary-color)"; }}>
                        {p.imageUrls?.length > 0 ? (
                          <img src={p.imageUrls[0]} alt="thumb" className="rounded me-3" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
                        ) : (
                          <i className="bi bi-box-seam me-3" style={{ fontSize: "2rem" }}></i>
                        )}
                        <div>
                          <div style={{ lineHeight: "1.2" }}>{loc(p.name)}</div>
                          <small className="text-warning" style={{ fontSize: "0.8rem" }}>{loc(p.category)}</small>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;

