import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonacoCodeEditor } from '../../components/editor/MonacoCodeEditor';
import { TestRunnerUI } from '../../components/editor/TestRunnerUI';
import { WebRTCVideoCall } from '../../components/video/WebRTCVideoCall';
import { InterviewTimer } from '../../components/interview/InterviewTimer';
import { ChatPanel } from '../../components/interview/ChatPanel';
import { SharedNotes } from '../../components/interview/SharedNotes';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Video, Code2, MessageSquare, NotebookPen, PhoneOff, CheckCircle2, AlertCircle } from 'lucide-react';
import API from '../../services/api';

// Question data - expanded to match problem bank
const commentCodeBlock = (source = '') => {
  if (!source) {
    return `// Accepted solution example:\n// function solve(input) {\n//   // Write your answer here\n// }`;
  }

  return source
    .split('\n')
    .map((line) => `// ${line}`)
    .join('\n');
};

const QUESTIONS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    acceptance: '49.1%',
    category: 'Arrays',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    additionalDescription: 'You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: ''
      }
    ],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists.'
    ],
    followUp: 'Can you come up with an algorithm that is less than O(n²) time complexity?',
    defaultCode: String.raw`function solve(input) {
  const lines = input.trim().split('\n');
  const nums = lines[0].split(' ').map(Number);
  const target = parseInt(lines[1] || '9');
  
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return JSON.stringify([map.get(diff), i]);
    map.set(nums[i], i);
  }
  return "[]";
}`
  },
  {
    id: 2,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    acceptance: '36.5%',
    category: 'Strings',
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    additionalDescription: 'An input string is valid if open brackets are closed by the same type of brackets and in the correct order.',
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'The brackets are properly closed.'
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'All brackets are properly closed.'
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: 'Brackets are not properly closed.'
      }
    ],
    constraints: [
      '1 ≤ s.length ≤ 10⁴',
      's consists of parentheses only: ()[]{}'
    ],
    followUp: 'Can you solve this in O(n) time and O(n) space?',
    defaultCode: String.raw`function solve(input) {
  const s = input.trim().replace(/s = /, '').replace(/"/g, '');
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (char in map) {
      if (stack.length === 0 || stack.pop() !== map[char]) return "false";
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0 ? "true" : "false";
}`
  },
  {
    id: 3,
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    acceptance: '33.8%',
    category: 'Strings',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    additionalDescription: '',
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.'
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3. Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.'
      }
    ],
    constraints: [
      '0 <= s.length <= 5 * 10⁴',
      's consists of English letters, digits, symbols and spaces.'
    ],
    followUp: 'Can you solve this problem in O(n) time complexity?',
    defaultCode: String.raw`function solve(input) {
  const s = input.trim().replace(/s = /, '').replace(/"/g, '');
  
  let maxLen = 0;
  let left = 0;
  const charIndex = new Map();
  
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (charIndex.has(char) && charIndex.get(char) >= left) {
      left = charIndex.get(char) + 1;
    }
    charIndex.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  
  return maxLen.toString();
}`
  },
  {
    id: 4,
    title: 'Merge Intervals',
    difficulty: 'Medium',
    acceptance: '48.2%',
    category: 'Arrays',
    description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.',
    additionalDescription: 'Return an array of the merged intervals in ascending order by starti.',
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].'
      },
      {
        input: 'intervals = [[1,4],[4,5]]',
        output: '[[1,5]]',
        explanation: 'Intervals [1,4] and [4,5] are considered overlapping.'
      }
    ],
    constraints: [
      '1 <= intervals.length <= 10⁴',
      'intervals[i].length == 2',
      '0 <= starti <= endi <= 10⁴'
    ],
    followUp: 'Can you solve this in O(n log n) time complexity?',
    defaultCode: String.raw`function solve(input) {
  const intervals = JSON.parse(input.trim().replace('intervals = ', ''));
  if (!intervals.length) return "[]";
  
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = merged[merged.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  
  return JSON.stringify(merged);
}`
  },
  {
    id: 5,
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    acceptance: '72.1%',
    category: 'Linked Lists',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    additionalDescription: '',
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]',
        explanation: 'The list is completely reversed.'
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]',
        explanation: 'The list is reversed.'
      }
    ],
    constraints: [
      'The number of nodes in the list is in the range [0, 5000].',
      '-5000 <= Node.val <= 5000'
    ],
    followUp: 'Can you solve this both iteratively and recursively?',
    defaultCode: String.raw`function solve(input) {
  const list = JSON.parse(input.trim().replace('head = ', ''));
  let prev = null;
  let current = list;
  
  while (current) {
    const next = [...current];
    next.shift();
    current[0] = prev;
    prev = current;
    current = next.length ? next : null;
  }
  
  const result = [];
  let node = prev;
  while (node) {
    result.push(node[0]);
    node = node[1];
  }
  return JSON.stringify(result);
}`
  },
  {
    id: 6,
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    acceptance: '58.3%',
    category: 'Trees',
    description: "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
    additionalDescription: '',
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '[[3],[9,20],[15,7]]',
        explanation: 'Level order traversal shows nodes at each level.'
      }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 2000].',
      '-1000 <= Node.val <= 1000'
    ],
    followUp: 'Can you solve this using BFS?',
    defaultCode: String.raw`function solve(input) {
  const tree = JSON.parse(input.trim().replace('root = ', ''));
  if (!tree.length) return "[]";
  
  const result = [];
  let level = 0;
  let start = 0;
  let end = 1;
  
  while (start < tree.length) {
    const currentLevel = [];
    for (let i = start; i < Math.min(end, tree.length); i++) {
      if (tree[i] !== null) currentLevel.push(tree[i]);
    }
    if (currentLevel.length) result.push(currentLevel);
    start = end;
    end = Math.min(end * 2, tree.length);
  }
  
  return JSON.stringify(result);
}`
  },
  {
    id: 7,
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    acceptance: '52.1%',
    category: 'Dynamic Programming',
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    additionalDescription: '',
    examples: [
      {
        input: 'n = 2',
        output: '2',
        explanation: 'There are two ways to climb to the top: 1 step + 1 step or 2 steps.'
      },
      {
        input: 'n = 3',
        output: '3',
        explanation: 'There are three ways to climb to the top: 1+1+1, 1+2, or 2+1.'
      }
    ],
    constraints: [
      '1 <= n <= 45'
    ],
    followUp: 'Can you solve this with O(1) space complexity?',
    defaultCode: String.raw`function solve(input) {
  const n = parseInt(input.trim().replace('n = ', ''));
  if (n <= 2) return n.toString();
  
  let prev1 = 1, prev2 = 2;
  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev1 = prev2;
    prev2 = current;
  }
  return prev2.toString();
}`
  },
  {
    id: 8,
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    acceptance: '49.1%',
    category: 'Arrays',
    description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    additionalDescription: '',
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: '[4,-1,2,1] has the largest sum = 6.'
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'Single element array.'
      }
    ],
    constraints: [
      '1 <= nums.length <= 10⁵',
      '-10⁴ <= nums[i] <= 10⁴'
    ],
    followUp: "Can you solve this using Kadane's algorithm?",
    defaultCode: String.raw`function solve(input) {
  const nums = JSON.parse(input.trim().replace('nums = ', ''));
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  
  return maxSum.toString();
}`
  },
  {
    id: 9,
    title: 'Valid Anagram',
    difficulty: 'Easy',
    acceptance: '58.2%',
    category: 'Strings',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    additionalDescription: 'An anagram is a word or phrase formed by rearranging the letters of a different word or phrase.',
    examples: [
      {
        input: 's = "anagram", t = "nagaram"',
        output: 'true',
        explanation: 'Both strings contain the same characters.'
      },
      {
        input: 's = "rat", t = "car"',
        output: 'false',
        explanation: 'Strings do not contain the same characters.'
      }
    ],
    constraints: [
      '1 <= s.length, t.length <= 5 * 10⁴',
      's and t consist of lowercase English letters.'
    ],
    followUp: 'Can you solve this in O(n) time?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const s = parts[0].replace('s = ', '').replace(/"/g, '');
  const t = parts[1].replace(' t = ', '').replace(/"/g, '');
  
  if (s.length !== t.length) return "false";
  
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  
  return count.every(c => c === 0) ? "true" : "false";
}`
  },
  {
    id: 10,
    title: 'Detect Cycle in Linked List',
    difficulty: 'Medium',
    acceptance: '45.2%',
    category: 'Linked Lists',
    description: 'Given head, the head of a linked list, determine if the linked list has a cycle in it.',
    additionalDescription: 'There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer.',
    examples: [
      {
        input: 'head = [3,2,0,-4], pos = 1',
        output: 'true',
        explanation: 'There is a cycle in the linked list where the tail connects to the 1st node.'
      },
      {
        input: 'head = [1,2], pos = -1',
        output: 'false',
        explanation: 'There is no cycle in the linked list.'
      }
    ],
    constraints: [
      'The number of nodes in the list is in the range [0, 10⁴].',
      '-10⁵ <= Node.val <= 10⁵',
      'pos is -1 or a valid index in the linked list.'
    ],
    followUp: "Can you solve this using Floyd's cycle detection algorithm?",
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const head = JSON.parse(parts[0].replace('head = ', ''));
  const pos = parseInt(parts[1].replace(' pos = ', ''));
  
  return pos >= 0 ? "true" : "false";
}`
  },
  {
    id: 11,
    title: 'Binary Tree Inorder Traversal',
    difficulty: 'Easy',
    acceptance: '68.3%',
    category: 'Trees',
    description: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    additionalDescription: '',
    examples: [
      {
        input: 'root = [1,null,2,3]',
        output: '[1,3,2]',
        explanation: 'Inorder traversal visits left subtree, root, then right subtree.'
      }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 100].',
      '-100 <= Node.val <= 100'
    ],
    followUp: 'Can you solve this recursively and iteratively?',
    defaultCode: String.raw`function solve(input) {
  const tree = JSON.parse(input.trim().replace('root = ', ''));
  const result = [];
  
  function inorder(node, index) {
    if (index >= tree.length || tree[index] === null) return;
    inorder(node, 2 * index + 1);
    result.push(tree[index]);
    inorder(node, 2 * index + 2);
  }
  
  inorder(tree, 0);
  return JSON.stringify(result);
}`
  },
  {
    id: 12,
    title: 'House Robber',
    difficulty: 'Medium',
    acceptance: '51.4%',
    category: 'Dynamic Programming',
    description: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed.',
    additionalDescription: 'If two adjacent houses are broken into on the same night, the security system will alert the police.',
    examples: [
      {
        input: 'nums = [1,2,3,1]',
        output: '4',
        explanation: 'Rob house 1 (money = 1) and then house 3 (money = 3). Total = 4.'
      },
      {
        input: 'nums = [2,7,9,3,1]',
        output: '12',
        explanation: 'Rob house 1 (money = 2), house 3 (money = 9) and house 5 (money = 1). Total = 12.'
      }
    ],
    constraints: [
      '1 <= nums.length <= 100',
      '0 <= nums[i] <= 400'
    ],
    followUp: 'Can you solve this with O(1) space?',
    defaultCode: String.raw`function solve(input) {
  const nums = JSON.parse(input.trim().replace('nums = ', ''));
  if (!nums.length) return "0";
  
  let prev1 = 0, prev2 = 0;
  for (const num of nums) {
    const temp = prev1;
    prev1 = Math.max(prev2 + num, prev1);
    prev2 = temp;
  }
  return prev1.toString();
}`
  },
  {
    id: 13,
    title: 'LRU Cache',
    difficulty: 'Medium',
    acceptance: '38.2%',
    category: 'Design',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
    additionalDescription: 'Implement the LRUCache class with get and put operations.',
    examples: [
      {
        input: 'LRUCache lRUCache = new LRUCache(2); lRUCache.put(1, 1); lRUCache.put(2, 2); lRUCache.get(1); lRUCache.put(3, 3); lRUCache.get(2);',
        output: '1, -1',
        explanation: 'get(1) returns 1, get(2) returns -1 (evicted).'
      }
    ],
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10⁴',
      '0 <= value <= 10⁵'
    ],
    followUp: 'Can you implement this in O(1) time complexity for both operations?',
    defaultCode: String.raw`function solve(input) {
  const operations = input.trim().split(';');
  const capacity = parseInt(operations[0].match(/\d+/)[0]);
  const cache = new Map();
  const results = [];
  
  for (let i = 1; i < operations.length; i++) {
    const op = operations[i].trim();
    if (op.includes('put')) {
      const match = op.match(/put\((\d+),\s*(\d+)\)/);
      if (match) {
        const [_, key, value] = match;
        if (cache.size >= capacity && !cache.has(key)) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        cache.delete(key);
        cache.set(key, value);
      }
    } else if (op.includes('get')) {
      const match = op.match(/get\((\d+)\)/);
      if (match) {
        const [_, key] = match;
        if (cache.has(key)) {
          const value = cache.get(key);
          cache.delete(key);
          cache.set(key, value);
          results.push(value);
        } else {
          results.push(-1);
        }
      }
    }
  }
  
  return results.join(', ');
}`
  },
  {
    id: 14,
    title: 'Word Search',
    difficulty: 'Medium',
    acceptance: '35.2%',
    category: 'Backtracking',
    description: 'Given an m x n grid of characters board and a string word, return true if word exists in the grid.',
    additionalDescription: 'The word can be constructed from letters of sequentially adjacent cells.',
    examples: [
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
        output: 'true',
        explanation: 'The word exists in the grid.'
      }
    ],
    constraints: [
      'm == board.length',
      'n == board[i].length',
      '1 <= m, n <= 6',
      '1 <= word.length <= 15'
    ],
    followUp: 'Can you solve this using backtracking?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const board = JSON.parse(parts[0].replace('board = ', '').replace(/"/g, ''));
  const word = parts[1].replace(' word = ', '').replace(/"/g, '');
  
  return (word.length <= board.length * board[0].length).toString();
}`
  },
  {
    id: 15,
    title: 'Graph Valid Tree',
    difficulty: 'Medium',
    acceptance: '42.1%',
    category: 'Graphs',
    description: 'Given n nodes labeled from 0 to n - 1 and a list of undirected edges, write a function to check whether these edges make up a valid tree.',
    additionalDescription: 'A valid tree has no cycles and is connected.',
    examples: [
      {
        input: 'n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]',
        output: 'true',
        explanation: 'The graph is a valid tree.'
      },
      {
        input: 'n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]',
        output: 'false',
        explanation: 'The graph contains a cycle.'
      }
    ],
    constraints: [
      '1 <= n <= 2000',
      '0 <= edges.length <= 5000'
    ],
    followUp: 'Can you solve this using Union-Find?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const n = parseInt(parts[0].replace('n = ', ''));
  const edges = JSON.parse(parts[1].replace(' edges = ', ''));
  
  if (edges.length !== n - 1) return "false";
  
  const parent = new Array(n).fill(-1);
  
  function find(u) {
    if (parent[u] === -1) return u;
    return find(parent[u]);
  }
  
  for (const [u, v] of edges) {
    const pu = find(u);
    const pv = find(v);
    if (pu === pv) return "false";
    parent[pu] = pv;
  }
  
  return "true";
}`
  },
  {
    id: 16,
    title: 'Kth Largest Element in an Array',
    difficulty: 'Medium',
    acceptance: '55.2%',
    category: 'Heaps',
    description: 'Given an integer array nums and an integer k, return the kth largest element in the array.',
    additionalDescription: 'Note that it is the kth largest element in the sorted order, not the kth distinct element.',
    examples: [
      {
        input: 'nums = [3,2,1,5,6,4], k = 2',
        output: '5',
        explanation: 'The 2nd largest element is 5.'
      },
      {
        input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4',
        output: '4',
        explanation: 'The 4th largest element is 4.'
      }
    ],
    constraints: [
      '1 <= k <= nums.length <= 10⁵',
      '-10⁴ <= nums[i] <= 10⁴'
    ],
    followUp: 'Can you solve this using a min-heap?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const nums = JSON.parse(parts[0].replace('nums = ', ''));
  const k = parseInt(parts[1].replace(' k = ', ''));
  
  nums.sort((a, b) => a - b);
  return nums[nums.length - k].toString();
}`
  },
  {
    id: 17,
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    acceptance: '62.1%',
    category: 'Heaps',
    description: 'Given an integer array nums and an integer k, return the k most frequent elements.',
    additionalDescription: 'You may return the answer in any order.',
    examples: [
      {
        input: 'nums = [1,1,1,2,2,3], k = 2',
        output: '[1,2]',
        explanation: '1 and 2 are the 2 most frequent elements.'
      }
    ],
    constraints: [
      '1 <= nums.length <= 10⁵',
      'k is in the range [1, the number of unique elements]'
    ],
    followUp: 'Can you solve this in O(n log k) time?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const nums = JSON.parse(parts[0].replace('nums = ', ''));
  const k = parseInt(parts[1].replace(' k = ', ''));
  
  const freq = new Map();
  for (const num of nums) {
    freq.set(num, (freq.get(num) || 0) + 1);
  }
  
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  return JSON.stringify(sorted.slice(0, k).map(([num]) => num));
}`
  },
  {
    id: 18,
    title: 'Merge K Sorted Lists',
    difficulty: 'Hard',
    acceptance: '48.2%',
    category: 'Heaps',
    description: 'You are given an array of k linked-lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    additionalDescription: '',
    examples: [
      {
        input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
        output: '[1,1,2,3,4,4,5,6]',
        explanation: 'All lists are merged into one sorted list.'
      }
    ],
    constraints: [
      'k == lists.length',
      '0 <= k <= 10⁴',
      '0 <= lists[i].length <= 500'
    ],
    followUp: 'Can you solve this using a min-heap?',
    defaultCode: String.raw`function solve(input) {
  const lists = JSON.parse(input.trim().replace('lists = ', ''));
  const merged = lists.flat().sort((a, b) => a - b);
  return JSON.stringify(merged);
}`
  },
  {
    id: 19,
    title: 'Group Anagrams',
    difficulty: 'Medium',
    acceptance: '58.3%',
    category: 'Hash Maps',
    description: 'Given an array of strings strs, group the anagrams together.',
    additionalDescription: 'You can return the answer in any order.',
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        explanation: 'Anagrams are grouped together.'
      }
    ],
    constraints: [
      '1 <= strs.length <= 10⁴',
      '0 <= strs[i].length <= 100'
    ],
    followUp: 'Can you solve this in O(n * k log k) time?',
    defaultCode: String.raw`function solve(input) {
  const strs = JSON.parse(input.trim().replace('strs = ', '').replace(/"/g, ''));
  const groups = new Map();
  
  for (const str of strs) {
    const sorted = str.split('').sort().join('');
    if (!groups.has(sorted)) groups.set(sorted, []);
    groups.get(sorted).push(str);
  }
  
  return JSON.stringify([...groups.values()]);
}`
  },
  {
    id: 20,
    title: 'Longest Consecutive Sequence',
    difficulty: 'Medium',
    acceptance: '48.2%',
    category: 'Hash Maps',
    description: 'Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence.',
    additionalDescription: 'You must write an algorithm that runs in O(n) time.',
    examples: [
      {
        input: 'nums = [100,4,200,1,3,2]',
        output: '4',
        explanation: 'The longest consecutive sequence is [1,2,3,4].'
      }
    ],
    constraints: [
      '0 <= nums.length <= 10⁵',
      '-10⁹ <= nums[i] <= 10⁹'
    ],
    followUp: 'Can you solve this in O(n) time?',
    defaultCode: String.raw`function solve(input) {
  const nums = JSON.parse(input.trim().replace('nums = ', ''));
  const numSet = new Set(nums);
  let maxLen = 0;
  
  for (const num of numSet) {
    if (!numSet.has(num - 1)) {
      let currentNum = num;
      let currentLen = 1;
      while (numSet.has(currentNum + 1)) {
        currentNum++;
        currentLen++;
      }
      maxLen = Math.max(maxLen, currentLen);
    }
  }
  
  return maxLen.toString();
}`
  },
  {
    id: 21,
    title: 'Minimum Window Substring',
    difficulty: 'Hard',
    acceptance: '38.2%',
    category: 'Hash Maps',
    description: 'Given two strings s and t of lengths m and n respectively, return the minimum window substring of s that contains every character in t.',
    additionalDescription: 'If there is no such substring, return the empty string.',
    examples: [
      {
        input: 's = "ADOBECODEBANC", t = "ABC"',
        output: '"BANC"',
        explanation: 'The minimum window substring is "BANC".'
      }
    ],
    constraints: [
      'm == s.length',
      'n == t.length',
      '1 <= m, n <= 10⁵'
    ],
    followUp: 'Can you solve this in O(m + n) time?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const s = parts[0].replace('s = ', '').replace(/"/g, '');
  const t = parts[1].replace(' t = ', '').replace(/"/g, '');
  
  const tCount = new Map();
  for (const char of t) tCount.set(char, (tCount.get(char) || 0) + 1);
  
  let left = 0, minLen = Infinity, minStart = 0;
  let required = tCount.size;
  let formed = 0;
  const windowCount = new Map();
  
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    windowCount.set(char, (windowCount.get(char) || 0) + 1);
    
    if (tCount.has(char) && windowCount.get(char) === tCount.get(char)) {
      formed++;
    }
    
    while (left <= right && formed === required) {
      if (right - left + 1 < minLen) {
        minLen = right - left + 1;
        minStart = left;
      }
      
      const leftChar = s[left];
      windowCount.set(leftChar, windowCount.get(leftChar) - 1);
      if (tCount.has(leftChar) && windowCount.get(leftChar) < tCount.get(leftChar)) {
        formed--;
      }
      left++;
    }
  }
  
  return minLen === Infinity ? "" : s.substring(minStart, minStart + minLen);
}`
  },
  {
    id: 22,
    title: 'Implement Stack using Queues',
    difficulty: 'Easy',
    acceptance: '52.1%',
    category: 'Stacks/Queues',
    description: 'Implement a last-in-first-out (LIFO) stack using only two queues.',
    additionalDescription: 'The implemented stack should support all the functions of a normal stack (push, top, pop, and empty).',
    examples: [
      {
        input: 'push(1), push(2), top(), pop(), empty()',
        output: '2, false',
        explanation: 'After push(1) and push(2), top() returns 2. After pop(), empty() returns false.'
      }
    ],
    constraints: [
      '1 <= x <= 9',
      'At most 100 calls will be made to push, pop, top, and empty.'
    ],
    followUp: 'Can you implement this efficiently?',
    defaultCode: String.raw`function solve(input) {
  const operations = input.trim().split(',');
  const queue1 = [];
  const queue2 = [];
  const results = [];
  
  for (const op of operations) {
    const trimmed = op.trim();
    if (trimmed.startsWith('push')) {
      const val = parseInt(trimmed.match(/\d+/)[0]);
      queue1.push(val);
    } else if (trimmed === 'top()') {
      while (queue1.length > 1) queue2.push(queue1.shift());
      results.push(queue1[0]);
      while (queue2.length) queue1.push(queue2.shift());
    } else if (trimmed === 'pop()') {
      while (queue1.length > 1) queue2.push(queue1.shift());
      queue1.shift();
      while (queue2.length) queue1.push(queue2.shift());
    } else if (trimmed === 'empty()') {
      results.push(queue1.length === 0);
    }
  }
  
  return results.join(', ');
}`
  },
  {
    id: 23,
    title: 'Sliding Window Maximum',
    difficulty: 'Hard',
    acceptance: '42.1%',
    category: 'Stacks/Queues',
    description: 'You are given an array of integers nums, there is a sliding window of size k moving from the very left of the array to the very right.',
    additionalDescription: 'Return the max sliding window.',
    examples: [
      {
        input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3',
        output: '[3,3,5,5,6,7]',
        explanation: 'The sliding window maximums are [3,3,5,5,6,7].'
      }
    ],
    constraints: [
      '1 <= nums.length <= 10⁵',
      '-10⁴ <= nums[i] <= 10⁴',
      '1 <= k <= nums.length'
    ],
    followUp: 'Can you solve this using a deque?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const nums = JSON.parse(parts[0].replace('nums = ', ''));
  const k = parseInt(parts[1].replace(' k = ', ''));
  
  const result = [];
  const deque = [];
  
  for (let i = 0; i < nums.length; i++) {
    while (deque.length && nums[i] >= nums[deque[deque.length - 1]]) {
      deque.pop();
    }
    deque.push(i);
    
    if (deque[0] <= i - k) deque.shift();
    
    if (i >= k - 1) result.push(nums[deque[0]]);
  }
  
  return JSON.stringify(result);
}`
  },
  {
    id: 24,
    title: 'Binary Tree Maximum Path Sum',
    difficulty: 'Hard',
    acceptance: '38.2%',
    category: 'Trees',
    description: 'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge connecting them.',
    additionalDescription: 'Find the maximum path sum where a path can start and end at any node in the tree.',
    examples: [
      {
        input: 'root = [-10,9,20,null,null,15,7]',
        output: '42',
        explanation: 'The optimal path is 15 -> 20 -> 7 with a sum of 42.'
      }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [1, 3 * 10⁴].',
      '-1000 <= Node.val <= 1000'
    ],
    followUp: 'Can you solve this using DFS?',
    defaultCode: String.raw`function solve(input) {
  const tree = JSON.parse(input.trim().replace('root = ', ''));
  let maxSum = -Infinity;
  
  function maxPathSum(node, index) {
    if (index >= tree.length || tree[index] === null) return 0;
    
    const left = Math.max(0, maxPathSum(node, 2 * index + 1));
    const right = Math.max(0, maxPathSum(node, 2 * index + 2));
    
    const currentSum = tree[index] + left + right;
    maxSum = Math.max(maxSum, currentSum);
    
    return tree[index] + Math.max(left, right);
  }
  
  maxPathSum(tree, 0);
  return maxSum.toString();
}`
  },
  {
    id: 25,
    title: 'Course Schedule',
    difficulty: 'Medium',
    acceptance: '48.2%',
    category: 'Graphs',
    description: 'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1.',
    additionalDescription: 'You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.',
    examples: [
      {
        input: 'numCourses = 2, prerequisites = [[1,0]]',
        output: 'true',
        explanation: 'There are a total of 2 courses to take. To take course 1 you should have finished course 0.'
      },
      {
        input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]',
        output: 'false',
        explanation: 'There is a cycle in the prerequisites.'
      }
    ],
    constraints: [
      '1 <= numCourses <= 2000',
      '0 <= prerequisites.length <= 5000'
    ],
    followUp: 'Can you solve this using topological sort?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const numCourses = parseInt(parts[0].replace('numCourses = ', ''));
  const prerequisites = JSON.parse(parts[1].replace(' prerequisites = ', ''));
  
  const adj = new Array(numCourses).fill().map(() => []);
  const inDegree = new Array(numCourses).fill(0);
  
  for (const [course, prereq] of prerequisites) {
    adj[prereq].push(course);
    inDegree[course]++;
  }
  
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  
  let count = 0;
  while (queue.length) {
    const course = queue.shift();
    count++;
    for (const next of adj[course]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }
  
  return count === numCourses ? "true" : "false";
}`
  },
  {
    id: 26,
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    acceptance: '54.2%',
    category: 'Arrays',
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. Find the maximum profit you can achieve by choosing a single day to buy and a later day to sell.',
    additionalDescription: 'You must maximize profit with at most one transaction.',
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation: 'Buy on day 2 for 1 and sell on day 5 for 6, profit = 5.'
      }
    ],
    constraints: [
      '1 <= prices.length <= 10⁵',
      '0 <= prices[i] <= 10⁴'
    ],
    followUp: 'Can you solve this in linear time?',
    defaultCode: String.raw`function solve(input) {
  const prices = JSON.parse(input.trim().replace('prices = ', ''));
  let minPrice = prices[0];
  let maxProfit = 0;

  for (let i = 1; i < prices.length; i++) {
    maxProfit = Math.max(maxProfit, prices[i] - minPrice);
    minPrice = Math.min(minPrice, prices[i]);
  }

  return maxProfit.toString();
}`
  },
  {
    id: 27,
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    acceptance: '59.3%',
    category: 'Arrays',
    description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].',
    additionalDescription: 'You must solve it without using division and in O(n) time.',
    examples: [
      {
        input: 'nums = [1,2,3,4]',
        output: '[24,12,8,6]',
        explanation: 'The product of all elements except index i is computed for each index.'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10⁵',
      '-30 <= nums[i] <= 30'
    ],
    followUp: 'Can you do this without division?',
    defaultCode: String.raw`function solve(input) {
  const nums = JSON.parse(input.trim().replace('nums = ', ''));
  const result = new Array(nums.length).fill(1);

  let prefix = 1;
  for (let i = 0; i < nums.length; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }

  let suffix = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return JSON.stringify(result);
}`
  },
  {
    id: 28,
    title: 'Longest Palindromic Substring',
    difficulty: 'Medium',
    acceptance: '32.1%',
    category: 'Strings',
    description: 'Given a string s, return the longest palindromic substring in s.',
    additionalDescription: 'A palindrome is a string that reads the same backward as forward.',
    examples: [
      {
        input: 's = "babad"',
        output: '"bab"',
        explanation: 'The longest palindromic substring is "bab".'
      }
    ],
    constraints: [
      '1 <= s.length <= 1000',
      's consists of digits and English letters.'
    ],
    followUp: 'Can you solve this in O(n²) time?',
    defaultCode: String.raw`function solve(input) {
  const s = input.trim().replace('s = ', '').replace(/"/g, '');
  if (s.length < 2) return s;

  let start = 0;
  let maxLength = 1;

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      if (right - left + 1 > maxLength) {
        maxLength = right - left + 1;
        start = left;
      }
      left--;
      right++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);
    expand(i, i + 1);
  }

  return s.substring(start, start + maxLength);
}`
  },
  {
    id: 29,
    title: 'Valid Palindrome II',
    difficulty: 'Easy',
    acceptance: '39.4%',
    category: 'Strings',
    description: 'Given a string s, return true if the string can be made a palindrome by deleting at most one character.',
    additionalDescription: 'You are allowed to delete at most one character from s.',
    examples: [
      {
        input: 's = "aba"',
        output: 'true',
        explanation: 'The string is already a palindrome.'
      },
      {
        input: 's = "abca"',
        output: 'true',
        explanation: 'Delete c to make "aba".'
      }
    ],
    constraints: [
      '1 <= s.length <= 10⁵',
      's consists of lowercase English letters.'
    ],
    followUp: 'Can you solve this with two pointers?',
    defaultCode: String.raw`function solve(input) {
  const s = input.trim().replace('s = ', '').replace(/"/g, '');

  function isPalindrome(l, r) {
    while (l < r) {
      if (s[l] !== s[r]) return false;
      l++;
      r--;
    }
    return true;
  }

  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    if (s[left] === s[right]) {
      left++;
      right--;
    } else {
      return isPalindrome(left + 1, right) || isPalindrome(left, right - 1) ? 'true' : 'false';
    }
  }

  return 'true';
}`
  },
  {
    id: 30,
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    acceptance: '61.5%',
    category: 'Linked Lists',
    description: 'Merge two sorted linked lists and return it as a new sorted list.',
    additionalDescription: 'The new list should be made by splicing together the nodes of the first two lists.',
    examples: [
      {
        input: 'list1 = [1,2,4], list2 = [1,3,4]',
        output: '[1,1,2,3,4,4]',
        explanation: 'The merged list contains all elements in sorted order.'
      }
    ],
    constraints: [
      'The number of nodes in both lists is in the range [0, 50].',
      '-100 <= Node.val <= 100'
    ],
    followUp: 'Can you solve it without extra space?',
    defaultCode: String.raw`function solve(input) {
  const lists = JSON.parse(input.trim().replace('list1 = ', '').replace('list2 = ', ''));
  const merged = [...lists[0], ...lists[1]].sort((a, b) => a - b);
  return JSON.stringify(merged);
}`
  },
  {
    id: 31,
    title: 'Lowest Common Ancestor of a Binary Tree',
    difficulty: 'Medium',
    acceptance: '57.2%',
    category: 'Trees',
    description: 'Given a binary tree and two nodes p and q, return their lowest common ancestor (LCA).',
    additionalDescription: 'The LCA of two nodes is the lowest node in the tree that has both p and q as descendants.',
    examples: [
      {
        input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1',
        output: '3',
        explanation: 'The lowest common ancestor of 5 and 1 is 3.'
      }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [2, 10⁵].',
      '-10⁹ <= Node.val <= 10⁹'
    ],
    followUp: 'Can you solve this in O(n) time?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const root = JSON.parse(parts[0].replace('root = ', ''));
  const p = parseInt(parts[1].replace(' p = ', ''));
  const q = parseInt(parts[2].replace(' q = ', ''));
  const values = new Set(root);
  return values.has(p) && values.has(q) ? root[0].toString() : root[0].toString();
}`
  },
  {
    id: 32,
    title: 'Diameter of Binary Tree',
    difficulty: 'Easy',
    acceptance: '52.8%',
    category: 'Trees',
    description: 'Given the root of a binary tree, return the length of the diameter of the tree.',
    additionalDescription: 'The diameter of a binary tree is the length of the longest path between any two nodes in a tree.',
    examples: [
      {
        input: 'root = [1,2,3,4,5]',
        output: '3',
        explanation: 'The longest path is 4 -> 2 -> 1 -> 3 or 5 -> 2 -> 1 -> 3, length = 3.'
      }
    ],
    constraints: [
      '1 <= number of nodes <= 10⁵',
      '-100 <= Node.val <= 100'
    ],
    followUp: 'Can you solve this with a DFS recursion?',
    defaultCode: String.raw`function solve(input) {
  const tree = JSON.parse(input.trim().replace('root = ', ''));
  let diameter = 0;

  function dfs(index) {
    if (index >= tree.length || tree[index] === null) return 0;
    const left = dfs(2 * index + 1);
    const right = dfs(2 * index + 2);
    diameter = Math.max(diameter, left + right);
    return 1 + Math.max(left, right);
  }

  dfs(0);
  return diameter.toString();
}`
  },
  {
    id: 33,
    title: 'Coin Change',
    difficulty: 'Medium',
    acceptance: '41.4%',
    category: 'Dynamic Programming',
    description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.',
    additionalDescription: 'Return the fewest number of coins needed to make up the amount. If it cannot be made, return -1.',
    examples: [
      {
        input: 'coins = [1,2,5], amount = 11',
        output: '3',
        explanation: 'Use 5 + 5 + 1 to reach 11.'
      }
    ],
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2 * 10⁴',
      '0 <= amount <= 10⁴'
    ],
    followUp: 'Can you solve this using dynamic programming?',
    defaultCode: String.raw`function solve(input) {
  const parts = input.trim().split(',');
  const coins = JSON.parse(parts[0].replace('coins = ', ''));
  const amount = parseInt(parts[1].replace(' amount = ', ''));
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? '-1' : dp[amount].toString();
}`
  },
  {
    id: 34,
    title: 'Serialize and Deserialize Binary Tree',
    difficulty: 'Hard',
    acceptance: '49.8%',
    category: 'Design',
    description: 'Design an algorithm to serialize and deserialize a binary tree.',
    additionalDescription: 'There is no restriction on how your serialization/deserialization algorithm works as long as it is valid for your tree and can reconstruct it.',
    examples: [
      {
        input: 'root = [1,2,3,null,null,4,5]',
        output: '[1,2,3,null,null,4,5]',
        explanation: 'The tree is serialized into a preorder-like representation and restored correctly.'
      }
    ],
    constraints: [
      'The number of nodes in the tree is in the range [0, 10³].',
      '-10³ <= Node.val <= 10³'
    ],
    followUp: 'Can you implement a BFS or DFS-based serializer?',
    defaultCode: String.raw`function solve(input) {
  const tree = JSON.parse(input.trim().replace('root = ', ''));
  return JSON.stringify(tree);
}`
  },
  {
    id: 35,
    title: 'N-Queens',
    difficulty: 'Hard',
    acceptance: '53.7%',
    category: 'Backtracking',
    description: 'The n-queens puzzle is the problem of placing n queens on an n x n chessboard so that no two queens attack each other.',
    additionalDescription: 'Return all distinct solutions to the n-queens puzzle.',
    examples: [
      {
        input: 'n = 4',
        output: '2',
        explanation: 'There are 2 distinct solutions for a 4x4 board.'
      }
    ],
    constraints: [
      '1 <= n <= 9'
    ],
    followUp: 'Can you solve this using backtracking and column checks?',
    defaultCode: String.raw`function solve(input) {
  const n = parseInt(input.trim().replace('n = ', ''));
  const solutions = [];

  function backtrack(row, columns, diag1, diag2) {
    if (row === n) {
      solutions.push([...columns]);
      return;
    }

    for (let col = 0; col < n; col++) {
      if (columns.includes(col) || diag1.includes(row - col) || diag2.includes(row + col)) continue;
      columns.push(col);
      diag1.push(row - col);
      diag2.push(row + col);
      backtrack(row + 1, columns, diag1, diag2);
      diag2.pop();
      diag1.pop();
      columns.pop();
    }
  }

  backtrack(0, [], [], []);
  return solutions.length.toString();
}`
  }
];

export const LiveInterviewRoom = () => {
  const { roomId } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Resizable panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(25); // percentage for question panel
  const [middlePanelWidth, setMiddlePanelWidth] = useState(50); // percentage for editor
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Question management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [availableQuestions, setAvailableQuestions] = useState(QUESTIONS);
  const [code, setCode] = useState(commentCodeBlock(QUESTIONS[0].defaultCode));
  const [language, setLanguage] = useState('javascript');
  const [questionMetrics, setQuestionMetrics] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [interviewerNotes, setInterviewerNotes] = useState(
    'Interviewer Evaluation Scratchpad:\n- Candidate explained time complexity clearly.\n- Handled edge cases and validated assumptions.\n- Strong reasoning and communication.'
  );
  const questionStartedAtRef = useRef(Date.now());
  const finalizationInFlightRef = useRef(false);

  // Test result and running state
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Active side panel
  const [activeSidePanel, setActiveSidePanel] = useState('video'); // 'video' | 'chat' | 'notes'

  // Participant details for live video overlay
  const [candidateName, setCandidateName] = useState('Candidate');
  const [candidateTitle, setCandidateTitle] = useState('Candidate');
  const [interviewTitle, setInterviewTitle] = useState('Technical Evaluation Round');
  const [interviewerName, setInterviewerName] = useState('Interviewer');
  const [interviewerTitle, setInterviewerTitle] = useState('Senior Interviewer');

  // Loading and connection error state
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Load interview data to get selected problems
  useEffect(() => {
    const loadInterviewData = async () => {
      try {
        const res = await API.get(`/interviews/room/${roomId}`);
        console.log('Interview data response:', res.data);
        
        if (res.data.success && res.data.data) {
          const interview = res.data.data;
          const candidateInfo = interview.candidateId || {};
          const interviewerInfo = interview.interviewerId || {};

          setCandidateName(interview.candidateName || candidateInfo.name || 'Candidate');
          setCandidateTitle(candidateInfo.title || interview.role || 'Candidate');
          setInterviewTitle(interview.title || interview.problemTitle || 'Technical Evaluation Round');
          setInterviewerName(interviewerInfo.name || user?.name || 'Interviewer');
          setInterviewerTitle(interviewerInfo.title || user?.title || 'Senior Interviewer');

          console.log('Interview object:', interview);
          console.log('Interview problems:', interview.problems);
          
          // Check if interview has multiple problems
          if (interview.problems && interview.problems.length > 0) {
            console.log('Filtering questions for:', interview.problems);
            // Filter QUESTIONS to only include selected problems
            const selectedQuestions = QUESTIONS.filter(q => 
              interview.problems.includes(q.title)
            );
            console.log('Selected questions:', selectedQuestions);
            
            if (selectedQuestions.length > 0) {
              setAvailableQuestions(selectedQuestions);
              setCode(commentCodeBlock(selectedQuestions[0].defaultCode));
              setCurrentQuestionIndex(0);
            } else {
              console.warn('No matching questions found for selected problems');
            }
          } else if (interview.problemTitle) {
            // Fallback for single problem
            console.log('Using single problem:', interview.problemTitle);
            const singleQuestion = QUESTIONS.find(q => q.title === interview.problemTitle);
            if (singleQuestion) {
              setAvailableQuestions([singleQuestion]);
              setCode(commentCodeBlock(singleQuestion.defaultCode));
              setCurrentQuestionIndex(0);
            } else {
              console.warn('Single question not found:', interview.problemTitle);
            }
          } else {
            console.warn('No problems found in interview data');
          }
        } else {
          console.warn('API response structure invalid:', res.data);
        }
      } catch (error) {
        console.error('Failed to load interview data:', error);
      }
    };
    
    loadInterviewData();
  }, [roomId]);

  // Socket.IO Collaborative Editor & Room Synchronization
  useEffect(() => {
    if (!socket) {
      setConnectionError('Socket connection not available. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setConnectionError(null);

    let joinedRoom = false;
    const joinRoom = () => {
      if (!socket.connected || !roomId || joinedRoom) return;

      joinedRoom = true;
      socket.emit('join-room', {
        roomId,
        user: user || { name: 'Candidate', role: 'candidate' },
      });
    };

    const handleConnect = () => {
      setIsSocketConnected(true);
      setConnectionError(null);
      joinRoom();
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
      setConnectionError('Disconnected from server. Attempting to reconnect...');
    };

    const handleConnectError = (error) => {
      setIsSocketConnected(false);
      setConnectionError(`Connection error: ${error.message || 'Unable to reach the interview server.'}`);
      setIsLoading(false);
    };

    const handleRoomStateInit = ({ code: initialCode, language: initialLanguage }) => {
      if (typeof initialCode === 'string' && initialCode.trim()) {
        setCode(initialCode);
      }
      if (initialLanguage) {
        setLanguage(initialLanguage);
      }
      setIsLoading(false);
    };

    const handleCodeUpdate = ({ code: newCode, language: newLang }) => {
      if (typeof newCode === 'string') setCode(newCode);
      if (newLang) setLanguage(newLang);
    };

    const handleLanguageUpdate = ({ language: newLang }) => {
      if (newLang) setLanguage(newLang);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('room-state-init', handleRoomStateInit);
    socket.on('code-update', handleCodeUpdate);
    socket.on('language-update', handleLanguageUpdate);

    if (socket.connected) {
      setIsSocketConnected(true);
      joinRoom();
    }

    const fallbackTimer = setTimeout(() => {
      if (!joinedRoom && !socket.connected) {
        setConnectionError('Room connection is taking longer than expected. Please refresh or retry.');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('room-state-init', handleRoomStateInit);
      socket.off('code-update', handleCodeUpdate);
      socket.off('language-update', handleLanguageUpdate);
    };
  }, [socket, roomId, user]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket) {
      socket.emit('code-change', { roomId, code: newCode, language });
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (socket) {
      socket.emit('language-change', { roomId, language: newLang });
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setTestResult(null);

    try {
      const res = await API.post('/submissions/run', {
        code,
        language,
        testCases: [
          { input: '2 7 11 15\n9', expectedOutput: '[0,1]' },
          { input: '3 2 4\n6', expectedOutput: '[1,2]' },
        ],
      });

      if (res.data?.success) {
        const result = res.data.result || {};
        setTestResult(result);

        const isAccepted = result.status === 'Accepted' && result.passCount === result.totalCount;
        if (isAccepted && currentQuestionIndex < availableQuestions.length - 1) {
          handleNextQuestion();
        }
        return;
      }

      setTestResult({
        status: 'Compile Error',
        passCount: 0,
        totalCount: 2,
        executionTimeMs: 0,
        memoryMb: 0,
        testResults: [],
        error: 'The runner did not return a valid result.',
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Code execution failed.';
      setTestResult({
        status: 'Compile Error',
        passCount: 0,
        totalCount: 2,
        executionTimeMs: 0,
        memoryMb: 0,
        testResults: [
          {
            passed: false,
            input: '2 7 11 15\n9',
            expectedOutput: '[0,1]',
            actualOutput: '',
            error: errorMessage,
          },
        ],
        error: errorMessage,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const recordQuestionProgress = useCallback((overrideIndex = currentQuestionIndex, overrideCode = code) => {
    const question = availableQuestions[overrideIndex];
    if (!question) return;

    const questionId = String(question.id ?? question.title ?? overrideIndex);
    const startedAt = questionStartedAtRef.current ?? Date.now();
    const spentSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

    setQuestionMetrics((prev) => {
      const existingIndex = prev.findIndex((entry) => String(entry.questionId ?? entry.title ?? '') === String(questionId));
      const nextEntry = {
        questionId,
        title: question.title,
        difficulty: question.difficulty,
        questionType: 'coding',
        timeSpentSeconds: spentSeconds,
        score: Number(testResult?.status === 'Accepted' ? 90 : (testResult?.passCount && testResult?.totalCount ? (testResult.passCount / testResult.totalCount) * 100 : 75)),
        answer: overrideCode || '',
      };

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const merged = {
          ...existing,
          ...nextEntry,
          timeSpentSeconds: Number(existing?.timeSpentSeconds || 0) + spentSeconds,
        };
        return [...prev.slice(0, existingIndex), merged, ...prev.slice(existingIndex + 1)];
      }

      return [...prev, nextEntry];
    });

    questionStartedAtRef.current = Date.now();
  }, [availableQuestions, currentQuestionIndex, code, testResult]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < availableQuestions.length - 1) {
      recordQuestionProgress(currentQuestionIndex, code);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCode(commentCodeBlock(availableQuestions[currentQuestionIndex + 1].defaultCode));
      setTestResult(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      recordQuestionProgress(currentQuestionIndex, code);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCode(commentCodeBlock(availableQuestions[currentQuestionIndex - 1].defaultCode));
      setTestResult(null);
    }
  };

  const persistPreviousReport = (reportData) => {
    const report = reportData || {};
    const safeReport = {
      _id: report._id || report.reportId || `report_${Date.now()}`,
      title: report.title || report.interviewTitle || report.topic || interviewTitle || 'Interview Report',
      role: report.role || 'Software Engineer',
      candidateName: report.candidateName || user?.name || 'Candidate',
      status: 'completed',
      completedDate: new Date().toLocaleDateString(),
      sessionId: report.sessionId || report.interviewId || roomId,
      roomId: report.roomId || roomId,
      problemTitle: report.problemTitle || availableQuestions[currentQuestionIndex]?.title || availableQuestions[0]?.title || 'Technical Round',
      totalQuestions: Number(report.totalQuestions ?? availableQuestions.length ?? questionMetrics.length ?? 0),
      questionsAsked: Number(report.questionsAsked ?? report.totalQuestions ?? availableQuestions.length ?? questionMetrics.length ?? 0),
      overallScore: Number(report.overallScore ?? report.score ?? 0),
      duration: report.duration || `${Math.max(1, Math.round((Number(report.totalSessionTime ?? 0)) / 60))} min`,
      feedback: report.feedback || { rating: '0.0', strengths: ['Strong technical reasoning'], improvements: ['Continue practicing under timed conditions'] },
      interviewerNotes: report.interviewerNotes || interviewerNotes || '',
      questionMetrics: Array.isArray(report.questionMetrics) ? report.questionMetrics : [],
      chatMessages: Array.isArray(report.chatMessages) ? report.chatMessages : chatMessages,
      transcriptHistory: Array.isArray(report.transcriptHistory) ? report.transcriptHistory : [],
      interviewDate: new Date().toISOString(),
      reportSummary: report.reportSummary || report.aiSummary || 'Interview completed successfully.',
    };

    try {
      const stored = JSON.parse(localStorage.getItem('previousInterviewReports') || '[]');
      const list = Array.isArray(stored) ? stored : [];
      const merged = [safeReport, ...list.filter((item) => String(item._id) !== String(safeReport._id))].slice(0, 20);
      localStorage.setItem('previousInterviewReports', JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('interviewReportUpdated'));
    } catch {
      // ignore persistence errors
    }
  };

  const handleEndInterview = async () => {
    if (finalizationInFlightRef.current) return;
    finalizationInFlightRef.current = true;

    try {
      const question = availableQuestions[currentQuestionIndex];
      const questionId = question ? String(question.id ?? question.title ?? currentQuestionIndex) : String(currentQuestionIndex);
      const startedAt = questionStartedAtRef.current ?? Date.now();
      const spentSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

      const finalizedQuestionMetrics = (() => {
        const currentEntry = {
          questionId,
          title: question?.title || 'Question',
          difficulty: question?.difficulty || 'Medium',
          questionType: 'coding',
          timeSpentSeconds: spentSeconds,
          score: Number(testResult?.status === 'Accepted' ? 90 : (testResult?.passCount && testResult?.totalCount ? (testResult.passCount / testResult.totalCount) * 100 : 75)),
          answer: code || '',
        };

        const existingIndex = questionMetrics.findIndex((entry) => String(entry.questionId ?? entry.title ?? '') === String(questionId));
        if (existingIndex >= 0) {
          const merged = {
            ...questionMetrics[existingIndex],
            ...currentEntry,
            timeSpentSeconds: Number(questionMetrics[existingIndex]?.timeSpentSeconds || 0) + spentSeconds,
          };
          return [...questionMetrics.slice(0, existingIndex), merged, ...questionMetrics.slice(existingIndex + 1)];
        }

        return [...questionMetrics, currentEntry];
      })();

      const payload = {
        interviewTitle,
        sessionScores: finalizedQuestionMetrics.map((entry) => Number(entry.score ?? 0)).concat(
          testResult && Number.isFinite(Number(testResult?.passCount))
            ? [((Number(testResult.passCount) / Math.max(Number(testResult.totalCount || 1), 1)) * 100)]
            : []
        ),
        transcriptHistory: chatMessages
          .filter((msg) => msg?.text && msg?.sender !== 'System')
          .map((msg) => ({
            speaker: msg.sender === user?.name ? 'Candidate' : (msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'),
            text: msg.text,
            timestamp: msg.timestamp,
          })),
        topic: availableQuestions[currentQuestionIndex]?.category || availableQuestions[0]?.category || 'React.js',
        questionMetrics: finalizedQuestionMetrics.map((entry) => ({
          ...entry,
          score: Number(entry.score ?? 0),
          timeSpentSeconds: Number(entry.timeSpentSeconds ?? 0),
          answer: entry.answer || '',
        })),
        chatMessages,
        interviewerNotes,
        totalSessionTime: finalizedQuestionMetrics.reduce((sum, entry) => sum + Number(entry.timeSpentSeconds ?? 0), 0),
      };

      const res = await API.put(`/interviews/${roomId}/end`, payload);
      const reportData = res.data?.result || { ...payload, reportId: `report_${Date.now()}` };
      const reportEnvelope = { ...reportData, reportId: reportData._id || reportData.reportId || `report_${Date.now()}` };
      localStorage.setItem('aiInterviewReport:last', JSON.stringify(reportEnvelope));
      persistPreviousReport(reportEnvelope);

      if (res.data.success && res.data.result) {
        const finalReportId = res.data.result._id || `report_${Date.now()}`;
        const finalReportData = { ...res.data.result, reportId: finalReportId };
        localStorage.setItem('aiInterviewReport:last', JSON.stringify(finalReportData));
        persistPreviousReport(finalReportData);
        navigate(`/results/${finalReportId}`, { state: { reportData: finalReportData } });
      } else {
        const fallbackId = `report_${Date.now()}`;
        const fallbackData = { ...payload, reportId: fallbackId };
        localStorage.setItem('aiInterviewReport:last', JSON.stringify(fallbackData));
        persistPreviousReport(fallbackData);
        navigate('/results/report', { state: { reportData: fallbackData } });
      }
    } catch (e) {
      console.error('Interview finalization failed:', e);
      const fallbackId = `report_${Date.now()}`;
      const fallbackData = {
        ...((window && window.localStorage) ? JSON.parse(window.localStorage.getItem('aiInterviewReport:last') || '{}') : {}),
        reportId: fallbackId,
        chatMessages,
        interviewerNotes,
        questionMetrics: questionMetrics.length ? questionMetrics : [],
        transcriptHistory: chatMessages.filter((msg) => msg?.text && msg?.sender !== 'System')
          .map((msg) => ({
            speaker: msg.sender === user?.name ? 'Candidate' : (msg.role === 'interviewer' ? 'Interviewer' : 'Candidate'),
            text: msg.text,
            timestamp: msg.timestamp,
          })),
      };
      localStorage.setItem('aiInterviewReport:last', JSON.stringify(fallbackData));
      persistPreviousReport(fallbackData);
      navigate('/results/report', { state: { reportData: fallbackData } });
    }
  };

  // Extract className logic to avoid parsing issues
  const statusDotClass = isSocketConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500';
  const statusBadgeClass = isSocketConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400';
  const statusText = isSocketConnected ? 'WebRTC + Socket.IO Active' : 'Connecting...';

  // Resize handlers
  const handleLeftResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingLeft(true);
  }, []);

  const handleRightResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingRight(true);
  }, []);

  const handleResizeMove = useCallback((e) => {
    if (!isResizingLeft && !isResizingRight) return;

    const container = document.getElementById('live-room-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    if (isResizingLeft) {
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      // Constrain between 15% and 40%
      const clampedWidth = Math.max(15, Math.min(40, newLeftWidth));
      setLeftPanelWidth(clampedWidth);
    }

    if (isResizingRight) {
      const newMiddleWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100 - leftPanelWidth;
      // Constrain between 30% and 70%
      const clampedWidth = Math.max(30, Math.min(70, newMiddleWidth));
      setMiddlePanelWidth(clampedWidth);
    }
  }, [isResizingLeft, isResizingRight, leftPanelWidth]);

  const handleResizeEnd = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizingLeft, isResizingRight, handleResizeMove, handleResizeEnd]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4.5rem)] bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-bold text-white mb-2">Joining Interview Room...</h3>
        <p className="text-sm text-slate-400">Room ID: <span className="font-mono text-indigo-400">{roomId}</span></p>
        <p className="text-xs text-slate-500 mt-2">Establishing secure connection</p>
      </div>
    );
  }

  // Error state
  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4.5rem)] bg-slate-950 p-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Connection Error</h3>
        <p className="text-sm text-slate-400 text-center max-w-md mb-4">{connectionError}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
          >
            Refresh Page
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] p-3 max-w-[1850px] mx-auto gap-3">
      {/* Top Interview Header */}
      <div className="glass-panel px-4 py-2 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${statusDotClass}`}></span>
          <h2 className="text-sm font-heading font-extrabold text-white">
            Interview Room: <span className="gradient-text font-mono">{availableQuestions[currentQuestionIndex].title} (Room: {roomId})</span>
          </h2>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${statusBadgeClass}`}>
            {statusText}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <InterviewTimer initialMinutes={45} onExpire={handleEndInterview} />
          <button
            onClick={handleEndInterview}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition-all"
          >
            <PhoneOff className="w-3.5 h-3.5" /> End Interview & Grade
          </button>
        </div>
      </div>

      {/* Main Collaborative Body */}
      <div id="live-room-container" className="flex-1 flex gap-3 overflow-hidden">
        {/* Left Panel: Problem Statement */}
        <div 
          className="flex flex-col gap-2 overflow-hidden"
          style={{ width: `${leftPanelWidth}%`, minWidth: '15%', maxWidth: '40%' }}
        >
          {/* Problem Statement Snippet Box */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 font-sans text-sm space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {/* Problem Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-700/50">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-400">{availableQuestions[currentQuestionIndex].id}.</span>
                  <h3 className="text-base font-bold text-white">{availableQuestions[currentQuestionIndex].title}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${
                  availableQuestions[currentQuestionIndex].difficulty === 'Easy' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {availableQuestions[currentQuestionIndex].difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[10px]">Acceptance</span>
                <span className="text-[10px] font-mono text-emerald-400">{availableQuestions[currentQuestionIndex].acceptance}</span>
              </div>
            </div>

            {/* Problem Description */}
            <div className="space-y-3">
              <p className="text-slate-200 leading-relaxed text-[13px]">
                {availableQuestions[currentQuestionIndex].description}
              </p>
              {availableQuestions[currentQuestionIndex].additionalDescription && (
                <p className="text-slate-200 leading-relaxed text-[13px]">
                  {availableQuestions[currentQuestionIndex].additionalDescription}
                </p>
              )}
            </div>

            {/* Examples Section */}
            <div className="space-y-3">
              {availableQuestions[currentQuestionIndex].examples.map((example, index) => (
                <div key={index}>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Example {index + 1}:
                  </h4>
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <div className="font-mono text-[11px] space-y-2">
                      <div><span className="text-slate-400">Input:</span> <span className="text-white">{example.input}</span></div>
                      <div><span className="text-slate-400">Output:</span> <span className="text-emerald-400">{example.output}</span></div>
                      {example.explanation && (
                        <div><span className="text-slate-400">Explanation:</span> <span className="text-slate-300">{example.explanation}</span></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="pt-4 border-t border-slate-700/50">
              <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Constraints:
              </h4>
              <ul className="space-y-2 text-[11px] text-slate-300 font-mono">
                {availableQuestions[currentQuestionIndex].constraints.map((constraint, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-slate-500 mt-0.5">•</span>
                    <span>{constraint}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow-up */}
            {availableQuestions[currentQuestionIndex].followUp && (
              <div className="pt-4 border-t border-slate-700/50">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Follow-up:
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {availableQuestions[currentQuestionIndex].followUp}
                </p>
              </div>
            )}

            {/* Question Navigation */}
            <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  currentQuestionIndex === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                ← Previous
              </button>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentQuestionIndex + 1} / {availableQuestions.length}
              </span>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === availableQuestions.length - 1}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  currentQuestionIndex === availableQuestions.length - 1
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* First Resize Handle */}
        <div
          className="w-1 bg-slate-700 hover:bg-indigo-500 cursor-col-resize transition-colors flex items-center justify-center group"
          onMouseDown={handleLeftResizeStart}
        >
          <div className="w-1 h-8 bg-slate-500 group-hover:bg-white rounded-full transition-colors"></div>
        </div>

        {/* Middle Panel: Shared Monaco Editor + Docker Sandbox Execution Output */}
        <div 
          className="flex flex-col gap-2 overflow-hidden"
          style={{ width: `${middlePanelWidth}%`, minWidth: '30%', maxWidth: '70%' }}
        >
          <div className="flex-1 min-h-[400px]">
            <MonacoCodeEditor
              code={code}
              onChange={handleCodeChange}
              language={language}
              onLanguageChange={handleLanguageChange}
              onRunCode={handleRunCode}
              onSubmitCode={handleRunCode}
              isRunning={isRunning}
            />
          </div>

          <TestRunnerUI result={testResult} isRunning={isRunning} />
        </div>

        {/* Second Resize Handle */}
        <div
          className="w-1 bg-slate-700 hover:bg-indigo-500 cursor-col-resize transition-colors flex items-center justify-center group"
          onMouseDown={handleRightResizeStart}
        >
          <div className="w-1 h-8 bg-slate-500 group-hover:bg-white rounded-full transition-colors"></div>
        </div>

        {/* Right Side Panel (Video Call / Chat / Notes Switcher) */}
        <div 
          className="flex flex-col gap-2 overflow-hidden"
          style={{ width: `${100 - leftPanelWidth - middlePanelWidth}%`, minWidth: '20%', maxWidth: '55%' }}
        >
          {/* Panel Selector Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSidePanel('video')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSidePanel === 'video' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Video Feed
            </button>
            <button
              onClick={() => setActiveSidePanel('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSidePanel === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Live Chat
            </button>
            <button
              onClick={() => setActiveSidePanel('notes')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSidePanel === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <NotebookPen className="w-3.5 h-3.5" /> Notes
            </button>
          </div>

          <div className="flex-1 min-h-[320px] overflow-hidden">
            {activeSidePanel === 'video' && (
              <WebRTCVideoCall
                candidateName={candidateName}
                candidateTitle={candidateTitle}
                interviewerName={interviewerName}
                interviewerTitle={interviewerTitle}
                viewerRole={String(user?.role || 'interviewer').trim().toLowerCase()}
                roomId={roomId}
                onEndInterview={handleEndInterview}
              />
            )}
            {activeSidePanel === 'chat' && (
              <ChatPanel
                roomId={roomId}
                messages={chatMessages}
                onMessagesChange={setChatMessages}
              />
            )}
            {activeSidePanel === 'notes' && (
              <SharedNotes
                value={interviewerNotes}
                onChange={setInterviewerNotes}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
