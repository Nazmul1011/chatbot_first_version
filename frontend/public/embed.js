(function () {
  const script = document.currentScript;
  const apiKey = script.getAttribute('data-api-key');
  const marketingId = script.getAttribute('data-marketing-id');
  const baseUrl = "http://localhost:3000/chat-widget";

  if (!apiKey) {
    console.error("ChatAgent: Missing data-api-key.");
    return;
  }

  // Determine Iframe URL with Params
  const query = new URLSearchParams({
    api_key: apiKey,
    marketing_id: marketingId || ""
  }).toString();
  const iframeUrl = `${baseUrl}?${query}`;

  // 1. Create Iframe Container (Full Screen Overlay but Transparent)
  const container = document.createElement("div");
  container.id = "chat-agent-master-container";
  container.style.cssText = `
    position: fixed;
    bottom: 0; right: 0;
    width: 450px; height: 750px;
    background: transparent;
    border: none;
    z-index: 99999999;
    overflow: hidden;
    pointer-events: none;
  `;

  // 2. Create the Iframe portal
  const iframe = document.createElement("iframe");
  iframe.src = iframeUrl;
  iframe.style.cssText = `
    width: 100%; height: 100%;
    border: none;
    background: transparent;
    pointer-events: auto;
  `;

  container.appendChild(iframe);
  document.body.appendChild(container);

  // 3. Dynamic Resizer Logic (Listens for 'Open/Close' from the React App)
  window.addEventListener("message", (event) => {
    // Only trust messages from our widget
    if (event.origin !== "http://localhost:3000") return;

    if (event.data.type === "CHAT_OPEN") {
      container.style.width = "450px";
      container.style.height = "750px";
      container.style.pointerEvents = "auto";
    } else if (event.data.type === "CHAT_MAXIMIZE") {
      container.style.width = "90vw";
      container.style.height = "90vh";
      container.style.maxWidth = "1200px";
    } else if (event.data.type === "CHAT_CLOSE") {
      container.style.width = "100px";
      container.style.height = "100px";
    }
  });

  // Initial State: Tiny
  container.style.width = "100px";
  container.style.height = "100px";

  // Mobile Handling
  if (window.innerWidth < 640) {
    // Handle mobile differently if needed
  }

})();
