import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const FloatingWhatsApp = () => {
    const [settings, setSettings] = useState({ phone: "249123456789", message: "Hello, I am interested in your services.", enabled: true });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const snap = await getDoc(doc(db, "settings", "whatsapp"));
                if (snap.exists()) {
                    const data = snap.data();
                    setSettings({
                        phone: data.phone || "249123456789",
                        message: data.message || "Hello, I am interested in your services.",
                        enabled: data.enabled !== false,
                    });
                }
            } catch { /* use defaults */ }
        };
        fetchSettings();
    }, []);

    if (!settings.enabled) return null;

    const whatsappUrl = `https://wa.me/${settings.phone}?text=${encodeURIComponent(settings.message)}`;

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

