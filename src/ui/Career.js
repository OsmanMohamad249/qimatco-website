import React, { useState, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from '../components/InnerHeader';
import Footer from '../components/Footer';

const Career = () => {
  const { t, language } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', linkedin: '', experience: '', education: '' });
  const [file, setFile] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ loading: false, success: false, error: '' });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!file) return setSubmitStatus({ ...submitStatus, error: language === 'ar' ? 'يرجى إرفاق السيرة الذاتية' : 'Please attach CV' });
    setSubmitStatus({ loading: true, success: false, error: '' });

    try {
      // 1. Upload CV to Cloudinary (Using 'auto' for PDF/DOC support)
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", file);
      cloudinaryData.append("upload_preset", "cv_preset");

      const cloudinaryRes = await fetch("https://api.cloudinary.com/v1_1/dmynksk5z/auto/upload", {
        method: "POST",
        body: cloudinaryData,
      });

      const cloudinaryJson = await cloudinaryRes.json();

      if (!cloudinaryRes.ok) {
        throw new Error(cloudinaryJson.error?.message || "Cloudinary upload failed");
      }

      const cvUrl = cloudinaryJson.secure_url;

      // 2. Save Application to Firestore (Database)
      await addDoc(collection(db, "applications"), {
        ...formData,
        cvUrl,
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        createdAt: serverTimestamp()
      });

      setSubmitStatus({ loading: false, success: true, error: '' });
      setTimeout(() => {
        setSelectedJob(null);
        setSubmitStatus({ loading: false, success: false, error: '' });
      }, 3000);
    } catch (err) {
      setSubmitStatus({ loading: false, success: false, error: err.message });
    }
  };

  return (
    <>
      <Helmet><title>{t('nav_careers')} | Qimat AlAibtikar</title></Helmet>
      <InnerHeader />
      <div className="breadcrumbs" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')", padding: "140px 0 60px 0", marginTop: "70px", position: "relative", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.85)" }}></div>
        <div className="container position-relative z-index-2 text-center text-white">
          <h2 style={{ fontWeight: "800", color: "#fff", marginBottom: "15px" }}>{t('nav_careers')}</h2>
        </div>
      </div>

      <main id="main" className="py-5" style={{ backgroundColor: "var(--bg-main)", minHeight: "60vh" }}>
        <div className="container">
          <h3 className="mb-5 text-center fw-bold" style={{ color: "var(--primary-color)" }}>{t('career_open_positions')}</h3>

          {loading ? (
            <div className="text-center"><div className="spinner-border text-primary"></div></div>
          ) : jobs.length === 0 ? (
            <div className="alert alert-info text-center fw-bold border-0">{t('career_no_jobs')}</div>
          ) : (
            <div className="row g-4">
              {jobs.map(job => {
                const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;
                const isClosed = job.status === 'closed' || isExpired;
                return (
                  <div key={job.id} className="col-lg-6">
                    <div className="enterprise-card p-4 h-100 bg-white shadow-sm border-0 d-flex flex-column" style={{ borderLeft: "5px solid var(--accent-color) !important" }}>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h4 className="fw-bold" style={{ color: "var(--primary-color)" }}>{job.title}</h4>
                        <span className="badge bg-light text-dark border"><i className="bi bi-briefcase me-1 ms-1"></i>{job.department}</span>
                      </div>
                      <div className="mb-3 text-secondary d-flex gap-3">
                        <span><i className="bi bi-geo-alt text-warning me-1 ms-1"></i>{job.location}</span>
                        <span><i className="bi bi-clock text-warning me-1 ms-1"></i>{job.type}</span>
                      </div>
                      {job.deadline && (
                        <span className="text-danger fw-bold mb-2 d-block"><i className="bi bi-calendar-x me-1 ms-1"></i>{t('career_deadline')}: {job.deadline}</span>
                      )}
                      <p className="text-muted flex-grow-1">{job.description}</p>
                      {isClosed ? (
                        <button className="btn btn-secondary mt-3 w-100 fw-bold" disabled>{t('career_closed')}</button>
                      ) : (
                        <button className="btn btn-outline-primary mt-3 w-100 fw-bold" onClick={() => setSelectedJob(job)}>{t('career_apply_now')}</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selectedJob && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg w-100" style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold mb-0" style={{ color: "var(--primary-color)" }}>{t('career_apply_now')}: {selectedJob.title}</h4>
              <button className="btn-close" onClick={() => setSelectedJob(null)}></button>
            </div>

            {submitStatus.success ? (
              <div className="alert alert-success text-center fw-bold">{t('career_success')}</div>
            ) : (
              <form onSubmit={handleApply}>
                <div className="mb-3">
                  <label className="form-label text-secondary">{t('career_form_name')}</label>
                  <input type="text" className="form-control bg-light border-0" required onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary">Email</label>
                    <input type="email" className="form-control bg-light border-0" required onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="col-md-6 mt-3 mt-md-0">
                    <label className="form-label text-secondary">{t('career_form_phone')}</label>
                    <input type="tel" className="form-control bg-light border-0" required onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary">{t('career_linkedin')}</label>
                    <input type="url" className="form-control bg-light border-0" onChange={e => setFormData({ ...formData, linkedin: e.target.value })} />
                  </div>
                  <div className="col-md-6 mt-3 mt-md-0">
                    <label className="form-label text-secondary">{t('career_experience')}</label>
                    <input type="number" min="0" className="form-control bg-light border-0" onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label text-secondary">{t('career_education')}</label>
                  <select className="form-select bg-light border-0" onChange={e => setFormData({ ...formData, education: e.target.value })}>
                    <option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>
                    <option value="high_school">{language === 'ar' ? 'ثانوي' : 'High School'}</option>
                    <option value="bachelor">{language === 'ar' ? 'بكالوريوس' : 'Bachelor'}</option>
                    <option value="master">{language === 'ar' ? 'ماجستير' : 'Master'}</option>
                    <option value="phd">{language === 'ar' ? 'دكتوراه' : 'PhD'}</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label text-secondary">{t('career_form_cv')}</label>
                  <input type="file" className="form-control bg-light border-0" accept=".pdf,.doc,.docx" required onChange={e => setFile(e.target.files[0])} />
                  <small className="text-muted mt-1 d-block">Max size: 5MB (PDF/DOC)</small>
                </div>
                {submitStatus.error && <div className="alert alert-danger">{submitStatus.error}</div>}
                <button type="submit" className="btn enterprise-cta-btn w-100 btn-lg" disabled={submitStatus.loading}>
                  {submitStatus.loading ? <span className="spinner-border spinner-border-sm"></span> : t('career_submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default Career;
