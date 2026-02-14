import React from 'react';

const FloatingWhatsApp = () => {
    // Replace with actual number
    const phoneNumber = "249123456789";
    const message = "Hello, I am interested in your services.";
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            className="floating-whatsapp"
            target="_blank"
            rel="noopener noreferrer external"
            title="Chat with us on WhatsApp"
        >
            <i className="bi bi-whatsapp"></i>
        </a>
    );
};

export default FloatingWhatsApp;

