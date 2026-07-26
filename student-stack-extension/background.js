const BASE_URL = "https://student-stack-3f9j-4i1cr7t6q-urvi2.vercel.app";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "EXECUTE_HEIST") {
    console.log("🕵️‍♂️ Background Agent: Multi-Platform Heist initialized.");
    
    (async () => {
      try {
        const solvedProblemsMap = new Map();

        // ==========================================
        // 1. LEETCODE HEIST (Requires active login cookie)
        // ==========================================
        if (request.handles?.leetcode) {
          console.log("🟠 Starting LeetCode Heist...");
          let offset = 0;
          let keepFetching = true;

          while (keepFetching) {
            console.log(`🕵️‍♂️ Fetching LeetCode offset ${offset}...`);
            
            const lcResponse = await fetch(`https://leetcode.com/api/submissions/?offset=${offset}&limit=100`, {
              method: 'GET',
              credentials: 'include',
              headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            });
            
            if (lcResponse.ok) {
              const lcData = await lcResponse.json();
              const dump = lcData.submissions_dump || [];

              if (dump.length === 0) {
                keepFetching = false;
                break;
              }

              dump.forEach(sub => {
                if (sub.status_display === "Accepted") {
                  solvedProblemsMap.set(`LC-${sub.title}`, { title: sub.title, platform: "LeetCode", timestamp: sub.timestamp });
                }
              });

              if (!lcData.has_next) keepFetching = false;
              else {
                offset += dump.length;
                await new Promise(resolve => setTimeout(resolve, 2500));
              }
            } else if (lcResponse.status === 429 || lcResponse.status === 403) {
              console.warn(`⚠️ LeetCode Firewall hit at offset ${offset}! Pausing for 10 seconds to cool down...`);
              await new Promise(resolve => setTimeout(resolve, 10000)); 
            } else {
              console.error("❌ Fatal LeetCode Error:", lcResponse.status);
              keepFetching = false;
            }
          }
        }

        // ==========================================
        // 2. CODEFORCES HEIST (Public API)
        // ==========================================
        if (request.handles?.codeforces) {
          console.log(`🔵 Starting Codeforces Heist for ${request.handles.codeforces}...`);
          try {
            const cfRes = await fetch(`https://codeforces.com/api/user.status?handle=${request.handles.codeforces}`);
            if (cfRes.ok) {
              const cfData = await cfRes.json();
              if (cfData.status === "OK") {
                cfData.result.forEach(sub => {
                  if (sub.verdict === "OK") {
                    solvedProblemsMap.set(`CF-${sub.problem.name}`, { title: sub.problem.name, platform: "Codeforces" });
                  }
                });
              }
            }
          } catch (err) { console.error("Codeforces sync failed", err); }
        }

        // ==========================================
        // 3. GEEKSFORGEEKS HEIST (HTML Scraper)
        // ==========================================
        if (request.handles?.geeksforgeeks) {
          console.log(`🟢 Starting GFG Heist for ${request.handles.geeksforgeeks}...`);
          try {
            const gfgRes = await fetch(`https://www.geeksforgeeks.org/user/${request.handles.geeksforgeeks}/`);
            if (gfgRes.ok) {
              const htmlText = await gfgRes.text();
              const regex = /<a href="https:\/\/practice\.geeksforgeeks\.org\/problems\/[^"]+">([^<]+)<\/a>/g;
              let match;
              while ((match = regex.exec(htmlText)) !== null) {
                const problemTitle = match[1].trim();
                solvedProblemsMap.set(`GFG-${problemTitle}`, { title: problemTitle, platform: "GeeksForGeeks" });
              }
            }
          } catch (err) { console.error("GFG sync failed", err); }
        }

        // ==========================================
        // 4. SEND FINAL PAYLOAD TO LIVE BACKEND
        // ==========================================
        const finalPayload = Array.from(solvedProblemsMap.values());
        console.log(`🚀 Multi-Heist Complete! Extracted ${finalPayload.length} total solutions. Sending to backend...`);

        const backendRes = await fetch(`${BASE_URL}/api/dsa/extension-sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${request.token}`
          },
          body: JSON.stringify({ submissions: finalPayload })
        });

        if (backendRes.ok) {
          sendResponse({ type: "SYNC_SUCCESS", count: finalPayload.length });
        } else {
          sendResponse({ type: "SYNC_ERROR", message: "Backend rejected the payload." });
        }

      } catch (error) {
        console.error("🕵️‍♂️ Error:", error);
        sendResponse({ type: "SYNC_ERROR", message: "Network error during heist." });
      }
    })();

    return true; 
  }
});

// Real-time Single Submission Tracking
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "LEETCODE_SUBMISSION_ACCEPTED") {
        
        chrome.storage.local.get(['studentStackToken'], async (result) => {
            if (!result.studentStackToken) {
                chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_ERROR", message: "❌ ERROR: No token found in extension! Refresh your StudentStack Dashboard to re-sync the token." });
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/api/dsa/problems/track-submission`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${result.studentStackToken}`
                    },
                    body: JSON.stringify(message.payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_REPLY", message: `✅ SUCCESS: StudentStack Server saved [${data.title}]!` });
                } else {
                    const errData = await response.json();
                    chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_ERROR", message: `⚠️ SERVER REJECTED (${response.status}): ${errData.message}` });
                }
            } catch (err) {
                chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_ERROR", message: `❌ FETCH FAILED: Is your server running?` });
            }
        });
    }
});