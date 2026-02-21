import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../img/qimmah-logo.png";
import { useLanguage } from "../context/LanguageContext";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../firebase";

const Footer = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState([]);

  // Helper to extract localized text
  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val["ar"] || val["en"] || "";
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snap = await getDocs(query(collection(db, "services"), limit(4)));
        setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error(error);
      }
    };
    fetchServices();
  }, []);

  return (
    <footer id="footer" className="enterprise-footer">
      <div className="footer-top">
        <div className="container">
          <div className="row gy-4">
            {/* Column 1: Company Info */}
            <div className="col-lg-4 col-md-6 footer-info">
              <Link
                to="/"
                className="logo d-flex align-items-center mb-3 text-decoration-none"
              >
                <img
                  src={logo}
                  alt="Qimmah Al Ebtekar"
                  style={{
                    maxHeight: "60px",
                    backgroundColor: "#fff",
                    padding: "5px",
                    borderRadius: "8px",
                  }}
                />
              </Link>
              <p
                className="mt-3 text-light-50"
                style={{
                  fontSize: "0.95rem",
                  lineHeight: "1.8",
                  paddingRight: language === "ar" ? "0" : "20px",
                  paddingLeft: language === "ar" ? "20px" : "0",
                }}
              >
                {language === "ar"
                  ? "قمة الابتكار للحلول المتكاملة، شريكك اللوجستي الموثوق. نقدم خدمات شحن، تخليص جمركي، وتجارة دولية بمعايير عالمية لربط أعمالك بالأسواق العالمية."
                  : "Qimmah Al Ebtekar for Integrated Solutions, your trusted logistics partner. We offer world-class shipping, customs clearance, and global trade services."}
              </p>
              <div className="social-links mt-4 d-flex gap-2">
                <a href="#" className="social-icon">
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a href="#" className="social-icon">
                  <i className="bi bi-facebook"></i>
                </a>
                <a href="#" className="social-icon">
                  <i className="bi bi-instagram"></i>
                </a>
                <a href="#" className="social-icon">
                  <i className="bi bi-linkedin"></i>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="col-lg-2 col-6 footer-links">
              <h4 className="footer-heading">
                {language === "ar" ? "روابط سريعة" : "Quick Links"}
              </h4>
              <ul className="list-unstyled">
                <li>
                  <i
                    className={`bi ${
                      language === "ar" ? "bi-chevron-left" : "bi-chevron-right"
                    }`}
                  ></i>{" "}
                  <Link to="/">{t("nav_home")}</Link>
                </li>
                <li>
                  <i
                    className={`bi ${
                      language === "ar" ? "bi-chevron-left" : "bi-chevron-right"
                    }`}
                  ></i>{" "}
                  <Link to="/about">{t("nav_about")}</Link>
                </li>
                <li>
                  <i
                    className={`bi ${
                      language === "ar" ? "bi-chevron-left" : "bi-chevron-right"
                    }`}
                  ></i>{" "}
                  <Link to="/services">{t("nav_services")}</Link>
                </li>
                <li>
                  <i
                    className={`bi ${
                      language === "ar" ? "bi-chevron-left" : "bi-chevron-right"
                    }`}
                  ></i>{" "}
                  <Link to="/#trading">
                    {language === "ar" ? "التجارة الدولية" : "Trading"}
                  </Link>
                </li>
                <li>
                  <i
                    className={`bi ${
                      language === "ar" ? "bi-chevron-left" : "bi-chevron-right"
                    }`}
                  ></i>{" "}
                  <Link to="/contact">{t("nav_contact")}</Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Dynamic Services */}
            <div className="col-lg-3 col-6 footer-links">
              <h4 className="footer-heading">
                {language === "ar" ? "أبرز خدماتنا" : "Our Services"}
              </h4>
              <ul className="list-unstyled">
                {services.length > 0 ? (
                  services.map((s) => (
                    <li key={s.id}>
                      <i
                        className={`bi ${
                          language === "ar" ? "bi-chevron-left" : "bi-chevron-right"
                        }`}
                      ></i>{" "}
                      <Link to={`/services/${s.id}`}>{loc(s.title)}</Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <i
                        className={`bi ${
                          language === "ar" ? "bi-chevron-left" : "bi-chevron-right"
                        }`}
                      ></i>{" "}
                      <Link to="/services">
                        {language === "ar" ? "الشحن البحري" : "Sea Freight"}
                      </Link>
                    </li>
                    <li>
                      <i
                        className={`bi ${
                          language === "ar" ? "bi-chevron-left" : "bi-chevron-right"
                        }`}
                      ></i>{" "}
                      <Link to="/services">
                        {language === "ar" ? "الشحن الجوي" : "Air Freight"}
                      </Link>
                    </li>
                    <li>
                      <i
                        className={`bi ${
                          language === "ar" ? "bi-chevron-left" : "bi-chevron-right"
                        }`}
                      ></i>{" "}
                      <Link to="/services">
                        {language === "ar" ? "التخليص الجمركي" : "Customs Clearance"}
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Column 4: Contact & Newsletter */}
            <div className="col-lg-3 col-md-12 footer-contact text-md-start">
              <h4 className="footer-heading">{t("nav_contact")}</h4>
              <p
                className="text-light-50 mb-4"
                style={{ fontSize: "0.95rem" }}
              >
                <i className="bi bi-geo-alt me-2 text-warning"></i>{" "}
                {language === "ar"
                  ? "المملكة العربية السعودية، الرياض"
                  : "Riyadh, Saudi Arabia"}
                <br />
                <br />
                <i className="bi bi-telephone me-2 text-warning"></i> +966 XX XXX
                XXXX
                <br />
                <br />
                <i className="bi bi-envelope me-2 text-warning"></i>{" "}
                info@qimatco.com
                <br />
              </p>

              <div className="footer-newsletter mt-4">
                <h6 className="text-white mb-2">
                  {language === "ar"
                    ? "اشترك في النشرة البريدية"
                    : "Subscribe to Newsletter"}
                </h6>
                <form
                  action=""
                  method="post"
                  className="d-flex"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    type="email"
                    name="email"
                    className="form-control border-0 rounded-start"
                    placeholder={
                      language === "ar" ? "البريد الإلكتروني" : "Email Address"
                    }
                    style={{
                      borderRadius:
                        language === "ar"
                          ? "0 5px 5px 0"
                          : "5px 0 0 5px",
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-warning border-0"
                    style={{
                      borderRadius:
                        language === "ar"
                          ? "5px 0 0 5px"
                          : "0 5px 5px 0",
                    }}
                  >
                    {language === "ar" ? "اشتراك" : "Subscribe"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <div className="copyright">
                &copy; {new Date().getFullYear()}{" "}
                <strong>
                  <span>
                    {language === "ar"
                      ? "قمة الابتكار للحلول المتكاملة"
                      : "Qimmah Al Ebtekar"}
                  </span>
                </strong>
                .{" "}
                {language === "ar" ? "جميع الحقوق محفوظة" : "All Rights Reserved"}.
              </div>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <div className="credits">
                <Link
                  to="/admin"
                  className="text-decoration-none text-light-50 hover-white"
                >
                  <i className="bi bi-shield-lock me-1"></i>{" "}
                  {language === "ar" ? "بوابة الإدارة" : "Admin Portal"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

