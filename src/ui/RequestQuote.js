import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";

const RequestQuote = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [inventory, setInventory] = useState([]);
  const [entityType, setEntityType] = useState("individual");
  const [entityInfo, setEntityInfo] = useState({
    type: "individual",
    companyName: "",
    crNumber: "",
    address: "",
  });
  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsapp: "",
  });
  const [items, setItems] = useState([
    { serviceId: "", serviceName: "", quantity: "", deliveryLocation: "" },
  ]);
  const [statusMsg, setStatusMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const [servicesSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "services")),
          getDocs(collection(db, "products"))
        ]);
        const svc = servicesSnap.docs.map((d) => ({ id: d.id, type: "service", ...d.data() }));
        const prd = productsSnap.docs.map((d) => ({ id: d.id, type: "product", ...d.data() }));
        const allItems = [...svc, ...prd];
        setInventory(allItems);

        // Handle pre-selected product from URL
        const params = new URLSearchParams(location.search);
        const productId = params.get('productId');
        if (productId) {
          const selected = allItems.find(i => i.id === productId);
          if (selected) {
            const title = selected.title || selected.name || "";
            const localized = typeof title === "object" ? (title[language] || title.ar || title.en || "") : title;
            setItems([{
              serviceId: selected.id,
              serviceName: localized,
              itemType: selected.type || "product",
              quantity: "1",
              deliveryLocation: ""
            }]);
          }
        }
      } catch {
        setInventory([]);
      }
    };
    loadInventory();
  }, [location.search, language]);

  const handleEntityTypeChange = (type) => {
    setEntityType(type);
    setEntityInfo((prev) => ({ ...prev, type }));
  };

  const handleEntityInfoChange = (e) => {
    const { name, value } = e.target;
    setEntityInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "serviceId") {
        const item = inventory.find((s) => s.id === value);
        const title = item?.title || item?.name || "";
        const localized = typeof title === "object" ? (title[language] || title.ar || title.en || "") : title;
        next[index].serviceName = localized;
        next[index].itemType = item?.type || "service";
      }
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => ([...prev, { serviceId: "", serviceName: "", quantity: "", deliveryLocation: "" }]));
  };

  const removeItemRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const isValidPhone = (phone) => phone && phone.length >= 7;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");

    const hasSelectedItem = items.some((it) => it.serviceId);
    if (!hasSelectedItem) {
      setStatusMsg(language === "ar" ? "يرجى اختيار خدمة واحدة على الأقل" : "Please select at least one service");
      return;
    }
    if (!isValidEmail(contactInfo.email) || !isValidPhone(contactInfo.phone)) {
      setStatusMsg(language === "ar" ? "تحقق من البريد الإلكتروني ورقم الهاتف" : "Check email and phone number");
      return;
    }

    try {
      setSubmitting(true);
      const quoteDoc = {
        contactInfo: { ...contactInfo },
        entityInfo: { ...entityInfo, type: entityType },
        items: items.filter((it) => it.serviceId).map((it) => ({
          serviceId: it.serviceId,
          serviceName: it.serviceName,
          quantity: it.quantity,
          deliveryLocation: it.deliveryLocation,
          itemType: it.itemType || "service",
        })),
        status: "pending",
        adminNotes: "",
        currency: "SAR",
        language: language,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "quotes"), quoteDoc);
      const formattedId = `Q-${new Date().getFullYear()}-${docRef.id.substring(0, 5).toUpperCase()}`;
      setRequestId(formattedId);
    } catch (err) {
      setStatusMsg(err.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet><title>{t('quote_title') || (language === "ar" ? "طلب عرض سعر رسمي" : "Request an Official Quote")}</title></Helmet>
      <InnerHeader />
      <main id="main" className="py-5" style={{ backgroundColor: "var(--bg-main)", minHeight: "60vh" }}>
        <div className="container">
          <div className="enterprise-card p-4 p-md-5">
            <h2 style={{ color: "var(--primary-color)", fontWeight: "700" }}>{t('quote_title') || (language === "ar" ? "طلب عرض سعر رسمي" : "Request an Official Quote")}</h2>

            <form className="mt-4" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-bold">{t('quote_entity_type') || (language === "ar" ? "نوع الجهة" : "Entity Type")}</label>
                <div className="d-flex gap-3">
                  <label className="form-check">
                    <input className="form-check-input" type="radio" name="entityType" checked={entityType === "individual"} onChange={() => handleEntityTypeChange("individual")} />
                    <span className="form-check-label">{t('quote_individual') || (language === "ar" ? "فرد" : "Individual")}</span>
                  </label>
                  <label className="form-check">
                    <input className="form-check-input" type="radio" name="entityType" checked={entityType === "company"} onChange={() => handleEntityTypeChange("company")} />
                    <span className="form-check-label">{t('quote_company') || (language === "ar" ? "شركة" : "Company")}</span>
                  </label>
                </div>
              </div>

              {entityType === "company" ? (
                <div className="row g-3">
                  <div className="col-md-6"><label className="form-label">{t('quote_company_name') || (language === "ar" ? "اسم الشركة" : "Company Name")}</label><input name="companyName" className="form-control" value={entityInfo.companyName} onChange={handleEntityInfoChange} required /></div>
                  <div className="col-md-6"><label className="form-label">{t('quote_cr_number') || (language === "ar" ? "السجل التجاري" : "CR Number")}</label><input name="crNumber" className="form-control" value={entityInfo.crNumber} onChange={handleEntityInfoChange} required /></div>
                  <div className="col-12"><label className="form-label">{t('quote_business_address') || (language === "ar" ? "عنوان العمل" : "Business Address")}</label><input name="address" className="form-control" value={entityInfo.address} onChange={handleEntityInfoChange} required /></div>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12"><label className="form-label">{t('career_form_name') || (language === "ar" ? "الاسم الكامل" : "Full Name")}</label><input name="fullName" className="form-control" value={contactInfo.fullName} onChange={handleContactChange} required /></div>
                </div>
              )}

              <hr className="my-4" />

              <div className="row g-3">
                {entityType === "company" && (
                  <div className="col-12"><label className="form-label">{t('quote_contact_person') || (language === "ar" ? "اسم مسؤول التواصل" : "Contact Person")}</label><input name="fullName" className="form-control" value={contactInfo.fullName} onChange={handleContactChange} required /></div>
                )}
                <div className="col-md-6"><label className="form-label">{t('quote_email') || 'Email'}</label><input name="email" type="email" className="form-control" value={contactInfo.email} onChange={handleContactChange} required /></div>
                <div className="col-md-6"><label className="form-label">{t('quote_phone') || (language === "ar" ? "رقم الهاتف" : "Phone Number")}</label><input name="phone" className="form-control" value={contactInfo.phone} onChange={handleContactChange} required /></div>
                <div className="col-md-6"><label className="form-label">{t('quote_whatsapp') || 'WhatsApp'}</label><input name="whatsapp" className="form-control" value={contactInfo.whatsapp} onChange={handleContactChange} /></div>
              </div>

              <hr className="my-4" />

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>{t('quote_service') || (language === "ar" ? "الخدمة" : "Service")}</th>
                      <th>{t('quote_quantity') || (language === "ar" ? "الكمية" : "Quantity")}</th>
                      <th>{t('quote_delivery') || (language === "ar" ? "موقع التسليم" : "Delivery Location")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={`item-${idx}`}>
                        <td>
                          <select className="form-select" value={item.serviceId} onChange={(e) => handleItemChange(idx, "serviceId", e.target.value)}>
                            <option value="">{t('quote_select_service') || (language === "ar" ? "اختر الخدمة" : "Select Service")}</option>
                            {inventory.map((inv) => {
                              const title = inv?.title || inv?.name || inv?.id;
                              const label = typeof title === "object" ? (title[language] || title.ar || title.en || inv.id) : title;
                              const typeLabel = inv.type === "product" ? (language === "ar" ? "منتج" : "Product") : (language === "ar" ? "خدمة" : "Service");
                              return (
                                <option key={`${inv.type}-${inv.id}`} value={inv.id}>{label} - {typeLabel}</option>
                              );
                            })}
                          </select>
                        </td>
                        <td><input className="form-control" value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", e.target.value)} /></td>
                        <td><input className="form-control" value={item.deliveryLocation} onChange={(e) => handleItemChange(idx, "deliveryLocation", e.target.value)} /></td>
                        <td>
                          {items.length > 1 && (
                            <button type="button" className="btn btn-outline-danger" onClick={() => removeItemRow(idx)}>{t('quote_remove_item') || (language === "ar" ? "حذف" : "Remove")}</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={addItemRow}>{t('quote_add_item') || (language === "ar" ? "إضافة خدمة" : "Add Item")}</button>
                <button type="submit" className="btn enterprise-cta-btn" disabled={submitting}>{submitting ? (t('quote_submitting') || (language === "ar" ? "جارٍ الإرسال..." : "Submitting...")) : (t('quote_submit') || (language === "ar" ? "إرسال الطلب" : "Submit Request"))}</button>
              </div>

              {statusMsg && <div className="alert alert-danger mt-3">{statusMsg}</div>}
            </form>
          </div>
        </div>
      </main>

      {requestId && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="bg-white p-4 p-md-5 rounded-4 shadow-lg w-100" style={{ maxWidth: "600px" }}>
            <h4 className="fw-bold" style={{ color: "var(--primary-color)" }}>{t('quote_success') || (language === "ar" ? "تم إرسال طلبك بنجاح" : "Request submitted successfully")}</h4>
            <p className="text-muted">{t('quote_request_id') || (language === "ar" ? "رقم الطلب" : "Request ID")}: <strong>{requestId}</strong></p>
            <button className="btn enterprise-cta-btn" onClick={() => setRequestId("")}>{t('quote_close') || (language === "ar" ? "إغلاق" : "Close")}</button>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default RequestQuote;

