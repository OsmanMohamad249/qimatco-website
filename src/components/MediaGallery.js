import React, { useEffect, useRef } from "react";
import "./MediaGallery.css";

/*
  MediaGallery – reusable component for displaying images + videos
  using GLightbox (loaded globally in public/index.html).

  Props:
    imageUrls  – string[]   (optional)
    videoUrls  – string[]   (optional)
    maxVisible – number      (default 4, after which "+N more" overlay appears)
*/

const MediaGallery = ({ imageUrls = [], videoUrls = [], maxVisible = 4 }) => {
  const galleryRef = useRef(null);

  const allMedia = [
    ...imageUrls.map((url) => ({ type: "image", url })),
    ...videoUrls.map((url) => ({ type: "video", url })),
  ];

  // Initialize GLightbox whenever media changes
  useEffect(() => {
    if (!galleryRef.current || allMedia.length === 0) return;
    // GLightbox is loaded globally from public/index.html
    if (typeof window.GLightbox === "undefined") return;

    const lb = window.GLightbox({
      selector: ".mg-lightbox-item",
      touchNavigation: true,
      loop: true,
      autoplayVideos: true,
    });
    return () => { try { lb.destroy(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrls, videoUrls]);

  if (allMedia.length === 0) return null;

  // Single image → large featured
  if (allMedia.length === 1) {
    const item = allMedia[0];
    return (
      <div className="mg-gallery mg-single" ref={galleryRef}>
        {item.type === "image" ? (
          <a href={item.url} className="mg-lightbox-item mg-item mg-featured" data-gallery="media-gallery">
            <img src={item.url} alt="" loading="lazy" />
            <div className="mg-overlay"><i className="bi bi-arrows-fullscreen"></i></div>
          </a>
        ) : (
          <a href={item.url} className="mg-lightbox-item mg-item mg-featured mg-video-item" data-gallery="media-gallery" data-type="video" data-source="local">
            <video src={item.url} muted preload="metadata" />
            <div className="mg-overlay"><i className="bi bi-play-circle"></i></div>
          </a>
        )}
      </div>
    );
  }

  const visible = allMedia.slice(0, maxVisible);
  const remaining = allMedia.length - maxVisible;

  return (
    <div className="mg-gallery" ref={galleryRef}>
      <div className={`mg-grid mg-cols-${Math.min(visible.length, 3)}`}>
        {visible.map((item, i) => {
          const isLast = i === maxVisible - 1 && remaining > 0;

          if (item.type === "image") {
            return (
              <a key={`img-${i}`} href={item.url} className="mg-lightbox-item mg-item" data-gallery="media-gallery">
                <img src={item.url} alt="" loading="lazy" />
                <div className="mg-overlay">
                  {isLast ? <span className="mg-more">+{remaining}</span> : <i className="bi bi-arrows-fullscreen"></i>}
                </div>
              </a>
            );
          }
          return (
            <a key={`vid-${i}`} href={item.url} className="mg-lightbox-item mg-item mg-video-item" data-gallery="media-gallery" data-type="video" data-source="local">
              <video src={item.url} muted preload="metadata" />
              <div className="mg-overlay">
                {isLast ? <span className="mg-more">+{remaining}</span> : <i className="bi bi-play-circle"></i>}
              </div>
            </a>
          );
        })}

        {/* Hidden items for lightbox to pick up (so user can browse ALL media) */}
        {remaining > 0 && allMedia.slice(maxVisible).map((item, i) => (
          item.type === "image" ? (
            <a key={`hidden-img-${i}`} href={item.url} className="mg-lightbox-item" data-gallery="media-gallery" style={{ display: "none" }}>img</a>
          ) : (
            <a key={`hidden-vid-${i}`} href={item.url} className="mg-lightbox-item" data-gallery="media-gallery" data-type="video" data-source="local" style={{ display: "none" }}>vid</a>
          )
        ))}
      </div>
    </div>
  );
};

export default MediaGallery;

