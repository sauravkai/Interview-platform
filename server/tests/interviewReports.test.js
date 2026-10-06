import test from 'node:test';
import assert from 'node:assert/strict';

import { getUserInterviewReports } from '../src/controllers/interviewController.js';
import { InterviewResult } from '../src/models/InterviewResult.js';

test('getUserInterviewReports should return the saved interview results for the active user', async () => {
  const originalFind = InterviewResult.find;
  const fakeResults = [
    {
      _id: 'result-1',
      interviewId: { _id: 'int-1', title: 'System Design Round', candidateName: 'Ava Johnson', role: 'Software Engineer' },
      candidateId: 'cand-1',
      interviewerId: 'int-1',
      overallScore: 87,
      questionMetrics: [{ question: 'Why use caching?', score: 90 }],
      chatMessages: [{ sender: 'candidate', text: 'I would add Redis.' }],
      interviewerNotes: 'Strong communication',
      totalSessionTime: 1800,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    },
  ];

  InterviewResult.find = async () => ({
    populate: async () => fakeResults,
    sort: async () => fakeResults,
  });

  let response = null;
  try {
    await getUserInterviewReports({ user: { _id: 'int-1' } }, { json: (payload) => { response = payload; } }, () => {});
    assert.equal(response.success, true);
    assert.equal(response.data.length, 1);
    assert.equal(response.data[0].title, 'System Design Round');
    assert.equal(response.data[0].overallScore, 87);
    assert.match(response.data[0].reportSummary, /Strong communication/i);
  } finally {
    InterviewResult.find = originalFind;
  }
});
