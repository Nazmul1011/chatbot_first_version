"use client";
import ChatWidget from "@/components/ChatWidget";

export default function StandaloneChatWidget() {
  return (
    <div className="bg-transparent min-h-screen overflow-hidden">
      <ChatWidget />
    </div>
  );
}
