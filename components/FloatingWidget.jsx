"use client";

import Image from "next/image";
import React, { useState } from "react";

const CHATBOT_URL = "https://tvet-support.previewapp.cc/chat-widget/x/";
const LOGO_URL =
  "https://stalwartng.com/wp-content/uploads/2025/09/cropped-cropped-Stalwart-Horizontal-768x186.png";

export default function FloatingWidget() {
  const [open, setOpen] = useState(false);

  const startChat = () => {
    window.open(CHATBOT_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        id="my-chatbot-btn"
        aria-label="Open support chat"
        className="fixed bottom-5 right-5 z-9999 flex h-[55px] w-[55px] cursor-pointer items-center justify-center rounded-full bg-[#007bff] text-[28px] text-white shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:scale-105"
      >
        💬
      </button>

      <div
        id="my-chatbot-popup"
        className={`fixed bottom-[85px] right-5 z-9999 w-[350px] max-w-[calc(100vw-40px)] rounded-xl bg-white p-5 text-center font-sans shadow-[0_8px_20px_rgba(0,0,0,0.3)] ${
          open ? "animate-[fadeIn_0.3s_ease] block" : "hidden"
        }`}
      >
        <Image
          id="chat-logo"
          src={LOGO_URL}
          alt="Stalwart logo"
          width={248}
          height={60}
          className="mx-auto mb-2.5 h-[60px] w-auto object-contain"
        />
        <div id="chat-welcome" className="mb-5 text-[15px] text-[#333]">
          Welcome! We&apos;re here to assist you. Click on the button below to
          initiate a chat.
        </div>
        <button
          type="button"
          id="chat-init-btn"
          onClick={startChat}
          className="mt-[15px] cursor-pointer rounded-lg border-0 bg-[#007bff] px-5 py-3 text-base font-bold text-white shadow-[0_4px_10px_rgba(0,0,0,0.2)] transition hover:bg-[#0056b3]"
        >
          Initiate Chat
        </button>
      </div>
    </>
  );
}
