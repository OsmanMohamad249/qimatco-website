import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";

// Swiper Styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Carousel = () => {
  const { t, language } = useLanguage();

  // High-quality Enterprise Imagery (Unsplash)
  const slides = [
    {
      id: 1,
      bg: "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?q=80&w=2070&auto=format&fit=crop",
      title: t('hero_title_1') || t('hero_title') || "Your Trusted Gateway to Global Trade",
      subtitle: t('hero_desc_1') || t('hero_subtitle') || "Connecting Sudan to the world through integrated trade.",
    },
    {
      id: 2,
      bg: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop",
      title: t('hero_title_2') || (language === 'ar' ? "تصدير ثروات السودان للعالم" : "Exporting Sudan's Wealth"),
      subtitle: t('hero_desc_2') || (language === 'ar' ? "نفخر بتصدير أجود المحاصيل والمواشي للأسواق العالمية" : "Proudly exporting Sudanese crops and livestock"),
    },
    {
      id: 3,
      bg: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop",
      title: t('hero_title_3') || (language === 'ar' ? "رواد استيراد الأقمشة والملابس" : "Leaders in Fabrics & Garments Import"),
      subtitle: t('hero_desc_3') || (language === 'ar' ? "نستورد أفضل الأقمشة والملابس من الصين وتركيا والهند ومصر" : "Importing top fabrics and garments from China, Turkey, India, and Egypt"),
    }
  ];

  return (
    <section id="hero" className="enterprise-hero p-0">
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Pagination]}
        effect="fade"
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop={true}
        className="hero-swiper"
        dir="ltr" /* Force LTR for Swiper so animations don't break in Arabic */
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="hero-slide" style={{ backgroundImage: `url(${slide.bg})` }}>
              <div className="hero-overlay"></div>
              <div className="container hero-content text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <h1 className="hero-title text-white mb-4 animate__animated animate__fadeInDown">
                  {slide.title}
                </h1>
                <p className="hero-subtitle text-white mb-5 animate__animated animate__fadeInUp">
                  {slide.subtitle}
                </p>
                <div className="d-flex justify-content-center flex-wrap gap-3 animate__animated animate__fadeInUp animate__delay-1s">
                  <Link to="/contact" className="btn enterprise-cta-btn btn-lg px-4 px-md-5">
                    {t('hero_cta_quote') || 'طلب عرض سعر'}
                  </Link>
                  <Link to="/track" className="btn btn-outline-light btn-lg px-4 px-md-5" style={{ borderRadius: "var(--radius-md)", fontWeight: "600", borderWidth: "2px" }}>
                    <i className="bi bi-geo-alt me-2"></i> {language === 'ar' ? 'تتبع شحنتك' : 'Track Shipment'}
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default Carousel;
