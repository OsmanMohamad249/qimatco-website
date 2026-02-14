import React from "react";
import { Helmet } from "react-helmet";
import InnerHeaderBanner from "../components/InnerHeaderBanner";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";
import serviceHeader from '../img/services-header.jpg'
import { useLanguage } from "../context/LanguageContext";
import CBMCalculator from "../components/CBMCalculator";

const education = "https://loremflickr.com/800/600/container,ship/all";
const entertainment = "https://loremflickr.com/800/600/warehouse/all";
const games = "https://loremflickr.com/800/600/cargo,plane/all";
const sports = "https://loremflickr.com/800/600/truck,logistics/all";

const Service = () => {
  const { t } = useLanguage();
  return (
    <>
      <Helmet>
        <title>Logistics Services | Qimmah Al Ebtekar</title>
        <meta name="description" content="Professional logistics services: Sea Freight, Air Freight, Land Transport, and Customs Clearance by Qimmah Al Ebtekar." />
      </Helmet>
      <InnerHeader />
      <InnerHeaderBanner name={t('nav_services')} img = {serviceHeader}/>

      <main id="main">
        <section id="services-list" className="services-list">
          <div className="container" data-aos="fade-up">
            <div className="section-header">
              <h2>
                {t('services_title_main')}
              </h2>
            </div>
            {/* Sea Freight */}
            <div className="row gy-5 pt-5 align-items-center" id="sea-freight">
              <div className="col-lg-5 col-md-6 service-item" data-aos="fade-up" data-aos-delay="100">
                <img src={education} className="img-fluid" alt="Sea Freight" title="Sea Freight" />
              </div>
              <div className="col-lg-7 col-md-6 service-item" data-aos="fade-up" data-aos-delay="100">
                <div className="icon flex-shrink-0">
                  <i className="bi bi-tsunami" style={{ color: "#003B6D" }}></i>
                </div>
                <div>
                  <h4 className="title"> {t('service_sea_title')} </h4>
                  <p className="description">
                    {t('service_sea_desc')}
                  </p>
                </div>
              </div>
            </div>

             {/* Air Freight */}
             <div className="row gy-5 pt-5 align-items-center" id="air-freight">
              <div className="col-lg-7 col-md-6 service-item" data-aos="fade-up" data-aos-delay="200">
                <div className="icon flex-shrink-0">
                  <i className="bi bi-airplane-fill" style={{ color: "#0096D6" }}></i>
                </div>
                <div>
                  <h4 className="title"> {t('service_air_title')} </h4>
                  <p className="description">
                     {t('service_air_desc')}
                  </p>
                </div>
              </div>
              <div className="col-lg-5 col-md-6 service-item" data-aos="fade-up" data-aos-delay="200">
                <img src={games} className="img-fluid" alt="Air Freight" />
              </div>
            </div>
          </div>
        </section>

        <section className="services-list light-bg" id="land-freight">
          <div className="container" data-aos="fade-up">
            <div className="row gy-5 align-items-center ">
              <div className="col-lg-5 col-md-6 service-item" data-aos="fade-up" data-aos-delay="300">
                <img src={sports} className="img-fluid" alt="Land Freight" />
              </div>
              <div className="col-lg-7 col-md-6 service-item" data-aos="fade-up" data-aos-delay="300">
                 <div className="icon flex-shrink-0">
                  <i className="bi bi-truck-front-fill" style={{ color: "var(--accent-color)" }}></i>
                </div>
                <div>
                  <h4 className="title"> {t('service_land_title')} </h4>
                  <p className="description">
                    {t('service_land_desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="services-list" id="customs-clearance">
          <div className="container" data-aos="fade-up">
            <div className="row gy-5 align-items-center ">
               <div className="col-lg-7 col-md-6 service-item " data-aos="fade-up" data-aos-delay="400">
                <div className="icon flex-shrink-0">
                  <i className="bi bi-file-earmark-check-fill" style={{ color: "var(--primary-color)" }}></i>
                </div>
                <div>
                  <h4 className="title"> {t('service_customs_title')} </h4>
                  <p className="description">
                     {t('service_customs_desc')}
                  </p>
                </div>
              </div>
              <div className="col-lg-5 col-md-6 service-item order-first order-sm-last" data-aos="fade-up" data-aos-delay="400">
                <img src={education} className="img-fluid" alt="Customs Clearance" />
              </div>
            </div>
          </div>
        </section>

         <section className="services-list light-bg" id="import-services">
          <div className="container" data-aos="fade-up">
            <div className="row gy-5 align-items-center ">
               <div className="col-lg-5 col-md-6 service-item" data-aos="fade-up" data-aos-delay="500">
                <img src={entertainment} className="img-fluid" alt="Import Services" />
              </div>
               <div className="col-lg-7 col-md-6 service-item " data-aos="fade-up" data-aos-delay="500">
                <div className="icon flex-shrink-0">
                  <i className="bi bi-globe-americas" style={{ color: "var(--secondary-color)" }}></i>
                </div>
                <div>
                  <h4 className="title"> {t('service_import_title')} </h4>
                  <p className="description">
                    {t('service_import_desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="services-list" id="warehousing">
          <div className="container" data-aos="fade-up">
            <div className="row gy-5 align-items-center ">
               <div className="col-lg-7 col-md-6 service-item " data-aos="fade-up" data-aos-delay="600">
                <div className="icon flex-shrink-0">
                  <i className="bi bi-box-seam-fill" style={{ color: "#13d527" }}></i>
                </div>
                <div>
                  <h4 className="title"> {t('service_warehouse_title')} </h4>
                  <p className="description">
                     {t('service_warehouse_desc')}
                  </p>
                </div>
              </div>
              <div className="col-lg-5 col-md-6 service-item order-first order-sm-last" data-aos="fade-up" data-aos-delay="600">
                <img src={entertainment} className="img-fluid" alt="Warehousing" />
              </div>
            </div>
          </div>
        </section>

        {/* CBM Calculator Section */}
        <section id="shipping-tools" className="shipping-tools light-bg">
          <div className="container" data-aos="fade-up">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <CBMCalculator />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
};

export default Service;
