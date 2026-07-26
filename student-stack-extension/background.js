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
                await new Promise(resolve => setTimeout(resolve, 2500)); // Normal 2.5s delay
              }
            } else if (lcResponse.status === 429 || lcResponse.status === 403) {
              // 🔥 THE NEW FIX: Don't give up! Just wait 10 seconds and try again.
              console.warn(`⚠️ LeetCode Firewall hit at offset ${offset}! Pausing for 10 seconds to cool down...`);
              await new Promise(resolve => setTimeout(resolve, 10000)); 
            } else {
              console.error("❌ Fatal LeetCode Error:", lcResponse.status);
              keepFetching = false; // Give up only if it's a completely unknown server error
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
                    // Codeforces problem titles often have the letter attached (e.g. "A. Watermelon")
                    // The backend should ideally match loosely, but we pass the exact name.
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
            // GFG doesn't have a clean API, so we scrape the user's practice profile
            const gfgRes = await fetch(`https://www.geeksforgeeks.org/user/${request.handles.geeksforgeeks}/`);
            if (gfgRes.ok) {
              const htmlText = await gfgRes.text();
              
              // We use a regular expression to rip the problem names out of the HTML tags
              // GFG lists solved problems in anchor tags like: <a href=".../problem-name/">Problem Name</a>
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
        // 4. SEND FINAL PAYLOAD TO BACKEND
        // ==========================================
        const finalPayload = Array.from(solvedProblemsMap.values());
        console.log(`🚀 Multi-Heist Complete! Extracted ${finalPayload.length} total solutions. Sending to backend...`);

        const backendRes = await fetch("http://localhost:5000/api/dsa/extension-sync", {
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

// Add this inside your existing background.js (Service Worker)

// Add/Replace this block in your background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "LEETCODE_SUBMISSION_ACCEPTED") {
        
        chrome.storage.local.get(['studentStackToken'], async (result) => {
            if (!result.studentStackToken) {
                chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_ERROR", message: "❌ ERROR: No token found in extension! Refresh your StudentStack Dashboard to re-sync the token." });
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/dsa/problems/track-submission', {
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
                chrome.tabs.sendMessage(sender.tab.id, { type: "SERVER_ERROR", message: `❌ FETCH FAILED: Is your Node server running?` });
            }
        });
    }
});