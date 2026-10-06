import test from 'node:test';
import assert from 'node:assert/strict';

import { getUsers, getDashboardStats } from '../src/controllers/userController.js';
import { User } from '../src/models/User.js';
import { CodingProblem } from '../src/models/CodingProblem.js';
import { Interview } from '../src/models/Interview.js';
import { Submission } from '../src/models/Submission.js';

test('getUsers should not fall back to demo user data when the database fails', async () => {
  const originalFind = User.find;
  let response = null;

  User.find = () => ({
    select: () => ({
      sort: async () => {
        throw new Error('Database unavailable');
      },
    }),
  });

  try {
    await getUsers({}, { json: (payload) => { response = payload; } }, () => {});
    assert.equal(response.success, false);
    assert.deepEqual(response.data, []);
    assert.match(response.message, /Unable to load users/i);
  } finally {
    User.find = originalFind;
  }
});

test('getDashboardStats should not return placeholder counts when the database fails', async () => {
  const originalUserCount = User.countDocuments;
  const originalProblemCount = CodingProblem.countDocuments;
  const originalInterviewCount = Interview.countDocuments;
  const originalSubmissionCount = Submission.countDocuments;
  let response = null;

  User.countDocuments = async () => { throw new Error('Database unavailable'); };
  CodingProblem.countDocuments = async () => { throw new Error('Database unavailable'); };
  Interview.countDocuments = async () => { throw new Error('Database unavailable'); };
  Submission.countDocuments = async () => { throw new Error('Database unavailable'); };

  try {
    await getDashboardStats({}, { json: (payload) => { response = payload; } }, () => {});
    assert.equal(response.success, false);
    assert.deepEqual(response.stats, {});
    assert.match(response.message, /Unable to load dashboard stats/i);
  } finally {
    User.countDocuments = originalUserCount;
    CodingProblem.countDocuments = originalProblemCount;
    Interview.countDocuments = originalInterviewCount;
    Submission.countDocuments = originalSubmissionCount;
  }
});
