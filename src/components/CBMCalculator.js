import React, { useState } from 'react';
export default CBMCalculator;

};
  );
    </div>
      </div>
        )}
          </div>
            </p>
              * هذا تقدير بناءً على عامل الشحن الجوي القياسي (6000). للحصول على عرض سعر دقيق، يرجى التواصل معنا.
              <br/>
              * This is an estimate based on standard air freight factor (6000). For precise quotes, please contact us.
            <p className="small text-muted mb-0">
            <hr />
            </div>
              <strong style={{ color: 'var(--primary-color)' }}>{volumetricWeight} kg</strong>
              <span>Volumetric Weight (الوزن الحجمي):</span>
            <div className="d-flex justify-content-between">
            </div>
              <strong style={{ color: 'var(--primary-color)' }}>{volume} m³</strong>
              <span>Total Volume (الحجم الكلي):</span>
            <div className="d-flex justify-content-between mb-2">
            <h5 className="mb-3" style={{ color: 'var(--secondary-color)' }}>النتيجة / Result:</h5>
          <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'white', border: '1px solid #dee2e6' }}>
        {volume !== null && (

        </form>
          </div>
            </div>
              </button>
                احسب الآن / Calculate
              <button type="submit" className="btn btn-primary w-100 py-2" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
            <div className="col-12 mt-4">

            </div>
              />
                min="1"
                required
                onChange={(e) => setQuantity(e.target.value)}
                value={quantity}
                className="form-control"
                type="number"
              <input
              <label className="form-label text-muted">العدد / Quantity</label>
            <div className="col-md-6">
            </div>
              />
                placeholder="0"
                required
                onChange={(e) => setHeight(e.target.value)}
                value={height}
                className="form-control"
                type="number"
              <input
              <label className="form-label text-muted">الارتفاع (سم) / Height (cm)</label>
            <div className="col-md-6">
            </div>
              />
                placeholder="0"
                required
                onChange={(e) => setWidth(e.target.value)}
                value={width}
                className="form-control"
                type="number"
              <input
              <label className="form-label text-muted">العرض (سم) / Width (cm)</label>
            <div className="col-md-6">
            </div>
              />
                placeholder="0"
                required
                onChange={(e) => setLength(e.target.value)}
                value={length}
                className="form-control"
                type="number"
              <input
              <label className="form-label text-muted">الطول (سم) / Length (cm)</label>
            <div className="col-md-6">
          <div className="row g-3">
        <form onSubmit={calculateCBM}>

        </h4>
          حاسبة الحجم والوزن (CBM Calculator)
          <i className="bi bi-calculator me-2"></i>
        <h4 className="card-title mb-4" style={{ color: 'var(--primary-color)' }}>
      <div className="card-body p-4">
    <div className="card shadow-sm border-0" style={{ backgroundColor: 'var(--bg-light)', borderRadius: 'var(--border-radius)' }}>
  return (

  };
    setVolumetricWeight(totalVolWeight.toFixed(2));
    setVolume(totalVolume.toFixed(3));

    const totalVolWeight = (l * w * h * q) / 6000;
    // Volumetric Weight (Standard 6000): (L * W * H * Qty) / 6000

    const totalVolume = (l * w * h * q) / 1000000;
    // Volume in CBM: (L * W * H * Qty) / 1,000,000

    }
      return;
      alert("Please enter valid numbers");
    if (isNaN(l) || isNaN(w) || isNaN(h) || isNaN(q)) {

    const q = parseInt(quantity);
    const h = parseFloat(height);
    const w = parseFloat(width);
    const l = parseFloat(length);
    e.preventDefault();
  const calculateCBM = (e) => {

  const [volumetricWeight, setVolumetricWeight] = useState(null);
  const [volume, setVolume] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
const CBMCalculator = () => {


