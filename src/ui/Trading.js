import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import AOS from "aos";
import "aos/dist/aos.css";

const Trading = () => {
  const { language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val["ar"] || val["en"] || "";
  };

  useEffect(() => {
     if (!loading) {
       setTimeout(() => { AOS.refresh(); }, 200);
     }
  }, [products, loading]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let snap;
        try {
          snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
        } catch {
          snap = await getDocs(collection(db, "products"));
        }
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (products.length === 0) return null;

  return (
    <section id="trading" className="py-5" style={{ backgroundColor: "#ffffff" }}>
      <div className="container" data-aos="fade-up">
        <div className="section-header mb-5 text-center">
          <h2 style={{ color: "var(--primary-color)", fontWeight: "800", fontSize: "2.5rem" }}>
            {language === 'ar' ? 'قطاع التجارة الدولية' : 'International Trading Sector'}
          </h2>
          <div style={{ width: "60px", height: "4px", backgroundColor: "var(--accent-color)", margin: "15px auto", borderRadius: "var(--radius-sm)" }}></div>
          <p style={{ maxWidth: "700px", margin: "0 auto", fontSize: "1.1rem" }}>
            {language === 'ar'
              ? 'نستعرض لكم أبرز المنتجات التي نوفرها عبر شبكتنا العالمية، مع تقديم حلول استيراد وتصدير شاملة.'
              : 'Discover the top products we source globally, offering comprehensive import and export solutions.'}
          </p>
        </div>

        <div className="row g-4">
          {products.map((product, index) => (
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={index * 100} key={product.id}>
              <div className="enterprise-service-card h-100">
                <div className="card-img-wrapper">
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <img src={product.imageUrls[0]} alt={loc(product.name)} className="img-fluid" />
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100 bg-light" style={{ minHeight: "220px" }}>
                       <i className="bi bi-box-seam" style={{fontSize: "4rem", color: "var(--primary-color)"}}></i>
                    </div>
                  )}
                  {loc(product.category) && (
                    <div className="icon-badge" style={{ width: "auto", padding: "0 15px", fontSize: "0.9rem", fontWeight: "bold", borderRadius: "30px", height: "35px", bottom: "-15px" }}>
                      {loc(product.category)}
                    </div>
                  )}
                </div>
                <div className="card-content d-flex flex-column h-100">
                  <h4 className="title">{loc(product.name)}</h4>
                  <p className="description flex-grow-1" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                    {loc(product.description)}
                  </p>
                  <Link to={`/products/${product.id}`} className="read-more-btn mt-3 text-decoration-none">
                    {language === 'ar' ? 'تفاصيل المنتج' : 'View Details'}
                    <i className={`bi ${language === 'ar' ? 'bi-arrow-left-short' : 'bi-arrow-right-short'}`}></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Trading;
