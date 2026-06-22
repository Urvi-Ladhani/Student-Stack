const DSARoadmap = require('../models/DSARoadmap');
const DSATopic = require('../models/DSATopic');
const DSAProblem = require('../models/DSAProblem');
const { problemMatrix } = require('../data/roadmapData');

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

// 🔥 THE MATRIX SEEDER (Capable of 800+ Problems) 🔥
exports.seedDefaultRoadmaps = async (req, res) => {
  try {
    const existing = await DSARoadmap.findOne({ type: 'system' });
    if (existing) return res.status(200).json({ message: "Default roadmaps already exist!" });

    console.log("🌱 1/3: Booting Matrix Seeder...");

    // 1. Create Roadmaps
    const roadmapsData = [
      { name: 'NeetCode 150', topics: ['Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Search', 'Linked List', 'Trees', 'Tries', 'Heap / Priority Queue', 'Backtracking', 'Graphs', 'Advanced Graphs', '1-D DP', '2-D DP', 'Greedy', 'Intervals', 'Math & Geometry', 'Bit Manipulation'] },
      { name: 'Striver A2Z', topics: ['Learn the basics', 'Sorting Techniques', 'Arrays', 'Binary Search', 'Strings', 'Learn LinkedList', 'Recursion', 'Bit Manipulation', 'Stack and Queues', 'Sliding Window & Two Pointer', 'Heaps', 'Greedy Algorithms', 'Binary Trees', 'BST', 'Graphs', 'Dynamic Programming', 'Tries'] },
      { name: 'Blind 75', topics: ['Array', 'Binary', 'Dynamic Programming', 'Graph', 'Interval', 'Linked List', 'Matrix', 'String', 'Tree', 'Heap'] }
    ];

    const dbRoadmaps = {}; // Dictionary to store roadmap IDs
    const dbTopics = {};   // Dictionary to store topic IDs

    for (const rm of roadmapsData) {
      const createdRm = await DSARoadmap.create({ userId: null, name: rm.name, type: 'system', totalTopics: rm.topics.length });
      dbRoadmaps[rm.name] = createdRm._id;
      
      const topicsToInsert = rm.topics.map((t, i) => ({ userId: req.user._id, roadmapId: createdRm._id, name: t, order: i + 1 }));
      const insertedTopics = await DSATopic.insertMany(topicsToInsert);
      
      // Map "RoadmapName-TopicName" to its new Mongo ID
      insertedTopics.forEach(t => { dbTopics[`${rm.name}-${t.name}`] = t._id; });
    }

    console.log("🌱 2/3: Unzipping Problem Matrix...");

    // 2. The Compressed Problem Matrix
    // Format: [ "Roadmap Name", "Topic Name", "Problem Title", "URL", "Difficulty", "Platform" ]
    const problemMatrix = [
      // --- NEETCODE 150 ---
      ['NeetCode 150', 'Arrays & Hashing', 'Contains Duplicate', 'https://leetcode.com/problems/contains-duplicate/', 'easy', 'LeetCode'],
      ['NeetCode 150', 'Arrays & Hashing', 'Valid Anagram', 'https://leetcode.com/problems/valid-anagram/', 'easy', 'LeetCode'],
      ['NeetCode 150', 'Arrays & Hashing', 'Two Sum', 'https://leetcode.com/problems/two-sum/', 'easy', 'LeetCode'],
      ['NeetCode 150', 'Arrays & Hashing', 'Group Anagrams', 'https://leetcode.com/problems/group-anagrams/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Arrays & Hashing', 'Top K Frequent Elements', 'https://leetcode.com/problems/top-k-frequent-elements/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Arrays & Hashing', 'Product of Array Except Self', 'https://leetcode.com/problems/product-of-array-except-self/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Arrays & Hashing', 'Valid Sudoku', 'https://leetcode.com/problems/valid-sudoku/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Arrays & Hashing', 'Longest Consecutive Sequence', 'https://leetcode.com/problems/longest-consecutive-sequence/', 'medium', 'LeetCode'],
      
      ['NeetCode 150', 'Two Pointers', 'Valid Palindrome', 'https://leetcode.com/problems/valid-palindrome/', 'easy', 'LeetCode'],
      ['NeetCode 150', 'Two Pointers', 'Two Sum II', 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Two Pointers', '3Sum', 'https://leetcode.com/problems/3sum/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Two Pointers', 'Container With Most Water', 'https://leetcode.com/problems/container-with-most-water/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Two Pointers', 'Trapping Rain Water', 'https://leetcode.com/problems/trapping-rain-water/', 'hard', 'LeetCode'],

      ['NeetCode 150', 'Sliding Window', 'Best Time to Buy and Sell Stock', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', 'easy', 'LeetCode'],
      ['NeetCode 150', 'Sliding Window', 'Longest Substring Without Repeating Characters', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Sliding Window', 'Longest Repeating Character Replacement', 'https://leetcode.com/problems/longest-repeating-character-replacement/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Sliding Window', 'Permutation in String', 'https://leetcode.com/problems/permutation-in-string/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Sliding Window', 'Minimum Window Substring', 'https://leetcode.com/problems/minimum-window-substring/', 'hard', 'LeetCode'],
      ['NeetCode 150', 'Sliding Window', 'Sliding Window Maximum', 'https://leetcode.com/problems/sliding-window-maximum/', 'hard', 'LeetCode'],

      ['NeetCode 150', 'Stack', 'Valid Parentheses', 'https://leetcode.com/problems/valid-parentheses/', 'easy', 'LeetCode'],
      ['NeetCode 150', 'Stack', 'Min Stack', 'https://leetcode.com/problems/min-stack/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Stack', 'Evaluate Reverse Polish Notation', 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Stack', 'Generate Parentheses', 'https://leetcode.com/problems/generate-parentheses/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Stack', 'Daily Temperatures', 'https://leetcode.com/problems/daily-temperatures/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Stack', 'Car Fleet', 'https://leetcode.com/problems/car-fleet/', 'medium', 'LeetCode'],
      ['NeetCode 150', 'Stack', 'Largest Rectangle in Histogram', 'https://leetcode.com/problems/largest-rectangle-in-histogram/', 'hard', 'LeetCode'],

      // --- STRIVER A2Z ---
      ['Striver A2Z', 'Learn the basics', 'Count Digits', 'https://practice.geeksforgeeks.org/problems/count-digits5716/1', 'easy', 'GeeksForGeeks'],
      ['Striver A2Z', 'Learn the basics', 'Reverse Integer', 'https://leetcode.com/problems/reverse-integer/', 'medium', 'LeetCode'],
      ['Striver A2Z', 'Learn the basics', 'Palindrome Number', 'https://leetcode.com/problems/palindrome-number/', 'easy', 'LeetCode'],
      ['Striver A2Z', 'Learn the basics', 'LCM And GCD', 'https://practice.geeksforgeeks.org/problems/lcm-and-gcd4516/1', 'easy', 'GeeksForGeeks'],
      ['Striver A2Z', 'Learn the basics', 'Armstrong Numbers', 'https://practice.geeksforgeeks.org/problems/armstrong-numbers2727/1', 'easy', 'GeeksForGeeks'],

      ['Striver A2Z', 'Arrays', 'Largest Element in an Array', 'https://practice.geeksforgeeks.org/problems/largest-element-in-array/1', 'easy', 'GeeksForGeeks'],
      ['Striver A2Z', 'Arrays', 'Check if Array Is Sorted and Rotated', 'https://leetcode.com/problems/check-if-array-is-sorted-and-rotated/', 'easy', 'LeetCode'],
      ['Striver A2Z', 'Arrays', 'Remove Duplicates from Sorted Array', 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', 'easy', 'LeetCode'],
      ['Striver A2Z', 'Arrays', 'Move Zeroes', 'https://leetcode.com/problems/move-zeroes/', 'easy', 'LeetCode'],
      ['Striver A2Z', 'Arrays', 'Missing Number', 'https://leetcode.com/problems/missing-number/', 'easy', 'LeetCode'],
      ['Striver A2Z', 'Arrays', 'Max Consecutive Ones', 'https://leetcode.com/problems/max-consecutive-ones/', 'easy', 'LeetCode'],
      ['Striver A2Z', 'Arrays', 'Single Number', 'https://leetcode.com/problems/single-number/', 'easy', 'LeetCode'],

      // --- BLIND 75 ---
      ['Blind 75', 'Array', 'Two Sum', 'https://leetcode.com/problems/two-sum/', 'easy', 'LeetCode'],
      ['Blind 75', 'Array', 'Best Time to Buy and Sell Stock', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', 'easy', 'LeetCode'],
      ['Blind 75', 'Array', 'Contains Duplicate', 'https://leetcode.com/problems/contains-duplicate/', 'easy', 'LeetCode'],
      ['Blind 75', 'Array', 'Product of Array Except Self', 'https://leetcode.com/problems/product-of-array-except-self/', 'medium', 'LeetCode'],
      ['Blind 75', 'Array', 'Maximum Subarray', 'https://leetcode.com/problems/maximum-subarray/', 'medium', 'LeetCode'],
      ['Blind 75', 'Array', 'Maximum Product Subarray', 'https://leetcode.com/problems/maximum-product-subarray/', 'medium', 'LeetCode'],
      ['Blind 75', 'Array', 'Find Minimum in Rotated Sorted Array', 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', 'medium', 'LeetCode'],
      ['Blind 75', 'Array', 'Search in Rotated Sorted Array', 'https://leetcode.com/problems/search-in-rotated-sorted-array/', 'medium', 'LeetCode'],
      ['Blind 75', 'Array', '3Sum', 'https://leetcode.com/problems/3sum/', 'medium', 'LeetCode'],
      ['Blind 75', 'Array', 'Container With Most Water', 'https://leetcode.com/problems/container-with-most-water/', 'medium', 'LeetCode']
    ];

    console.log(`🌱 3/3: Pushing ${problemMatrix.length} Problems to DB...`);

    // 3. Map Matrix to DB Objects
    const finalProblems = problemMatrix.map(row => {
      const [roadmapName, topicName, title, url, difficulty, platform] = row;
      const topicId = dbTopics[`${roadmapName}-${topicName}`];
      
      return {
        userId: req.user._id,
        topicId: topicId,
        title: title,
        url: url,
        difficulty: difficulty,
        platform: platform,
        status: 'unsolved'
      };
    }).filter(p => p.topicId); // Filter out any mapping errors just in case

    // 4. Bulk Insert everything at once (Lighting Fast)
    await DSAProblem.insertMany(finalProblems);

    res.status(201).json({ message: "Successfully cloned massive Roadmap data to DB!" });
  } catch (error) {
    console.error("❌ SEEDING ERROR:", error);
    res.status(500).json({ message: 'Server Error seeding defaults' });
  }
};

exports.getProblems = async (req, res) => {
  try { res.json(await DSAProblem.find({ userId: req.user._id }).sort({ createdAt: -1 })); } 
  catch (err) { res.status(500).json({ message: 'Error' }); }
};

exports.createProblem = async (req, res) => {
  try { res.status(201).json(await DSAProblem.create({ ...req.body, userId: req.user._id })); } 
  catch (err) { res.status(500).json({ message: 'Error' }); }
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
  } catch (err) { res.status(500).json({ message: 'Error' }); }
};

const DSASyncProfile = require('../models/DSASyncProfile'); // <-- Add this at the very top of the file

// ==========================================
// SYNC ENGINE CONTROLLERS
// ==========================================
exports.getSyncProfile = async (req, res) => {
  try {
    let profile = await DSASyncProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await DSASyncProfile.create({ userId: req.user._id });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sync profile' });
  }
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
  } catch (error) {
    res.status(500).json({ message: 'Error saving sync credentials' });
  }
};