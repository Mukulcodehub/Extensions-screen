// Chrome Extension Background Service Worker for Screen Monitor Pro

console.log("Screen Monitor Pro background service worker loaded");

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed/updated:", details.reason);

  if (details.reason === "install") {
    console.log("Initial installation detected");
    // Set initial storage state
    chrome.storage.local.set({
      extensionInitialized: true,
      installTime: new Date().toISOString()
    });
  }
});

// Keep service worker alive (optional, for persistent background tasks)
// This is useful if the extension needs to perform tasks when popup is closed

let keepAlivePort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'keepAlive') {
    keepAlivePort = port;

    port.onDisconnect.addListener(() => {
      keepAlivePort = null;
      console.log('Background keep-alive port disconnected');
    });

    console.log('Background keep-alive port connected');
  }
});

// Listen for messages from tab
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'reopenTab') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  }
});

// Minimal periodic check (optional)
setInterval(() => {
  // This could be used for periodic checks if needed
  // console.log('Background tick');
}, 60000); // Every minute

// Handle extension icon click - open in new tab
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
});

console.log("Screen Monitor Pro background initialized");
