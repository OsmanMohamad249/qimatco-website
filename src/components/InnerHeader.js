import React from "react";
import logo from "../img/qimmah-logo.png";
//import Navbar from "./Navbar";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLocation } from 'react-router-dom'
import { animateScroll as scroll } from "react-scroll";
import { useLanguage } from "../context/LanguageContext";

const InnerHeader = () => {
  const { t, language, toggleLanguage } = useLanguage();

  const toTop = () => {
    scroll.scrollToTop({ delay: 0, duration: 0 });
  };


  //assigning location variable
  const location = useLocation();
  
   //destructuring path name from location
   const {pathname} = location;

  //Javascript split method to get the name of the path in array
  const splitLocation = pathname.split("/");


  //sticky header
  useEffect(() => {
    const selectHeader = document.querySelector("#header");
    if (selectHeader) {
      document.addEventListener("scroll", () => {
        window.scrollY > 80
          ? selectHeader.classList.add("sticked")
          : selectHeader.classList.remove("sticked");
      });
    }
  }, []);

  // mobile view menu
  const mobilemenu = (event) => {
    event.preventDefault();
    const mobileNavShow = document.querySelector(".mobile-nav-show");
    const mobileNavHide = document.querySelector(".mobile-nav-hide");
    mobileNavShow.classList.toggle("d-none");
    mobileNavHide.classList.toggle("d-none");
    document.querySelector("body").classList.toggle("mobile-nav-active");
  };

  
  return (
    <>
      <header id="header" className="header fixed-top">
        <div className="container-fluid container-xl d-flex align-items-center justify-content-between">
          <Link to="/" className="logo" onClick={toTop}>
            <img
              src={logo}
              alt="QIMMAH AL EBTEKAR FOR INTEGRATED SOLUTIONS - قمة الإبتكار للحلول المتكاملة"
              title="QIMMAH AL EBTEKAR FOR INTEGRATED SOLUTIONS - قمة الإبتكار للحلول المتكاملة"
            />
          </Link>
          <span  onClick={mobilemenu}>  
          <i className="mobile-nav-toggle mobile-nav-show bi bi-list"     
          ></i>
          <i className="mobile-nav-toggle mobile-nav-hide d-none bi bi-x"></i>
          </span>
          <nav id="navbar" className="navbar">
          <ul onClick={mobilemenu}>
            <li >
              <Link to ="/"  className={splitLocation[1] === "" ? "active" : ""}> {t('nav_home')}</Link>
            </li>
            <li>
            <Link to ="/about"  className={splitLocation[1] === "about" ? "active" : ""}> {t('nav_about')}</Link>
            </li>
            <li>
            <Link to ="/services"  className={splitLocation[1] === "services" ? "active" : ""}> {t('nav_services')}</Link>
            </li>
            <li>
            <Link to ="/contact"  className={splitLocation[1] === "contact" ? "active" : ""}> {t('nav_contact')}</Link>
            </li>
            <li>
              <button
                className="btn btn-sm btn-outline-primary ms-3"
                onClick={toggleLanguage}
                style={{ direction: 'ltr' }}
              >
                {language === 'ar' ? 'English' : 'العربية'}
              </button>
            </li>
          </ul>
        </nav>
        </div>
      </header>
    </>
  );
};

export default InnerHeader;
