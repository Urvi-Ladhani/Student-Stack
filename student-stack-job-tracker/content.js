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
    // 1. Locate the active details pane on the right containing the selected job details
    let activePanel = document.querySelector('.jobs-search-two-pane__job-details') || 
                      document.querySelector('.jobs-search__job-details') ||
                      document.querySelector('.job-view-layout-jobs-details') ||
                      document.querySelector('.job-view-layout') ||
                      document.querySelector('.jobs-details') ||
                      document.querySelector('.jobs-search__right-rail');

    // Fallback: If not found, try to locate active details container relative to description node
    if (!activePanel) {
      const jdNode = document.getElementById('job-details') || document.querySelector('.jobs-description__content');
      if (jdNode) {
        activePanel = jdNode.closest('.jobs-search-two-pane__job-details') || 
                      jdNode.closest('.job-view-layout') ||
                      jdNode.closest('.jobs-details') ||
                      jdNode.parentElement;
      }
    }

    // Default to main or body if details container is completely missing
    if (!activePanel) {
      activePanel = document.querySelector('main') || document.body;
    }

    console.log("🕵️‍♂️ STUDENTSTACK: Scraping from details container:", activePanel);

    // 2. Extract Company Name
    const companyEl = activePanel.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
                      activePanel.querySelector('.job-details-jobs-unified-top-card__company-name') ||
                      activePanel.querySelector('.jobs-unified-top-card__company-name a') ||
                      activePanel.querySelector('.jobs-unified-top-card__company-name') ||
                      activePanel.querySelector('.topcard__flavor a') ||
                      activePanel.querySelector('.top-card-layout__company-name a') ||
                      activePanel.querySelector('a[href*="/company/"]');
    if (companyEl) {
      result.company = companyEl.textContent.trim().replace(/\s+/g, ' ');
    }

    // 3. Extract Job Title / Role
    const roleEl = activePanel.querySelector('.job-details-jobs-unified-top-card__job-title h1, .job-details-jobs-unified-top-card__job-title h2') ||
                   activePanel.querySelector('.jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title h2') ||
                   activePanel.querySelector('.top-card-layout__title') ||
                   activePanel.querySelector('.job-details-jobs-unified-top-card__job-title') ||
                   activePanel.querySelector('.jobs-unified-top-card__job-title') ||
                   activePanel.querySelector('h1') ||
                   activePanel.querySelector('h2');
    if (roleEl) {
      result.role = roleEl.textContent.trim().replace(/\s+/g, ' ');
    }

    // Clean Company and Role from metadata leakages
    if (result.company) {
      result.company = result.company.replace(/·|•|\n/g, '').trim();
      const compLower = result.company.toLowerCase();
      if (compLower.includes('hours ago') || compLower.includes('days ago') || compLower.includes('weeks ago') || compLower.includes('posted') || compLower.includes('applicant')) {
        result.company = 'Unknown Company';
      }
    }
    if (result.role) {
      result.role = result.role.replace(/·|•|\n/g, '').trim();
      const roleLower = result.role.toLowerCase();
      if (roleLower.includes('hours ago') || roleLower.includes('days ago') || roleLower.includes('weeks ago') || roleLower.includes('posted') || roleLower.includes('applicant')) {
        result.role = 'Unknown Role';
      }
    }

    // 4. Extract Job Link (Construct clean view URL from dynamic IDs)
    let jobId = '';
    
    // Check URL parameters
    const urlMatch = window.location.href.match(/[?&]currentJobId=(\d+)/) || 
                     window.location.href.match(/[?&]jobId=(\d+)/);
    if (urlMatch) {
      jobId = urlMatch[1];
    }
    
    // Check URL pathname
    if (!jobId) {
      const pathMatch = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
      if (pathMatch) jobId = pathMatch[1];
    }
    
    // Check active panel anchors (share, report, company links, etc.)
    if (!jobId && activePanel) {
      const anchors = activePanel.querySelectorAll('a');
      for (let a of anchors) {
        const href = a.href || '';
        let m = href.match(/\/jobs\/view\/(\d+)/);
        if (m) {
          jobId = m[1];
          break;
        }
        m = href.match(/[?&]jobId=(\d+)/) || href.match(/jobId%3D(\d+)/);
        if (m) {
          jobId = m[1];
          break;
        }
      }
    }
    
    // Check active card attributes and card anchors
    if (!jobId) {
      const activeCard = document.querySelector('[class*="job-card-container--active"]') ||
                         document.querySelector('.jobs-search-results-list__list-item--active') ||
                         document.querySelector('.job-card-container--active');
      if (activeCard) {
        const idAttr = activeCard.getAttribute('data-job-id') || 
                       activeCard.getAttribute('data-occludable-job-id');
        if (idAttr) {
          jobId = idAttr;
        } else {
          const cardAnchors = activeCard.querySelectorAll('a');
          for (let a of cardAnchors) {
            const href = a.href || '';
            let m = href.match(/\/jobs\/view\/(\d+)/);
            if (m) {
              jobId = m[1];
              break;
            }
            m = href.match(/[?&]jobId=(\d+)/) || href.match(/jobId%3D(\d+)/);
            if (m) {
              jobId = m[1];
              break;
            }
          }
        }
      }
    }
    
    // General global search for any jobs/view link
    if (!jobId) {
      const globalLinks = document.querySelectorAll('a[href*="/jobs/view/"]');
      for (let a of globalLinks) {
        const m = a.href.match(/\/jobs\/view\/(\d+)/);
        if (m) {
          jobId = m[1];
          break;
        }
      }
    }
    
    if (jobId) {
      result.jobLink = `https://www.linkedin.com/jobs/view/${jobId}/`;
    } else {
      result.jobLink = window.location.href.split('?')[0];
    }

    // 5. Extract Location (Clean bullet splitted tags)
    const locEl = activePanel.querySelector('.job-details-jobs-unified-top-card__primary-description') ||
                  activePanel.querySelector('.jobs-unified-top-card__primary-description') ||
                  activePanel.querySelector('.topcard__flavor-row') ||
                  activePanel.querySelector('.jobs-unified-top-card__bullet');
    if (locEl) {
      const text = locEl.innerText || locEl.textContent;
      const parts = text.split(/·|•|\n/).map(p => p.trim()).filter(p => p.length > 0);
      
      let locationCandidate = '';
      for (let part of parts) {
        const partLower = part.toLowerCase();
        if (
          !partLower.includes(result.company.toLowerCase()) && 
          !partLower.includes('applicant') && 
          !partLower.includes('view') && 
          !partLower.includes('ago') && 
          !partLower.includes('posted') && 
          !partLower.includes('easy apply') &&
          !partLower.includes('apply')
        ) {
          locationCandidate = part;
          break;
        }
      }
      
      if (!locationCandidate && parts.length > 1) {
        locationCandidate = parts[1];
      } else if (!locationCandidate && parts.length > 0) {
        locationCandidate = parts[0];
      }

      if (locationCandidate) {
        result.location = locationCandidate.replace(/\s+/g, ' ').replace(result.company, '').replace(/^[·•\s,]+|[·•\s,]+$/g, '').trim();
      }
    }
    
    // Safety check location
    if (result.location) {
      const locLower = result.location.toLowerCase();
      if (locLower.includes('hours ago') || locLower.includes('days ago') || locLower.includes('weeks ago') || locLower.includes('posted') || locLower.includes('applicant')) {
        result.location = 'Not specified';
      }
    }

    // 6. Extract Work Type & Stipend (Only within job insight containers inside details pane)
    const insightEls = activePanel.querySelectorAll('.job-details-jobs-unified-top-card__job-insight, .jobs-unified-top-card__job-insight, .job-details-jobs-unified-top-card__job-insight-list-item');
    
    // Check insights for work type
    for (let el of insightEls) {
      const text = el.innerText.toLowerCase();
      if (text.includes('remote')) {
        result.workType = 'Remote';
        break;
      } else if (text.includes('hybrid')) {
        result.workType = 'Hybrid';
        break;
      } else if (text.includes('on-site') || text.includes('onsite')) {
        result.workType = 'On-site';
        break;
      }
    }
    
    // Check insights for salary / stipend details
    for (let el of insightEls) {
      const text = el.innerText;
      if (text.includes('$') || text.includes('₹') || text.toLowerCase().includes('stipend') || text.toLowerCase().includes('salary') || text.toLowerCase().includes('/hr') || text.toLowerCase().includes('/mo')) {
        const parts = text.split(/·|•|\n/).map(p => p.trim());
        const salaryPart = parts.find(p => p.includes('$') || p.includes('₹') || p.toLowerCase().includes('stipend') || p.toLowerCase().includes('salary'));
        if (salaryPart) {
          result.stipend = salaryPart.replace(/\s+/g, ' ').trim();
          break;
        }
      }
    }
    
    // Safety check stipend
    if (result.stipend) {
      const stipLower = result.stipend.toLowerCase();
      if (stipLower.includes('hours ago') || stipLower.includes('days ago') || stipLower.includes('weeks ago') || stipLower.includes('posted') || stipLower.includes('applicant')) {
        result.stipend = 'Not specified';
      }
    }

    // 7. Extract Job Description (strictly target details description box)
    const descEl = activePanel.querySelector('#job-details') || 
                   activePanel.querySelector('.jobs-description__content') ||
                   activePanel.querySelector('.jobs-description-content') ||
                   activePanel.querySelector('.jobs-box__html-content');
    if (descEl) {
      result.jobDescription = descEl.innerText.trim();
    } else {
      const fallbackDesc = activePanel.querySelector('.jobs-description');
      if (fallbackDesc && activePanel !== document.body) {
        result.jobDescription = fallbackDesc.innerText.trim();
      } else {
        result.jobDescription = "Could not extract description automatically. Please view original link.";
      }
    }

    // Strict description cleaning - Filters out metadata lines (reposted, applicant counters, time ago)
    if (result.jobDescription) {
      let lines = result.jobDescription.split('\n');
      lines = lines.filter(line => {
        const l = line.trim().toLowerCase();
        if (l.length === 0) return true;
        if (l.includes('hours ago') || l.includes('days ago') || l.includes('weeks ago') || l.includes('months ago')) return false;
        if (l.includes('posted') && (l.includes('hr') || l.includes('day') || l.includes('week') || l.includes('month') || l.includes('time') || l.includes('ago') || l.includes('today') || l.includes('yesterday'))) return false;
        if (l.includes('applicants') && (l.includes('see') || l.includes('over') || l.includes('under') || /\d+/.test(l))) return false;
        if (l.includes('easy apply') || l.includes('apply now') || l.includes('apply on company website') || l.includes('apply on company site')) return false;
        if (l.includes('connections work here') || l.includes('connection work here') || l.includes('view mutual connections')) return false;
        if (l.includes('actively recruiting') || l.includes('reposted')) return false;
        return true;
      });
      result.jobDescription = lines.join('\n').trim();
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
            location, 
            workType, 
            stipend, 
            jobDescription, 
            status: 'applied', 
            jobLink 
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