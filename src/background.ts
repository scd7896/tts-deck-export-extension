import { EVENT_NAMES } from "./utils/event";
import { blobToBase64 } from "./utils/file";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === EVENT_NAMES.LOAD_CACHED_IMAGE) {
    fetchImageAsBlob(msg.payload)
      .then((blob) => blobToBase64(blob))
      .then((payload) => {
        sendResponse({ type: EVENT_NAMES.LOAD_CACHED_IMAGE, payload });
      })
      .catch((error) => {
        console.error("Failed to fetch cached image:", msg.payload, error);
        sendResponse({
          type: EVENT_NAMES.LOAD_CACHED_IMAGE,
          isError: true,
        });
      });
    return true;
  }

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

async function fetchImageAsBlob(url?: string) {
  if (!url) {
    throw new Error("Image URL is required");
  }

  const response = await fetch(url, {
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(`Image fetch failed with status ${response.status}`);
  }

  return response.blob();
}
