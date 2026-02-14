import React from 'react'
import { Link } from 'react-router-dom'

import { useLocation } from 'react-router-dom'

const Navbar = () => {
  
//assigning location variable
  const location = useLocation();
  
   //destructuring path name from location
   const {pathname} = location;

  //Javascript split method to get the name of the path in array
  const splitLocation = pathname.split("/");

  return (
    <>
        	<nav id="navbar" className="navbar">
          <ul>
            <li >
              <Link to ="/"  className={splitLocation[1] === "" ? "active" : ""}> الرئيسية</Link>
            </li>
            <li>
              <Link to ="/about"  className={splitLocation[1] === "about" ? "active" : ""}> من نحن</Link>
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
            <Link to ="/contact"  className={splitLocation[1] === "contact" ? "active" : ""}> تواصل معنا</Link>
            </li>
          </ul>
        </nav>

    </>
  )
}

export default Navbar