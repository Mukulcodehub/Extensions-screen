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

// Handle extension icon click - OPEN IN NEW TAB INSTEAD OF POPUP
chrome.action.onClicked.addListener(() => {
  console.log("Extension icon clicked, opening in new tab...");
  
  // Open the extension in a new tab
  chrome.tabs.create({
    url: chrome.runtime.getURL('popup.html'),
    active: true
  }, (tab) => {
    console.log("Extension opened in new tab with ID:", tab.id);
    
    // Wait for tab to load, then send a message to start screen capture
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        console.log("Tab loaded, sending screen capture request...");
        
        // Remove this listener
        chrome.tabs.onUpdated.removeListener(listener);
        
        // Send message to start screen capture
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: 'startScreenCaptureFromBackground'
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError);
            } else {
              console.log("Screen capture initiated from background");
            }
          });
        }, 1000);
      }
    });
  });
});

// Listen for messages from tabs
// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received:", request.action);
  
  // ... existing code ...
  
  if (request.action === 'screenCaptureSuccess') {
    // Forward to popup
    chrome.runtime.sendMessage(request);
  }
  
  if (request.action === 'screenCaptureError') {
    // Forward to popup
    chrome.runtime.sendMessage(request);
  }
  
  if (request.action === 'screenCaptureCancelled') {
    // Forward to popup
    chrome.runtime.sendMessage(request);
  }
});
// Start automatic screenshot monitoring
function startScreenshotMonitoring(intervalMinutes = 15) {
  console.log(`Starting screenshot monitoring every ${intervalMinutes} minutes`);
  
  chrome.storage.local.set({
    isMonitoring: true,
    intervalMinutes: intervalMinutes
  });
  
  // Notify all tabs that monitoring has started
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'monitoringStarted',
        interval: intervalMinutes
      }).catch(() => {
        // Tab might not have content script, ignore errors
      });
    });
  });
}

// Stop monitoring
function stopScreenshotMonitoring() {
  console.log("Stopped screenshot monitoring");
  
  chrome.storage.local.set({
    isMonitoring: false
  });
  
  // Notify all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'monitoringStopped'
      }).catch(() => {
        // Ignore errors
      });
    });
  });
}

function captureScreenshot() {
  console.log("Manual screenshot capture requested");
  
  // Notify tabs to capture screenshot
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'captureScreenshot'
      });
    }
  });
}

console.log("Screen Monitor Pro background initialized");