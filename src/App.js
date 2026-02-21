import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import "../node_modules/bootstrap/dist/css/bootstrap.css";
import Preloader from "./layout/Preloader";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import AOS from "aos";
import "aos/dist/aos.css";

const Home = lazy(() => import("./ui/Home"));
const Career = lazy(() => import("./ui/Career"));
const Contact = lazy(() => import("./ui/Contact"));
const About = lazy(() => import("./ui/About"));
const Service = lazy(() => import("./ui/Service"));
const NoPage = lazy(() => import("./layout/NoPage"));
const TrackShipment = lazy(() => import("./ui/TrackShipment"));
const AdminPanel = lazy(() => import("./ui/AdminPanel"));
const BlogPage = lazy(() => import("./ui/BlogPage"));
const ServiceDetail = lazy(() => import("./ui/ServiceDetail"));
const ProductDetail = lazy(() => import("./ui/ProductDetail"));

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'slide',
      once: true,
      mirror: false
    });
  }, []);

  return (
    <>
      <Router>
        <Suspense fallback={ <Preloader/>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Service />} />
            <Route path="services/:id" element={<ServiceDetail />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="careers" element={<Career />} />
            <Route path="contact" element={<Contact />} />
            <Route path="track" element={<TrackShipment />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="*" element={<NoPage />} />
          </Routes>
        </Suspense>
        <FloatingWhatsApp />
      </Router>
    </>
  );
}

export default App;
