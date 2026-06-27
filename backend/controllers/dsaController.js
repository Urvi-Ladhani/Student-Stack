const DSARoadmap = require('../models/DSARoadmap');
const DSATopic = require('../models/DSATopic');
const DSAProblem = require('../models/DSAProblem');
const DSASyncProfile = require('../models/DSASyncProfile');
const { problemMatrix } = require('../data/roadmapData');
const DSAContest = require('../models/DSAContest');

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
    problem.status = outcome === 'solved' ? 'solved' : 'attempted';
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
          $set: { status: 'solved', confidenceRating: 3 },
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
    const { submissions } = req.body; 
    
    if (!submissions || submissions.length === 0) {
      return res.status(400).json({ message: "No submissions received from extension." });
    }

    console.log(`📡 Backend received ${submissions.length} problems. Processing...`);

    let problemsUpdated = 0;

    // 1. UPDATE ROADMAP PROBLEMS
    for (let sub of submissions) {
      const problem = await DSAProblem.findOne({ 
        userId: req.user._id, 
        title: sub.title 
      });

      if (problem && problem.status !== 'solved') {
        problem.status = 'solved';
        
        // Convert Unix timestamp to a real JS Date, or use current date if missing
        const exactDate = sub.timestamp ? new Date(sub.timestamp * 1000) : new Date();
        
        problem.attempts.push({
          date: exactDate,
          outcome: 'solved',
          confidenceRating: 3, 
          timeTakenMinutes: 0
        });
        
        await problem.save();
        problemsUpdated++;
      }
    }

    // 2. CALCULATE GLOBAL STATS
    const leetcodeCount = submissions.filter(p => p.platform === 'LeetCode').length;
    const codeforcesCount = submissions.filter(p => p.platform === 'Codeforces').length;
    const gfgCount = submissions.filter(p => p.platform === 'GeeksForGeeks').length;

    // 3. SAVE TO SYNC PROFILE
    await DSASyncProfile.findOneAndUpdate(
      { userId: req.user._id }, 
      { 
        'rawStats.leetcode': leetcodeCount,
        'rawStats.codeforces': codeforcesCount,
        'rawStats.gfg': gfgCount,
        lastSyncAt: new Date() 
      },
      { new: true, upsert: true }
    );

    console.log(`✅ Successfully updated ${problemsUpdated} roadmap problems and saved global stats!`);
    
    // Return the stats back to the frontend
    res.status(200).json({ 
      message: "Sync complete!", 
      updated: problemsUpdated,
      stats: { leetcode: leetcodeCount, codeforces: codeforcesCount, gfg: gfgCount }
    });

  } catch (error) {
    console.error("❌ Extension Sync Error:", error);
    res.status(500).json({ message: "Server error during sync." });
  }
};

exports.syncContests = async (req, res) => {
  try {
    console.log("🚀 CONTEST SYNC STARTED FOR USER:", req.user._id);
    const profile = await DSASyncProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      console.log("❌ No sync profile found! Did you save your handles?");
      return res.status(400).json({ message: 'No sync profile found.' });
    }
    
    console.log(`✅ Profile found! LC: [${profile.leetcode}], CF: [${profile.codeforces}]`);
    let contestsAdded = 0;

    // 1. SYNC LEETCODE CONTESTS
    if (profile.leetcode) {
      console.log(`📡 Fetching LeetCode contests for username: ${profile.leetcode}...`);
      try {
        const lcRes = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // 🔥 Bypasses LC Bot Protection
          },
          body: JSON.stringify({
            query: `query userContestRankingHistory($username: String!) { userContestRankingHistory(username: $username) { attended trendDirection problemsSolved contest { title startTime } rating ranking } }`,
            variables: { username: profile.leetcode }
          })
        });
        
        const lcData = await lcRes.json();
        console.log(`📦 LeetCode API Response Check:`, lcData.data ? "Success" : lcData.errors);
        
        if (lcData.data?.userContestRankingHistory) {
          const attended = lcData.data.userContestRankingHistory.filter(c => c.attended);
          console.log(`🎯 Found ${attended.length} attended LC contests!`);
          
          for (let i = 0; i < attended.length; i++) {
            const contest = attended[i];
            const prevRating = i > 0 ? attended[i-1].rating : 1500; 
            
            await DSAContest.updateOne(
              { userId: req.user._id, platform: 'LeetCode', contestName: contest.contest.title },
              {
                $setOnInsert: {
                  date: new Date(contest.contest.startTime * 1000),
                  rank: contest.ranking,
                  ratingChange: Math.round(contest.rating - prevRating),
                  newRating: Math.round(contest.rating)
                }
              },
              { upsert: true }
            );
            contestsAdded++;
          }
        }
      } catch (err) { console.error('🚨 LC Contest Sync Error:', err.message); }
    }

    // 2. SYNC CODEFORCES CONTESTS
    if (profile.codeforces) {
      console.log(`📡 Fetching CF contests for username: ${profile.codeforces}...`);
      try {
        const cfRes = await fetch(`https://codeforces.com/api/user.rating?handle=${profile.codeforces}`);
        const cfData = await cfRes.json();
        
        if (cfData.status === 'OK') {
          console.log(`🎯 Found ${cfData.result.length} CF contests!`);
          for (let contest of cfData.result) {
            await DSAContest.updateOne(
              { userId: req.user._id, platform: 'Codeforces', contestName: contest.contestName },
              {
                $set: { // ✅ ...to exactly this!
                  date: new Date(contest.contest.startTime * 1000),
                  rank: contest.ranking,
                  ratingChange: Math.round(contest.rating - prevRating),
                  newRating: Math.round(contest.rating)
                }
              },
              { upsert: true }
            );
            contestsAdded++;
          }
        }
      } catch (err) { console.error('🚨 CF Contest Sync Error:', err.message); }
    }

    console.log(`🎉 Sync Complete! Processed ${contestsAdded} contests into the database.`);
    res.status(200).json({ message: "Contest Sync Complete!", newContests: contestsAdded });
  } catch (error) {
    console.error("🔥 Contest Sync Fatal Error:", error);
    res.status(500).json({ message: "Server error during contest sync." });
  }
};

exports.getContests = async (req, res) => {
  try {
    const contests = await DSAContest.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(contests);
  } catch (error) {
    console.error("Error fetching contests:", error);
    res.status(500).json({ message: 'Error fetching contests' });
  }
};