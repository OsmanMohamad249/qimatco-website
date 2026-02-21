import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import MediaGallery from "../components/MediaGallery";
import AOS from "aos";
import "aos/dist/aos.css";

const Trading = () => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedProduct, setExpandedProduct] = useState(null);

  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val["ar"] || val["en"] || "";
  };

  useEffect(() => { AOS.init(); AOS.refresh(); }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { setError(t("trading_loading")); }
      finally { setLoading(false); }
    };
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="trading" className="trading section-bg">
      <Helmet>
        <title>{t("trading_title")} | Qimmah Al Ebtekar</title>
        <meta name="description" content="We export premium Sudanese products and import high-quality textiles and fashion from global markets." />
      </Helmet>
      <div className="container" data-aos="fade-up">
        <div className="section-header">
          <h2>{t("trading_title")}</h2>
        </div>

        {/* Export / Import intro cards */}
        <div className="row gy-4">
          <div className="col-lg-6" data-aos="fade-up" data-aos-delay="100">
            <div className="card-item">
              <div className="row">
                <div className="col-xl-5">
                  <div className="card-bg" style={{ minHeight: "300px", backgroundSize: "cover", backgroundImage: "url(https://loremflickr.com/800/600/crops,sudan/all)" }}></div>
                </div>
                <div className="col-xl-7 d-flex align-items-center">
                  <div className="card-body">
                    <h4 className="card-title">{t("trading_export_title")}</h4>
                    <p>{t("trading_export_text")}</p>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <span className="badge bg-success">#GumArabic</span>
                      <span className="badge bg-success">#Sesame</span>
                      <span className="badge bg-success">#Livestock</span>
                    </div>
                    <Link to="/contact" className="readmore stretched-link mt-3 d-inline-block">
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6" data-aos="fade-up" data-aos-delay="200">
            <div className="card-item">
              <div className="row">
                <div className="col-xl-5">
                  <div className="card-bg" style={{ minHeight: "300px", backgroundSize: "cover", backgroundImage: "url(https://loremflickr.com/800/600/fabric,textile/all)" }}></div>
                </div>
                <div className="col-xl-7 d-flex align-items-center">
                  <div className="card-body">
                    <h4 className="card-title">{t("trading_import_title")}</h4>
                    <p>{t("trading_import_text")}</p>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <span className="badge bg-info text-dark">#Textiles</span>
                      <span className="badge bg-info text-dark">#Fashion</span>
                      <span className="badge bg-info text-dark">#Fabrics</span>
                    </div>
                    <Link to="/contact" className="readmore stretched-link mt-3 d-inline-block">
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="mt-5">
          <div className="section-header mb-4">
            <h3 style={{ color: "var(--primary-color)" }}>{t("trading_products_title")}</h3>
            <p>{t("trading_products_subtitle")}</p>
          </div>
          {loading && <p>{t("trading_loading")}</p>}
          {error && <p className="text-danger">{error}</p>}
          {!loading && products.length === 0 && <p className="text-muted">{t("trading_no_products")}</p>}

          <div className="row g-4">
            {products.map((product) => {
              const imgs = product.imageUrls || [];
              const vids = product.videoUrl ? [product.videoUrl] : (product.videoUrls || []);
              const totalMedia = imgs.length + vids.length;
              const isExpanded = expandedProduct === product.id;

              return (
                <div key={product.id} className="col-lg-4 col-md-6" data-aos="fade-up">
                  <div className="card h-100 shadow-sm border-0" style={{ borderRadius: "var(--border-radius, 12px)", overflow: "hidden" }}>

                    {/* Card cover – click to expand gallery */}
                    {!isExpanded ? (
                      <>
                        {imgs.length > 0 ? (
                          <div className="position-relative" style={{ cursor: "pointer" }} onClick={() => setExpandedProduct(product.id)}>
                            <img src={imgs[0]} alt={loc(product.name)} className="card-img-top" style={{ height: 220, objectFit: "cover" }} />
                            {totalMedia > 1 && (
                              <span className="position-absolute bottom-0 end-0 m-2 badge" style={{ background: "rgba(0,0,0,0.6)", fontSize: "0.8rem" }}>
                                <i className="bi bi-images me-1"></i>{totalMedia}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: 220 }}>
                            <span className="text-muted">{t("trading_no_image")}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Expanded: show full MediaGallery */
                      <div className="p-2">
                        <div className="d-flex justify-content-end mb-1">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setExpandedProduct(null)}>
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                        <MediaGallery imageUrls={imgs} videoUrls={vids} maxVisible={4} />
                      </div>
                    )}

                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{loc(product.name)}</h5>
                      <p className="text-muted mb-2">{loc(product.category)}</p>
                      <p className="card-text flex-grow-1" style={{ minHeight: 60 }}>{loc(product.description)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Trading;

