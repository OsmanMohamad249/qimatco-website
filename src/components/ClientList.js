import React, { useEffect, useState } from "react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { Swiper, SwiperSlide } from "swiper/react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const snap = await getDocs(collection(db, "clients"));
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setClients(list);
      } catch (err) {
        setError("تعذر تحميل العملاء حالياً");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  return (
    <section id="clients" className="clients">
      <div className="container" data-aos="zoom-out">
        <div className="section-header">
          <h2>عملاؤنا</h2>
        </div>

        {loading && <p>جاري تحميل العملاء...</p>}
        {error && <p className="text-danger">{error}</p>}

        {!loading && clients.length === 0 && (
          <p className="text-muted">لا توجد شعارات عملاء حالياً</p>
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
                    alt={client.name || "Client"}
                    title={client.name || "Client"}
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
