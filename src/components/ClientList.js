import React, { useEffect, useState } from "react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { Swiper, SwiperSlide } from "swiper/react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import AOS from "aos";
import "aos/dist/aos.css";

const ClientList = () => {
  const { t, language } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Helper: get localized text from an object or string (backward compat)
  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val["ar"] || val["en"] || "";
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const snap = await getDocs(collection(db, "clients"));
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setClients(list);
      } catch (err) {
        setError(language === "ar" ? "تعذر تحميل العملاء حالياً" : "Failed to load clients");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [language]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => { AOS.refresh(); }, 500); // Increased delay
    }
  }, [clients, loading]);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false, // Changed to false to try re-triggering
      mirror: true,
    });
  }, []);

  return (
    <section id="clients" className="clients">
      {/* Removed data-aos="zoom-out" from container to prevent it from hiding the whole section if AOS fails */}
      <div className="container">
        <div className="section-header">
          <h2>{t('clients_title')}</h2>
        </div>

        {loading && <p>{language === "ar" ? "جاري تحميل العملاء..." : "Loading clients..."}</p>}
        {error && <p className="text-danger">{error}</p>}

        {!loading && clients.length === 0 && (
          <p className="text-muted">{language === "ar" ? "لا توجد شعارات عملاء حالياً" : "No client logos available"}</p>
        )}

        {!loading && clients.length > 0 && (
          <div className="clients-slider swiper">
            <Swiper
              modules={[Autoplay]}
              autoplay={{ delay: 1500, disableOnInteraction: true }}
              breakpoints={{
                640: { slidesPerView: 3, spaceBetween: 5 },
                768: { slidesPerView: 4, spaceBetween: 5 },
                1024: { slidesPerView: 6, spaceBetween: 10 },
              }}
            >
              {clients.map((client) => (
                <SwiperSlide key={client.id}>
                  <img
                    src={client.logoUrl}
                    className="img-fluid"
                    alt={loc(client.name) || "Client"}
                    title={loc(client.name) || "Client"}
                    style={{ maxHeight: "90px", objectFit: "contain" }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
};

export default ClientList;

