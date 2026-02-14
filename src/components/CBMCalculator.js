import React, { useState } from 'react';

const CBMCalculator = () => {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [volume, setVolume] = useState(null);
  const [volumetricWeight, setVolumetricWeight] = useState(null);

  const calculateCBM = (e) => {
    e.preventDefault();
    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const q = parseInt(quantity);

    if (isNaN(l) || isNaN(w) || isNaN(h) || isNaN(q)) {
      alert("Please enter valid numbers");
      return;
    }

    // Volume in CBM: (L * W * H * Qty) / 1,000,000
    const totalVolume = (l * w * h * q) / 1000000;

    // Volumetric Weight (Standard 6000): (L * W * H * Qty) / 6000
    const totalVolWeight = (l * w * h * q) / 6000;

    setVolume(totalVolume.toFixed(3));
    setVolumetricWeight(totalVolWeight.toFixed(2));
  };

  return (
    <div className="card shadow-sm border-0" style={{ backgroundColor: 'var(--bg-light)', borderRadius: 'var(--border-radius)' }}>
      <div className="card-body p-4">
        <h4 className="card-title mb-4" style={{ color: 'var(--primary-color)' }}>
          <i className="bi bi-calculator me-2"></i>
          حاسبة الحجم والوزن (CBM Calculator)
        </h4>

        <form onSubmit={calculateCBM}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label text-muted">الطول (سم) / Length (cm)</label>
              <input
                type="number"
                className="form-control"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
                placeholder="0"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">العرض (سم) / Width (cm)</label>
              <input
                type="number"
                className="form-control"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                required
                placeholder="0"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">الارتفاع (سم) / Height (cm)</label>
              <input
                type="number"
                className="form-control"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
                placeholder="0"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">العدد / Quantity</label>
              <input
                type="number"
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="1"
              />
            </div>

            <div className="col-12 mt-4">
              <button type="submit" className="btn btn-primary w-100 py-2" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
                احسب الآن / Calculate
              </button>
            </div>
          </div>
        </form>

        {volume !== null && (
          <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'white', border: '1px solid #dee2e6' }}>
            <h5 className="mb-3" style={{ color: 'var(--secondary-color)' }}>النتيجة / Result:</h5>
            <div className="d-flex justify-content-between mb-2">
              <span>Total Volume (الحجم الكلي):</span>
              <strong style={{ color: 'var(--primary-color)' }}>{volume} m³</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Volumetric Weight (الوزن الحجمي):</span>
              <strong style={{ color: 'var(--primary-color)' }}>{volumetricWeight} kg</strong>
            </div>
            <hr />
            <p className="small text-muted mb-0">
              * This is an estimate based on standard air freight factor (6000). For precise quotes, please contact us.
              <br/>
              * This is an estimate based on standard air freight factor (6000). For precise quotes, please contact us.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CBMCalculator;

