chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id || !isHttp(tab.url)) {
      console.warn("Cannot access tab:", tab?.url);
      return;
    }

    chrome.tabs.sendMessage(tab.id, msg, (response) => {
      console.log("response", response?.type, response?.payload);
      if (chrome.runtime.lastError) {
        sendResponse({ ...msg, isError: true });
        return;
      }

      sendResponse(response);
    });
  });
  return true;
});

function isHttp(url?: string) {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}
