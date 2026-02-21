import React, { useRef, useState } from "react";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const Contact = () => {
    const { t, language } = useLanguage();
    const formRef = useRef();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const formData = new FormData(e.target);
        const payload = {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            origin: formData.get('origin') || '',
            destination: formData.get('destination') || '',
            service: formData.get('service_type') || '',
            dimensions: formData.get('dimensions') || '',
            message: formData.get('message') || '',
            intent: formData.get('intent') || 'logistics',
            type: "Contact",
            status: "New",
            createdAt: serverTimestamp(),
        };
        try {
            await addDoc(collection(db, 'messages'), payload);
            setIsSubmitted(true);
            formRef.current.reset();
            setTimeout(() => setIsSubmitted(false), 5000);
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <InnerHeader />
            {/* Enterprise Banner */}
            <div className="breadcrumbs" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2070&auto=format&fit=crop')", padding: "140px 0 60px 0", marginTop: "70px", position: "relative", backgroundSize: "cover", backgroundPosition: "center" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.85)" }}></div>
                <div className="container position-relative d-flex flex-column align-items-center text-center text-white" style={{ zIndex: 2 }}>
                    <h2 style={{ fontWeight: "800", color: "#fff", marginBottom: "15px" }}>{language === 'ar' ? 'تواصل معنا' : 'Contact Us'}</h2>
                    <ol className="d-flex list-unstyled gap-2 fw-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
                        <li><Link to="/" className="text-white text-decoration-none">{language === 'ar' ? 'الرئيسية' : 'Home'}</Link></li>
                        <li>/</li>
                        <li style={{ color: "var(--accent-color)" }}>{language === 'ar' ? 'تواصل معنا' : 'Contact Us'}</li>
                    </ol>
                </div>
            </div>
            <main id="main">
                <section id="contact" className="contact">
                    <div className="container position-relative" data-aos="fade-up">
                        <div className="section-header">
                            <h2>{t('contact_title')}</h2>
                        </div>

                        <div className="row gy-4 d-flex justify-content-center">

                            {/* Contact Info Column */}
                            <div className="col-lg-5" data-aos="fade-up" data-aos-delay="100">
                                <div className="info-item d-flex">
                                    <i className="bi bi-geo-alt flex-shrink-0"></i>
                                    <div>
                                        <h4>{t('contact_address_label')}</h4>
                                        <p>{t('contact_address_val')}</p>
                                    </div>
                                </div>

                                <div className="info-item d-flex">
                                    <i className="bi bi-envelope flex-shrink-0"></i>
                                    <div>
                                        <h4>{t('contact_email_label')}</h4>
                                        <p>info@qimmah.com</p>
                                    </div>
                                </div>

                                <div className="info-item d-flex">
                                    <i className="bi bi-phone flex-shrink-0"></i>
                                    <div>
                                        <h4>{t('contact_phone_label')}</h4>
                                        <p>+249 912345678</p>
                                    </div>
                                </div>

                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249743.0298075308!2d32.698335!3d15.593256!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x168e8fde9837c397%3A0xe539e0ebc54a9d70!2sKhartoum%2C%20Sudan!5e0!3m2!1sen!2s!4v1690000000000!5m2!1sen!2s"
                                    frameBorder="0"
                                    style={{ border: 0, width: "100%", height: "290px", marginTop: "20px" }}
                                    allowFullScreen
                                    title="Google Maps"
                                ></iframe>
                            </div>

                            {/* Advanced Form Column */}
                            <div className="col-lg-7" data-aos="fade-up" data-aos-delay="250">
                                <div className="php-email-form">
                                    <form ref={formRef} onSubmit={handleSubmit}>
                                        <h3 className="mb-4">{t('nav_quote')}</h3>

                                        <div className="form-group mb-3">
                                            <label className="mb-2 fw-bold">{t('contact_intent')}:</label>
                                            <div className="d-flex gap-4">
                                                <div className="form-check">
                                                    <input className="form-check-input" type="radio" name="intent" id="intent_logistics" value="logistics" defaultChecked />
                                                    <label className="form-check-label" htmlFor="intent_logistics">
                                                        {t('contact_intent_logistics')}
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input className="form-check-input" type="radio" name="intent" id="intent_trading" value="trading" />
                                                    <label className="form-check-label" htmlFor="intent_trading">
                                                        {t('contact_intent_trading')}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 form-group">
                                                <input type="text" name="name" className="form-control" id="name" placeholder={t('contact_name')} required />
                                            </div>
                                            <div className="col-md-6 form-group mt-3 mt-md-0">
                                                <input type="email" className="form-control" name="email" id="email" placeholder={t('contact_email')} required />
                                            </div>
                                        </div>

                                        <div className="form-group mt-3">
                                            <input type="text" className="form-control" name="phone" id="phone" placeholder={t('contact_phone')} required />
                                        </div>

                                        <div className="row mt-3">
                                            <div className="col-md-6 form-group">
                                                <input type="text" name="origin" className="form-control" id="origin" placeholder={t('contact_origin')} required />
                                            </div>
                                            <div className="col-md-6 form-group mt-3 mt-md-0">
                                                <input type="text" name="destination" className="form-control" id="destination" placeholder={t('contact_destination')} required />
                                            </div>
                                        </div>

                                        <div className="row mt-3">
                                            <div className="col-md-6 form-group">
                                                <select name="service_type" className="form-control" required defaultValue="">
                                                    <option value="" disabled>{t('contact_service_type')}</option>
                                                    <option value="sea">{t('service_sea')}</option>
                                                    <option value="air">{t('service_air')}</option>
                                                    <option value="land">{t('service_land')}</option>
                                                    <option value="customs">{t('service_customs')}</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6 form-group mt-3 mt-md-0">
                                                <input type="text" name="dimensions" className="form-control" id="dimensions" placeholder={t('contact_dims')} />
                                            </div>
                                        </div>

                                        <div className="form-group mt-3">
                                            <textarea className="form-control" name="message" rows="5" placeholder={t('contact_message')} required></textarea>
                                        </div>

                                        <div className="my-3">
                                            {isSubmitted && <div className="sent-message d-block">{t('contact_success_msg')}</div>}
                                        </div>

                                        <div className="text-center">
                                            <button type="submit" disabled={submitting}>
                                                {submitting ? t('contact_submitting', 'جاري الإرسال...') : t('contact_submit')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default Contact;
