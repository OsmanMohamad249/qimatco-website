import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import AOS from "aos";
import "aos/dist/aos.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Link } from "react-router-dom"; // Added for routing

import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";
import Carousel from "../components/Carousel";
import ClientList from "../components/ClientList";
import Facts from "../components/Facts";
import ServiceList from "../components/ServiceList";
import Trading from "./Trading";

const Home = () => {
  const { t, language } = useLanguage();
  const [ads, setAds] = useState([]);
  const [news, setNews] = useState([]);
  const [team, setTeam] = useState([]);
  const [titles, setTitles] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    setTimeout(() => { AOS.refresh(); }, 200);
  }, [ads, news, team, jobs]);

  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val["ar"] || val["en"] || "";
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        let snap;
        try { snap = await getDocs(query(collection(db, "ads"), orderBy("createdAt", "desc"), limit(10))); }
        catch { snap = await getDocs(query(collection(db, "ads"), limit(10))); }
        setAds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {}
      try {
        let snap;
        try { snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3))); }
        catch { snap = await getDocs(query(collection(db, "news"), limit(3))); }
        setNews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {}

      // Fetch Team (Employees + Titles)
      try {
        const [empSnap, titleSnap] = await Promise.all([
          getDocs(query(collection(db, "team_employees"), limit(8))),
          getDocs(collection(db, "team_titles"))
        ]);
        setTeam(empSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTitles(titleSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {}

      // Fetch Jobs
      try {
        const q = query(collection(db, "jobs"), where("status", "==", "open"), limit(3));
        const snap = await getDocs(q);
        setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // Fallback if index isn't ready
        try {
          const snap = await getDocs(collection(db, "jobs"));
          setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(j => j.status === 'open').slice(0, 3));
        } catch {}
      }
    };
    loadData();
  }, []);

  const titleById = titles.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});

  const resolveTitleName = (emp) => {
    const title = titleById[emp.titleId];
    return title ? loc(title.title) : (t('career_form_name') || "Member");
  };

  return (
    <>
      <Helmet>
        <title>Home | Qimat AlAibtikar Integrated Solutions</title>
        <meta name="description" content="Qimat AlAibtikar: Integrated Logistics Solutions, International Shipping, Customs Clearance, and Global Trading." />
      </Helmet>
      <InnerHeader />
      <Carousel />
      <main id="main" style={{ backgroundColor: "var(--bg-main)" }}>

        {/* Ads Slider Section (Enterprise Promos) */}
        {ads.length > 0 && (
          <section className="ads-section py-5">
            <div className="container">
              <div className="section-header mb-4 text-center">
                <h2 style={{ color: "var(--primary-color)", fontWeight: "700" }}>{t('home_ads_title')}</h2>
                <div style={{ width: "60px", height: "4px", backgroundColor: "var(--accent-color)", margin: "10px auto", borderRadius: "var(--radius-sm)" }}></div>
              </div>
              <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                spaceBetween={30}
                slidesPerView={1}
                breakpoints={{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
                style={{ paddingBottom: "40px" }} // Space for pagination dots
              >
                {ads.map((ad) => (
                  <SwiperSlide key={ad.id}>
                    <div className="enterprise-card h-100 p-0" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      {/* Detect video vs image */}
                      {ad.videoUrls?.length ? (
                        <video
                          autoPlay muted loop playsInline
                          style={{ height: "240px", objectFit: "cover", width: "100%", borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                        >
                          <source src={ad.videoUrls[0]} type="video/mp4" />
                        </video>
                      ) : ad.imageUrls?.length ? (
                        <img src={ad.imageUrls[0]} alt={loc(ad.title)} style={{ height: "240px", objectFit: "cover", width: "100%", borderBottom: "1px solid rgba(0,0,0,0.05)" }} />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: "240px", width: "100%", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                          <i className="bi bi-megaphone" style={{ fontSize: "3rem", color: "var(--accent-color)" }}></i>
                        </div>
                      )}
                      <div className="card-body p-4 flex-grow-1 d-flex flex-column">
                        <h5 style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "10px" }}>{loc(ad.title)}</h5>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", margin: 0 }}>
                          {loc(ad.body)}
                        </p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        <Trading />
        <ServiceList />

        {/* Our Team Section */}
        {team.length > 0 && (
          <section className="py-5 bg-white">
            <div className="container" data-aos="fade-up">
              <div className="section-header mb-5 text-center">
                <h2 style={{ color: "var(--primary-color)", fontWeight: "700" }}>{t('nav_team')}</h2>
                <div style={{ width: "60px", height: "4px", backgroundColor: "var(--accent-color)", margin: "10px auto", borderRadius: "var(--radius-sm)" }}></div>
              </div>
              <div className="row g-4">
                {team.map((emp) => (
                  <div key={emp.id} className="col-lg-3 col-md-6" data-aos="fade-up">
                    <div className="enterprise-card text-center p-4">
                      <div className="mb-3">
                        {emp.imageUrl ? (
                          <img src={emp.imageUrl} alt={loc(emp.name)} className="rounded-circle shadow-sm" style={{ width: "120px", height: "120px", objectFit: "cover", border: "3px solid var(--accent-color)" }} />
                        ) : (
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto" style={{ width: "120px", height: "120px", border: "3px solid var(--accent-color)" }}>
                            <i className="bi bi-person-fill text-secondary" style={{ fontSize: "3rem" }}></i>
                          </div>
                        )}
                      </div>
                      <h5 style={{ color: "var(--primary-color)", fontWeight: "700" }}>{loc(emp.name)}</h5>
                      <p className="text-muted small mb-0">{resolveTitleName(emp)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <Link to="/team" className="btn btn-outline-primary px-4 fw-bold">{language === 'ar' ? 'عرض كامل الفريق' : 'View Full Team'}</Link>
              </div>
            </div>
          </section>
        )}

        <ClientList />

        <section className="py-5" style={{ backgroundColor: "#ffffff" }}>
          <div className="container" data-aos="fade-up">
            <div className="enterprise-card p-4 p-md-5" style={{ borderLeft: "5px solid var(--accent-color)" }}>
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-4">
                <div className="text-center text-md-start">
                  <h3 style={{ color: "var(--primary-color)", fontWeight: "700", marginBottom: "10px" }}>
                    {t('career_open_positions')}
                  </h3>
                  <p className="text-secondary mb-0" style={{ fontSize: "1.1rem" }}>
                    {jobs.length > 0 
                      ? (language === 'ar' ? `لدينا حالياً ${jobs.length} وظائف شاغرة بانتظارك!` : `We currently have ${jobs.length} open positions waiting for you!`)
                      : t('career_no_jobs')}
                  </p>
                </div>
                <Link to="/career" className="enterprise-cta-btn shadow-sm">
                  {t('nav_careers')} <i className="bi bi-briefcase ms-1 me-1"></i>
                </Link>
              </div>

              {jobs.length > 0 && (
                <div className="row g-3 mt-4">
                  {jobs.map(job => (
                    <div key={job.id} className="col-md-4">
                      <div className="p-3 rounded bg-light border-start border-warning border-3 h-100">
                        <h6 className="fw-bold mb-1" style={{ color: "var(--primary-color)" }}>{job.title}</h6>
                        <div className="small text-muted">
                          <i className="bi bi-geo-alt me-1 ms-1"></i>{job.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Latest News Section (Enterprise Insights) */}
        {news.length > 0 && (
          <section className="latest-news py-5" style={{ backgroundColor: "#ffffff" }}>
            <div className="container" data-aos="fade-up">
              <div className="section-header mb-5 text-center">
                <h2 style={{ color: "var(--primary-color)", fontWeight: "700" }}>{t('home_latest_news')}</h2>
                <div style={{ width: "60px", height: "4px", backgroundColor: "var(--accent-color)", margin: "10px auto", borderRadius: "var(--radius-sm)" }}></div>
              </div>
              <div className="row g-4">
                {news.map((item) => (
                  <div key={item.id} className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="100">
                    <div className="enterprise-card h-100 p-0" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      {item.imageUrls?.length ? (
                        <img src={item.imageUrls[0]} alt={loc(item.title)} style={{ height: "220px", objectFit: "cover", width: "100%" }} />
                      ) : item.videoUrls?.length ? (
                        <video muted autoPlay loop playsInline style={{ height: "220px", objectFit: "cover", width: "100%" }}>
                          <source src={item.videoUrls[0]} type="video/mp4" />
                        </video>
                      ) : item.imageUrl ? (
                        <img src={item.imageUrl} alt={loc(item.title)} style={{ height: "220px", objectFit: "cover", width: "100%" }} />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: "220px", width: "100%" }}>
                          <i className="bi bi-newspaper" style={{ fontSize: "3rem", color: "var(--secondary-color)" }}></i>
                        </div>
                      )}
                      <div className="card-body p-4 d-flex flex-column flex-grow-1">
                        {item.createdAt && (
                          <span style={{ color: "var(--accent-color)", fontSize: "0.85rem", fontWeight: "600", marginBottom: "8px", display: "block" }}>
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(item.createdAt.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-SD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        )}
                        <h4 style={{ color: "var(--primary-color)", fontWeight: "700", fontSize: "1.25rem", marginBottom: "15px" }}>{loc(item.title)}</h4>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", flexGrow: 1 }}>
                          {loc(item.body)}
                        </p>
                        <Link to="/blog" style={{ color: "var(--primary-color)", fontWeight: "600", marginTop: "15px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px", transition: "color var(--transition-fast)" }}
                              onMouseOver={(e) => e.target.style.color = 'var(--accent-color)'}
                              onMouseOut={(e) => e.target.style.color = 'var(--primary-color)'}
                        >
                          {language === 'ar' ? 'اقرأ المزيد' : 'Read More'} <i className={`bi ${language === 'ar' ? 'bi-arrow-left-short' : 'bi-arrow-right-short'}`} style={{fontSize: "1.2rem"}}></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <Facts />
      </main>
      <Footer />
    </>
  );
};

export default Home;

