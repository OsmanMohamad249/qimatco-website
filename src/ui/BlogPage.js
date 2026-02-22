import React, { useEffect, useState } from 'react';
import { Helmet } from "react-helmet";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from '../components/InnerHeader';
import Footer from '../components/Footer';

const BlogPage = () => {
  const { t, language } = useLanguage();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loc = (val) => val ? (typeof val === "string" ? val : val[language] || val["ar"] || val["en"] || "") : "";

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
        setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchNews();
  }, []);

  return (
    <>
      <Helmet><title>{t('nav_blog')} | Qimat AlAibtikar</title></Helmet>
      <InnerHeader />

      <div className="breadcrumbs" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?q=80&w=2071&auto=format&fit=crop')", padding: "140px 0 60px 0", marginTop: "70px", position: "relative", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.85)" }}></div>
        <div className="container position-relative z-index-2 text-center text-white">
          <h2 style={{ fontWeight: "800", color: "#fff", marginBottom: "15px" }}>{t('nav_blog')}</h2>
        </div>
      </div>

      <main id="main" className="py-5" style={{ backgroundColor: "var(--bg-main)", minHeight: "60vh" }}>
        <div className="container">
          <div className="section-header mb-5 text-center">
            <h2 style={{ color: "var(--primary-color)", fontWeight: "800", fontSize: "2.5rem" }}>{language === 'ar' ? 'المركز الإعلامي' : 'Media Center'}</h2>
            <div style={{ width: "60px", height: "4px", backgroundColor: "var(--accent-color)", margin: "15px auto", borderRadius: "var(--radius-sm)" }}></div>
          </div>

          {loading ? ( <div className="text-center py-5"><div className="spinner-border text-primary"></div></div> ) : news.length > 0 ? (
            <div className="row g-4">
              {news.map((item) => (
                <div className="col-lg-4 col-md-6" key={item.id}>
                  <div className="enterprise-service-card h-100 border-0 bg-white">
                    <div className="card-img-wrapper" style={{height: "220px"}}>
                      <img src={item.imageUrl || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800"} alt="news" className="img-fluid w-100 h-100" style={{objectFit: "cover"}} />
                      <div className="position-absolute top-0 end-0 m-3 badge bg-warning text-dark px-3 py-2 rounded-pill fs-6 shadow-sm"><i className="bi bi-calendar-event me-2"></i>{item.date || "جديد"}</div>
                    </div>
                    <div className="card-content d-flex flex-column p-4 h-100">
                      <h4 className="title fw-bold" style={{color: "var(--primary-color)"}}>{loc(item.title)}</h4>
                      <p className="description flex-grow-1 text-secondary mt-2" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{loc(item.content)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ( <div className="text-center py-5 text-muted"><i className="bi bi-newspaper fs-1 d-block mb-3"></i><h5>{language === 'ar' ? 'لا توجد أخبار حالياً' : 'No news available'}</h5></div> )}
        </div>
      </main>
      <Footer />
    </>
  );
};
export default BlogPage;
