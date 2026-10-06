import { CodingProblem } from '../models/CodingProblem.js';
import { initialProblems } from '../seeders/problemSeeder.js';

export const getProblems = async (req, res, next) => {
  try {
    let problems = await CodingProblem.find().sort({ createdAt: -1 });
    if (!problems || problems.length === 0) {
      // Return initial problem bank if DB not populated yet
      problems = initialProblems;
    }
    res.json({ success: true, count: problems.length, data: problems });
  } catch (error) {
    res.json({ success: true, count: initialProblems.length, data: initialProblems });
  }
};

export const getProblemBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let problem = await CodingProblem.findOne({ slug });
    if (!problem) {
      problem = initialProblems.find((p) => p.slug === slug) || initialProblems[0];
    }
    res.json({ success: true, data: problem });
  } catch (error) {
    const problem = initialProblems.find((p) => p.slug === req.params.slug) || initialProblems[0];
    res.json({ success: true, data: problem });
  }
};

export const createProblem = async (req, res, next) => {
  try {
    const problem = await CodingProblem.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: problem });
  } catch (error) {
    next(error);
  }
};

export const updateProblem = async (req, res, next) => {
  try {
    const problem = await CodingProblem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: problem });
  } catch (error) {
    next(error);
  }
};

export const deleteProblem = async (req, res, next) => {
  try {
    await CodingProblem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Problem deleted successfully' });
  } catch (error) {
    next(error);
  }
};
