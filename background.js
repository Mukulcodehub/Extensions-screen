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
      installTime: new Date().toISOString(),
      isMonitoring: false,
      intervalMinutes: 15,
      lastCaptureTime: null,
      captureCount: 0
    });
  }
});

// Keep service worker alive
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received:", request.action);
  
  switch (request.action) {
    case 'startMonitoring':
      startScreenshotMonitoring(request.interval);
      sendResponse({ success: true });
      break;
    
    case 'stopMonitoring':
      stopScreenshotMonitoring();
      sendResponse({ success: true });
      break;
    
    case 'captureNow':
      captureScreenshot();
      sendResponse({ success: true });
      break;
    
    case 'getStatus':
      chrome.storage.local.get(['isMonitoring', 'lastCaptureTime', 'captureCount', 'intervalMinutes'], (data) => {
        sendResponse(data);
      });
      return true;
    
    case 'screenStreamReady':
      // Notify popup that screen stream is ready
      chrome.runtime.sendMessage({
        action: 'screenAccessGranted',
        streamId: request.streamId
      });
      break;
    
    case 'screenStreamEnded':
      // Notify popup that screen sharing ended
      chrome.runtime.sendMessage({
        action: 'screenAccessEnded'
      });
      break;
    
    case 'reopenTab':
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
      sendResponse({ success: true });
      break;
  }
});

let screenshotInterval = null;

function startScreenshotMonitoring(intervalMinutes = 15) {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }
  
  console.log(`Starting screenshot monitoring every ${intervalMinutes} minutes`);
  
  chrome.storage.local.set({
    isMonitoring: true,
    intervalMinutes: intervalMinutes
  });
  
  // Start interval
  const intervalMs = intervalMinutes * 60 * 1000;
  screenshotInterval = setInterval(() => {
    captureScreenshot();
  }, intervalMs);
}

function stopScreenshotMonitoring() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
  
  console.log("Stopped screenshot monitoring");
  chrome.storage.local.set({
    isMonitoring: false
  });
}

function captureScreenshot() {
  console.log("Capturing screenshot via background...");
  
  // This would trigger the screenshot capture
  // You can implement this based on your needs
  chrome.runtime.sendMessage({
    action: 'triggerScreenshot'
  });
}

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
});

console.log("Screen Monitor Pro background initialized");