import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
import { lazy, Suspense } from "react";
import "../node_modules/bootstrap/dist/css/bootstrap.css";
import Preloader from "./layout/Preloader";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
const Home = lazy(() => import("./ui/Home"));
const Career = lazy(() => import("./ui/Career"));
const Contact = lazy(() => import("./ui/Contact"));
const About = lazy(() => import("./ui/About"));
const Service = lazy(() => import("./ui/Service"));
const NoPage = lazy(() => import("./layout/NoPage"));
const TrackShipment = lazy(() => import("./ui/TrackShipment"));
const AdminPanel = lazy(() => import("./ui/AdminPanel"));

function App() {
  return (
    <>
      <Router>
        <Suspense fallback={ <Preloader/>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Service />} />
            <Route path="careers" element={<Career />} />
            <Route path="contact" element={<Contact />} />
            <Route path="track" element={<TrackShipment />} />
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
