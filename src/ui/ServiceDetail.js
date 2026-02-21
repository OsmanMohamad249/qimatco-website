import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";

const ServiceDetail = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loc = (val) => { if (!val) return ""; if (typeof val === "string") return val; return val[language] || val["ar"] || val["en"] || ""; };

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "services", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/services');
        }
        const snap = await getDocs(collection(db, "services"));
        setAllServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    fetchService();
  }, [id, navigate]);

  if (loading) return <main id="main" className="py-5"><div className="container text-center"><div className="spinner-border text-primary"></div></div></main>;
  if (!service) return null;

  return (
    <>
      <Helmet><title>{loc(service.title)} | Qimmah Al Ebtekar</title></Helmet>
      <InnerHeader />

      {/* Dynamic Banner */}
      <div className="service-detail-banner" style={{ backgroundImage: `url(${service.imageUrl})`, padding: "120px 0", position: "relative", backgroundSize: "cover", backgroundPosition: "center", marginTop: "70px" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.75)" }}></div>
        <div className="container position-relative text-white" style={{ zIndex: 2 }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <i className={`bi ${service.icon}`} style={{ fontSize: "3rem", color: "var(--accent-color)" }}></i>
            <h1 style={{ fontWeight: "800", margin: 0, color: "#fff" }}>{loc(service.title)}</h1>
          </div>
          <p style={{ fontSize: "1.2rem", maxWidth: "600px", color: "rgba(255,255,255,0.9)" }}>{loc(service.shortDesc)}</p>
        </div>
      </div>

      <main id="main" className="py-5" style={{ backgroundColor: "var(--bg-main)" }}>
        <div className="container">
          <div className="row g-5">
            {/* Main Content */}
            <div className="col-lg-8">
              <div className="enterprise-card p-4 p-md-5">
                <h3 style={{ color: "var(--primary-color)", fontWeight: "700", borderBottom: "3px solid var(--accent-color)", paddingBottom: "15px", display: "inline-block" }}>
                  {language === 'ar' ? 'نظرة عامة على الخدمة' : 'Service Overview'}
                </h3>
                <p className="mt-4" style={{ fontSize: "1.1rem", lineHeight: "2", whiteSpace: "pre-wrap" }}>
                  {loc(service.fullDesc)}
                </p>
                <div className="mt-5 bg-light p-4 rounded" style={{ borderRight: language === 'ar' ? "4px solid var(--accent-color)" : "none", borderLeft: language !== 'ar' ? "4px solid var(--accent-color)" : "none" }}>
                  <h4 style={{ color: "var(--primary-color)" }}>{language === 'ar' ? 'هل تحتاج إلى هذه الخدمة؟' : 'Need this service?'}</h4>
                  <p className="mb-4">{language === 'ar' ? 'تواصل معنا الآن للحصول على استشارة مجانية وعرض سعر مخصص لأعمالك.' : 'Contact us now for a free consultation and a customized quote.'}</p>
                  <Link to="/contact" className="btn enterprise-cta-btn px-4" style={{display: "inline-flex"}}>
                    {t('nav_contact')} <i className="bi bi-arrow-up-right-circle ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar (Other Services) */}
            <div className="col-lg-4">
              <div className="enterprise-card p-4 mb-4">
                <h4 style={{ color: "var(--primary-color)", fontWeight: "700", marginBottom: "20px" }}>
                  {language === 'ar' ? 'خدمات أخرى' : 'Other Services'}
                </h4>
                <ul className="list-unstyled mb-0">
                  {allServices.filter(s => s.id !== id).map((s) => (
                    <li key={s.id} className="mb-3">
                      <Link to={`/services/${s.id}`} className="d-flex align-items-center p-3 rounded text-decoration-none" style={{ backgroundColor: "var(--bg-main)", color: "var(--primary-color)", fontWeight: "600", transition: "all 0.3s" }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-color)"; e.currentTarget.style.color = "#fff"; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-main)"; e.currentTarget.style.color = "var(--primary-color)"; }}>
                        <i className={`bi ${s.icon} me-3`} style={{ fontSize: "1.2rem" }}></i>
                        {loc(s.title)}
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

export default ServiceDetail;

