"use client";

import React, { useState } from "react";

const CHATBOT_URL = "https://ticket.stalwartng.com/chat-widget/x/";

export default function FloatingWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        id="cb-btn"
        aria-label="Open support chat"
        className="fixed bottom-5 right-5 z-999999 flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full bg-[#007bff] text-[30px] text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:scale-105"
      >
        💬
      </button>

      <div
        id="cb-popup"
        className={`fixed bottom-[90px] right-5 z-999999 h-[650px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] max-md:right-[15px] max-md:h-[80vh] max-md:w-[calc(100vw-30px)] max-[480px]:bottom-0 max-[480px]:right-0 max-[480px]:h-screen max-[480px]:w-screen max-[480px]:rounded-none ${
          open ? "flex" : "hidden"
        }`}
      >
        <div
          id="cb-head"
          className="flex h-[55px] shrink-0 items-center justify-between bg-[#007bff] px-4 font-sans text-base font-bold text-white"
        >
          <span>Live Support</span>
          <button
            type="button"
            id="cb-close"
            onClick={() => setOpen(false)}
            aria-label="Close support chat"
            className="cursor-pointer rounded-full px-1 text-[28px] leading-none transition hover:bg-white/15"
          >
            &times;
          </button>
        </div>

        <iframe
          src={CHATBOT_URL}
          id="cb-frame"
          title="Live support chat"
          allow="clipboard-write; microphone"
          className="h-full w-full border-0"
        />
      </div>
    </>
  );
}
