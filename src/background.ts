chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id || !isHttp(tab.url)) {
      console.warn("Cannot access tab:", tab?.url);
      return;
    }

    chrome.tabs.sendMessage(tab.id, msg, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("sendMessage failed:", chrome.runtime.lastError.message);
        return;
      }
      sendResponse(response);
    });
  });
});

function isHttp(url?: string) {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}
