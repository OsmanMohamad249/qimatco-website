import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const { pathname } = location;
  const splitLocation = pathname.split("/");

  return (
    <>
      <nav id="navbar" className="navbar enterprise-navbar">
        <ul>
          <li>
            <Link to="/" className={splitLocation[1] === "" ? "active" : ""}>الرئيسية</Link>
          </li>
          <li>
            <Link to="/about" className={splitLocation[1] === "about" ? "active" : ""}>من نحن</Link>
          </li>
          <li className="dropdown">
            <a href="#" className={splitLocation[1] === "services" ? "active" : ""}>
              <span>خدماتنا</span> <i className="bi bi-chevron-down"></i>
            </a>
            <ul>
              <li><Link to="/services">خدمات لوجستية</Link></li>
              <li><a href="/#trading">تجارة دولية</a></li>
            </ul>
          </li>
          <li>
            <Link to="/blog" className={splitLocation[1] === "blog" ? "active" : ""}>المدونة</Link>
          </li>
          <li>
            <Link to="/contact" className={splitLocation[1] === "contact" ? "active" : ""}>تواصل معنا</Link>
          </li>
          {/* Prominent Call-to-Action Button */}
          <li className="nav-cta-item">
            <Link to="/track" className={`enterprise-cta-btn ${splitLocation[1] === "track" ? "active" : ""}`}>
              تتبع شحنتك <i className="bi bi-box-seam"></i>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
