"use client";

import React, { useState, useEffect } from "react";

export default function FloatingWidget({
  iframeUrl = "https://ticket.stalwartng.com/chat-widget/x/",
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is typically the breakpoint for mobile
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleClick = () => {
    if (isMobile) {
      // Redirect to external link on mobile
      window.open(iframeUrl, "_blank");
    } else {
      // Open iframe popup on desktop
      setOpen(true);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleClick}
        id="floating-iframe-btn"
        aria-label="Open support chat"
        className="fixed bottom-5 right-5 w-14 h-14 bg-blue-600 text-white text-2xl rounded-full flex items-center justify-center shadow-lg z-[999999] transform transition-transform hover:scale-110"
      >
        💬
      </button>

      {/* Popup container */}
      <div
        id="floating-iframe-popup"
        className={`fixed bottom-24 right-5 w-[400px] h-[550px] bg-white rounded-xl shadow-lg overflow-hidden z-[999999] ${
          open ? "block" : "hidden"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          id="floating-iframe-close"
          aria-label="Close support chat"
          className="absolute top-2 right-3 text-2xl text-gray-700 z-10"
        >
          &times;
        </button>

        <iframe
          src={iframeUrl}
          id="floating-iframe"
          title="Support chat"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="w-full h-full border-0"
        />
      </div>
    </>
  );
}
