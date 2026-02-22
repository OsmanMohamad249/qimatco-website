import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";

const TrackShipment = () => {
  const { language } = useLanguage();
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    const trimmedId = trackingId.trim();
    if (!trimmedId) { setError(language === 'ar' ? "يرجى إدخال رقم التتبع" : "Please enter a tracking ID."); return; }
    try {
      setLoading(true);
      const snapshot = await getDoc(doc(db, "shipments", trimmedId));
      if (!snapshot.exists()) { setError(language === 'ar' ? "لم يتم العثور على شحنة بهذا الرقم." : "No shipment found for this tracking ID."); }
      else { setResult({ id: snapshot.id, ...snapshot.data() }); }
    } catch { setError(language === 'ar' ? "تعذر جلب البيانات. حاول مرة أخرى." : "Unable to fetch shipment. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <>
      <InnerHeader />
      <Helmet><title>{language === 'ar' ? 'تتبع شحنتك | قمة الابتكار' : 'Track Shipment | Qimat AlAibtikar'}</title></Helmet>

      {/* Enterprise Banner */}
      <div className="breadcrumbs" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')", padding: "140px 0 60px 0", marginTop: "70px", position: "relative", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.85)" }}></div>
        <div className="container position-relative d-flex flex-column align-items-center text-center text-white" style={{ zIndex: 2 }}>
          <h2 style={{ fontWeight: "800", color: "#fff", marginBottom: "15px" }}>{language === 'ar' ? 'تتبع شحنتك' : 'Track Your Shipment'}</h2>
          <ol className="d-flex list-unstyled gap-2 fw-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
            <li><Link to="/" className="text-white text-decoration-none">{language === 'ar' ? 'الرئيسية' : 'Home'}</Link></li>
            <li>/</li>
            <li style={{ color: "var(--accent-color)" }}>{language === 'ar' ? 'تتبع الشحنة' : 'Track Shipment'}</li>
          </ol>
        </div>
      </div>

      <main id="main" className="py-5" style={{ backgroundColor: "var(--bg-main)" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="enterprise-card p-4 p-md-5">
                <h3 className="mb-3" style={{ color: "var(--primary-color)", fontWeight: "700" }}>
                  <i className="bi bi-box-seam me-2"></i>
                  {language === 'ar' ? 'تتبع شحنتك' : 'Track Your Shipment'}
                </h3>
                <p className="text-muted mb-4">
                  {language === 'ar' ? 'أدخل رقم التتبع الخاص بك للاطلاع على حالة الشحنة.' : 'Enter your tracking ID to check your shipment status.'}
                </p>
                <form onSubmit={handleSubmit} className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold">{language === 'ar' ? 'رقم التتبع' : 'Tracking ID'}</label>
                    <input type="text" className="form-control form-control-lg" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder={language === 'ar' ? 'مثال: QIM-123456' : 'e.g. QIM-123456'} />
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn enterprise-cta-btn w-100" disabled={loading}>
                      {loading ? (language === 'ar' ? 'جارٍ البحث...' : 'Searching...') : (language === 'ar' ? 'تتبع الشحنة' : 'Track Shipment')}
                    </button>
                  </div>
                </form>

                {error && <div className="alert alert-danger mt-3"><i className="bi bi-exclamation-triangle me-2"></i>{error}</div>}

                {result && (
                  <div className="mt-4 p-4 rounded-3" style={{ background: "var(--bg-main)", border: "2px solid var(--accent-color)" }}>
                    <h5 className="mb-3" style={{ color: "var(--primary-color)", fontWeight: "700" }}>
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      {language === 'ar' ? 'تفاصيل الشحنة' : 'Shipment Details'}
                    </h5>
                    <div className="row g-3">
                      <div className="col-md-6"><strong>{language === 'ar' ? 'رقم التتبع:' : 'Tracking ID:'}</strong> {result.id}</div>
                      <div className="col-md-6"><strong>{language === 'ar' ? 'الحالة:' : 'Status:'}</strong> <span className="badge bg-primary">{result.status || "N/A"}</span></div>
                      <div className="col-md-6"><strong>{language === 'ar' ? 'العميل:' : 'Customer:'}</strong> {result.customerName || "-"}</div>
                      <div className="col-md-6"><strong>{language === 'ar' ? 'المنشأ:' : 'Origin:'}</strong> {result.origin || "-"}</div>
                      <div className="col-md-6"><strong>{language === 'ar' ? 'الوجهة:' : 'Destination:'}</strong> {result.destination || "-"}</div>
                      <div className="col-md-6"><strong>{language === 'ar' ? 'الوصول المتوقع:' : 'ETA:'}</strong> {result.eta || "-"}</div>
                      <div className="col-12"><strong>{language === 'ar' ? 'ملاحظات:' : 'Notes:'}</strong> {result.notes || "-"}</div>
                      {result.updatedAt && (
                        <div className="col-12 text-muted small">
                          {language === 'ar' ? 'آخر تحديث:' : 'Last Updated:'} {result.updatedAt.toDate ? result.updatedAt.toDate().toLocaleString() : result.updatedAt}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TrackShipment;

