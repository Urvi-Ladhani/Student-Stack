let BASE_URL = "https://student-stack-3f9j-4i1cr7t6q-urvi2.vercel.app";

// Load from storage on startup
chrome.storage.local.get(['studentStackBackendUrl'], (result) => {
  if (result.studentStackBackendUrl) {
    BASE_URL = result.studentStackBackendUrl;
    console.log("🎒 Restored BASE_URL from storage:", BASE_URL);
  }
});

let currentSyncController = null;
let isPaused = false;
let pauseResolver = null;
let currentPlatform = null;

function reportProgress(platform, status) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: "SYNC_PROGRESS_UPDATE",
        platform: platform,
        status: status,
        isPaused: isPaused
      }).catch(err => {});
    });
  });
}

async function checkPauseAndStop() {
  if (currentSyncController?.signal.aborted) {
    throw new Error("STOPPED");
  }
  if (isPaused) {
    reportProgress(currentPlatform, "paused");
    await new Promise((resolve) => {
      pauseResolver = resolve;
    });
  }
  if (currentSyncController?.signal.aborted) {
    throw new Error("STOPPED");
  }
}

// Fetch helper with timeout and abort signal linking
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 15000, signal } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort());
    }
  }

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Verification helpers
async function verifyLeetCodeUsername(username) {
  try {
    const res = await fetchWithTimeout('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({
        query: `query getUserProfile($username: String!) { matchedUser(username: $username) { username } }`,
        variables: { username }
      }),
      timeout: 10000
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.data?.matchedUser;
  } catch (err) {
    console.error("LeetCode verification error:", err);
    return false;
  }
}

async function verifyCodeforcesHandle(handle) {
  try {
    const res = await fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${handle}`, {
      timeout: 10000
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'OK';
  } catch (err) {
    console.error("Codeforces verification error:", err);
    return false;
  }
}

async function verifyGFGUsername(username) {
  try {
    const res = await fetchWithTimeout(`https://www.geeksforgeeks.org/user/${username}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 12000
    });
    if (!res.ok) return false;
    const htmlText = await res.text();
    const hasProfile = htmlText.includes("gfg_user_profile") || 
                        htmlText.includes("profile_name") || 
                        htmlText.includes("profile-pic") || 
                        htmlText.includes("Problems Solved") || 
                        htmlText.includes("score_card");
    return hasProfile;
  } catch (err) {
    console.error("GFG verification error:", err);
    return false;
  }
}

// Primary listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. VERIFY HANDLES REQUEST
  if (request.action === "VERIFY_HANDLES") {
    (async () => {
      const results = {};
      try {
        if (request.handles?.leetcode) {
          const isValid = await verifyLeetCodeUsername(request.handles.leetcode);
          results.leetcode = { valid: isValid, message: isValid ? "Connected" : "Invalid Username" };
        } else {
          results.leetcode = { valid: true, message: "Not Linked" };
        }
        
        if (request.handles?.codeforces) {
          const isValid = await verifyCodeforcesHandle(request.handles.codeforces);
          results.codeforces = { valid: isValid, message: isValid ? "Connected" : "Invalid Username" };
        } else {
          results.codeforces = { valid: true, message: "Not Linked" };
        }
        
        if (request.handles?.geeksforgeeks) {
          const isValid = await verifyGFGUsername(request.handles.geeksforgeeks);
          results.geeksforgeeks = { valid: isValid, message: isValid ? "Connected" : "Invalid Username" };
        } else {
          results.geeksforgeeks = { valid: true, message: "Not Linked" };
        }
        
        sendResponse(results);
      } catch (err) {
        console.error("Verification handler error:", err);
        sendResponse({
          leetcode: { valid: false, message: "Error" },
          codeforces: { valid: false, message: "Error" },
          geeksforgeeks: { valid: false, message: "Error" }
        });
      }
    })();
    return true; // async reply
  }

  // 2. PAUSE SYNC REQUEST
  if (request.action === "PAUSE_HEIST") {
    isPaused = true;
    reportProgress(currentPlatform, "paused");
    sendResponse({ success: true, platform: currentPlatform });
    return true;
  }

  // 3. RESUME SYNC REQUEST
  if (request.action === "RESUME_HEIST") {
    isPaused = false;
    if (pauseResolver) {
      pauseResolver();
      pauseResolver = null;
    }
    reportProgress(currentPlatform, "syncing");
    sendResponse({ success: true, platform: currentPlatform });
    return true;
  }

  // 4. STOP SYNC REQUEST
  if (request.action === "STOP_HEIST") {
    isPaused = false;
    if (currentSyncController) {
      currentSyncController.abort();
    }
    if (pauseResolver) {
      pauseResolver();
      pauseResolver = null;
    }
    reportProgress(null, "stopped");
    sendResponse({ success: true });
    return true;
  }

  // 5. EXECUTE HEIST REQUEST (Syncing progress)
  if (request.action === "EXECUTE_HEIST") {
    console.log("🕵️‍♂️ Background Agent: Multi-Platform Heist initialized.");
    
    if (request.baseUrl) {
      BASE_URL = request.baseUrl;
      chrome.storage.local.set({ studentStackBackendUrl: request.baseUrl });
    }

    currentSyncController = new AbortController();
    isPaused = false;

    (async () => {
      try {
        const solvedProblemsMap = new Map();
        const syncedPlatforms = { leetcode: false, codeforces: false, geeksforgeeks: false };
        const platformStatuses = {
          leetcode: "Not Linked",
          codeforces: "Not Linked",
          geeksforgeeks: "Not Linked"
        };

        // ==========================================
        // 1. LEETCODE HEIST
        // ==========================================
        if (request.handles?.leetcode) {
          console.log("🟠 Starting LeetCode Heist...");
          currentPlatform = "LeetCode";
          reportProgress("LeetCode", "syncing");
          await checkPauseAndStop();

          platformStatuses.leetcode = "Verifying...";
          let offset = 0;
          let keepFetching = true;
          let lcSuccess = false;

          try {
            while (keepFetching) {
              await checkPauseAndStop();
              console.log(`🕵️‍♂️ Fetching LeetCode offset ${offset}...`);
              
              const lcResponse = await fetchWithTimeout(`https://leetcode.com/api/submissions/?offset=${offset}&limit=100`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                timeout: 15000,
                signal: currentSyncController?.signal
              });
              
              if (lcResponse.ok) {
                const contentType = lcResponse.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                  console.error("❌ LeetCode returned non-JSON. Logged out?");
                  platformStatuses.leetcode = "Sync Failed: Logged out";
                  keepFetching = false;
                  break;
                }

                const lcData = await lcResponse.json();
                const dump = lcData.submissions_dump || [];

                if (dump.length === 0) {
                  lcSuccess = true;
                  keepFetching = false;
                  break;
                }

                dump.forEach(sub => {
                  if (sub.status_display === "Accepted") {
                    solvedProblemsMap.set(`LC-${sub.title}`, { title: sub.title, platform: "LeetCode", timestamp: sub.timestamp });
                  }
                });

                if (!lcData.has_next) {
                  lcSuccess = true;
                  keepFetching = false;
                } else {
                  offset += dump.length;
                  await new Promise((resolve, reject) => {
                    const timerId = setTimeout(resolve, 2000);
                    currentSyncController?.signal.addEventListener('abort', () => {
                      clearTimeout(timerId);
                      reject(new Error("STOPPED"));
                    });
                  });
                }
              } else if (lcResponse.status === 401 || lcResponse.status === 403) {
                console.error("❌ LeetCode Unauthorized/Logged out");
                platformStatuses.leetcode = "Sync Failed: Logged out";
                keepFetching = false;
              } else if (lcResponse.status === 429) {
                console.warn(`⚠️ LeetCode Firewall hit. Pausing...`);
                await new Promise((resolve, reject) => {
                  const timerId = setTimeout(resolve, 5000);
                  currentSyncController?.signal.addEventListener('abort', () => {
                    clearTimeout(timerId);
                    reject(new Error("STOPPED"));
                  });
                }); 
              } else {
                console.error("❌ LeetCode HTTP Error:", lcResponse.status);
                platformStatuses.leetcode = `Sync Failed: HTTP ${lcResponse.status}`;
                keepFetching = false;
              }
            }
            if (lcSuccess) {
              syncedPlatforms.leetcode = true;
              platformStatuses.leetcode = "Connected";
            }
          } catch (err) {
            if (err.message === "STOPPED") throw err;
            console.error("LeetCode heist failed:", err);
            platformStatuses.leetcode = "Sync Failed: Timeout/Network Error";
          }
        }

        // ==========================================
        // 2. CODEFORCES HEIST
        // ==========================================
        if (request.handles?.codeforces) {
          console.log(`🔵 Starting Codeforces Heist for ${request.handles.codeforces}...`);
          currentPlatform = "Codeforces";
          reportProgress("Codeforces", "syncing");
          await checkPauseAndStop();

          platformStatuses.codeforces = "Verifying...";
          try {
            const cfRes = await fetchWithTimeout(`https://codeforces.com/api/user.status?handle=${request.handles.codeforces}`, {
              timeout: 15000,
              signal: currentSyncController?.signal
            });
            if (cfRes.ok) {
              const cfData = await cfRes.json();
              if (cfData.status === "OK") {
                cfData.result.forEach(sub => {
                  if (sub.verdict === "OK") {
                    solvedProblemsMap.set(`CF-${sub.problem.name}`, { title: sub.problem.name, platform: "Codeforces" });
                  }
                });
                syncedPlatforms.codeforces = true;
                platformStatuses.codeforces = "Connected";
              } else {
                platformStatuses.codeforces = "Sync Failed: Invalid User";
              }
            } else {
              platformStatuses.codeforces = `Sync Failed: HTTP ${cfRes.status}`;
            }
          } catch (err) {
            if (err.message === "STOPPED") throw err;
            console.error("Codeforces sync failed", err);
            platformStatuses.codeforces = "Sync Failed: Timeout/Network Error";
          }
        }

        // ==========================================
        // 3. GEEKSFORGEEKS HEIST
        // ==========================================
        if (request.handles?.geeksforgeeks) {
          console.log(`🟢 Starting GFG Heist for ${request.handles.geeksforgeeks}...`);
          currentPlatform = "GeeksForGeeks";
          reportProgress("GeeksForGeeks", "syncing");
          await checkPauseAndStop();

          platformStatuses.geeksforgeeks = "Verifying...";
          try {
            const gfgRes = await fetchWithTimeout(`https://www.geeksforgeeks.org/user/${request.handles.geeksforgeeks}/`, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              timeout: 15000,
              signal: currentSyncController?.signal
            });
            if (gfgRes.ok) {
              const htmlText = await gfgRes.text();
              const regex = /<a href="https:\/\/practice\.geeksforgeeks\.org\/problems\/[^"]+">([^<]+)<\/a>/g;
              let match;
              while ((match = regex.exec(htmlText)) !== null) {
                const problemTitle = match[1].trim();
                solvedProblemsMap.set(`GFG-${problemTitle}`, { title: problemTitle, platform: "GeeksForGeeks" });
              }
              syncedPlatforms.geeksforgeeks = true;
              platformStatuses.geeksforgeeks = "Connected";
            } else {
              platformStatuses.geeksforgeeks = `Sync Failed: HTTP ${gfgRes.status}`;
            }
          } catch (err) {
            if (err.message === "STOPPED") throw err;
            console.error("GFG sync failed", err);
            platformStatuses.geeksforgeeks = "Sync Failed: Timeout/Network Error";
          }
        }

        // ==========================================
        // 4. SEND FINAL PAYLOAD TO LIVE BACKEND
        // ==========================================
        await checkPauseAndStop();
        const finalPayload = Array.from(solvedProblemsMap.values());
        console.log(`🚀 Multi-Heist Complete! Extracted ${finalPayload.length} total solutions. Sending to backend BASE_URL: ${BASE_URL}...`);

        const backendRes = await fetchWithTimeout(`${BASE_URL}/api/dsa/extension-sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${request.token}`
          },
          body: JSON.stringify({ 
            submissions: finalPayload,
            syncedPlatforms: syncedPlatforms
          }),
          timeout: 20000,
          signal: currentSyncController?.signal
        });

        if (backendRes.ok) {
          sendResponse({ 
            type: "SYNC_SUCCESS", 
            count: finalPayload.length,
            platformStatuses: platformStatuses
          });
        } else {
          sendResponse({ 
            type: "SYNC_ERROR", 
            message: "Backend rejected the payload.",
            platformStatuses: platformStatuses
          });
        }

      } catch (error) {
        if (error.message === "STOPPED") {
          console.log("🛑 Heist process halted dynamically.");
          sendResponse({
            type: "SYNC_ERROR",
            message: "Sync stopped by user.",
            platformStatuses: platformStatuses
          });
          return;
        }
        console.error("🕵️‍♂️ Heist process error:", error);
        sendResponse({ type: "SYNC_ERROR", message: error.message || "Network error during heist.", platformStatuses: {
          leetcode: request.handles?.leetcode ? "Sync Failed" : "Not Linked",
          codeforces: request.handles?.codeforces ? "Sync Failed" : "Not Linked",
          geeksforgeeks: request.handles?.geeksforgeeks ? "Sync Failed" : "Not Linked"
        }});
      } finally {
        currentSyncController = null;
        currentPlatform = null;
        isPaused = false;
      }
    })();

    return true; 
  }
});

// Real-time Single Submission Tracking
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "LEETCODE_SUBMISSION_ACCEPTED") {
        chrome.storage.local.get(['studentStackToken', 'studentStackBackendUrl'], async (result) => {
            const token = result.studentStackToken;
            const activeBaseUrl = result.studentStackBackendUrl || BASE_URL;

            if (!token) {
                chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_ERROR", message: "❌ ERROR: No token found in extension! Refresh your StudentStack Dashboard to re-sync the token." });
                sendResponse({ success: false, error: "No token found" });
                return;
            }

            try {
                const response = await fetchWithTimeout(`${activeBaseUrl}/api/dsa/problems/track-submission`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(message.payload),
                    timeout: 10000
                });
                
                if (response.ok) {
                    const data = await response.json();
                    chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_REPLY", message: `✅ SUCCESS: StudentStack Server saved [${data.title}]!` });
                    sendResponse({ success: true, data });
                } else {
                    const errData = await response.json();
                    chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_ERROR", message: `⚠️ SERVER REJECTED (${response.status}): ${errData.message}` });
                    sendResponse({ success: false, error: errData.message });
                }
            } catch (err) {
                chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_ERROR", message: `❌ FETCH FAILED: Is your server running?` });
                sendResponse({ success: false, error: err.message });
            }
        });
        return true; // Keep message channel open for async response
    }
});

// ==========================================
// 6. SCRAPE LINKEDIN JOBS REQUEST
// ==========================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SCRAPE_LINKEDIN_JOBS") {
        (async () => {
            try {
                console.log("🕵️‍♂️ Extension scraping LinkedIn URL:", request.url);
                
                chrome.storage.local.get(['studentStackToken', 'studentStackBackendUrl'], async (result) => {
                    const token = result.studentStackToken;
                    const activeBaseUrl = result.studentStackBackendUrl || BASE_URL;

                    if (!token) {
                        sendResponse({ success: false, message: "❌ ERROR: No token found in extension!" });
                        return;
                    }

                    try {
                        const response = await fetchWithTimeout(`${activeBaseUrl}/api/internships/linkedin/scrape`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ url: request.url }),
                            timeout: 10000
                        });

                        if (response.ok) {
                            const data = await response.json();
                            sendResponse({ success: true, jobs: data.jobs || [] });
                        } else {
                            const errData = await response.json().catch(() => ({}));
                            sendResponse({ success: false, message: errData.message || `LinkedIn returned HTTP ${response.status}`, jobs: [] });
                        }
                    } catch (err) {
                        console.error("LinkedIn scraper connection/fetch error:", err);
                        sendResponse({ success: false, message: `Failed to connect to backend: ${err.message}`, jobs: [] });
                    }
                });
            } catch (err) {
                console.error("LinkedIn scraper outer handler error:", err);
                sendResponse({ success: false, message: err.message || "Failed to scrape LinkedIn jobs", jobs: [] });
            }
        })();
        return true; // Keep message channel open for async response
    }
});