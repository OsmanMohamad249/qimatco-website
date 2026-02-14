import React from 'react'

const Facts = () => {
  return (
    <>
  
      <section id="facts" className="facts">
        <div className="container" data-aos="fade-up">
          <div className="row justify-content-center">
            <div className="col-lg-12 text-center">
              <div className="section-header">
                <h2 className="text-white">خبراتنا بالأرقام</h2>
                <p>نفخر بخدمتنا لعملائنا عبر أسواق متعددة بثقة وكفاءة.</p>
              </div>
              <div className="row counters">
                <div className="col-lg-3 col-6 text-center">
                  <span  className="purecounter">17</span>
                  <h3> حاوية تم شحنها </h3>
                  <p> عمليات شحن ناجحة </p>
                </div>
                <div className="col-lg-3 col-6 text-center">
                  <span className="purecounter">82</span>
                  <h3> عميل سعيد </h3>
                  <p>ثقة مستمرة</p>
                </div>
                <div className="col-lg-3 col-6 text-center">
                  <span  className="purecounter">43</span>
                  <h3> دولة نخدمها</h3>
                  <p>تغطية عالمية </p>
                </div>
                 <div className="col-lg-3 col-6 text-center">
                  <span  className="purecounter">20</span>
                  <h3> سنوات من الخبرة</h3>
                  <p>خبرة تراكمية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Facts