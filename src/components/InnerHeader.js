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
    <header id="header" className="header fixed-top">
      <div className="container-fluid container-xl d-flex align-items-center justify-content-between">
        <Link to="/" className="logo d-flex align-items-center" onClick={toTop}>
          <img src={logo} alt="Qimmah Al Ebtekar" style={{ maxHeight: "60px" }} />
        </Link>

        <span onClick={mobilemenu} className="mobile-nav-toggle-wrapper d-xl-none">
          <i className="mobile-nav-toggle mobile-nav-show bi bi-list fs-1" style={{color: "var(--primary-color)"}}></i>
          <i className="mobile-nav-toggle mobile-nav-hide d-none bi bi-x fs-1" style={{color: "var(--primary-color)"}}></i>
        </span>

        <nav id="navbar" className="navbar">
          <ul onClick={mobilemenu} className="align-items-center">
            <li><Link to="/" className={splitLocation[1] === "" ? "active" : ""}>{t('nav_home')}</Link></li>
            <li><Link to="/about" className={splitLocation[1] === "about" ? "active" : ""}>{t('nav_about')}</Link></li>
            <li><Link to="/services" className={splitLocation[1] === "services" ? "active" : ""}>{t('nav_services')}</Link></li>
            <li><Link to="/blog" className={splitLocation[1] === "blog" ? "active" : ""}>{t('nav_blog')}</Link></li>
            <li><Link to="/contact" className={splitLocation[1] === "contact" ? "active" : ""}>{t('nav_contact')}</Link></li>

            {/* Enterprise Tracking Button CTA */}
            <li className="ms-lg-4 mt-3 mt-lg-0 mb-3 mb-lg-0">
              <Link to="/track" className="btn text-white px-4 py-2" style={{backgroundColor: "var(--accent-color)", borderRadius: "50px", fontWeight: "bold"}}>
                <i className="bi bi-box-seam me-2"></i> {t('nav_track_placeholder') || 'تتبع الشحنة'}
              </Link>
            </li>

            {/* Language Switcher */}
            <li className="ms-lg-3">
              <button onClick={toggleLanguage} className="btn btn-outline-primary rounded-pill px-3 py-1" style={{ direction: 'ltr', fontWeight: 'bold' }}>
                <i className="bi bi-globe me-1"></i> {language === 'ar' ? 'English' : 'العربية'}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default InnerHeader;
