export const filterProblems = (problemBank, { searchQuery = '', selectedCategory = 'All', selectedDifficulty = 'All' } = {}) => {
  const normalizedQuery = (searchQuery || '').trim().toLowerCase();

  return problemBank.filter((problem) => {
    const searchableText = [
      problem.title,
      problem.category,
      problem.difficulty,
      ...(Array.isArray(problem.companies) ? problem.companies : []),
    ].join(' ').toLowerCase();

    const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesCategory = selectedCategory === 'All' || problem.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || problem.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });
};
