import React, { useState } from "react";
import shapeImg from "../img/img-wave2.png";
import { Link } from "react-router-dom";
import '../../node_modules/react-modal-video/css/modal-video.css'
import ModalVideo from 'react-modal-video'
import { useLanguage } from "../context/LanguageContext";

const Carousel = () => {
  const { t } = useLanguage();
  const [isOpen, setOpen] = useState(false)
  const logisticsHero1 = "https://loremflickr.com/1280/720/container,ship/all";
  const logisticsHero2 = "https://loremflickr.com/1280/720/warehouse/all";
  const logisticsHero3 = "https://loremflickr.com/1280/720/airplane,cargo/all";
  const logisticsHero4 = "https://loremflickr.com/1280/720/truck,logistics/all";
  return (
    <>
      <section id="hero" className="hero d-flex">
        <img className="shape" src={shapeImg} alt="#" />
        <div className="container">
          <div
            className="row align-items-center"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="col-lg-7 col-md-12 col-12">
              <h2 data-aos="fade-up">
                {t('hero_title')}
              </h2>
              <blockquote data-aos="fade-up" data-aos-delay="100">
                <p>
                  {t('hero_subtitle')}
                </p>
              </blockquote>
              <div className="d-flex align-items-center">
                <Link to="/contact" className="btn-get-started">
                  {t('hero_cta_quote')}
                </Link>
                <Link to="/services" className="btn-watch-video d-flex align-items-center pointer" style={{marginLeft: '25px'}}>
                  <i className="bi bi-arrow-right-circle"></i>
                  <span>{t('hero_cta_services')}</span>
                </Link>
              </div>
            </div>
            <div className="col-lg-5 col-md-12 col-12">
              <div className="header-image ">
                <div
                  id="carouselExampleFade"
                  className="carousel slide carousel-fade"
                  data-bs-ride="carousel"
                >
                  <div className="carousel-indicators">
                    <button
                      type="button"
                      data-bs-target="#carouselExampleFade"
                      data-bs-slide-to="0"
                      className="active"
                      aria-current="true"
                      aria-label="Slide 1"
                    ></button>
                    <button
                      type="button"
                      data-bs-target="#carouselExampleFade"
                      data-bs-slide-to="1"
                      aria-label="Slide 2"
                    ></button>
                    <button
                      type="button"
                      data-bs-target="#carouselExampleFade"
                      data-bs-slide-to="2"
                      aria-label="Slide 3"
                    ></button>
                    <button
                      type="button"
                      data-bs-target="#carouselExampleFade"
                      data-bs-slide-to="3"
                      aria-label="Slide 3"
                    ></button>
                  </div>
                  <div className="carousel-inner">
                    <div
                      className="carousel-item active"
                     
                    >
                      <img src={logisticsHero1} className="d-block w-100" alt="Shipping" />
                    </div>
                    <div className="carousel-item">
                      <img src={logisticsHero2} className="d-block w-100" alt="Warehouse" />
                    </div>
                    <div className="carousel-item">
                      <img src={logisticsHero3} className="d-block w-100" alt="Air Cargo" />
                    </div>
                    <div className="carousel-item">
                      <img src={logisticsHero4} className="d-block w-100" alt="Trucking" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Carousel;
