import mongoose from 'mongoose';
import { CodingProblem } from '../models/CodingProblem.js';
import { config } from '../config/env.js';

export const initialProblems = [
  {
    _id: '661a10000000000000000001',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    category: 'Arrays',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ],
    starterCode: {
      javascript: `function solve(input) {
  // Parse input example: "5\\n1 2 3 4 5" or JSON array
  const lines = input.trim().split('\\n');
  const nums = lines[0].split(' ').map(Number);
  const target = parseInt(lines[1] || '9');
  
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return JSON.stringify([map.get(diff), i]);
    }
    map.set(nums[i], i);
  }
  return "[]";
}`,
      python: `def solve(input_data):
    lines = input_data.strip().split('\\n')
    nums = list(map(int, lines[0].split()))
    target = int(lines[1]) if len(lines) > 1 else 9
    
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return f"[{seen[diff]},{i}]"
        seen[n] = i
    return "[]"`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); i++) {
            if (mp.find(target - nums[i]) != mp.end()) {
                return {mp[target - nums[i]], i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`,
    },
    testCases: [
      {
        input: '2 7 11 15\n9',
        expectedOutput: '[0,1]',
        isHidden: false,
        explanation: '2 + 7 = 9',
      },
      {
        input: '3 2 4\n6',
        expectedOutput: '[1,2]',
        isHidden: false,
        explanation: '2 + 4 = 6',
      },
      {
        input: '3 3\n6',
        expectedOutput: '[0,1]',
        isHidden: true,
        explanation: '3 + 3 = 6',
      },
    ],
  },
  {
    _id: '661a10000000000000000002',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    category: 'Strings',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: [
      '1 <= s.length <= 10^4',
      "s consists of parentheses only '()[]{}'.",
    ],
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const s = input.trim();
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (let char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return 'false';
    }
  }
  return stack.length === 0 ? 'true' : 'false';
}`,
      python: `def solve(input_data):
    s = input_data.strip()
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return "false"
        else:
            stack.append(char)
    return "true" if not stack else "false"`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '()', expectedOutput: 'true', isHidden: false },
      { input: '()[]{}', expectedOutput: 'true', isHidden: false },
      { input: '(]', expectedOutput: 'false', isHidden: true },
    ],
  },
  {
    _id: '661a10000000000000000003',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    category: 'Sliding Window',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const s = input.trim();
  let set = new Set();
  let left = 0, maxLen = 0;
  
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left]);
      left++;
    }
    set.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen.toString();
}`,
      python: `def solve(input_data):
    s = input_data.strip()
    seen = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in seen and seen[char] >= left:
            left = seen[char] + 1
        seen[char] = right
        max_len = max(max_len, right - left + 1)
    return str(max_len)`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
      { input: 'bbbbb', expectedOutput: '1', isHidden: false },
      { input: 'pwwkew', expectedOutput: '3', isHidden: true },
    ],
  },
  {
    _id: '661a10000000000000000004',
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    difficulty: 'Medium',
    category: 'Arrays',
    description: `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= starti <= endi <= 10^4'],
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const intervals = JSON.parse(input.trim());
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      merged.push(intervals[i]);
    }
  }
  return JSON.stringify(merged);
}`,
      python: `def solve(input_data):
    import json
    intervals = json.loads(input_data.strip())
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    
    for i in range(1, len(intervals)):
        last = merged[-1]
        if intervals[i][0] <= last[1]:
            last[1] = max(last[1], intervals[i][1])
        else:
            merged.append(intervals[i])
    return json.dumps(merged)`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', isHidden: false },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000005',
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    category: 'Arrays',
    description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.`,
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has the largest sum = 6.' },
      { input: 'nums = [1]', output: '1' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const nums = JSON.parse(input.trim());
  let maxSum = nums[0], currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum.toString();
}`,
      python: `def solve(input_data):
    import json
    nums = json.loads(input_data.strip())
    max_sum = nums[0]
    current_sum = nums[0]
    
    for i in range(1, len(nums)):
        current_sum = max(nums[i], current_sum + nums[i])
        max_sum = max(max_sum, current_sum)
    return str(max_sum)`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
      { input: '[1]', expectedOutput: '1', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000006',
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    difficulty: 'Easy',
    category: 'Strings',
    description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.`,
    constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const [s, t] = input.trim().split('\\n');
  if (s.length !== t.length) return 'false';
  
  const count = {};
  for (let char of s) count[char] = (count[char] || 0) + 1;
  for (let char of t) {
    if (!count[char]) return 'false';
    count[char]--;
  }
  return 'true';
}`,
      python: `def solve(input_data):
    s, t = input_data.strip().split('\\n')
    if len(s) != len(t):
        return "false"
    from collections import Counter
    return "true" if Counter(s) == Counter(t) else "false"`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: 'anagram\\nnagaram', expectedOutput: 'true', isHidden: false },
      { input: 'rat\\ncar', expectedOutput: 'false', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000007',
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    difficulty: 'Easy',
    category: 'Linked Lists',
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    constraints: ['The number of nodes in the list is in the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const list = JSON.parse(input.trim());
  let prev = null, curr = list;
  
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return JSON.stringify(prev);
}`,
      python: `def solve(input_data):
    import json
    # Simplified: reverse array representation
    arr = json.loads(input_data.strip())
    return json.dumps(arr[::-1])`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
      { input: '[1,2]', expectedOutput: '[2,1]', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000008',
    title: 'Detect Cycle in Linked List',
    slug: 'detect-cycle',
    difficulty: 'Medium',
    category: 'Linked Lists',
    description: `Given head, the head of a linked list, determine if the linked list has a cycle in it.`,
    constraints: ['The number of nodes in the list is in the range [0, 10^4].', '-10^5 <= Node.val <= 10^5'],
    examples: [
      { input: 'head = [3,2,0,-4], pos = 1', output: 'true', explanation: 'There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).' },
      { input: 'head = [1,2], pos = -1', output: 'false' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const [listStr, posStr] = input.trim().split('\\n');
  const pos = parseInt(posStr);
  return pos >= 0 ? 'true' : 'false';
}`,
      python: `def solve(input_data):
    list_str, pos_str = input_data.strip().split('\\n')
    pos = int(pos_str)
    return "true" if pos >= 0 else "false"`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[3,2,0,-4]\\n1', expectedOutput: 'true', isHidden: false },
      { input: '[1,2]\\n-1', expectedOutput: 'false', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000009',
    title: 'Binary Tree Level Order Traversal',
    slug: 'binary-tree-level-order',
    difficulty: 'Medium',
    category: 'Trees',
    description: `Given the root of a binary tree, return the level order traversal of its nodes' values.`,
    constraints: ['The number of nodes in the tree is in the range [0, 2000].', '-1000 <= Node.val <= 1000'],
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' },
      { input: 'root = [1]', output: '[[1]]' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const tree = JSON.parse(input.trim());
  if (!tree.length) return '[]';
  
  const result = [];
  let level = [tree[0]];
  
  while (level.length) {
    result.push(level.map(n => n.val));
    const nextLevel = [];
    level.forEach(node => {
      if (node.left) nextLevel.push(node.left);
      if (node.right) nextLevel.push(node.right);
    });
    level = nextLevel;
  }
  return JSON.stringify(result);
}`,
      python: `def solve(input_data):
    import json
    # Simplified: return array representation
    arr = json.loads(input_data.strip())
    return json.dumps([arr]) if arr else "[]"`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]', isHidden: false },
      { input: '[1]', expectedOutput: '[[1]]', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000010',
    title: 'Binary Tree Inorder Traversal',
    slug: 'binary-tree-inorder',
    difficulty: 'Easy',
    category: 'Trees',
    description: `Given the root of a binary tree, return the inorder traversal of its nodes' values.`,
    constraints: ['The number of nodes in the tree is in the range [0, 100].', '-100 <= Node.val <= 100'],
    examples: [
      { input: 'root = [1,null,2,3]', output: '[1,3,2]' },
      { input: 'root = []', output: '[]' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const tree = JSON.parse(input.trim());
  if (!tree.length) return '[]';
  
  const result = [];
  function inorder(node) {
    if (!node) return;
    inorder(node.left);
    result.push(node.val);
    inorder(node.right);
  }
  inorder(tree[0]);
  return JSON.stringify(result);
}`,
      python: `def solve(input_data):
    import json
    arr = json.loads(input_data.strip())
    return json.dumps(arr) if arr else "[]"`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[1,null,2,3]', expectedOutput: '[1,3,2]', isHidden: false },
      { input: '[]', expectedOutput: '[]', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000011',
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    category: 'DP',
    description: `You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    constraints: ['1 <= n <= 45'],
    examples: [
      { input: 'n = 2', output: '2', explanation: 'There are two ways to climb to the top.' },
      { input: 'n = 3', output: '3' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const n = parseInt(input.trim());
  if (n <= 2) return n.toString();
  
  let prev1 = 1, prev2 = 2;
  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev1 = prev2;
    prev2 = curr;
  }
  return prev2.toString();
}`,
      python: `def solve(input_data):
    n = int(input_data.strip())
    if n <= 2:
        return str(n)
    prev1, prev2 = 1, 2
    for i in range(3, n + 1):
        curr = prev1 + prev2
        prev1, prev2 = prev2, curr
    return str(prev2)`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false },
      { input: '3', expectedOutput: '3', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000012',
    title: 'House Robber',
    slug: 'house-robber',
    difficulty: 'Medium',
    category: 'DP',
    description: `Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.`,
    constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],
    examples: [
      { input: '_nums = [1,2,3,1]', output: '4', explanation: 'Rob house 1 (money = 1) and then house 3 (money = 3).' },
      { input: 'nums = [2,7,9,3,1]', output: '12' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const nums = JSON.parse(input.trim());
  if (nums.length === 0) return '0';
  if (nums.length === 1) return nums[0].toString();
  
  let prev2 = 0, prev1 = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const curr = Math.max(prev1, prev2 + nums[i]);
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1.toString();
}`,
      python: `def solve(input_data):
    import json
    nums = json.loads(input_data.strip())
    if len(nums) == 0:
        return "0"
    if len(nums) == 1:
        return str(nums[0])
    prev2, prev1 = 0, nums[0]
    for i in range(1, len(nums)):
        curr = max(prev1, prev2 + nums[i])
        prev2, prev1 = prev1, curr
    return str(prev1)`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: '4', isHidden: false },
      { input: '[2,7,9,3,1]', expectedOutput: '12', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000013',
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    difficulty: 'Easy',
    category: 'Arrays',
    description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true' },
      { input: 'nums = [1,2,3,4]', output: 'false' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const nums = JSON.parse(input.trim());
  const seen = new Set();
  for (let num of nums) {
    if (seen.has(num)) return 'true';
    seen.add(num);
  }
  return 'false';
}`,
      python: `def solve(input_data):
    import json
    nums = json.loads(input_data.strip())
    seen = set()
    for num in nums:
        if num in seen:
            return "true"
        seen.add(num)
    return "false"`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: 'true', isHidden: false },
      { input: '[1,2,3,4]', expectedOutput: 'false', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000014',
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    difficulty: 'Medium',
    category: 'Arrays',
    description: `Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].`,
    constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30'],
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const nums = JSON.parse(input.trim());
  const n = nums.length;
  const answer = new Array(n).fill(1);
  
  let left = 1;
  for (let i = 0; i < n; i++) {
    answer[i] = left;
    left *= nums[i];
  }
  
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= right;
    right *= nums[i];
  }
  
  return JSON.stringify(answer);
}`,
      python: `def solve(input_data):
    import json
    nums = json.loads(input_data.strip())
    n = len(nums)
    answer = [1] * n
    
    left = 1
    for i in range(n):
        answer[i] = left
        left *= nums[i]
    
    right = 1
    for i in range(n - 1, -1, -1):
        answer[i] *= right
        right *= nums[i]
    
    return json.dumps(answer)`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]', isHidden: false },
      { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000015',
    title: '3Sum',
    slug: '3sum',
    difficulty: 'Medium',
    category: 'Arrays',
    description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.`,
    constraints: ['0 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' },
      { input: 'nums = [0,1,1]', output: '[]' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const nums = JSON.parse(input.trim());
  nums.sort((a, b) => a - b);
  const result = [];
  
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return JSON.stringify(result);
}`,
      python: `def solve(input_data):
    import json
    nums = json.loads(input_data.strip())
    nums.sort()
    result = []
    
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total == 0:
                result.append([nums[i], nums[left], nums[right]])
                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                left += 1
                right -= 1
            elif total < 0:
                left += 1
            else:
                right -= 1
    
    return json.dumps(result)`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]', isHidden: false },
      { input: '[0,1,1]', expectedOutput: '[]', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000016',
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    category: 'Arrays',
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy and a different day in the future to sell.`,
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5' },
      { input: 'prices = [7,6,4,3,1]', output: '0' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const prices = JSON.parse(input.trim());
  let minPrice = Infinity, maxProfit = 0;
  
  for (let price of prices) {
    minPrice = Math.min(minPrice, price);
    maxProfit = Math.max(maxProfit, price - minPrice);
  }
  return maxProfit.toString();
}`,
      python: `def solve(input_data):
    import json
    prices = json.loads(input_data.strip())
    min_price = float('inf')
    max_profit = 0
    
    for price in prices:
        min_price = min(min_price, price)
        max_profit = max(max_profit, price - min_price)
    
    return str(max_profit)`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5', isHidden: false },
      { input: '[7,6,4,3,1]', expectedOutput: '0', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000017',
    title: 'Longest Palindromic Substring',
    slug: 'longest-palindromic-substring',
    difficulty: 'Medium',
    category: 'Strings',
    description: `Given a string s, return the longest palindromic substring in s.`,
    constraints: ['1 <= s.length <= 1000', 's consists of English letters.'],
    examples: [
      { input: 's = "babad"', output: '"bab"' },
      { input: 's = "cbbd"', output: '"bb"' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const s = input.trim();
  let result = '';
  
  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    return s.slice(left + 1, right);
  }
  
  for (let i = 0; i < s.length; i++) {
    const odd = expand(i, i);
    const even = expand(i, i + 1);
    const longer = odd.length > even.length ? odd : even;
    if (longer.length > result.length) result = longer;
  }
  
  return result;
}`,
      python: `def solve(input_data):
    s = input_data.strip()
    result = ""
    
    def expand(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return s[left + 1:right]
    
    for i in range(len(s)):
        odd = expand(i, i)
        even = expand(i, i + 1)
        longer = odd if len(odd) > len(even) else even
        if len(longer) > len(result):
            result = longer
    
    return result`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: 'babad', expectedOutput: 'bab', isHidden: false },
      { input: 'cbbd', expectedOutput: 'bb', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000018',
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    difficulty: 'Easy',
    category: 'Strings',
    description: `Given a string s, return true if it is a palindrome, or false otherwise.`,
    constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true' },
      { input: 's = "race a car"', output: 'false' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const s = input.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0, right = s.length - 1;
  
  while (left < right) {
    if (s[left] !== s[right]) return 'false';
    left++;
    right--;
  }
  return 'true';
}`,
      python: `def solve(input_data):
    s = input_data.strip().lower().replace(/[^a-z0-9]/g, '')
    left, right = 0, len(s) - 1
    
    while left < right:
        if s[left] != s[right]:
            return "false"
        left += 1
        right -= 1
    
    return "true"`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
      { input: 'race a car', expectedOutput: 'false', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000019',
    title: 'Middle of the Linked List',
    slug: 'middle-of-linked-list',
    difficulty: 'Easy',
    category: 'Linked Lists',
    description: `Given the head of a singly linked list, return the middle node of the linked list. If there are two middle nodes, return the second middle node.`,
    constraints: ['The number of nodes in the list is in the range [1, 100].', '1 <= Node.val <= 100'],
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '3' },
      { input: 'head = [1,2,3,4,5,6]', output: '4' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const list = JSON.parse(input.trim());
  if (!list.length) return 'null';
  
  let slow = 0, fast = 0;
  while (fast < list.length && fast + 1 < list.length) {
    slow++;
    fast += 2;
  }
  return list[slow].toString();
}`,
      python: `def solve(input_data):
    import json
    arr = json.loads(input_data.strip())
    if not arr:
        return "null"
    slow = 0
    fast = 0
    while fast < len(arr) and fast + 1 < len(arr):
        slow += 1
        fast += 2
    return str(arr[slow])`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '3', isHidden: false },
      { input: '[1,2,3,4,5,6]', expectedOutput: '4', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000020',
    title: 'Remove Nth Node From End of List',
    slug: 'remove-nth-node-from-end',
    difficulty: 'Medium',
    category: 'Linked Lists',
    description: `Given the head of a linked list, remove the nth node from the end of the list and return its head.`,
    constraints: ['The number of nodes in the list is sz.', '1 <= sz <= 30', '0 <= Node.val <= 100', '1 <= n <= sz'],
    examples: [
      { input: 'head = [1,2,3,4,5], n = 2', output: '[1,2,3,5]' },
      { input: 'head = [1], n = 1', output: '[]' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const [listStr, nStr] = input.trim().split('\\n');
  const list = JSON.parse(listStr);
  const n = parseInt(nStr);
  
  const dummy = { val: 0, next: list };
  let fast = dummy, slow = dummy;
  
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }
  
  while (fast) {
    slow = slow.next;
    fast = fast.next;
  }
  
  slow.next = slow.next.next;
  return JSON.stringify(dummy.next);
}`,
      python: `def solve(input_data):
    list_str, n_str = input_data.strip().split('\\n')
    arr = json.loads(list_str)
    n = int(n_str)
    
    if n == len(arr):
        return json.dumps(arr[1:])
    
    arr.pop(len(arr) - n)
    return json.dumps(arr)`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[1,2,3,4,5]\\n2', expectedOutput: '[1,2,3,5]', isHidden: false },
      { input: '[1]\\n1', expectedOutput: '[]', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000021',
    title: 'Maximum Depth of Binary Tree',
    slug: 'maximum-depth-binary-tree',
    difficulty: 'Easy',
    category: 'Trees',
    description: `Given the root of a binary tree, return its maximum depth.`,
    constraints: ['The number of nodes in the tree is in the range [0, 10^4].', '-100 <= Node.val <= 100'],
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '3' },
      { input: 'root = [1,null,2]', output: '2' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const tree = JSON.parse(input.trim());
  if (!tree.length) return '0';
  
  function maxDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
  }
  
  return maxDepth(tree[0]).toString();
}`,
      python: `def solve(input_data):
    import json
    arr = json.loads(input_data.strip())
    if not arr:
        return "0"
    # Simplified: count levels based on array structure
    return str(len(arr))`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '3', isHidden: false },
      { input: '[1,null,2]', expectedOutput: '2', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000022',
    title: 'Validate Binary Search Tree',
    slug: 'validate-binary-search-tree',
    difficulty: 'Medium',
    category: 'Trees',
    description: `Given the root of a binary tree, determine if it is a valid binary search tree (BST).`,
    constraints: ['The number of nodes in the tree is in the range [1, 10^4].', '-2^31 <= Node.val <= 2^31 - 1'],
    examples: [
      { input: 'root = [2,1,3]', output: 'true' },
      { input: 'root = [5,1,4,null,null,3,6]', output: 'false' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const tree = JSON.parse(input.trim());
  if (!tree.length) return 'true';
  
  function isValid(node, min, max) {
    if (!node) return true;
    if (node.val <= min || node.val >= max) return false;
    return isValid(node.left, min, node.val) && isValid(node.right, node.val, max);
  }
  
  return isValid(tree[0], -Infinity, Infinity) ? 'true' : 'false';
}`,
      python: `def solve(input_data):
    import json
    arr = json.loads(input_data.strip())
    if not arr:
        return "true"
    # Simplified: check if array is sorted
    is_sorted = all(arr[i] <= arr[i+1] for i in range(len(arr)-1))
    return "true" if is_sorted else "false"`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[2,1,3]', expectedOutput: 'true', isHidden: false },
      { input: '[5,1,4,null,null,3,6]', expectedOutput: 'false', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000023',
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'Medium',
    category: 'DP',
    description: `Given an integer array coins representing coins of different denominations and an integer amount, return the fewest number of coins that you need to make up that amount.`,
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3' },
      { input: 'coins = [2], amount = 3', output: '-1' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const [coinsStr, amountStr] = input.trim().split('\\n');
  const coins = JSON.parse(coinsStr);
  const amount = parseInt(amountStr);
  
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  
  for (let i = 1; i <= amount; i++) {
    for (let coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  
  return dp[amount] === Infinity ? '-1' : dp[amount].toString();
}`,
      python: `def solve(input_data):
    coins_str, amount_str = input_data.strip().split('\\n')
    coins = json.loads(coins_str)
    amount = int(amount_str)
    
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for i in range(1, amount + 1):
        for coin in coins:
            if i - coin >= 0:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    
    return str(-1 if dp[amount] == float('inf') else dp[amount])`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[1,2,5]\\n11', expectedOutput: '3', isHidden: false },
      { input: '[2]\\n3', expectedOutput: '-1', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000024',
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence',
    difficulty: 'Medium',
    category: 'DP',
    description: `Given an integer array nums, return the length of the longest strictly increasing subsequence.`,
    constraints: ['1 <= nums.length <= 2500', '-10^4 <= nums[i] <= 10^4'],
    examples: [
      { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4' },
      { input: 'nums = [0,1,0,3,2,3]', output: '4' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const nums = JSON.parse(input.trim());
  const dp = new Array(nums.length).fill(1);
  
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }
  
  return Math.max(...dp).toString();
}`,
      python: `def solve(input_data):
    import json
    nums = json.loads(input_data.strip())
    dp = [1] * len(nums)
    
    for i in range(1, len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    
    return str(max(dp))`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[10,9,2,5,3,7,101,18]', expectedOutput: '4', isHidden: false },
      { input: '[0,1,0,3,2,3]', expectedOutput: '4', isHidden: false },
    ],
  },
  {
    _id: '661a10000000000000000025',
    title: 'Word Search',
    slug: 'word-search',
    difficulty: 'Medium',
    category: 'Arrays',
    description: `Given an m x n grid of characters board and a string word, return true if word exists in the grid.`,
    constraints: ['m == board.length', 'n == board[i].length', '1 <= m, n <= 6', '1 <= word.length <= 15'],
    examples: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true' },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"', output: 'true' },
    ],
    starterCode: {
      javascript: `function solve(input) {
  const [boardStr, wordStr] = input.trim().split('\\n');
  const board = JSON.parse(boardStr);
  const word = wordStr.trim();
  
  function dfs(i, j, k) {
    if (k === word.length) return true;
    if (i < 0 || i >= board.length || j < 0 || j >= board[0].length || board[i][j] !== word[k]) return false;
    
    const temp = board[i][j];
    board[i][j] = '#';
    
    const found = dfs(i + 1, j, k + 1) || dfs(i - 1, j, k + 1) || dfs(i, j + 1, k + 1) || dfs(i, j - 1, k + 1);
    
    board[i][j] = temp;
    return found;
  }
  
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      if (dfs(i, j, 0)) return 'true';
    }
  }
  return 'false';
}`,
      python: `def solve(input_data):
    board_str, word = input_data.strip().split('\\n')
    board = json.loads(board_str)
    word = word.strip()
    
    def dfs(i, j, k):
        if k == len(word):
            return True
        if i < 0 or i >= len(board) or j < 0 or j >= len(board[0]) or board[i][j] != word[k]:
            return False
        
        temp = board[i][j]
        board[i][j] = '#'
        
        found = dfs(i + 1, j, k + 1) or dfs(i - 1, j, k + 1) or dfs(i, j + 1, k + 1) or dfs(i, j - 1, k + 1)
        
        board[i][j] = temp
        return found
    
    for i in range(len(board)):
        for j in range(len(board[0])):
            if dfs(i, j, 0):
                return "true"
    return "false"`,
      cpp: ``,
      java: ``,
    },
    testCases: [
      { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\\nABCCED', expectedOutput: 'true', isHidden: false },
      { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\\nSEE', expectedOutput: 'true', isHidden: false },
    ],
  },
];

export const seedProblems = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await CodingProblem.deleteMany({});
      await CodingProblem.insertMany(initialProblems);
      console.log('[Seeder] Coding problems seeded successfully.');
    }
  } catch (error) {
    console.error('[Seeder Error]:', error.message);
  }
};
