import React, { useRef, useState } from "react";
import InnerHeaderBanner from "../components/InnerHeaderBanner";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";

const contactHeader = "https://loremflickr.com/1920/600/contact,center,logistics/all";

const Contact = () => {
    const { t } = useLanguage();
    const formRef = useRef();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would typically integrate EmailJS or another backend service
        // For now, we simulate success
        setIsSubmitted(true);
        formRef.current.reset();
        setTimeout(() => setIsSubmitted(false), 5000);
    };

    return (
        <>
            <InnerHeader />
            <InnerHeaderBanner name={t('contact_title')} img={contactHeader} />
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
                                            <button type="submit">{t('contact_submit')}</button>
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
