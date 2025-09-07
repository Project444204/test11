"use client";

import React from "react";

type NotificationBarProps = {
  text: string;
  confirmText?: string;
  onConfirm: () => void;
};

export default function NotificationBar({ text, confirmText = "نعم", onConfirm }: NotificationBarProps) {
  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center">
      <div className="bg-black/80 text-white backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
        <span className="text-sm">{text}</span>
        <button
          type="button"
          onClick={onConfirm}
          className="bg-yellow-400 text-black text-sm font-medium px-3 py-1 rounded-full hover:bg-yellow-300 active:scale-[0.98] transition"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}


