const DSARoadmap = require('../models/DSARoadmap');
const DSATopic = require('../models/DSATopic');
const DSAProblem = require('../models/DSAProblem');
const DSASyncProfile = require('../models/DSASyncProfile');
const { problemMatrix } = require('../data/roadmapData');
const DSAContest = require('../models/DSAContest');
const axios = require('axios');
const cheerio = require('cheerio');

// ==========================================
// ROADMAP & TOPIC CONTROLLERS
// ==========================================
exports.getRoadmaps = async (req, res) => {
  try { res.json(await DSARoadmap.find({ $or: [{ userId: req.user._id }, { type: 'system' }] })); } 
  catch (error) { res.status(500).json({ message: 'Error fetching roadmaps' }); }
};

exports.getTopics = async (req, res) => {
  try { res.json(await DSATopic.find({ roadmapId: req.params.roadmapId }).sort({ order: 1 })); } 
  catch (error) { res.status(500).json({ message: 'Error fetching topics' }); }
};

exports.createRoadmap = async (req, res) => {
  try {
    const { name, description, topics } = req.body;
    const newRoadmap = await DSARoadmap.create({ userId: req.user._id, name, type: 'custom', description, totalTopics: topics.length, isActive: true });
    if (topics && topics.length > 0) {
      await Promise.all(topics.map((topicName, index) => DSATopic.create({ userId: req.user._id, roadmapId: newRoadmap._id, name: topicName, order: index + 1 })));
    }
    res.status(201).json(newRoadmap);
  } catch (error) { res.status(500).json({ message: 'Error creating roadmap' }); }
};

// ==========================================
// THE MASSIVE DATA SEEDER
// ==========================================
exports.seedDefaultRoadmaps = async (req, res) => {
  try {
    const existing = await DSARoadmap.findOne({ type: 'system' });
    if (existing) return res.status(200).json({ message: "Default roadmaps already exist!" });

    console.log("🌱 1/3: Booting Matrix Seeder...");

    const roadmapsData = [
      { name: 'NeetCode 150', topics: ['Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Search', 'Linked List', 'Trees', 'Tries', 'Heap / Priority Queue', 'Backtracking', 'Graphs', 'Advanced Graphs', '1-D DP', '2-D DP', 'Greedy', 'Intervals', 'Math & Geometry', 'Bit Manipulation'] },
      { name: 'Striver A2Z', topics: ['Learn the basics', 'Sorting Techniques', 'Arrays', 'Binary Search', 'Strings', 'Learn LinkedList', 'Recursion', 'Bit Manipulation', 'Stack and Queues', 'Sliding Window & Two Pointer', 'Heaps', 'Greedy Algorithms', 'Binary Trees', 'BST', 'Graphs', 'Dynamic Programming', 'Tries'] },
      { name: 'Blind 75', topics: ['Array', 'Binary', 'Dynamic Programming', 'Graph', 'Interval', 'Linked List', 'Matrix', 'String', 'Tree', 'Heap'] },
      { name: 'FAANG Crash Course', topics: ['Data Structure Design', 'Advanced Graphs & Trees', 'Fast & Slow Pointers', 'Merge Intervals', 'Cyclic Sort', 'Top K Elements', 'K-way Merge', 'System Design Basics'] },
      { name: 'DP Masterclass', topics: ['1D Dynamic Programming', '2D Dynamic Programming', 'DP on Strings', 'DP on Subsequences', 'DP on Stocks', 'DP on Rectangles'] }
    ];

    const dbRoadmaps = {}; 
    const dbTopics = {};   

    for (const rm of roadmapsData) {
      const createdRm = await DSARoadmap.create({ userId: null, name: rm.name, type: 'system', totalTopics: rm.topics.length });
      dbRoadmaps[rm.name] = createdRm._id;
      
      const topicsToInsert = rm.topics.map((t, i) => ({ userId: req.user._id, roadmapId: createdRm._id, name: t, order: i + 1 }));
      const insertedTopics = await DSATopic.insertMany(topicsToInsert);
      
      insertedTopics.forEach(t => { dbTopics[`${rm.name}-${t.name}`] = t._id; });
    }

    console.log(`🌱 2/3: Unzipping ${problemMatrix.length} Problems from Data File...`);

    const finalProblems = problemMatrix.map(row => {
      const [roadmapName, topicName, title, url, difficulty, platform] = row;
      const topicId = dbTopics[`${roadmapName}-${topicName}`];
      
      if (!topicId) console.log(`Missing Folder mapping for: ${roadmapName} -> ${topicName}`);

      return {
        userId: req.user._id,
        topicId: topicId,
        title: title,
        url: url,
        difficulty: difficulty,
        platform: platform,
        status: 'unsolved'
      };
    }).filter(p => p.topicId); 

    console.log(`🌱 3/3: Pushing ${finalProblems.length} Problems to DB...`);

    await DSAProblem.insertMany(finalProblems);

    console.log("✅ MASSIVE SEED COMPLETE.");
    res.status(201).json({ message: "Successfully cloned massive Roadmap data to DB!" });
  } catch (error) {
    console.error("❌ SEEDING ERROR:", error);
    res.status(500).json({ message: 'Server Error seeding defaults' });
  }
};


// ==========================================
// PROBLEM LOGGING CONTROLLERS
// ==========================================
exports.getProblems = async (req, res) => {
  try { 
    let problems = await DSAProblem.find({ userId: req.user._id }).sort({ createdAt: -1 }); 

    // 🔥 THE FIX: Auto-Initialize problems for NEW accounts!
    if (problems.length === 0) {
      console.log(`🌱 Initializing 438 Roadmap Problems for new user...`);
      
      // Grab all system roadmaps and topics to build the map
      const systemRoadmaps = await DSARoadmap.find({ type: 'system' });
      const systemTopics = await DSATopic.find({ roadmapId: { $in: systemRoadmaps.map(r => r._id) } });
      
      const topicMap = {};
      systemTopics.forEach(t => {
        const rm = systemRoadmaps.find(r => r._id.toString() === t.roadmapId.toString());
        if (rm) topicMap[`${rm.name}-${t.name}`] = t._id;
      });

      // Map the user's specific problem documents to the global topics
      const finalProblems = problemMatrix.map(row => {
        const [roadmapName, topicName, title, url, difficulty, platform] = row;
        const topicId = topicMap[`${roadmapName}-${topicName}`];
        
        return {
          userId: req.user._id,
          topicId: topicId,
          title: title,
          url: url,
          difficulty: difficulty,
          platform: platform,
          status: 'unsolved'
        };
      }).filter(p => p.topicId); 

      // Save them and return the newly generated list
      if (finalProblems.length > 0) {
        await DSAProblem.insertMany(finalProblems);
        problems = await DSAProblem.find({ userId: req.user._id }).sort({ createdAt: -1 });
        console.log(`✅ Successfully mapped ${problems.length} problems for the new user!`);
      }
    }
    
    res.json(problems);
  } 
  catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Error fetching problems' }); 
  }
};

exports.createProblem = async (req, res) => {
  try { res.status(201).json(await DSAProblem.create({ ...req.body, userId: req.user._id })); } 
  catch (err) { res.status(500).json({ message: 'Error creating problem' }); }
};
// 🔥 NEW: Toggle Star Status
exports.toggleStar = async (req, res) => {
  try {
    const problem = await DSAProblem.findOne({ _id: req.params.id, userId: req.user._id });
    if (!problem) return res.status(404).json({ message: 'Not found' });

    problem.isStarred = !problem.isStarred;
    await problem.save();
    
    res.json(problem);
  } catch (err) { 
    res.status(500).json({ message: 'Error toggling star' }); 
  }
};

exports.logAttempt = async (req, res) => {
  try {
    const { outcome, confidenceRating, timeTakenMinutes } = req.body;
    const problem = await DSAProblem.findOne({ _id: req.params.id, userId: req.user._id });
    if (!problem) return res.status(404).json({ message: 'Not found' });

    problem.attempts.push({ outcome, confidenceRating, timeTakenMinutes, date: new Date() });
    if (outcome === 'solved') {
      problem.status = 'solved';
      problem.solvedAt = new Date();
    } else {
      problem.status = 'attempted';
    }
    problem.confidenceRating = confidenceRating;
    
    let interval = problem.revisionSchedule?.interval || 0;
    if (confidenceRating >= 3) interval = interval === 0 ? 1 : interval === 1 ? 6 : Math.round(interval * 2.5);
    else interval = 1;
    
    const nextRev = new Date(); nextRev.setDate(nextRev.getDate() + interval);
    problem.revisionSchedule = { nextRevisionDate: nextRev, interval, easeFactor: 2.5 };
    
    await problem.save();
    res.json(problem);
  } catch (err) { res.status(500).json({ message: 'Error logging attempt' }); }
};

// ==========================================
// SYNC ENGINE CONTROLLERS
// ==========================================
exports.getSyncProfile = async (req, res) => {
  try {
    let profile = await DSASyncProfile.findOne({ userId: req.user._id });
    if (!profile) profile = await DSASyncProfile.create({ userId: req.user._id });
    res.json(profile);
  } catch (error) { res.status(500).json({ message: 'Error fetching sync profile' }); }
};

exports.updateSyncProfile = async (req, res) => {
  try {
    const { leetcode, codeforces, geeksforgeeks } = req.body;
    let profile = await DSASyncProfile.findOne({ userId: req.user._id });
    
    if (profile) {
      profile.leetcode = leetcode;
      profile.codeforces = codeforces;
      profile.geeksforgeeks = geeksforgeeks;
      await profile.save();
    } else {
      profile = await DSASyncProfile.create({ userId: req.user._id, leetcode, codeforces, geeksforgeeks });
    }
    res.json({ message: 'Credentials saved successfully!', profile });
  } catch (error) { res.status(500).json({ message: 'Error saving sync credentials' }); }
};

exports.runAutoSync = async (req, res) => {
  try {
    const profile = await DSASyncProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(400).json({ message: 'No sync profile found.' });

    let solvedTitles = [];
    let platformsSynced = [];

    if (profile.leetcode) {
      try {
        const lcRes = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query recentAcSubmissions($username: String!, $limit: Int!) { recentAcSubmissionList(username: $username, limit: $limit) { title } }`,
            variables: { username: profile.leetcode, limit: 50 }
          })
        });
        const lcData = await lcRes.json();
        if (lcData.data?.recentAcSubmissionList) {
          solvedTitles.push(...lcData.data.recentAcSubmissionList.map(sub => sub.title));
          platformsSynced.push('LeetCode');
        }
      } catch (err) { console.error('LeetCode Sync Error:', err.message); }
    }

    if (profile.codeforces) {
      try {
        const cfRes = await fetch(`https://codeforces.com/api/user.status?handle=${profile.codeforces}`);
        const cfData = await cfRes.json();
        if (cfData.status === 'OK') {
          solvedTitles.push(...cfData.result.filter(sub => sub.verdict === 'OK').map(sub => sub.problem.name));
          platformsSynced.push('Codeforces');
        }
      } catch (err) { console.error('Codeforces Sync Error:', err.message); }
    }

    if (solvedTitles.length > 0) {
      const updateResult = await DSAProblem.updateMany(
        { userId: req.user._id, title: { $in: solvedTitles }, status: { $ne: 'solved' } },
        { 
          $set: { status: 'solved', confidenceRating: 3, solvedAt: new Date() },
          $push: { attempts: { outcome: 'solved', confidenceRating: 3, timeTakenMinutes: 0, date: new Date() } }
        }
      );
      profile.lastSynced = new Date();
      await profile.save();
      res.json({ message: 'Sync Complete!', platforms: platformsSynced, problemsUpdated: updateResult.modifiedCount });
    } else {
      res.json({ message: 'No new solved problems found.', platforms: platformsSynced, problemsUpdated: 0 });
    }
  } catch (error) { res.status(500).json({ message: 'Server error during sync.' }); }
};

// ==========================================
// THE UPDATED EXTENSION SYNC
// ==========================================
exports.extensionSync = async (req, res) => {
  try {
    const { submissions, syncedPlatforms } = req.body; 
    
    if ((!submissions || submissions.length === 0) && !syncedPlatforms) {
      return res.status(400).json({ message: "No submissions received from extension." });
    }

    console.log(`📡 Backend received ${submissions ? submissions.length : 0} problems. Processing...`);

    let problemsUpdated = 0;

    // 1. UPDATE ROADMAP PROBLEMS
    if (submissions && submissions.length > 0) {
      for (let sub of submissions) {
        const problem = await DSAProblem.findOne({ 
          userId: req.user._id, 
          title: sub.title 
        });

        if (problem) {
          const exactDate = sub.timestamp ? new Date(sub.timestamp * 1000) : new Date();
          let changed = false;

          if (problem.status !== 'solved') {
            problem.status = 'solved';
            problem.solvedAt = exactDate;
            problem.attempts.push({
              date: exactDate,
              outcome: 'solved',
              confidenceRating: 3, 
              timeTakenMinutes: 0
            });
            changed = true;
          } else if (!problem.solvedAt) {
            problem.solvedAt = exactDate;
            changed = true;
          }

          if (changed) {
            await problem.save();
            problemsUpdated++;
          }
        }
      }
    }

    // 2. SAVE TO SYNC PROFILE
    // We only update stats for platforms that successfully synced.
    // If syncedPlatforms is not provided (legacy request), we update all of them.
    const updateFields = {};
    updateFields.lastSyncAt = new Date();

    const leetcodeCount = submissions ? submissions.filter(p => p.platform === 'LeetCode').length : 0;
    const codeforcesCount = submissions ? submissions.filter(p => p.platform === 'Codeforces').length : 0;
    const gfgCount = submissions ? submissions.filter(p => p.platform === 'GeeksForGeeks').length : 0;

    if (!syncedPlatforms || syncedPlatforms.leetcode) {
      updateFields['rawStats.leetcode'] = leetcodeCount;
    }
    if (!syncedPlatforms || syncedPlatforms.codeforces) {
      updateFields['rawStats.codeforces'] = codeforcesCount;
    }
    if (!syncedPlatforms || syncedPlatforms.geeksforgeeks) {
      updateFields['rawStats.gfg'] = gfgCount;
    }

    const updatedProfile = await DSASyncProfile.findOneAndUpdate(
      { userId: req.user._id }, 
      { $set: updateFields },
      { new: true, upsert: true }
    );

    console.log(`✅ Successfully updated ${problemsUpdated} roadmap problems and saved global stats!`);
    
    // Return the fresh stats back to the frontend
    res.status(200).json({ 
      message: "Sync complete!", 
      updated: problemsUpdated,
      stats: updatedProfile.rawStats
    });

  } catch (error) {
    console.error("❌ Extension Sync Error:", error);
    res.status(500).json({ message: "Server error during sync." });
  }
};

// ==========================================
// THE NEW SERVER-SIDE SYNC ENGINE
// ==========================================
exports.serverSync = async (req, res) => {
  try {
    const { handles } = req.body;
    if (!handles) return res.status(400).json({ success: false, message: 'No handles provided.' });

    let solvedTitles = new Set();
    const platformStatuses = { leetcode: 'Idle', codeforces: 'Idle', geeksforgeeks: 'Idle' };

    const promises = [];

    // 1. Fetch LeetCode (GraphQL)
    if (handles.leetcode) {
      promises.push((async () => {
        try {
          const response = await axios.post('https://leetcode.com/graphql', {
            query: `
              query recentAcSubmissions($username: String!, $limit: Int!) {
                recentAcSubmissionList(username: $username, limit: $limit) {
                  title
                  titleSlug
                  timestamp
                }
              }
            `,
            variables: { username: handles.leetcode, limit: 20 }
          }, { timeout: 4000 });
          const subs = response.data?.data?.recentAcSubmissionList || [];
          subs.forEach(s => solvedTitles.add(s.title));
          platformStatuses.leetcode = 'Connected';
        } catch (err) {
          console.error("LC Server-Sync Error:", err.message);
          platformStatuses.leetcode = 'SyncFailed';
          return [];
        }
      })());
    }

    // 2. Fetch Codeforces (Public API)
    if (handles.codeforces) {
      promises.push((async () => {
        try {
          const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handles.codeforces}`, { timeout: 4000 });
          if (response.data.status === 'OK') {
            const subs = response.data.result.filter(s => s.verdict === 'OK');
            subs.forEach(s => solvedTitles.add(s.problem.name));
            platformStatuses.codeforces = 'Connected';
          } else {
            platformStatuses.codeforces = 'SyncFailed';
          }
        } catch (err) {
          console.error("CF Server-Sync Error:", err.message);
          platformStatuses.codeforces = 'SyncFailed';
          return [];
        }
      })());
    }

    // 3. Fetch GeeksForGeeks (Scrape Public Profile)
    if (handles.geeksforgeeks) {
      promises.push((async () => {
        try {
          const response = await axios.get(`https://www.geeksforgeeks.org/user/${handles.geeksforgeeks}/`, { timeout: 4000 });
          const $ = cheerio.load(response.data);
          // GfG user profiles usually list solved problems in elements.
          // Note: The specific selector may vary depending on GfG's current HTML structure.
          // Typically, solved problems are links in a specific section.
          // For safety, let's look for any 'a' tags that look like problem links
          $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            if (href.includes('/problems/')) {
              solvedTitles.add($(el).text().trim());
            }
          });
          platformStatuses.geeksforgeeks = 'Connected';
        } catch (err) {
          console.error("GFG Server-Sync Error:", err.message);
          platformStatuses.geeksforgeeks = 'SyncFailed';
          return [];
        }
      })());
    }

    await Promise.allSettled(promises);

    let problemsUpdated = 0;
    const exactDate = new Date();
    const titlesArray = Array.from(solvedTitles);

    if (titlesArray.length > 0) {
      const problemsToUpdate = await DSAProblem.find({
        userId: req.user._id,
        title: { $in: titlesArray }
      });

      for (let problem of problemsToUpdate) {
        let changed = false;

        if (problem.status !== 'solved') {
          problem.status = 'solved';
          problem.solvedAt = exactDate;
          if (!problem.attempts) problem.attempts = [];
          problem.attempts.push({
            date: exactDate,
            outcome: 'solved',
            confidenceRating: 3, 
            timeTakenMinutes: 0
          });
          changed = true;
        } else if (!problem.solvedAt) {
          problem.solvedAt = exactDate;
          changed = true;
        }

        if (changed) {
          await problem.save();
          problemsUpdated++;
        }
      }
    }

    // Update Profile Stats based on connected platforms
    const updateFields = { lastSyncAt: exactDate };
    // Optionally update raw stats if needed, or rely on existing stats
    // We'll update the sync time so the UI knows it worked
    await require('../models/DSASyncProfile').findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Server-side sync complete!",
      count: problemsUpdated,
      data: titlesArray,
      platformStatuses
    });

  } catch (error) {
    console.error("Server-Sync Critical Error:", error);
    res.status(500).json({ success: false, message: "Server error during server sync.", error: error.message });
  }
};

exports.syncContests = async (req, res) => {
  try {
    console.log("🚀 CONTEST SYNC STARTED FOR USER:", req.user._id);
    const profile = await DSASyncProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(400).json({ success: false, message: 'No sync profile found.' });
    
    let contestsAdded = 0;
    const promises = [];

    // 1. SYNC LEETCODE CONTESTS
    if (profile.leetcode) {
      promises.push((async () => {
        try {
          const lcRes = await axios.post('https://leetcode.com/graphql', {
            query: `query userContestRankingHistory($username: String!) { userContestRankingHistory(username: $username) { attended trendDirection problemsSolved contest { title startTime } rating ranking } }`,
            variables: { username: profile.leetcode }
          }, { timeout: 4000, headers: { 'User-Agent': 'Mozilla/5.0' } });
          const lcData = lcRes.data;
          
          if (lcData.data?.userContestRankingHistory) {
            const attended = lcData.data.userContestRankingHistory.filter(c => c.attended);
            console.log(`🎯 Found ${attended.length} attended LC contests!`);
            
            for (let i = 0; i < attended.length; i++) {
              const contest = attended[i];
              const prevRating = i > 0 ? attended[i-1].rating : 1500; 
              
              try {
                await DSAContest.updateOne(
                  { userId: req.user._id, platform: 'LeetCode', contestName: contest.contest.title },
                  {
                    $set: {
                      date: new Date(contest.contest.startTime * 1000),
                      rank: contest.ranking,
                      ratingChange: Math.round(contest.rating - prevRating),
                      newRating: Math.round(contest.rating)
                    }
                  },
                  { upsert: true }
                );
                contestsAdded++;
              } catch (dbErr) {
                console.error(`❌ DB REJECTED LEETCODE CONTEST:`, dbErr.message);
              }
            }
          }
        } catch (err) { console.error('🚨 LC Sync Error:', err.message); return []; }
      })());
    }

    // 2. SYNC CODEFORCES CONTESTS
    if (profile.codeforces) {
      promises.push((async () => {
        try {
          const cfRes = await axios.get(`https://codeforces.com/api/user.rating?handle=${profile.codeforces}`, { timeout: 4000 });
          const cfData = cfRes.data;
          
          if (cfData.status === 'OK') {
            console.log(`🎯 Found ${cfData.result.length} CF contests!`);
            for (let contest of cfData.result) {
              // 🔥 DB SAVE TRACKER
              try {
                await DSAContest.updateOne(
                  { userId: req.user._id, platform: 'Codeforces', contestName: contest.contestName },
                  {
                    $set: {
                      date: new Date(contest.ratingUpdateTimeSeconds * 1000),
                      rank: contest.rank,
                      ratingChange: contest.newRating - contest.oldRating,
                      newRating: contest.newRating
                    }
                  },
                  { upsert: true }
                );
                contestsAdded++;
              } catch (dbErr) {
                console.error(`❌ DB REJECTED CODEFORCES CONTEST:`, dbErr.message);
              }
            }
          }
        } catch (err) { console.error('🚨 CF Sync Error:', err.message); return []; }
      })());
    }

    await Promise.allSettled(promises);

    const DSASyncProfile = require('../models/DSASyncProfile'); // Ensure this is imported at the top!
    await DSASyncProfile.updateOne(
      { userId: req.user._id },
      { $set: { lastSyncAt: new Date() } }
    );

    console.log(`🎉 Sync Complete! Processed ${contestsAdded} contests into the database.`);
    res.status(200).json({ success: true, message: "Contest Sync Complete!", newContests: contestsAdded, data: [] });
  } catch (error) { 
    console.error("Contest Sync Critical Error:", error);
    res.status(500).json({ success: false, message: "Server error during contest sync.", error: error.message });
  }
};

// ==========================================
// GET CONTEST HISTORY
// ==========================================
exports.getContests = async (req, res) => {
  try {
    const contests = await DSAContest.find({ userId: req.user._id }).sort({ date: -1 });
    console.log(`📡 Frontend requested history. Sending ${contests.length} contests from database.`);
    res.json(contests);
  } catch (error) { 
    console.error("Error fetching contests:", error);
    res.status(500).json({ message: 'Error fetching contests' }); 
  }
};

// ==========================================
// LIVE SUBMISSION TRACKER (Hit by Extension)
// ==========================================
exports.trackLiveSubmission = async (req, res) => {
  try {
    const { problemUrl, platform, runtime, memory, isAccepted } = req.body;
    if (!isAccepted) return res.status(200).json({ message: "Ignored failed submission" });

    // 🔥 THE BULLETPROOF URL MATCHER
    // 1. Strip off query parameters (e.g., ?itm_source=...) and hash tags (#)
    const cleanBase = problemUrl.split('?')[0].split('#')[0];
    
    // 2. Extract just the core path (e.g., "/problems/binary-tree-representation")
    let urlPath = "";
    try {
        urlPath = new URL(cleanBase).pathname;
    } catch(e) {
        urlPath = cleanBase; // Fallback if URL parsing fails
    }
    
    // 3. Remove LeetCode specific tabs just in case you submitted from the submissions tab
    if (urlPath.includes('/description')) urlPath = urlPath.split('/description')[0];
    if (urlPath.includes('/submissions')) urlPath = urlPath.split('/submissions')[0];

    // 4. Remove trailing slashes to ensure perfect matching
    urlPath = urlPath.replace(/\/$/, "");

    // NOTE: Make sure this matches your actual Mongoose model import!
    const ProblemModel = require('../models/DSAProblem'); 

    // 5. Search the database for ANY url that contains this exact core path
    const problem = await ProblemModel.findOne({ 
      userId: req.user._id, 
      url: { $regex: urlPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } 
    });
    
    if (!problem) return res.status(404).json({ message: "Problem not found in database. Make sure the URL matches!" });

    // Update to solved
    problem.status = 'solved';
    problem.solvedAt = new Date();
    
    // Ensure attempts array exists before pushing
    if (!problem.attempts) problem.attempts = []; 
    
    problem.attempts.push({
      date: new Date(),
      outcome: 'solved',
      timeTakenMinutes: req.body.timeTakenMinutes || 0, 
      confidenceRating: 5, // The fix from earlier!
      notes: `Runtime: ${runtime || 'N/A'}, Memory: ${memory || 'N/A'}`
    });
    
    await problem.save();
    console.log(`🚀 Live Tracked: Solved [${problem.title}] with ${runtime} & ${memory}`);
    
    res.status(200).json({ message: `StudentStack Server saved [${problem.title}]!`, title: problem.title });
  } catch (error) {
    console.error("🔥 BACKEND CRASH in trackLiveSubmission:", error);
    res.status(500).json({ message: error.message || "Server crashed while saving" });
  }
};