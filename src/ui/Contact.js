import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from '../components/InnerHeader';
import Footer from '../components/Footer';

const Contact = () => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState({ loading: false, success: false, error: "" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: "" });
    try {
      await addDoc(collection(db, "messages"), { ...formData, createdAt: serverTimestamp(), read: false });
      setStatus({ loading: false, success: true, error: "" });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus({ loading: false, success: false, error: language === 'ar' ? "حدث خطأ أثناء الإرسال" : "Error sending message" });
    }
  };

  return (
    <>
      <Helmet><title>{t('nav_contact')} | Qimat AlAibtikar</title></Helmet>
      <InnerHeader />

      <div className="breadcrumbs" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2074&auto=format&fit=crop')", padding: "140px 0 60px 0", marginTop: "70px", position: "relative", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.85)" }}></div>
        <div className="container position-relative z-index-2 text-center text-white">
          <h2 style={{ fontWeight: "800", color: "#fff", marginBottom: "15px" }}>{t('nav_contact')}</h2>
        </div>
      </div>

      <main id="main" className="py-5" style={{ backgroundColor: "var(--bg-main)" }}>
        <div className="container" style={{ marginTop: "-80px", position: "relative", zIndex: 3 }}>
          <div className="row g-4 mb-5">
            <div className="col-lg-4 col-md-6"><div className="enterprise-card p-4 text-center h-100 shadow-sm border-bottom border-warning border-4"><i className="bi bi-geo-alt fs-1 text-warning mb-3 d-block"></i><h4 className="fw-bold" style={{color: "var(--primary-color)"}}>{language === 'ar' ? 'العنوان' : 'Address'}</h4><p className="text-muted mb-0">{language === 'ar' ? 'المملكة العربية السعودية، الرياض' : 'Riyadh, Saudi Arabia'}</p></div></div>
            <div className="col-lg-4 col-md-6"><div className="enterprise-card p-4 text-center h-100 shadow-sm border-bottom border-warning border-4"><i className="bi bi-telephone fs-1 text-warning mb-3 d-block"></i><h4 className="fw-bold" style={{color: "var(--primary-color)"}}>{language === 'ar' ? 'الهاتف' : 'Phone'}</h4><p className="text-muted mb-0" dir="ltr">+966 XX XXX XXXX</p></div></div>
            <div className="col-lg-4 col-md-12"><div className="enterprise-card p-4 text-center h-100 shadow-sm border-bottom border-warning border-4"><i className="bi bi-envelope fs-1 text-warning mb-3 d-block"></i><h4 className="fw-bold" style={{color: "var(--primary-color)"}}>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</h4><p className="text-muted mb-0">info@qimatco.com</p></div></div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="enterprise-card p-4 p-md-5 shadow-lg">
                <div className="text-center mb-5">
                  <h3 style={{color: "var(--primary-color)", fontWeight: "800"}}>{language === 'ar' ? 'أرسل لنا رسالة' : 'Send Us a Message'}</h3>
                  <p className="text-muted">{language === 'ar' ? 'فريقنا جاهز للرد على استفساراتكم وتقديم أفضل الحلول.' : 'Our team is ready to answer your inquiries.'}</p>
                </div>
                {status.success && <div className="alert alert-success fw-bold text-center border-0"><i className="bi bi-check-circle-fill me-2"></i>{language === 'ar' ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' : 'Message sent successfully!'}</div>}
                {status.error && <div className="alert alert-danger fw-bold text-center border-0">{status.error}</div>}

                <form onSubmit={handleSubmit} className="row g-4">
                  <div className="col-md-6"><label className="form-label fw-bold text-secondary">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label><input type="text" name="name" className="form-control form-control-lg bg-light border-0" value={formData.name} onChange={handleChange} required /></div>
                  <div className="col-md-6"><label className="form-label fw-bold text-secondary">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label><input type="email" name="email" className="form-control form-control-lg bg-light border-0" value={formData.email} onChange={handleChange} required /></div>
                  <div className="col-12"><label className="form-label fw-bold text-secondary">{language === 'ar' ? 'الموضوع' : 'Subject'}</label><input type="text" name="subject" className="form-control form-control-lg bg-light border-0" value={formData.subject} onChange={handleChange} required /></div>
                  <div className="col-12"><label className="form-label fw-bold text-secondary">{language === 'ar' ? 'رسالتك' : 'Your Message'}</label><textarea name="message" rows="5" className="form-control form-control-lg bg-light border-0" value={formData.message} onChange={handleChange} required></textarea></div>
                  <div className="col-12 text-center mt-5"><button type="submit" className="btn enterprise-cta-btn btn-lg px-5" disabled={status.loading}>{status.loading ? <span className="spinner-border spinner-border-sm"></span> : (language === 'ar' ? 'إرسال الرسالة' : 'Send Message')}</button></div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};
export default Contact;
