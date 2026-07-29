// =======================================================
// PART 1: THE OS BRIDGE (Runs on your React Dashboard)
// =======================================================
// Inject marker indicating extension content script is loaded and active
document.documentElement.setAttribute("data-studentstack-extension-active", "true");

window.addEventListener("message", (event) => {
  if (event.source === window && event.data.type === "PING_STUDENTSTACK_EXTENSION") {
    window.postMessage({ type: "PONG_STUDENTSTACK_EXTENSION" }, "*");
  }

  if (event.source === window && event.data.type === "VERIFY_STUDENTSTACK_HANDLES") {
    chrome.runtime.sendMessage(
      { action: "VERIFY_HANDLES", handles: event.data.handles },
      (response) => {
        window.postMessage({ type: "VERIFY_HANDLES_RESPONSE", results: response }, "*");
      }
    );
  }

  if (event.source === window && event.data.type === "START_LEETCODE_SYNC") {
    chrome.runtime.sendMessage(
      { 
        action: "EXECUTE_HEIST", 
        token: event.data.token, 
        handles: event.data.handles,
        baseUrl: event.data.baseUrl || window.location.origin
      },
      (response) => {
        if (response && response.type === "SYNC_SUCCESS") {
          window.postMessage({ 
            type: "SYNC_SUCCESS", 
            count: response.count,
            platformStatuses: response.platformStatuses 
          }, "*");
        } else {
          window.postMessage({ 
            type: "SYNC_ERROR", 
            message: response?.message || "Unknown error",
            platformStatuses: response?.platformStatuses
          }, "*");
        }
      }
    );
  }

  if (event.source === window && event.data.type === "SAVE_EXTENSION_TOKEN") {
    const backendUrl = event.data.backendUrl || window.location.origin;
    chrome.storage.local.set({ 
      studentStackToken: event.data.token,
      studentStackBackendUrl: backendUrl
    }, () => {
      console.log("🔐 Token and Backend URL securely saved to Extension Storage:", backendUrl);
    });
  }
});

// Helper Function to Beam Data to Node.js
const sendToStudentStack = (url, platform, runtime, memory) => {
  chrome.runtime.sendMessage({
      type: "LEETCODE_SUBMISSION_ACCEPTED",
      payload: { problemUrl: url, platform: platform, isAccepted: true, runtime: runtime, memory: memory }
  });
};

// Listen for Server Replies
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SERVER_REPLY") console.log("%c" + msg.message, "color: #00ff00; font-weight: bold; font-size: 16px;");
  if (msg.type === "SERVER_ERROR") console.log("%c" + msg.message, "color: #ff0000; font-weight: bold; font-size: 16px;");
});

// =======================================================
// PART 2: LEETCODE INTERCEPTOR
// =======================================================
if (window.location.hostname.includes("leetcode.com")) {
  console.log("🟢 StudentStack LeetCode Interceptor Active");
  const observer = new MutationObserver(() => {
      const acceptedText = document.querySelector('[data-e2e-locator="submission-result"]');
      if (acceptedText && acceptedText.innerText.includes("Accepted") && !window.hasTrackedThisSubmission) {
          window.hasTrackedThisSubmission = true; 
          setTimeout(() => {
              const fullText = document.body.innerText;
              const runtimeMatch = fullText.match(/Runtime[\s\S]*?(\d+\s*ms)/i);
              const memoryMatch = fullText.match(/Memory[\s\S]*?(\d+(?:\.\d+)?\s*MB)/i);
              sendToStudentStack(
                window.location.href, "LeetCode", 
                runtimeMatch ? runtimeMatch[1].replace(/\s+/g, ' ') : "N/A", 
                memoryMatch ? memoryMatch[1].replace(/\s+/g, ' ') : "N/A"
              );
          }, 1000);
          setTimeout(() => { window.hasTrackedThisSubmission = false; }, 5000);
      }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// =======================================================
// PART 3: GEEKSFORGEEKS INTERCEPTOR
// =======================================================
if (window.location.hostname.includes("geeksforgeeks.org")) {
  console.log("🟢 StudentStack GFG Interceptor Active");
  const observer = new MutationObserver(() => {
      const fullText = document.body.innerText;
      if ((fullText.includes("Problem Solved Successfully") || fullText.includes("Correct Answer")) && !window.hasTrackedThisSubmission) {
          window.hasTrackedThisSubmission = true; 
          setTimeout(() => {
              const txt = document.body.innerText;
              const timeMatch = txt.match(/Time Taken:\s*([0-9.]+)/i);
              const runtime = timeMatch ? timeMatch[1] + " sec" : "N/A";
              sendToStudentStack(window.location.href, "GeeksForGeeks", runtime, "N/A");
          }, 1500);
          setTimeout(() => { window.hasTrackedThisSubmission = false; }, 5000);
      }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// =======================================================
// PART 4: CODEFORCES INTERCEPTOR
// =======================================================
if (window.location.hostname.includes("codeforces.com")) {
  console.log("🟢 StudentStack Codeforces Interceptor Active");
  const observer = new MutationObserver(() => {
      const acceptedTag = document.querySelector('.verdict-accepted');
      if (acceptedTag && !window.hasTrackedThisSubmission) {
          window.hasTrackedThisSubmission = true; 
          sendToStudentStack(window.location.href, "Codeforces", "N/A", "N/A");
          setTimeout(() => { window.hasTrackedThisSubmission = false; }, 5000);
      }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}