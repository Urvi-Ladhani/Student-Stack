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

// 2. The Smart Scraper (Fixes Link, Description, and Address)
function extractJobDetails() {
  let result = { 
    role: 'Unknown Role', company: 'Unknown Company', location: 'Not specified', 
    workType: 'Not specified', stipend: 'Not specified', jobDescription: '', jobLink: '' 
  };

  try {
    const panel = document.querySelector('.jobs-search__right-rail') || 
                  document.querySelector('.job-view-layout-jobs-details') || 
                  document.body;

    // A. Role, Company, and EXACT LINK
    const companyEl = panel.querySelector('a[href*="/company/"]');
    if (companyEl) result.company = companyEl.textContent.trim();
    
    const titleLink = panel.querySelector('a[href*="/jobs/view/"]');
    if (titleLink) {
        result.role = titleLink.textContent.trim();
        // 🟢 FIX: Grabs the exact job link from the title, not the browser bar!
        result.jobLink = titleLink.href.split('?')[0]; 
    }
    
    // Fallback if link is still empty
    if (!result.jobLink) result.jobLink = window.location.href.split('?')[0];

    // B. Address (Location) and Stipend Hunter
    const allSpans = panel.querySelectorAll('span, div');
    let maxTextLength = 0;
    let fallbackDescription = "";

    for (let el of allSpans) {
        let text = el.textContent.trim();

        // Check small text blocks for Location and Money
        if (text.length > 2 && text.length < 100) {
            // Address: Looks for commas (e.g., "Ahmedabad, Gujarat, India")
            if (result.location === 'Not specified' && text.includes(',')) {
                if (!/\d/.test(text) && !text.toLowerCase().includes('save') && !text.toLowerCase().includes('apply')) {
                    result.location = text;
                }
            }
            // Stipend
            if (result.stipend === 'Not specified' && (text.includes('₹') || text.includes('$') || text.toLowerCase().includes('lpa'))) {
                result.stipend = text;
            }
        }

        // 🟢 FIX: Description Hunter (Finds the largest paragraph on the screen)
        if (text.length > 400 && text.length > maxTextLength) {
            // Prevent it from accidentally grabbing the whole webpage
            if (!text.includes(panel.textContent.trim().substring(0, 100))) {
                maxTextLength = text.length;
                fallbackDescription = text;
            }
        }
    }

    // C. Work Type
    const lowerText = panel.innerText.toLowerCase();
    if (lowerText.includes('remote')) result.workType = 'Remote';
    else if (lowerText.includes('hybrid')) result.workType = 'Hybrid';
    else if (lowerText.includes('on-site') || lowerText.includes('onsite')) result.workType = 'On-site';

    // D. Final Description Lock-in
    const descEl = panel.querySelector('article') || panel.querySelector('#job-details') || panel.querySelector('.jobs-description__content');
    if (descEl) {
        result.jobDescription = descEl.innerText.trim();
    } else if (fallbackDescription.length > 0) {
        result.jobDescription = fallbackDescription;
    } else {
        result.jobDescription = "Could not extract description automatically. Please view original link.";
    }

  } catch(e) {
    console.log("Scraping error:", e);
  }

  console.log("🕵️‍♂️ DATA EXTRACTED:", result);
  return result;
}

// 3. The Interceptor
document.addEventListener('click', async (e) => {
  const clickedTarget = e.target.closest('button') || e.target;
  const buttonText = (clickedTarget.innerText || clickedTarget.textContent || "").toLowerCase();

  if (buttonText.includes('apply')) {
    showToast("Intercepting apply click...", "success");

    // 🟢 WE GRAB EVERYTHING DIRECTLY FROM THE SCRAPER NOW
    const { role, company, location, workType, stipend, jobDescription, jobLink } = extractJobDetails();

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
          body: JSON.stringify({ 
            company, 
            role, 
            location, // The address!
            workType, 
            stipend, 
            jobDescription, // The massive text block!
            status: 'applied', 
            jobLink // The exact URL!
          })
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