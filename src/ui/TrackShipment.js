import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const TrackShipment = () => {
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const trimmedId = trackingId.trim();
    if (!trimmedId) {
      setError("Please enter a tracking ID.");
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, "shipments", trimmedId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        setError("No shipment found for this tracking ID.");
      } else {
        setResult({ id: snapshot.id, ...snapshot.data() });
      }
    } catch (err) {
      setError("Unable to fetch shipment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main" className="py-5">
      <Helmet>
        <title>Track Shipment | Qimmah Al Ebtekar</title>
        <meta
          name="description"
          content="Track your Qimmah shipment in real-time using your tracking ID."
        />
      </Helmet>
      <div className="container" data-aos="fade-up">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <h3 className="mb-3" style={{ color: "var(--primary-color)" }}>
                  تتبع شحنتك / Track Your Shipment
                </h3>
                <p className="text-muted mb-4">
                  أدخل رقم التتبع الخاص بك للاطلاع على حالة الشحنة.
                </p>
                <form onSubmit={handleSubmit} className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Tracking ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="مثال: QIM-123456"
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-between align-items-center">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ background: "var(--secondary-color)", border: "none" }}
                      disabled={loading}
                    >
                      {loading ? "جارٍ التتبع..." : "تتبع / Track"}
                    </button>
                    {error && <span className="text-danger small">{error}</span>}
                  </div>
                </form>

                {result && (
                  <div className="mt-4 p-3 rounded" style={{ background: "var(--bg-light)" }}>
                    <h5 className="mb-2">النتيجة / Result</h5>
                    <div className="row g-2">
                      <div className="col-md-6"><strong>ID:</strong> {result.id}</div>
                      <div className="col-md-6"><strong>Status:</strong> {result.status || "N/A"}</div>
                      <div className="col-md-6"><strong>Customer:</strong> {result.customerName || "-"}</div>
                      <div className="col-md-6"><strong>Origin:</strong> {result.origin || "-"}</div>
                      <div className="col-md-6"><strong>Destination:</strong> {result.destination || "-"}</div>
                      <div className="col-md-6"><strong>ETA:</strong> {result.eta || "-"}</div>
                      <div className="col-12"><strong>Notes:</strong> {result.notes || "-"}</div>
                      {result.updatedAt && (
                        <div className="col-12 text-muted small">
                          Last Updated: {result.updatedAt.toDate ? result.updatedAt.toDate().toLocaleString() : result.updatedAt}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TrackShipment;

