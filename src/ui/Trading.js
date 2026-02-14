import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";

const Trading = () => {
    const { t } = useLanguage();

    return (
        <section id="trading" className="trading section-bg">
            <div className="container" data-aos="fade-up">

                <div className="section-header">
                    <h2>{t('trading_title')}</h2>
                </div>

                <div className="row gy-4">

                    <div className="col-lg-6" data-aos="fade-up" data-aos-delay="100">
                        <div className="card-item">
                            <div className="row">
                                <div className="col-xl-5">
                                    <div className="card-bg" style={{ minHeight: '300px', backgroundSize: 'cover', backgroundImage: 'url(https://loremflickr.com/800/600/crops,sudan/all)' }}></div>
                                </div>
                                <div className="col-xl-7 d-flex align-items-center">
                                    <div className="card-body">
                                        <h4 className="card-title">{t('trading_export_title')}</h4>
                                        <p>{t('trading_export_text')}</p>
                                        <div className="d-flex flex-wrap gap-2 mt-3">
                                            <span className="badge bg-success">#GumArabic</span>
                                            <span className="badge bg-success">#Sesame</span>
                                            <span className="badge bg-success">#Livestock</span>
                                        </div>
                                        <Link to="/contact" className="readmore stretched-link mt-3 d-inline-block">
                                            <i className="bi bi-arrow-right"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6" data-aos="fade-up" data-aos-delay="200">
                        <div className="card-item">
                            <div className="row">
                                <div className="col-xl-5">
                                    <div className="card-bg" style={{ minHeight: '300px', backgroundSize: 'cover', backgroundImage: 'url(https://loremflickr.com/800/600/fabric,textile/all)' }}></div>
                                </div>
                                <div className="col-xl-7 d-flex align-items-center">
                                    <div className="card-body">
                                        <h4 className="card-title">{t('trading_import_title')}</h4>
                                        <p>{t('trading_import_text')}</p>
                                        <div className="d-flex flex-wrap gap-2 mt-3">
                                            <span className="badge bg-primary">#Fashion</span>
                                            <span className="badge bg-primary">#Textiles</span>
                                            <span className="badge bg-primary">#Wholesale</span>
                                        </div>
                                        <Link to="/contact" className="readmore stretched-link mt-3 d-inline-block">
                                            <i className="bi bi-arrow-right"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
};

export default Trading;

