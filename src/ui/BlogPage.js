import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useLanguage } from "../context/LanguageContext";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import InnerHeaderBanner from "../components/InnerHeaderBanner";
import Footer from "../components/Footer";
import MediaGallery from "../components/MediaGallery";

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
        let snap;
        try { snap = await getDocs(query(collection(db, "blog"), orderBy("createdAt", "desc"))); }
        catch { snap = await getDocs(collection(db, "blog")); }
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* */ }
      finally { setLoading(false); }
    };
    fetchPosts();
  }, []);

  // ── Single post view ──
  if (selectedPost) {
    return (
      <>
        <Helmet><title>{loc(selectedPost.title)} | Qimmah Blog</title></Helmet>
        <InnerHeaderBanner name={t('blog_page_title')} />
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
                    {new Date(selectedPost.createdAt.seconds * 1000).toLocaleDateString(
                      language === 'ar' ? 'ar-SD' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                )}

                {/* Professional Media Gallery */}
                <MediaGallery
                  imageUrls={selectedPost.imageUrls || (selectedPost.imageUrl ? [selectedPost.imageUrl] : [])}
                  videoUrls={selectedPost.videoUrls || []}
                  maxVisible={6}
                />

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

  // ── List view ──
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
              {posts.map((post) => {
                const imgs = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
                const vids = post.videoUrls || [];
                const totalMedia = imgs.length + vids.length;

                return (
                  <div key={post.id} className="col-lg-4 col-md-6" data-aos="fade-up">
                    <div
                      className="card h-100 shadow-sm border-0"
                      style={{ cursor: "pointer", borderRadius: "var(--border-radius, 12px)", overflow: "hidden" }}
                      onClick={() => setSelectedPost(post)}
                    >
                      {/* Cover: show mini gallery preview (max 3) with "+more" */}
                      {imgs.length > 0 ? (
                        <div className="position-relative">
                          <img src={imgs[0]} alt={loc(post.title)} className="card-img-top" style={{ height: 220, objectFit: "cover" }} />
                          {totalMedia > 1 && (
                            <span className="position-absolute bottom-0 end-0 m-2 badge" style={{ background: "rgba(0,0,0,0.6)", fontSize: "0.8rem" }}>
                              <i className="bi bi-images me-1"></i>{totalMedia}
                            </span>
                          )}
                        </div>
                      ) : vids.length > 0 ? (
                        <div className="position-relative">
                          <video muted preload="metadata" className="card-img-top" style={{ height: 220, objectFit: "cover", width: "100%" }}>
                            <source src={vids[0]} type="video/mp4" />
                          </video>
                          <span className="position-absolute top-50 start-50 translate-middle" style={{ color: "#fff", fontSize: "2.5rem", textShadow: "0 2px 8px rgba(0,0,0,.4)" }}>
                            <i className="bi bi-play-circle-fill"></i>
                          </span>
                        </div>
                      ) : (
                        <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: 220 }}>
                          <i className="bi bi-journal-richtext" style={{ fontSize: 48, color: "var(--secondary-color)" }}></i>
                        </div>
                      )}

                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title" style={{ color: "var(--primary-color)" }}>{loc(post.title)}</h5>
                        {post.createdAt && (
                          <p className="text-muted small">
                            {new Date(post.createdAt.seconds * 1000).toLocaleDateString(
                              language === 'ar' ? 'ar-SD' : 'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </p>
                        )}
                        <p className="card-text flex-grow-1" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                          {loc(post.body)}
                        </p>
                        <span className="text-primary mt-2 d-inline-block">
                          {t('blog_read_more')} <i className={`bi bi-arrow-${language === 'ar' ? 'left' : 'right'}`}></i>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default BlogPage;

