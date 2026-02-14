import React, { useEffect, useState,useRef } from "react";
import InnerHeaderBanner from "../components/InnerHeaderBanner";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";
const contactHeader = "https://loremflickr.com/1920/600/contact,center,logistics/all";
import emailjs from 'emailjs-com'



const Contact = () => {
  //submit button enable all fileds submited
  const form = useRef();
  const inputRef = useRef(null);


  const [inputFields, setInputFields] = useState({
    username: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // destructure all object values
  const { username, email, subject, message } = inputFields;

  // check the form fileds lenth
  const validateValues = (inputValues) => {
    let errors = {};

    if (inputValues.username.length < 2) {
      errors.username = "الاسم قصير جدًا";
    }
    if (inputValues.email.length < 5) {
      errors.email = "البريد الإلكتروني قصير جدًا";
    }
    if (inputValues.subject.length < 5) {
      errors.subject = "الموضوع قصير جدًا";
    }
    if (inputValues.message.length < 10) {
      errors.message = "الرسالة قصيرة جدًا";
    }

    return errors;
  };

  const handleChange = (event) => {
    setInputFields({ ...inputFields, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrors(validateValues(inputFields));
    setSubmitting(true);

    // email configure
    emailjs.sendForm('service_k80xoyk', 'template_q6z4pl4', form.current, 'yV95_dZd7WA5uN3f7')
      .then((result) => {
          //console.log(result.text);
          //console.log("Message sent successfully")
         
      }, (error) => {
          console.log(error.text);
      });
      //nputRef.current.value = ''; 
      setInputFields({username: "",
      email: "",
      subject: "",
      message: ""})
  };

  const finishSubmit = () => {
    console.log(inputFields);   
   //inputRef.current.value = '';
  };

  useEffect(() => {
    if (Object.keys(errors).length === 0 && submitting) {
      finishSubmit();
      }
  }, [errors]);

  return (
    <>
      <InnerHeader />
      <InnerHeaderBanner name={"اتصل بنا"} img={contactHeader} />
      <main id="main">
        <section id="contact" className="contact">
          <div className="container position-relative" data-aos="fade-up">
            <div className="section-header">
              <h2>تواصل معنا</h2>
            </div>

            <div className="row gy-4 d-flex justify-content-end">
              <div className="col-lg-5" data-aos="fade-up" data-aos-delay="100">
                <div className="info-item d-flex">
                  <i className="bi bi-geo-alt flex-shrink-0"></i>
                  <div>
                    <h4>العنوان:</h4>
                    <p>الخرطوم، السودان</p>
                  </div>
                </div>

                <div className="info-item d-flex">
                  <i className="bi bi-envelope flex-shrink-0"></i>
                  <div>
                    <h4>البريد الإلكتروني:</h4>
                    <p>
                      <a href="mailto:info@qimmah.com">
                        info@qimmah.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="info-item d-flex">
                  <i className="bi bi-phone flex-shrink-0"></i>
                  <div>
                    <h4>الهاتف:</h4>
                    <p>+249 000 000 000</p>
                  </div>
                </div>
              </div>

              <div className="col-lg-6" data-aos="fade-up" data-aos-delay="250">
                <form ref={form} className="php-email-form" onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <input  ref={inputRef}
                        onChange={handleChange}
                        value={username}
                        type="text"
                        name="username"
                        className="form-control"
                        placeholder="الاسم"
                        style={{
                          border: errors.username ? "1px solid red" : null,
                        }}
                      />
                      {errors.username ? (
                        <small className="error">
                          يرجى إدخال اسم من 3 أحرف على الأقل
                        </small>
                      ) : null}
                    </div>
                    <div className="col-md-6 form-group mt-3 mt-md-0">
                      <input ref={inputRef}
                        onChange={handleChange}
                        value={email}
                        type="email"
                        className="form-control"
                        name="email"
                        placeholder="البريد الإلكتروني"
                        style={{
                          border: errors.email ? "1px solid red" : null,
                        }}
                      />
                      {errors.email ? (
                        <small className="error">يرجى إدخال بريد إلكتروني صحيح</small>
                      ) : null}
                    </div>
                  </div>
                  <div className="form-group mt-3">
                    <input 
                   ref={inputRef}
                      onChange={handleChange}
                      value={subject}
                      type="text"
                      className="form-control"
                      name="subject"
                      placeholder="الموضوع"
                      style={{ border: errors.message ? "1px solid red" : null }}
                    />
                    {errors.subject ? (
                      <small className="error">
                        يرجى إدخال موضوع من 5 أحرف على الأقل
                      </small>
                    ) : null}
                  </div>
                  <div className="form-group mt-3">
                    <textarea  ref={inputRef}
                      onChange={handleChange}
                      value={message}
                      className="form-control"
                      name="message"
                      rows="5"
                      placeholder="رسالتك"
                      style={{
                        border: errors.message ? "1px solid red" : null,
                      }}
                    ></textarea>
                    {errors.message ? (
                      <small className="error">
                        يرجى إدخال رسالة من 10 أحرف على الأقل
                      </small>
                    ) : null}
                  </div>

                  <p className="text-center">
                    {Object.keys(errors).length === 0 && submitting ? (
                      <div className="alert alert-success p-2 ">
                        تم الإرسال بنجاح ✓
                      </div>
                    ) : null}
                  </p>

                  <div className="text-center">
                    <button className="btn btn-primary" type="submit">
                      إرسال الرسالة
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Contact;
