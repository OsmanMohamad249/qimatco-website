import React from "react";
import { Helmet } from "react-helmet";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";
import Carousel from "../components/Carousel";
import ClientList from "../components/ClientList";
import Facts from "../components/Facts";
import ServiceList from "../components/ServiceList";
import Trading from "./Trading";

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Home | Qimmah Al Ebtekar Integrated Solutions</title>
        <meta name="description" content="Qimmah Al Ebtekar: Integrated Logistics Solutions, International Shipping, Customs Clearance, and Global Trading." />
      </Helmet>
      <InnerHeader />
      <Carousel />
      <main id="main">
        <ServiceList/>
        <Trading/>
        <ClientList/>
        <Facts/>
      </main>
      <Footer />
    </>
  );
};

export default Home;
