import React from 'react'
import { Helmet } from "react-helmet";
import AOS from "aos";
import '../../node_modules/aos/dist/aos.css'
import InnerHeaderBanner from '../components/InnerHeaderBanner';
import InnerHeader from '../components/InnerHeader';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import abtHeader from '../img/about-header.jpg'
import { useEffect } from 'react';
import { useLanguage } from "../context/LanguageContext";

const about_img = "https://loremflickr.com/800/600/logistics,team/all";

const About = () => {
   const { t } = useLanguage();
   useEffect(() => {
      AOS.init();
      AOS.refresh();
    }, []);
  
  return (
    <>
      <Helmet>
        <title>About Us | Qimmah Al Ebtekar</title>
        <meta name="description" content="Learn about Qimmah Al Ebtekar - Your trusted partner in logistics, shipping, and international trade." />
      </Helmet>
      <InnerHeader />
      <InnerHeaderBanner name={t('nav_about')} img = {abtHeader}/>

     <main id="main">   
      <section id="about" className="about">
         <div className="container" data-aos="fade-up">
            <div className="section-header">
               <h2>{t('about_title')}</h2>
            </div>
            <div className="row gy-4 align-items-center" data-aos="fade-up">
               <div className="col-lg-6">
                  <img src={about_img} className="img-fluid" alt="About Qimmah" />
               </div>
               <div className="col-lg-6">
                  <p> {t('about_speed')}</p>
                  <p> {t('about_trust')}</p>
                  <p> {t('about_network')}</p>
                  <p> {t('about_integrated')}</p>
               </div>
            </div>
         </div>
      </section>
    
      <div id="vision" className="vision aos-init" data-aos="fade-up" data-aos-delay="300">
         <div className="container">
            <div className="row gy-4">
               <div className="col-lg-4 aos-init">
                  <div className="card-item">
                     <div className="row">
                        <div className="col-xl-12">
                           <div className="card-body">
                              <h4 className="card-title"> {t('about_vision_title')}</h4>
                              <p>{t('about_vision_desc')}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
              
               <div className="col-lg-4 aos-init">
                  <div className="card-item">
                     <div className="row">
                        <div className="col-xl-12">
                           <div className="card-body">
                              <h4 className="card-title"> {t('about_mission_title')}</h4>
                              <p>{t('about_mission_desc')}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
              
               <div className="col-lg-4 aos-init" data-aos="fade-up" data-aos-delay="300">
                  <div className="card-item">
                     <div className="row">
                        <div className="col-xl-12">
                           <div className="card-body">
                              <h4 className="card-title">{t('about_values_title')}</h4>
                              <p> {t('about_values_desc')}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
              
            </div>
         </div>
      </div>
  
   </main>
   <Footer/>
    
    </>
  )
}

export default About