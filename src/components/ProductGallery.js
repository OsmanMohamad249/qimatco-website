import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const ProductGallery = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const snap = await getDocs(collection(db, 'products'));
                const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setProducts(list);
            } catch (err) {
                setError('تعذر تحميل المنتجات حالياً');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="product-gallery py-5">
            <div className="section-header mb-4">
                <h3 style={{ color: 'var(--primary-color)' }}>معرض المنتجات / Product Gallery</h3>
                <p>تشكيلة مختارة من صادراتنا ووارداتنا المميزة</p>
            </div>

            {loading && <p>جاري تحميل المنتجات...</p>}
            {error && <p className="text-danger">{error}</p>}
            {!loading && products.length === 0 && <p>لا توجد منتجات متاحة حالياً</p>}

            <div className="row g-4">
                {products.map((product) => (
                    <div key={product.id} className="col-md-4 col-sm-6" data-aos="fade-up">
                        <div className="gallery-item position-relative overflow-hidden rounded shadow-sm" style={{ height: '250px', cursor: 'pointer' }}>
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-100 h-100 object-fit-cover transition-transform"
                                style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            />
                            <div className="overlay position-absolute bottom-0 start-0 w-100 p-3 text-white"
                                 style={{
                                     background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                     pointerEvents: 'none'
                                 }}>
                                <span className="badge bg-warning text-dark mb-1">{product.category || 'منتج'}</span>
                                <h5 className="m-0 fs-6">{product.name}</h5>
                                {product.description && <small>{product.description}</small>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductGallery;
