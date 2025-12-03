// content.js - Runs in webpage context
console.log("Screen Monitor Pro content script loaded");

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received:", request);
  
  if (request.action === 'checkScreenAccess') {
    // Check if we have screen access
    navigator.mediaDevices.getDisplayMedia({ video: true })
      .then(stream => {
        // We have access
        stream.getTracks().forEach(track => track.stop());
        sendResponse({ hasAccess: true });
      })
      .catch(error => {
        sendResponse({ hasAccess: false, error: error.message });
      });
    return true;
  }
  
  if (request.action === 'startScreenCapture') {
    // This will trigger the permission dialog
    // The popup won't close because this runs in webpage context
    navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "monitor",
        cursor: "always"
      },
      audio: false
    }).then(stream => {
      // Send stream back to popup
      chrome.runtime.sendMessage({
        action: 'screenStreamReady',
        streamId: stream.id
      });
      
      // Keep stream alive
      const video = document.createElement('video');
      video.srcObject = stream;
      video.style.display = 'none';
      document.body.appendChild(video);
      
      // Handle track ending
      stream.getVideoTracks()[0].onended = () => {
        chrome.runtime.sendMessage({ action: 'screenStreamEnded' });
        video.remove();
      };
      
      sendResponse({ success: true, streamId: stream.id });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    
    return true;
  }
});