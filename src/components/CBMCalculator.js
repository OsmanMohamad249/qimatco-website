import React, { useState } from 'react';
import { useLanguage } from "../context/LanguageContext";

const CBMCalculator = () => {
    const { t } = useLanguage();
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
            return;
        }

        const totalVolume = (l * w * h * q) / 1000000;
        const totalVolWeight = (l * w * h * q) / 6000;

        setVolume(totalVolume.toFixed(3));
        setVolumetricWeight(totalVolWeight.toFixed(2));
    };

    return (
        <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: 'var(--bg-light)', borderRadius: 'var(--border-radius)' }}>
            <div className="card-body p-4">
                <h4 className="card-title mb-4" style={{ color: 'var(--primary-color)' }}>
                    <i className="bi bi-calculator me-2"></i>
                    {t('cbm_title')}
                </h4>

                <form onSubmit={calculateCBM}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label text-muted">{t('cbm_length')}</label>
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
                            <label className="form-label text-muted">{t('cbm_width')}</label>
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
                            <label className="form-label text-muted">{t('cbm_height')}</label>
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
                            <label className="form-label text-muted">{t('cbm_qty')}</label>
                            <input
                                type="number"
                                className="form-control"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                                placeholder="1"
                                min="1"
                            />
                        </div>
                        <div className="col-12 mt-4">
                            <button type="submit" className="btn btn-primary w-100 py-2" style={{ backgroundColor: 'var(--secondary-color)', border: 'none' }}>
                                <i className="bi bi-calculator-fill me-2"></i>
                                {t('cbm_calc_btn')}
                            </button>
                        </div>
                    </div>
                </form>

                {(volume !== null) && (
                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#e9ecef' }}>
                        <div className="row text-center">
                            <div className="col-6 border-end">
                                <small className="text-muted d-block">{t('cbm_vol_weight')}</small>
                                <strong className="fs-5 text-dark">{volumetricWeight} kg</strong>
                            </div>
                            <div className="col-6">
                                <small className="text-muted d-block">{t('cbm_total_vol')}</small>
                                <strong className="fs-5 text-dark">{volume} m³</strong>
                            </div>
                        </div>
                        <p className="text-center mt-2 mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
                            * {t('cbm_disclaimer')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CBMCalculator;

