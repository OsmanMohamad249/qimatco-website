import React, { useEffect } from 'react';
import { useLanguage } from "../context/LanguageContext";
import PureCounter from '@srexi/purecounterjs';

const Facts = () => {
  const { language } = useLanguage();

  useEffect(() => {
    new PureCounter();
  }, []);

  const facts = [
    { count: "17", label: language === 'ar' ? 'حاوية تم شحنها' : 'Containers Shipped', sub: language === 'ar' ? 'عمليات شحن ناجحة' : 'Successful operations' },
    { count: "82", label: language === 'ar' ? 'عميل سعيد' : 'Happy Clients', sub: language === 'ar' ? 'ثقة مستمرة' : 'Ongoing trust' },
    { count: "43", label: language === 'ar' ? 'دولة نخدمها' : 'Countries Served', sub: language === 'ar' ? 'تغطية عالمية' : 'Global coverage' },
    { count: "20", label: language === 'ar' ? 'سنوات من الخبرة' : 'Years of Experience', sub: language === 'ar' ? 'خبرة تراكمية' : 'Cumulative expertise' },
  ];

  return (
    <>
      <section id="facts" className="facts">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12 text-center">
              <div className="section-header">
                <h2 className="text-white">{language === 'ar' ? 'خبراتنا بالأرقام' : 'Our Expertise in Numbers'}</h2>
                <p>{language === 'ar' ? 'نفخر بخدمتنا لعملائنا عبر أسواق متعددة بثقة وكفاءة.' : 'We proudly serve our clients across multiple markets with trust and efficiency.'}</p>
              </div>
              <div className="row counters">
                {facts.map((fact, idx) => (
                  <div className="col-lg-3 col-6 text-center" key={idx}>
                    <span
                      data-purecounter-start="0"
                      data-purecounter-end={fact.count}
                      data-purecounter-duration="1"
                      className="purecounter"
                    >
                      {fact.count}
                    </span>
                    <h3>{fact.label}</h3>
                    <p>{fact.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Facts;
