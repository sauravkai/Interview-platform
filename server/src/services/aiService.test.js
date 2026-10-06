import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAIResponse, DOMAIN_QUESTION_BANKS } from './aiService.js';

test('MCQ answers score 100 when correct', async () => {
  const result = await evaluateAIResponse({
    question: 'Which statement is correct?',
    candidateAnswer: 'B) synchronized block',
    topic: 'Java',
    expectedKeyPoints: ['synchronized blocks guard shared state'],
    questionType: 'mcq',
    isMcqCorrect: true,
  });

  assert.equal(result.score, 100);
  assert.equal(result.mlAnalysis.correctnessPercentage, 100);
});

test('MCQ answers score 0 when incorrect', async () => {
  const result = await evaluateAIResponse({
    question: 'Which statement is correct?',
    candidateAnswer: 'A) ArrayList',
    topic: 'Java',
    expectedKeyPoints: ['synchronized blocks guard shared state'],
    questionType: 'mcq',
    isMcqCorrect: false,
  });

  assert.equal(result.score, 0);
  assert.equal(result.mlAnalysis.correctnessPercentage, 0);
});

test('Question bank includes at least 100 questions across topics', () => {
  const totalQuestions = Object.values(DOMAIN_QUESTION_BANKS).reduce(
    (sum, questions) => sum + questions.length,
    0
  );

  assert.ok(totalQuestions >= 100, `Expected at least 100 questions, found ${totalQuestions}`);
});
