import { generateAIQuestion, evaluateAIResponse } from '../services/aiService.js';
import { getVapiConfig } from '../services/vapiService.js';

export const getQuestion = async (req, res, next) => {
  try {
    const { role, topic, difficulty, questionCount } = req.query;
    const data = await generateAIQuestion({
      role: role || 'Full Stack Engineer',
      topic: topic || 'React.js',
      difficulty: difficulty || 'Medium',
      questionCount: parseInt(questionCount || '1', 10),
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const evaluateResponse = async (req, res, next) => {
  try {
    const { question, candidateAnswer, code, topic, questionCount, expectedKeyPoints } = req.body;
    const data = await evaluateAIResponse({
      question,
      candidateAnswer,
      code,
      topic: topic || 'React.js',
      questionCount: parseInt(questionCount || '1', 10),
      expectedKeyPoints: expectedKeyPoints || [],
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getVapiToken = async (req, res, next) => {
  try {
    const config = getVapiConfig();
    res.json({ success: true, ...config });
  } catch (error) {
    next(error);
  }
};
