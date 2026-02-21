import React, { useEffect } from "react";
import logo from "../img/qimmah-logo.png";
import { Link, useLocation } from "react-router-dom";
import { animateScroll as scroll } from "react-scroll";
import { useLanguage } from "../context/LanguageContext";

const InnerHeader = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const { pathname } = location;
  const splitLocation = pathname.split("/");

  const toTop = () => {
    scroll.scrollToTop({ delay: 0, duration: 0 });
  };

  useEffect(() => {
    const selectHeader = document.querySelector("#header");
    if (selectHeader) {
      document.addEventListener("scroll", () => {
        window.scrollY > 40
          ? selectHeader.classList.add("sticked")
          : selectHeader.classList.remove("sticked");
      });
    }
  }, []);

  const mobilemenu = (event) => {
    if(!event.target.matches('a') && !event.target.closest('a') && !event.target.matches('button')) {
      event.preventDefault();
    }
    const mobileNavShow = document.querySelector(".mobile-nav-show");
    const mobileNavHide = document.querySelector(".mobile-nav-hide");
    if(mobileNavShow && mobileNavHide){
      mobileNavShow.classList.toggle("d-none");
      mobileNavHide.classList.toggle("d-none");
      document.querySelector("body").classList.toggle("mobile-nav-active");
    }
  };

  return (
    <>
      {/* --- TOP BAR (Enterprise Feature) --- */}
      <div className="top-bar d-none d-md-block" style={{ backgroundColor: "var(--primary-color)", color: "#fff", padding: "8px 0", fontSize: "0.85rem" }}>
        <div className="container-fluid container-xl d-flex justify-content-between align-items-center">
          <div className="contact-info d-flex gap-4">
            <span><i className="bi bi-envelope me-1 text-warning"></i> info@qimatco.com</span>
            <span><i className="bi bi-telephone me-1 text-warning"></i> +966 XX XXX XXXX</span>
          </div>
          <div className="top-links d-flex align-items-center gap-3">
            <button onClick={toggleLanguage} className="btn btn-link text-white text-decoration-none p-0" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
              <i className="bi bi-globe me-1"></i> {language === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN HEADER --- */}
      <header id="header" className="header d-flex align-items-center" style={{ transition: "all var(--transition-normal)", backgroundColor: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}>
        <div className="container-fluid container-xl d-flex align-items-center justify-content-between">
          <Link to="/" className="logo d-flex align-items-center" onClick={toTop}>
            <img src={logo} alt="QIMMAH AL EBTEKAR" style={{ maxHeight: "60px" }} />
          </Link>

          <span onClick={mobilemenu} className="mobile-nav-toggle-wrapper d-xl-none">
            <i className="mobile-nav-toggle mobile-nav-show bi bi-list fs-1"></i>
            <i className="mobile-nav-toggle mobile-nav-hide d-none bi bi-x fs-1"></i>
          </span>

          <nav id="navbar" className="navbar enterprise-navbar">
            <ul onClick={mobilemenu}>
              <li><Link to="/" className={splitLocation[1] === "" ? "active" : ""}>{t('nav_home')}</Link></li>
              <li><Link to="/about" className={splitLocation[1] === "about" ? "active" : ""}>{t('nav_about')}</Link></li>
              <li className="dropdown">
                <Link to="/services" className={splitLocation[1] === "services" ? "active" : ""}>
                  <span>{t('nav_services')}</span> <i className="bi bi-chevron-down dropdown-indicator"></i>
                </Link>
                <ul>
                  <li><Link to="/services">الخدمات اللوجستية</Link></li>
                  <li><a href="/#trading">التجارة الدولية</a></li>
                </ul>
              </li>
              <li><Link to="/blog" className={splitLocation[1] === "blog" ? "active" : ""}>{t('nav_blog')}</Link></li>
              <li><Link to="/contact" className={splitLocation[1] === "contact" ? "active" : ""}>{t('nav_contact')}</Link></li>

              {/* Enterprise CTA Button */}
              <li className="ms-lg-4 mt-3 mt-lg-0">
                <Link to="/track" className={`enterprise-cta-btn ${splitLocation[1] === "track" ? "active" : ""}`}>
                  {t('nav_track_placeholder') || 'تتبع الشحنة'} <i className="bi bi-box-seam"></i>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
};

export default InnerHeader;
