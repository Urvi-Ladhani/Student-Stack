console.log("🚀 STUDENTSTACK: Interceptor online and watching the page!");

// 1. Sleek Toast UI
function showToast(message, type = "success") {
  const oldToast = document.getElementById("studentstack-toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.id = "studentstack-toast";
  toast.innerText = message;
  toast.style.cssText = `
    position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
    background: ${type === "success" ? "#10b981" : "#ef4444"};
    color: #ffffff; font-family: system-ui, sans-serif; font-size: 14px;
    font-weight: 600; padding: 12px 24px; border-radius: 50px;
    z-index: 2147483647; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    pointer-events: none; transition: opacity 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 3500);
}

// 2. The Pinpoint Scraper
// 2. The Hyperlink Scraper
function extractJobDetails() {
  let role = 'Unknown Role';
  let company = 'Unknown Company';

  try {
    const jobPanel = document.querySelector('.jobs-search__right-rail') || 
                     document.querySelector('.job-view-layout-jobs-details') || 
                     document.body;

    // 1. Get the Company (This is working perfectly!)
    const companyEl = jobPanel.querySelector('a[href*="/company/"]');
    if (companyEl) {
      company = companyEl.textContent.trim();
    }

    // 2. Get the Role (The Hyperlink Strategy)
    // Find the main job link at the top of the panel
    const titleLink = jobPanel.querySelector('a[href*="/jobs/view/"]');
    
    if (titleLink && titleLink.textContent.trim().length > 2) {
      // Grab the raw text and clean it up
      role = titleLink.textContent.trim().split('\n')[0].trim();
    } 
    
    // Fallback just in case: brute force grab the first real heading using textContent
    if (role === 'Unknown Role') {
      const headings = jobPanel.querySelectorAll('h1, h2');
      for (let i = 0; i < headings.length; i++) {
        let text = headings[i].textContent.trim();
        if (text.length > 3 && !text.includes('Similar') && !text.includes('About')) {
          role = text.split('\n')[0].trim();
          break;
        }
      }
    }
  } catch (err) {
    console.log("Scraping error:", err);
  }

  // Final safety check
  if (!role || role === 'undefined') role = 'Unknown Role';

  return { role, company };
}
// 3. The SPAN-Proof Interceptor
document.addEventListener('click', async (e) => {
  const clickedTarget = e.target.closest('button') || e.target;
  const buttonText = (clickedTarget.innerText || clickedTarget.textContent || "").toLowerCase();

  if (buttonText.includes('apply')) {
    showToast("Intercepting apply click...", "success");

    const { role, company } = extractJobDetails();
    const jobUrl = window.location.href.split('?')[0]; 

    chrome.storage.local.get(['jobTrackerToken'], async (result) => {
      const token = result.jobTrackerToken;
      if (!token) return showToast("❌ Not Connected. Refresh React app.", "error");

      try {
        const response = await fetch('http://localhost:5000/api/internships', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ company, role, status: 'applied', jobLink: jobUrl })
        });

        if (response.ok) {
          showToast(`✅ Saved: ${role} at ${company}`);
        } else {
          showToast("❌ Database rejected it.", "error");
        }
      } catch (err) {
        showToast("❌ Server is offline.", "error");
      }
    });
  }
}, true);