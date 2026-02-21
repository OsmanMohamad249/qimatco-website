import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

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

  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val["ar"] || val["en"] || "";
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const snap = await getDocs(query(collection(db, "ads"), orderBy("createdAt", "desc"), limit(10)));
        setAds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {}
      try {
        const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3)));
        setNews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {}
    };
    loadData();
  }, []);

  return (
    <>
      <Helmet>
        <title>Home | Qimmah Al Ebtekar Integrated Solutions</title>
        <meta name="description" content="Qimmah Al Ebtekar: Integrated Logistics Solutions, International Shipping, Customs Clearance, and Global Trading." />
      </Helmet>
      <InnerHeader />
      <Carousel />
      <main id="main">

        {/* Ads Slider Section */}
        {ads.length > 0 && (
          <section className="ads-section py-4" style={{ background: "var(--bg-light, #F4F7F6)" }}>
            <div className="container">
              <div className="section-header mb-3">
                <h2>{t('home_ads_title')}</h2>
              </div>
              <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
              >
                {ads.map((ad) => (
                  <SwiperSlide key={ad.id}>
                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "var(--border-radius, 12px)", overflow: "hidden" }}>
                      {/* Detect video vs image */}
                      {ad.videoUrls?.length ? (
                        <video
                          autoPlay muted loop playsInline
                          className="card-img-top"
                          style={{ height: 220, objectFit: "cover", width: "100%" }}
                        >
                          <source src={ad.videoUrls[0]} type="video/mp4" />
                        </video>
                      ) : ad.imageUrls?.length ? (
                        <img src={ad.imageUrls[0]} alt={loc(ad.title)} className="card-img-top" style={{ height: 220, objectFit: "cover" }} />
                      ) : (
                        <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: 220 }}>
                          <i className="bi bi-megaphone" style={{ fontSize: 48, color: "var(--accent-color)" }}></i>
                        </div>
                      )}
                      <div className="card-body">
                        <h6 className="card-title" style={{ color: "var(--primary-color)" }}>{loc(ad.title)}</h6>
                        <p className="card-text small text-muted" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{loc(ad.body)}</p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        <ServiceList />
        <Trading />
        <ClientList />

        {/* Latest News Section */}
        {news.length > 0 && (
          <section className="latest-news py-5">
            <div className="container" data-aos="fade-up">
              <div className="section-header">
                <h2>{t('home_latest_news')}</h2>
              </div>
              <div className="row g-4">
                {news.map((item) => (
                  <div key={item.id} className="col-lg-4 col-md-6" data-aos="fade-up">
                    <div className="card h-100 shadow-sm border-0" style={{ borderRadius: "var(--border-radius, 12px)", overflow: "hidden" }}>
                      {item.imageUrls?.length ? (
                        <img src={item.imageUrls[0]} alt={loc(item.title)} className="card-img-top" style={{ height: 200, objectFit: "cover" }} />
                      ) : item.videoUrls?.length ? (
                        <video muted autoPlay loop playsInline className="card-img-top" style={{ height: 200, objectFit: "cover", width: "100%" }}>
                          <source src={item.videoUrls[0]} type="video/mp4" />
                        </video>
                      ) : item.imageUrl ? (
                        <img src={item.imageUrl} alt={loc(item.title)} className="card-img-top" style={{ height: 200, objectFit: "cover" }} />
                      ) : (
                        <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: 200 }}>
                          <i className="bi bi-newspaper" style={{ fontSize: 48, color: "var(--secondary-color)" }}></i>
                        </div>
                      )}
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title" style={{ color: "var(--primary-color)" }}>{loc(item.title)}</h5>
                        {item.createdAt && (
                          <p className="text-muted small">
                            {new Date(item.createdAt.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-SD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        )}
                        <p className="card-text flex-grow-1" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                          {loc(item.body)}
                        </p>
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

