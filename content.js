// content.js - Runs in webpage context to handle screen capture
console.log("Screen Monitor Pro content script loaded");

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received:", request.action);
  
  if (request.action === 'triggerScreenCapture') {
    console.log("Triggering screen capture from content script");
    
    // Create hidden iframe for screen capture
    createCaptureIframe().then(success => {
      sendResponse({ success: success });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Keep message channel open for async response
  }
});

function createCaptureIframe() {
  return new Promise((resolve, reject) => {
    console.log("Creating capture iframe...");
    
    // Check if iframe already exists
    let iframe = document.getElementById('screenCaptureIframe');
    
    if (!iframe) {
      // Create new iframe
      iframe = document.createElement('iframe');
      iframe.id = 'screenCaptureIframe';
      iframe.src = chrome.runtime.getURL('capture.html');
      iframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 999999;
        background: transparent;
        display: none;
      `;
      
      document.body.appendChild(iframe);
      
      // Wait for iframe to load
      iframe.onload = () => {
        console.log("Capture iframe loaded");
        
        // Show the iframe
        iframe.style.display = 'block';
        
        // Send message to show capture UI
        setTimeout(() => {
          iframe.contentWindow.postMessage({
            type: 'SHOW_CAPTURE_UI'
          }, '*');
          
          // Listen for messages from iframe
          window.addEventListener('message', function iframeMessageHandler(event) {
            console.log("Content script received message from iframe:", event.data);
            
            if (event.data.type === 'SCREEN_CAPTURE_SUCCESS') {
              console.log("Screen capture success:", event.data.displaySurface);
              
              // Hide iframe
              iframe.style.display = 'none';
              
              // Send success message to popup
              chrome.runtime.sendMessage({
                action: 'screenCaptureSuccess',
                displaySurface: event.data.displaySurface
              });
              
              // Remove event listener
              window.removeEventListener('message', iframeMessageHandler);
              resolve(true);
            }
            
            if (event.data.type === 'SCREEN_CAPTURE_ERROR') {
              console.error("Screen capture error:", event.data.error);
              
              // Hide iframe
              iframe.style.display = 'none';
              
              // Send error message to popup
              chrome.runtime.sendMessage({
                action: 'screenCaptureError',
                error: event.data.error
              });
              
              // Remove event listener
              window.removeEventListener('message', iframeMessageHandler);
              reject(new Error(event.data.error));
            }
            
            if (event.data.type === 'SCREEN_CAPTURE_CANCELLED') {
              console.log("Screen capture cancelled");
              
              // Hide iframe
              iframe.style.display = 'none';
              
              // Send cancel message to popup
              chrome.runtime.sendMessage({
                action: 'screenCaptureCancelled'
              });
              
              // Remove event listener
              window.removeEventListener('message', iframeMessageHandler);
              resolve(false);
            }
          });
        }, 100);
      };
      
      iframe.onerror = (error) => {
        console.error("Iframe load error:", error);
        reject(new Error("Failed to load capture iframe"));
      };
      
    } else {
      // Iframe already exists, show it
      iframe.style.display = 'block';
      
      // Send message to show capture UI
      iframe.contentWindow.postMessage({
        type: 'SHOW_CAPTURE_UI'
      }, '*');
      
      resolve(true);
    }
  });
}