import React, { useEffect, useState } from "react";
import footerLogo from '../img/qimmah-logo.png';
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useLanguage } from "../context/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    const fetchSocial = async () => {
      try {
        const snap = await getDocs(collection(db, "socialLinks"));
        setSocialLinks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* use empty */ }
    };
    fetchSocial();
  }, []);

  return (
    <>
      <footer id="footer" className="footer">
        <div className="footer-content">
          <div className="container">
            <div className="row gy-4">
              <div className="col-lg-4 col-md-12 footer-info">
                <Link to="/" className="logo d-flex align-items-center">
                  <img src={footerLogo} alt={t('footer_company_name')} title={t('footer_company_name')} />
                </Link>
                <h3>{t('footer_company_name')}</h3>
                <p>{t('footer_desc')}</p>
                <div className="social-links d-flex mt-3">
                  {socialLinks.length > 0 ? (
                    socialLinks.map((s) => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: s.color || "#fff" }} title={s.name}>
                        {s.logoUrl ? (
                          <img src={s.logoUrl} alt={s.name} style={{ width: 20, height: 20, objectFit: "contain" }} />
                        ) : (
                          <i className={`bi ${s.icon || "bi-globe"}`}></i>
                        )}
                      </a>
                    ))
                  ) : (
                    <>
                      <Link to="/" className="twitter"><i className="bi bi-twitter"></i></Link>
                      <Link to="/" className="facebook"><i className="bi bi-facebook"></i></Link>
                      <Link to="https://www.linkedin.com/" className="linkedin"><i className="bi bi-linkedin"></i></Link>
                    </>
                  )}
                </div>
              </div>
              <div className="col-lg-2 col-6 footer-links">
                <h4>{t('footer_useful_links')}</h4>
                <ul>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/">{t('footer_home')}</Link>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/about">{t('footer_about')}</Link>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/services">{t('footer_services_link')}</Link>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/contact">{t('footer_contact_link')}</Link>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/admin">{t('footer_admin')}</Link>
                  </li>
                </ul>
              </div>
              <div className="col-lg-3 col-6 footer-links">
                <h4>{t('footer_services')}</h4>
                <ul>
                  <li>
                    <i className="bi bi-dash"></i>
                    <HashLink smooth to="/services/#sea-freight">
                      {t('footer_sea_freight')}
                    </HashLink>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <HashLink smooth to="/services/#air-freight">
                      {t('footer_air_freight')}
                    </HashLink>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <HashLink smooth to="/services/#customs-clearance">
                      {t('footer_customs')}
                    </HashLink>
                  </li>
                </ul>
              </div>
              <div className="col-lg-3 col-md-12 footer-contact text-center text-md-start">
                <h4>{t('footer_contact')}</h4>
                <address>
                  {t('footer_address')} <br />
                  <br />
                  <strong>{t('footer_phone')}:</strong> +249 000 000 000 <br />
                  <strong>{t('footer_email')}: </strong>
                  <a href="mailto:info@qimmah.com">info@qimmah.com</a>
                  <br />
                </address>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-legal">
          <div className="container">
            <div className="copyright">
              &copy; {new Date().getFullYear()} {t('footer_copyright')}
              <span> {t('footer_copyright_company')}</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;

