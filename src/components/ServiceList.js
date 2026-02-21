import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import AOS from "aos";
import "aos/dist/aos.css";

const ServiceList = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loc = (val) => { if (!val) return ""; if (typeof val === "string") return val; return val[language] || val["ar"] || val["en"] || ""; };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      console.log("ServiceList: Starting fetch...");
      try {
        const snap = await getDocs(collection(db, "services"));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("ServiceList: Fetched services:", data);
        setServices(data);
      } catch (error) { console.error("Error fetching services", error); }
      finally { setLoading(false); }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => { AOS.refresh(); }, 200);
    }
  }, [services, loading]);

  if (loading) return (
    <section id="services-list" className="py-5" style={{ backgroundColor: "var(--bg-main)" }}>
      <div className="container text-center"><div className="spinner-border text-primary"></div></div>
    </section>
  );
  if (services.length === 0) return null;

  return (
    <section id="services-list" className="py-5" style={{ backgroundColor: "var(--bg-main)" }}>
      <div className="container">
        <div className="section-header mb-5 text-center">
          <h2 style={{ color: "var(--primary-color)", fontWeight: "800", fontSize: "2.5rem" }}>{t('services_title_main')}</h2>
          <div style={{ width: "60px", height: "4px", backgroundColor: "var(--accent-color)", margin: "15px auto", borderRadius: "var(--radius-sm)" }}></div>
        </div>
        <div className="row g-4">
          {services.map((service, index) => (
            <div className="col-lg-4 col-md-6" key={service.id}>
              <div className="enterprise-service-card h-100">
                <div className="card-img-wrapper">
                  <img src={service.imageUrl} alt={loc(service.title)} className="img-fluid" />
                  <div className="icon-badge"><i className={`bi ${service.icon}`}></i></div>
                </div>
                <div className="card-content d-flex flex-column h-100">
                  <h4 className="title">{loc(service.title)}</h4>
                  <p className="description flex-grow-1">{loc(service.shortDesc)}</p>
                  <Link to={`/services/${service.id}`} className="read-more-btn mt-3 text-decoration-none">
                    {t('service_read_more') || 'اقرأ المزيد'}
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

export default ServiceList;
