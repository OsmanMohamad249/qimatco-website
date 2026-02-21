import React, { useEffect } from 'react';
import { Helmet } from "react-helmet";
import AOS from "aos";
import 'aos/dist/aos.css';
import InnerHeader from '../components/InnerHeader';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { language } = useLanguage();
  useEffect(() => { AOS.init(); AOS.refresh(); }, []);

  const img_hero = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop";
  const img_logistics = "https://images.unsplash.com/photo-1565891741441-64926e441838?q=80&w=1000&auto=format&fit=crop";
  const img_export = "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?q=80&w=1000&auto=format&fit=crop";
  const img_import = "https://images.unsplash.com/photo-1551281081-8b066266002f?q=80&w=1000&auto=format&fit=crop";

  return (
    <>
      <Helmet>
        <title>{language === 'ar' ? 'من نحن | قمة الابتكار' : 'About Us | Qimmah Al Ebtekar'}</title>
      </Helmet>
      <InnerHeader />

      {/* Enterprise Banner */}
      <div className="breadcrumbs" style={{ backgroundImage: `url(${img_hero})`, padding: "140px 0 60px 0", marginTop: "70px", position: "relative", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(11, 44, 92, 0.85)" }}></div>
        <div className="container position-relative text-center text-white" style={{ zIndex: 2 }} data-aos="fade">
          <h2 style={{ fontWeight: "800", color: "#fff", marginBottom: "15px" }}>{language === 'ar' ? 'من نحن' : 'About Us'}</h2>
          <ol className="d-flex justify-content-center list-unstyled gap-2 fw-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
            <li><Link to="/" className="text-white text-decoration-none" style={{transition: "color 0.3s"}} onMouseOver={(e)=>e.target.style.color="var(--accent-color)"} onMouseOut={(e)=>e.target.style.color="#fff"}>{language === 'ar' ? 'الرئيسية' : 'Home'}</Link></li>
            <li>/</li>
            <li style={{ color: "var(--accent-color)" }}>{language === 'ar' ? 'من نحن' : 'About Us'}</li>
          </ol>
        </div>
      </div>

      <main id="main" style={{ backgroundColor: "var(--bg-main)" }} dir={language === 'ar' ? 'rtl' : 'ltr'}>

        {/* Why Choose Us Section */}
        <section className="py-5 mt-4">
          <div className="container" data-aos="fade-up">
            <div className="row gy-5 align-items-center">
              <div className="col-lg-6">
                <h6 className="mb-2" style={{ color: "var(--accent-color)", fontWeight: "700" }}>لماذا تختار قمة الابتكار؟</h6>
                <h2 style={{ color: "var(--primary-color)", fontWeight: "800", fontSize: "2.5rem", marginBottom: "30px" }}>
                  شريكك الاستراتيجي للنمو
                </h2>
                <p className="text-secondary mb-4" style={{ fontSize: "1.1rem", lineHeight: "1.8" }}>
                  نحن لسنا مجرد شركة خدمات لوجستية، بل منظومة متكاملة تهدف إلى تسهيل أعمالك وربطك بالأسواق العالمية بكفاءة عالية.
                </p>

                <div className="d-flex mb-4 p-3 rounded-3" style={{ backgroundColor: "#fff", boxShadow: "var(--shadow-sm)", borderRight: "4px solid var(--accent-color)" }}>
                  <div className="me-3 ms-3">
                    <i className="bi bi-rocket-takeoff" style={{ fontSize: "2.5rem", color: "var(--accent-color)" }}></i>
                  </div>
                  <div>
                    <h5 style={{ color: "var(--primary-color)", fontWeight: "700" }}>السرعة الدقيقة</h5>
                    <p className="mb-0 text-secondary" style={{ fontSize: "0.95rem" }}>ندرك أن الوقت هو المال، لذا نضمن وصول شحناتك في أسرع وقت ممكن وبدقة متناهية.</p>
                  </div>
                </div>

                <div className="d-flex p-3 rounded-3" style={{ backgroundColor: "#fff", boxShadow: "var(--shadow-sm)", borderRight: "4px solid var(--primary-color)" }}>
                  <div className="me-3 ms-3">
                    <i className="bi bi-shield-check" style={{ fontSize: "2.5rem", color: "var(--primary-color)" }}></i>
                  </div>
                  <div>
                    <h5 style={{ color: "var(--primary-color)", fontWeight: "700" }}>الثقة والأمان</h5>
                    <p className="mb-0 text-secondary" style={{ fontSize: "0.95rem" }}>نلتزم بأعلى معايير الشفافية والأمان في نقل بضائعك، مع توفير تحديثات دورية لكل مرحلة.</p>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 position-relative px-lg-5">
                <div className="position-relative rounded-4 overflow-hidden shadow-lg">
                  <img src={img_logistics} className="img-fluid w-100" alt="Logistics" style={{ minHeight: "500px", objectFit: "cover" }} />
                  <div className="position-absolute bottom-0 start-0 w-100 p-4" style={{ background: "linear-gradient(to top, rgba(11,44,92,0.95), transparent)" }}>
                    <h4 className="text-white fw-bold mb-1">{language === 'ar' ? 'قمة الابتكار' : 'Qimmah Al Ebtekar'}</h4>
                    <p className="text-white-50 mb-0">{language === 'ar' ? 'لحلول الإمداد والتجارة المتكاملة' : 'Integrated Supply & Trade Solutions'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Trading Reach */}
        <section className="py-5" style={{ backgroundColor: "#fff" }}>
          <div className="container" data-aos="fade-up">
            <div className="row g-4">
              {/* Import Network */}
              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="100">
                <div className="enterprise-card h-100 p-0 overflow-hidden d-flex flex-column border-0" style={{boxShadow: "0 10px 30px rgba(0,0,0,0.08)"}}>
                  <img src={img_import} alt="Import Network" style={{ height: "250px", objectFit: "cover" }} />
                  <div className="p-4 p-md-5 flex-grow-1">
                    <i className="bi bi-globe-americas mb-3 d-block" style={{ fontSize: "3rem", color: "var(--primary-color)" }}></i>
                    <h3 style={{ color: "var(--primary-color)", fontWeight: "700" }}>{language === 'ar' ? 'شبكة استيراد عالمية' : 'Global Import Network'}</h3>
                    <p className="mt-3 text-secondary" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
                      {language === 'ar' ? 'نغطي حالياً أهم أسواق المنسوجات والمنتجات العالمية لضمان تنوع وجودة تلبي احتياجاتك:' : 'We currently cover the most important textile and product markets globally to ensure variety and quality that meets your needs:'}
                    </p>
                    <ul className="list-unstyled mt-3">
                      <li className="mb-2"><i className="bi bi-check2-circle text-success ms-2 fs-5"></i> <strong>{language === 'ar' ? 'الصين:' : 'China:'}</strong> {language === 'ar' ? 'للتنوع الواسع.' : 'For wide variety.'}</li>
                      <li className="mb-2"><i className="bi bi-check2-circle text-success ms-2 fs-5"></i> <strong>{language === 'ar' ? 'تركيا:' : 'Turkey:'}</strong> {language === 'ar' ? 'للموضة والأزياء الحديثة.' : 'For modern fashion.'}</li>
                      <li className="mb-2"><i className="bi bi-check2-circle text-success ms-2 fs-5"></i> <strong>{language === 'ar' ? 'الهند:' : 'India:'}</strong> {language === 'ar' ? 'لأجود أنواع الأقمشة.' : 'For finest fabrics.'}</li>
                      <li className="mb-2"><i className="bi bi-check2-circle text-success ms-2 fs-5"></i> <strong>{language === 'ar' ? 'مصر:' : 'Egypt:'}</strong> {language === 'ar' ? 'للمنتجات القطنية الفاخرة.' : 'For premium cotton products.'}</li>
                    </ul>
                    <div className="alert alert-warning mt-4 mb-0 fw-bold border-0" style={{backgroundColor: "rgba(244, 169, 0, 0.15)", color: "#b37b00"}}>
                      <i className="bi bi-rocket me-2 ms-2"></i> {language === 'ar' ? 'وقريباً في أوروبا والأمريكيتين...' : 'Expanding to Europe and the Americas soon...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Network */}
              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="200">
                <div className="enterprise-card h-100 p-0 overflow-hidden d-flex flex-column border-0" style={{boxShadow: "0 10px 30px rgba(0,0,0,0.08)"}}>
                  <img src={img_export} alt="Sudanese Exports" style={{ height: "250px", objectFit: "cover" }} />
                  <div className="p-4 p-md-5 flex-grow-1">
                    <i className="bi bi-box-seam mb-3 d-block" style={{ fontSize: "3rem", color: "var(--accent-color)" }}></i>
                    <h3 style={{ color: "var(--primary-color)", fontWeight: "700" }}>{language === 'ar' ? 'الصادرات السودانية' : 'Sudanese Exports'}</h3>
                    <p className="mt-3 text-secondary" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
                      {language === 'ar' ? 'نفخر بتصدير أجود المنتجات السودانية الخالصة إلى الأسواق العالمية، ونعمل كجسر موثوق لربط خيرات أرضنا بالعالم.' : 'We proudly export the finest Sudanese products to global markets, serving as a trusted bridge connecting our homeland\'s bounty with the world.'}
                    </p>
                    <div className="mt-4">
                      <span className="badge bg-light text-dark fs-6 py-2 px-3 m-1 border border-secondary"><i className="bi bi-droplet-fill text-warning me-2 ms-2"></i> {language === 'ar' ? 'الصمغ العربي' : 'Gum Arabic'}</span>
                      <span className="badge bg-light text-dark fs-6 py-2 px-3 m-1 border border-secondary"><i className="bi bi-flower1 text-warning me-2 ms-2"></i> {language === 'ar' ? 'السمسم السوداني' : 'Sudanese Sesame'}</span>
                      <span className="badge bg-light text-dark fs-6 py-2 px-3 m-1 border border-secondary"><i className="bi bi-cup-hot-fill text-warning me-2 ms-2"></i> {language === 'ar' ? 'الكركديه' : 'Hibiscus'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision, Mission, Values (Dark Theme) */}
        <section className="py-5 position-relative" style={{ backgroundColor: "var(--primary-color)" }}>
          <div className="container" data-aos="fade-up">
            <div className="row g-4 justify-content-center">
              <div className="col-lg-4 col-md-6" data-aos="zoom-in" data-aos-delay="100">
                <div className="enterprise-card h-100 p-5 text-center" style={{ transform: "translateY(-15px)", borderBottom: "5px solid var(--accent-color)" }}>
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" style={{ width: "80px", height: "80px", backgroundColor: "rgba(244, 169, 0, 0.1)" }}>
                    <i className="bi bi-eye text-warning" style={{ fontSize: "2.5rem" }}></i>
                  </div>
                  <h4 style={{ color: "var(--primary-color)", fontWeight: "800", marginBottom: "15px" }}>{language === 'ar' ? 'رؤيتنا' : 'Our Vision'}</h4>
                  <p className="text-secondary mb-0" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
                    {language === 'ar' ? 'أن نكون الخيار الأول والشريك الاستراتيجي الأكثر موثوقية في مجال الخدمات اللوجستية في المنطقة.' : 'To be the first choice and the most reliable strategic partner in the logistics sector in the region.'}
                  </p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6" data-aos="zoom-in" data-aos-delay="200">
                <div className="enterprise-card h-100 p-5 text-center shadow-lg" style={{ border: "2px solid var(--accent-color)", transform: "translateY(-30px)" }}>
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" style={{ width: "80px", height: "80px", backgroundColor: "rgba(244, 169, 0, 0.1)" }}>
                    <i className="bi bi-bullseye text-warning" style={{ fontSize: "2.5rem" }}></i>
                  </div>
                  <h4 style={{ color: "var(--primary-color)", fontWeight: "800", marginBottom: "15px" }}>{language === 'ar' ? 'رسالتنا' : 'Our Mission'}</h4>
                  <p className="text-secondary mb-0" style={{ fontSize: "1.05rem", lineHeight: "1.8" }}>
                    {language === 'ar' ? 'تسهيل التجارة العالمية وربط الأسواق من خلال خدمات شحن وتخليص جمركي تتسم بالكفاءة والسرعة.' : 'Facilitating global trade and connecting markets through efficient and fast shipping and customs clearance services.'}
                  </p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6" data-aos="zoom-in" data-aos-delay="300">
                <div className="enterprise-card h-100 p-5 text-center" style={{ transform: "translateY(-15px)", borderBottom: "5px solid var(--accent-color)" }}>
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" style={{ width: "80px", height: "80px", backgroundColor: "rgba(244, 169, 0, 0.1)" }}>
                    <i className="bi bi-gem text-warning" style={{ fontSize: "2.5rem" }}></i>
                  </div>
                  <h4 style={{ color: "var(--primary-color)", fontWeight: "800", marginBottom: "15px" }}>{language === 'ar' ? 'قيمنا' : 'Our Values'}</h4>
                  <p className="text-secondary fw-bold mb-0" style={{ fontSize: "1.1rem", lineHeight: "2.2" }}>
                    {language === 'ar' ?
                      <>النزاهة <br/> الالتزام بالمواعيد <br/> الابتكار في الحلول <br/> التركيز الدائم على رضا العميل</> :
                      <>Integrity <br/> Punctuality <br/> Innovative Solutions <br/> Constant Focus on Customer Satisfaction</>
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer/>
    </>
  )
}
export default About;
