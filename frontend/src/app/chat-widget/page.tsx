"use client";
import ChatWidget from "@/components/ChatWidget";

export default function StandaloneChatWidget() {
  return (
    <>
      {/* Purges the global CSS background exactly for this Iframe to prevent the grey rectangle shadow */}
      <style dangerouslySetInnerHTML={{ __html: 'body, html { background: transparent !important; margin: 0; padding: 0; }' }} />
      <div className="bg-transparent h-screen w-screen overflow-hidden">
        <ChatWidget isEmbedded={true} />
      </div>
    </>
  );
}
