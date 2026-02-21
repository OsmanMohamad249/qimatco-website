import React from 'react';
import { Helmet } from "react-helmet";
import { Link } from 'react-router-dom';
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from '../components/InnerHeader';
import Footer from '../components/Footer';

const Career = () => {
  const { language } = useLanguage();

  return (
    <>
      <Helmet><title>{language === 'ar' ? 'التوظيف' : 'Careers'} | Qimmah Al Ebtekar</title></Helmet>
      <InnerHeader />

      <div className="breadcrumbs" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')", padding: "140px 0 60px 0", marginTop: "70px", position: "relative", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.85)" }}></div>
        <div className="container position-relative z-index-2 text-center text-white">
          <h2 style={{ fontWeight: "800", color: "#fff", marginBottom: "15px" }}>{language === 'ar' ? 'انضم إلى فريقنا' : 'Join Our Team'}</h2>
          <p className="fs-5 text-light-50">{language === 'ar' ? 'ابنِ مسيرتك المهنية مع رواد الحلول اللوجستية' : 'Build your career with the leaders in logistics'}</p>
        </div>
      </div>

      <main id="main" className="py-5" style={{ backgroundColor: "var(--bg-main)" }}>
        <div className="container">
          <div className="row g-4 mb-5 justify-content-center">
            <div className="col-lg-4 col-md-6"><div className="enterprise-card p-5 text-center h-100"><i className="bi bi-stars fs-1 text-warning mb-4 d-block"></i><h4 style={{color: "var(--primary-color)", fontWeight: "700"}}>{language === 'ar' ? 'بيئة محفزة' : 'Inspiring Environment'}</h4><p className="text-secondary">{language === 'ar' ? 'نوفر بيئة عمل تشجع على الإبداع وتطوير المهارات.' : 'We provide a workspace that encourages creativity.'}</p></div></div>
            <div className="col-lg-4 col-md-6"><div className="enterprise-card p-5 text-center h-100"><i className="bi bi-graph-up-arrow fs-1 text-warning mb-4 d-block"></i><h4 style={{color: "var(--primary-color)", fontWeight: "700"}}>{language === 'ar' ? 'تطور مستمر' : 'Continuous Growth'}</h4><p className="text-secondary">{language === 'ar' ? 'مسارات وظيفية واضحة وفرص للترقي.' : 'Clear career paths and promotion opportunities.'}</p></div></div>
            <div className="col-lg-4 col-md-6"><div className="enterprise-card p-5 text-center h-100"><i className="bi bi-globe fs-1 text-warning mb-4 d-block"></i><h4 style={{color: "var(--primary-color)", fontWeight: "700"}}>{language === 'ar' ? 'تأثير عالمي' : 'Global Impact'}</h4><p className="text-secondary">{language === 'ar' ? 'كن جزءاً من منظومة تربط الأسواق العالمية.' : 'Be part of a system connecting global markets.'}</p></div></div>
          </div>

          <div className="enterprise-card p-5 text-center mt-5 bg-white shadow-lg border-0" style={{borderTop: "5px solid var(--accent-color) !important"}}>
            <i className="bi bi-briefcase fs-1 text-secondary mb-3 d-block"></i>
            <h3 style={{color: "var(--primary-color)", fontWeight: "800"}}>{language === 'ar' ? 'الوظائف المتاحة حالياً' : 'Current Openings'}</h3>
            <p className="text-muted fs-5 mt-3">{language === 'ar' ? 'لا توجد شواغر وظيفية في الوقت الحالي، ولكننا نبحث دائماً عن المواهب! أرسل سيرتك الذاتية وسنتواصل معك عند توفر الفرصة.' : 'No open positions currently, but we are always looking for talent!'}</p>
            <Link to="/contact" className="btn enterprise-cta-btn btn-lg px-5 mt-4">{language === 'ar' ? 'أرسل سيرتك الذاتية' : 'Submit your CV'}</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};
export default Career;
