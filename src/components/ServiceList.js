import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const ServiceList = () => {
  const { t } = useLanguage();
  return (
    <>
      <section id="services-list" className="services-list">
        <div className="container" data-aos="fade-up">
          <div className="section-header">
            <h2>{t('services_title_main')}</h2>
            <p>
              {t('services_subtitle_main')}
            </p>
          </div>
          <div className="row gy-5">
            <div
              className="col-lg-6 col-md-6 service-item d-flex"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="single-service">
                <div className="icon flex-shrink-0">
                  <i className="bi bi-water" style={{ color: "#003B6D" }}></i>
                </div>
                <div>
                  <h4 className="title">
                    <Link to="/services" className="stretched-link">
                      {t('service_sea_title')}
                    </Link>
                  </h4>
                  <p className="description">
                    {t('service_sea_desc')}
                  </p>
                  <Link to="/services" className="btn-get-started">
                    {t('service_read_more')}
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="col-lg-6 col-md-6 service-item d-flex"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="single-service">
                <div className="icon flex-shrink-0">
                  <i
                    className="bi bi-airplane-fill"
                    style={{ color: "var(--secondary-color)" }}
                  ></i>
                </div>
                <div>
                  <h4 className="title">
                    <Link to="/services" className="stretched-link">
                      {t('service_air_title')}
                    </Link>
                  </h4>
                  <p className="description">
                    {t('service_air_desc')}
                  </p>
                  <Link to="/services" className="btn-get-started">
                    {t('service_read_more')}
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="col-lg-6 col-md-6 service-item d-flex"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="single-service">
                <div className="icon flex-shrink-0">
                  <i
                    className="bi bi-file-earmark-check-fill"
                    style={{ color: "var(--primary-color)" }}
                  ></i>
                </div>
                <div>
                  <h4 className="title">
                    <Link to="/services" className="stretched-link">
                      {t('service_customs_title')}
                    </Link>
                  </h4>
                  <p className="description">
                    {t('service_customs_desc')}
                  </p>
                  <Link to="/services" className="btn-get-started">
                    {t('service_read_more')}
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="col-lg-6 col-md-6 service-item d-flex"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="single-service">
                <div className="icon flex-shrink-0">
                  <i
                    className="bi bi-truck-front-fill"
                    style={{ color: "var(--accent-color)" }}
                  ></i>
                </div>
                <div>
                  <h4 className="title">
                    <Link to="/services" className="stretched-link">
                      {t('service_land_title')}
                    </Link>
                  </h4>
                  <p className="description">
                    {t('service_land_desc')}
                  </p>
                  <Link to="/services" className="btn-get-started">
                    {t('service_read_more')}
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="col-lg-6 col-md-6 service-item d-flex"
              data-aos="fade-up"
              data-aos-delay="600"
            >
              <div className="single-service">
                <div className="icon flex-shrink-0">
                  <i
                    className="bi bi-globe-americas"
                    style={{ color: "var(--secondary-color)" }}
                  ></i>
                </div>
                <div>
                  <h4 className="title">
                    <Link to="/services" className="stretched-link">
                      {t('service_import_title')}
                    </Link>
                  </h4>
                  <p className="description">
                    {t('service_import_desc')}
                  </p>
                  <Link to="/services" className="btn-get-started">
                    {t('service_read_more')}
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="col-lg-6 col-md-6 service-item d-flex"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              <div className="single-service">
                <div className="icon flex-shrink-0">
                  <i
                    className="bi bi-box-seam-fill"
                    style={{ color: "#13d527" }}
                  ></i>
                </div>
                <div>
                  <h4 className="title">
                    <Link to="/services" className="stretched-link">
                      {t('service_warehouse_title')}
                    </Link>
                  </h4>
                  <p className="description">
                    {t('service_warehouse_desc')}
                  </p>
                  <Link to="/services" className="btn-get-started">
                    {t('service_read_more')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServiceList;
