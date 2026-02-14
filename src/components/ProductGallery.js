import React from 'react';

const ProductGallery = () => {
    // Categories and Images (Placeholders)
    const products = [
        {
            id: 1,
            category: "Exports (صادرات)",
            name: "الصمغ العربي / Gum Arabic",
            img: "https://loremflickr.com/400/300/resin,gum/all?lock=1",
            gridClass: "col-md-4 col-sm-6"
        },
        {
            id: 2,
            category: "Exports (صادرات)",
            name: "السمسم الأبيض / White Sesame",
            img: "https://loremflickr.com/400/300/seeds,sesame/all?lock=2",
            gridClass: "col-md-4 col-sm-6"
        },
        {
            id: 3,
            category: "Exports (صادرات)",
            name: "الكركديه / Hibiscus",
            img: "https://loremflickr.com/400/300/flower,red/all?lock=3",
            gridClass: "col-md-4 col-sm-6"
        },
        {
            id: 4,
            category: "Imports (واردات)",
            name: "أقمشة فاخرة / Luxury Fabrics",
            img: "https://loremflickr.com/400/300/fabric,textile/all?lock=4",
            gridClass: "col-md-6 col-sm-12"
        },
        {
            id: 5,
            category: "Imports (واردات)",
            name: "ملابس جاهزة / Ready-made Garments",
            img: "https://loremflickr.com/400/300/fashion,clothes/all?lock=5",
            gridClass: "col-md-6 col-sm-12"
        },
        {
            id: 6,
            category: "Imports (واردات)",
            name: "منسوجات منزلية / Home Textiles",
            img: "https://loremflickr.com/400/300/bedding,towel/all?lock=6",
            gridClass: "col-md-4 col-sm-6"
        },
        {
            id: 7,
            category: "Exports (صادرات)",
            name: "الفول السوداني / Peanuts",
            img: "https://loremflickr.com/400/300/nut,peanut/all?lock=7",
            gridClass: "col-md-4 col-sm-6"
        },
         {
            id: 8,
            category: "Imports (واردات)",
            name: "إكسسوارات الموضة / Fashion Accessories",
            img: "https://loremflickr.com/400/300/bag,accessory/all?lock=8",
            gridClass: "col-md-4 col-sm-6"
        }
    ];

    return (
        <div className="product-gallery py-5">
            <div className="section-header mb-4">
                <h3 style={{ color: 'var(--primary-color)' }}>معرض المنتجات / Product Gallery</h3>
                <p>تشكيلة مختارة من صادراتنا ووارداتنا المميزة</p>
            </div>

            <div className="row g-4">
                {products.map((product) => (
                    <div key={product.id} className={product.gridClass} data-aos="fade-up">
                        <div className="gallery-item position-relative overflow-hidden rounded shadow-sm" style={{ height: '250px', cursor: 'pointer' }}>
                            <img
                                src={product.img}
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
                                <span className="badge bg-warning text-dark mb-1">{product.category}</span>
                                <h5 className="m-0 fs-6">{product.name}</h5>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductGallery;

