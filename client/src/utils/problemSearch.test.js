import test from 'node:test';
import assert from 'node:assert/strict';

import { filterProblems } from './problemSearch.js';

const problemBank = [
  { title: 'Two Sum', category: 'Arrays', difficulty: 'Easy' },
  { title: 'Valid Parentheses', category: 'Strings', difficulty: 'Easy' },
  { title: 'Merge Two Sorted Lists', category: 'Linked Lists', difficulty: 'Easy' },
  { title: 'Binary Tree Level Order Traversal', category: 'Trees', difficulty: 'Medium' },
  { title: 'Course Schedule', category: 'Graphs', difficulty: 'Medium' },
];

test('search matches title text case-insensitively', () => {
  const results = filterProblems(problemBank, { searchQuery: 'two', selectedCategory: 'All', selectedDifficulty: 'All' });
  assert.equal(results.length, 2);
  assert.deepEqual(results.map((problem) => problem.title), ['Two Sum', 'Merge Two Sorted Lists']);
});

test('category and difficulty filters combine with the search query', () => {
  const results = filterProblems(problemBank, { searchQuery: 'two', selectedCategory: 'Linked Lists', selectedDifficulty: 'Easy' });
  assert.deepEqual(results.map((problem) => problem.title), ['Merge Two Sorted Lists']);
});
