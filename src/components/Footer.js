import React, { useEffect, useState } from "react";
import footerLogo from '../img/qimmah-logo.png';
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const Footer = () => {
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
                  <img src={footerLogo} alt="QIMMAH AL EBTEKAR FOR INTEGRATED SOLUTIONS - قمة الإبتكار للحلول المتكاملة" title="QIMMAH AL EBTEKAR FOR INTEGRATED SOLUTIONS - قمة الإبتكار للحلول المتكاملة" />
                </Link>
                <h3>شركة قمة الابتكار للحلول المتكاملة</h3>
                <p>
                  حلول متكاملة في الاستيراد والتصدير، التخليص الجمركي، والخدمات اللوجستية من الباب للباب.
                </p>
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
                <h4>روابط مفيدة</h4>
                <ul>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/">الرئيسية</Link>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/about">من نحن</Link>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/services">خدماتنا</Link>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/contact">تواصل معنا</Link>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <Link to="/admin">بوابة الإدارة</Link>
                  </li>
                </ul>
              </div>
              <div className="col-lg-3 col-6 footer-links">
                <h4>خدماتنا</h4>
                <ul>
                  <li>
                    <i className="bi bi-dash"></i>
                    <HashLink smooth to="/services/#sea-freight">
                      الشحن البحري
                    </HashLink>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <HashLink smooth to="/services/#air-freight">
                      الشحن الجوي
                    </HashLink>
                  </li>
                  <li>
                    <i className="bi bi-dash"></i>
                    <HashLink smooth to="/services/#customs-clearance">التخليص الجمركي</HashLink>
                  </li>
                </ul>
              </div>
              <div className="col-lg-3 col-md-12 footer-contact text-center text-md-start">
                <h4>تواصل معنا</h4>
                <address>
                  الخرطوم، السودان <br />
                  <br />
                  <strong>الهاتف:</strong> +249 000 000 000 <br />
                  <strong>البريد الإلكتروني: </strong>
                  <a href="mailto:info@qimmah.com">
                    info@qimmah.com
                  </a>
                  <br />
                </address>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-legal">
          <div className="container">
            <div className="copyright">
              <span id="copyright">
                <script>
                  document.getElementById('copyright').appendChild(document.createTextNode(new
                  Date().getFullYear()) )
                </script>
              </span>
              &copy;  جميع الحقوق محفوظة
              <span> قمة الإبتكار للحلول المتكاملة - QIMMAH AL EBTEKAR FOR INTEGRATED SOLUTIONS </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;

