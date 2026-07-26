function syncToken() {
  const token = localStorage.getItem('token'); 
  
  if (token) {
    chrome.storage.local.get(['jobTrackerToken'], (result) => {
      if (result.jobTrackerToken !== token) {
        chrome.storage.local.set({ jobTrackerToken: token }, () => {
          console.log("✅ STUDENTSTACK: Token successfully locked into Chrome!");
        });
      } else {
        console.log("✅ StudentStack Extension is connected and ready.");
      }
    });
  }
}

// Run immediately on page load
syncToken();