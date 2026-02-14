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
            <li>
            <Link to ="/services"  className={splitLocation[1] === "services" ? "active" : ""}> خدماتنا</Link>
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