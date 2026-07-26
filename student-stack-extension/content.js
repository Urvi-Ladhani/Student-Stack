// =======================================================
// PART 1: THE OS BRIDGE (Runs on your React Dashboard)
// =======================================================
window.addEventListener("message", (event) => {
  if (event.source === window && event.data.type === "START_LEETCODE_SYNC") {
    chrome.runtime.sendMessage(
      { action: "EXECUTE_HEIST", token: event.data.token, handles: event.data.handles },
      (response) => {
        if (response && response.type === "SYNC_SUCCESS") {
          window.postMessage({ type: "SYNC_SUCCESS", count: response.count }, "*");
        } else {
          window.postMessage({ type: "SYNC_ERROR", message: response?.message || "Unknown error" }, "*");
        }
      }
    );
  }

  if (event.source === window && event.data.type === "SAVE_EXTENSION_TOKEN") {
    chrome.storage.local.set({ studentStackToken: event.data.token }, () => {
      console.log("🔐 Token securely saved to Extension Storage!");
    });
  }
});

// Helper Function to Beam Data to Node.js
const sendToStudentStack = (url, platform, runtime, memory) => {
  chrome.runtime.sendMessage({
      type: "LEETCODE_SUBMISSION_ACCEPTED", // Reusing this event name for all platforms
      payload: { problemUrl: url, platform: platform, isAccepted: true, runtime: runtime, memory: memory }
  });
};

// Listen for Server Replies (The X-Ray Vision)
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
      // GFG usually says "Problem Solved Successfully"
      if ((fullText.includes("Problem Solved Successfully") || fullText.includes("Correct Answer")) && !window.hasTrackedThisSubmission) {
          window.hasTrackedThisSubmission = true; 
          setTimeout(() => {
              const txt = document.body.innerText;
              const timeMatch = txt.match(/Time Taken:\s*([0-9.]+)/i);
              const runtime = timeMatch ? timeMatch[1] + " sec" : "N/A";
              // GFG rarely shows strict memory usage on the success screen, default to N/A
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
      // CF shows "Accepted" with this specific class in their status table
      const acceptedTag = document.querySelector('.verdict-accepted');
      if (acceptedTag && !window.hasTrackedThisSubmission) {
          window.hasTrackedThisSubmission = true; 
          // CF live scraping is tricky because of the table layout, default to N/A
          sendToStudentStack(window.location.href, "Codeforces", "N/A", "N/A");
          setTimeout(() => { window.hasTrackedThisSubmission = false; }, 5000);
      }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}