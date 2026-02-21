import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";
import CBMCalculator from "../components/CBMCalculator";

const Service = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val["ar"] || val["en"] || "";
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        let snap;
        try {
          snap = await getDocs(query(collection(db, "services"), orderBy("createdAt", "desc")));
        } catch {
          snap = await getDocs(collection(db, "services"));
        }
        setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching services", error);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    fetchServices();
  }, []);

  return (
    <>
      <Helmet>
        <title>{t('nav_services') || 'Services'} | Qimmah Al Ebtekar</title>
      </Helmet>
      <InnerHeader />

      {/* Enterprise Page Banner */}
      <div className="breadcrumbs" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')", padding: "140px 0 60px 0", marginTop: "70px", position: "relative", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.85)" }}></div>
        <div className="container position-relative d-flex flex-column align-items-center text-center text-white" style={{ zIndex: 2 }} data-aos="fade">
          <h2 style={{ fontWeight: "800", color: "#fff", marginBottom: "15px" }}>{t('nav_services') || 'خدماتنا'}</h2>
          <ol className="d-flex list-unstyled gap-2 fw-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
            <li><Link to="/" className="text-white text-decoration-none">{t('nav_home') || 'الرئيسية'}</Link></li>
            <li>/</li>
            <li style={{ color: "var(--accent-color)" }}>{t('nav_services') || 'خدماتنا'}</li>
          </ol>
        </div>
      </div>

      <main id="main" className="py-5" style={{ backgroundColor: "var(--bg-main)", minHeight: "50vh" }}>

        {/* CBM Calculator */}
        <section className="position-relative py-4">
          <div className="container" data-aos="fade-up">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <CBMCalculator />
              </div>
            </div>
          </div>
        </section>

        <div className="container" data-aos="fade-up">
          <div className="section-header mb-5 text-center">
            <h2 style={{ color: "var(--primary-color)", fontWeight: "800", fontSize: "2.5rem" }}>
              {language === 'ar' ? 'جميع الخدمات اللوجستية' : 'All Logistics Services'}
            </h2>
            <div style={{ width: "60px", height: "4px", backgroundColor: "var(--accent-color)", margin: "15px auto", borderRadius: "var(--radius-sm)" }}></div>
            <p className="mt-3 text-muted" style={{ fontSize: "1.1rem" }}>
              {language === 'ar' ? 'نقدم مجموعة متكاملة من الحلول اللوجستية المصممة خصيصاً لتلبية احتياجات أعمالك.' : 'We offer a comprehensive range of logistics solutions tailored to meet your business needs.'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : services.length > 0 ? (
            <div className="row g-4">
              {services.map((service, index) => (
                <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={index * 100} key={service.id}>
                  <div className="enterprise-service-card h-100">
                    <div className="card-img-wrapper">
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt={loc(service.title)} className="img-fluid" />
                      ) : (
                        <div className="d-flex justify-content-center align-items-center h-100 bg-light" style={{ minHeight: "220px" }}>
                          <i className="bi bi-briefcase" style={{fontSize: "4rem", color: "var(--primary-color)"}}></i>
                        </div>
                      )}

                      {/* Dynamic Icon Badge */}
                      {service.iconUrl ? (
                        <div className="icon-badge">
                          <img src={service.iconUrl} alt="icon" style={{ width: "24px", height: "24px" }} />
                        </div>
                      ) : (
                        <div className="icon-badge">
                          <i className={`bi ${service.icon || 'bi-briefcase'}`}></i>
                        </div>
                      )}
                    </div>

                    <div className="card-content d-flex flex-column h-100">
                      <h4 className="title">{loc(service.title)}</h4>
                      <p className="description flex-grow-1" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                        {loc(service.shortDesc)}
                      </p>
                      <Link to={`/services/${service.id}`} className="read-more-btn mt-3 text-decoration-none">
                        {t('service_read_more') || 'اقرأ المزيد'}
                        <i className={`bi ${language === 'ar' ? 'bi-arrow-left-short' : 'bi-arrow-right-short'}`}></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 mb-3 d-block text-secondary"></i>
              <h5>{language === 'ar' ? 'لا توجد خدمات متاحة حالياً' : 'No services available currently.'}</h5>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Service;
