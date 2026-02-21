import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../context/LanguageContext";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import InnerHeaderBanner from "../components/InnerHeaderBanner";
import Footer from "../components/Footer";

const BlogPage = () => {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val["ar"] || val["en"] || "";
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snap = await getDocs(query(collection(db, "blog"), orderBy("createdAt", "desc")));
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* */ }
      finally { setLoading(false); }
    };
    fetchPosts();
  }, []);

  // Single post view
  if (selectedPost) {
    return (
      <>
        <Helmet><title>{loc(selectedPost.title)} | Qimmah Blog</title></Helmet>
        <InnerHeaderBanner title={t('blog_page_title')} />
        <main id="main">
          <section className="py-5">
            <div className="container">
              <button className="btn btn-outline-primary mb-4" onClick={() => setSelectedPost(null)}>
                <i className="bi bi-arrow-right me-1"></i>{t('blog_back')}
              </button>
              <article>
                <h2 style={{ color: "var(--primary-color)" }}>{loc(selectedPost.title)}</h2>
                {selectedPost.createdAt && (
                  <p className="text-muted small mb-3">
                    {new Date(selectedPost.createdAt.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-SD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}

                {/* Media Gallery */}
                {(selectedPost.imageUrls?.length > 0 || selectedPost.videoUrls?.length > 0) && (
                  <div className="row g-3 mb-4">
                    {selectedPost.imageUrls?.map((url, i) => (
                      <div key={`img-${i}`} className="col-md-6">
                        <img src={url} alt="" className="img-fluid rounded shadow-sm" style={{ width: "100%", maxHeight: 400, objectFit: "cover" }} />
                      </div>
                    ))}
                    {selectedPost.videoUrls?.map((url, i) => (
                      <div key={`vid-${i}`} className="col-md-6">
                        <video controls className="rounded shadow-sm" style={{ width: "100%", maxHeight: 400 }}>
                          <source src={url} type="video/mp4" />
                        </video>
                      </div>
                    ))}
                  </div>
                )}

                {/* Legacy single imageUrl */}
                {!selectedPost.imageUrls?.length && selectedPost.imageUrl && (
                  <div className="mb-4"><img src={selectedPost.imageUrl} alt="" className="img-fluid rounded shadow-sm" style={{ maxHeight: 400 }} /></div>
                )}

                <div className="blog-content" style={{ lineHeight: 2, fontSize: "1.1rem" }}>
                  <p style={{ whiteSpace: "pre-wrap" }}>{loc(selectedPost.body)}</p>
                </div>
              </article>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  // List view
  return (
    <>
      <Helmet>
        <title>{t('blog_page_title')} | Qimmah Al Ebtekar</title>
        <meta name="description" content="Blog - Qimmah Al Ebtekar Integrated Solutions" />
      </Helmet>
      <InnerHeaderBanner name={t('blog_page_title')} />
      <main id="main">
        <section className="py-5">
          <div className="container">
            <div className="section-header">
              <h2>{t('blog_page_title')}</h2>
              <p>{t('blog_page_subtitle')}</p>
            </div>

            {loading && <p className="text-center">{t('blog_loading')}</p>}
            {!loading && posts.length === 0 && <p className="text-center text-muted">{t('blog_no_posts')}</p>}

            <div className="row g-4">
              {posts.map((post) => (
                <div key={post.id} className="col-lg-4 col-md-6" data-aos="fade-up">
                  <div className="card h-100 shadow-sm border-0" style={{ cursor: "pointer" }} onClick={() => setSelectedPost(post)}>
                    {/* Cover media */}
                    {post.imageUrls?.length ? (
                      <img src={post.imageUrls[0]} alt={loc(post.title)} className="card-img-top" style={{ height: 220, objectFit: "cover" }} />
                    ) : post.videoUrls?.length ? (
                      <video muted className="card-img-top" style={{ height: 220, objectFit: "cover" }}>
                        <source src={post.videoUrls[0]} type="video/mp4" />
                      </video>
                    ) : post.imageUrl ? (
                      <img src={post.imageUrl} alt={loc(post.title)} className="card-img-top" style={{ height: 220, objectFit: "cover" }} />
                    ) : (
                      <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: 220 }}>
                        <i className="bi bi-journal-richtext" style={{ fontSize: 48, color: "var(--secondary-color)" }}></i>
                      </div>
                    )}

                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title" style={{ color: "var(--primary-color)" }}>{loc(post.title)}</h5>
                      {post.createdAt && (
                        <p className="text-muted small">
                          {new Date(post.createdAt.seconds * 1000).toLocaleDateString(language === 'ar' ? 'ar-SD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                      <p className="card-text flex-grow-1" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                        {loc(post.body)}
                      </p>
                      <span className="text-primary mt-2 d-inline-block">{t('blog_read_more')} <i className="bi bi-arrow-left"></i></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default BlogPage;

