import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  FileText,
  CheckCircle2,
  CheckCircle,
  XCircle,
  MessageSquare,
  Play,
  Cpu,
  Layers,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  Sun,
  Moon,
  AlertCircle,
  Trophy,
  Upload,
  Code,
} from 'lucide-react';
import API from '../../services/api';
import { MonacoCodeEditor } from '../editor/MonacoCodeEditor';

const TECH_STACKS = [
  { id: 'Java', name: 'Java', color: 'from-amber-500 to-orange-600', icon: '☕' },
  { id: 'Python', name: 'Python', color: 'from-blue-500 to-cyan-500', icon: '🐍' },
  { id: 'Node.js', name: 'Node.js', color: 'from-emerald-500 to-teal-600', icon: '🟢' },
  { id: 'React.js', name: 'React.js', color: 'from-sky-500 to-indigo-500', icon: '⚛️' },
  { id: 'C++', name: 'C++', color: 'from-purple-500 to-indigo-600', icon: '⚡' },
  { id: 'System Design', name: 'System Design', color: 'from-pink-500 to-rose-600', icon: '🌐' },
  { id: 'SQL & DB', name: 'SQL & DB', color: 'from-slate-500 to-slate-700', icon: '🗄️' },
];

const AI_PERSONAS = [
  { role: 'Senior Java Microservices Architect', topic: 'Java', difficulty: 'Senior Architect', desc: 'Deep dive into JVM internals, Spring Boot, concurrency, and Kafka.' },
  { role: 'Python AI & Backend Engineer', topic: 'Python', difficulty: 'Mid-Level', desc: 'Focuses on GIL, asyncio, memory management, and FastAPI performance.' },
  { role: 'Full-Stack Node & React Architect', topic: 'Node.js', difficulty: 'Senior Architect', desc: 'Covers Libuv event loop, React 18 Fiber, streams, and system scaling.' },
  { role: 'Low-Latency C++ Systems Engineer', topic: 'C++', difficulty: 'Staff Principal', desc: 'Tests RAII, move semantics, smart pointers, memory layouts, and vtables.' },
  { role: 'Distributed Systems & Cloud Lead', topic: 'System Design', difficulty: 'Senior Architect', desc: 'Rate limiters, database sharding, consistent hashing, and caching.' },
  { role: 'Database Performance Engineer', topic: 'SQL & DB', difficulty: 'Senior Architect', desc: 'Focuses on query optimization, indexing strategies, transaction management, and database scaling.' },
];

const MCQ_ONLY_TOPICS = new Set(['Java', 'Python', 'C++', 'SQL & DB']);

const expandQuestionBank = (topic, questions = [], targetSize = 100) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  const expanded = [...questions];
  let variantIndex = 1;

  while (expanded.length < targetSize) {
    const source = questions[(expanded.length - 1) % questions.length] || questions[0];
    expanded.push({
      ...source,
      question: `${source.question || 'Follow-up question'} (Variant ${variantIndex})`,
      expectedKeyPoints: Array.isArray(source.expectedKeyPoints) && source.expectedKeyPoints.length > 0
        ? source.expectedKeyPoints
        : ['Core concept coverage', 'Tradeoff analysis', 'Practical implementation detail'],
      tags: Array.isArray(source.tags) ? [...source.tags, 'practice'] : [String(topic).toLowerCase(), 'practice'],
      difficulty: source.difficulty || 'medium',
      options: Array.isArray(source.options) && source.options.length >= 4 ? source.options : [
        `A) ${source.expectedKeyPoints?.[0] || 'Core technical concept'}`,
        `B) ${source.expectedKeyPoints?.[1] || 'Common alternative'}`,
        `C) ${source.expectedKeyPoints?.[2] || 'Partial application'}`,
        `D) ${source.expectedKeyPoints?.[3] || 'Incorrect approach'}`,
      ],
      correctAnswer: typeof source.correctAnswer === 'number' ? source.correctAnswer : 0,
    });

    variantIndex += 1;
  }

  return expanded;
};

const ensureMinimumQuestionBank = (questions = [], minimumSize = 100) => {
  if (!Array.isArray(questions) || questions.length >= minimumSize) {
    return Array.isArray(questions) ? questions : [];
  }

  const result = [...questions];
  let index = 0;

  while (result.length < minimumSize) {
    const source = questions[index % questions.length] || questions[0];
    if (!source) break;

    result.push({
      ...source,
      question: `${source.question || 'Follow-up question'} (Follow-up ${result.length + 1})`,
      expectedKeyPoints: Array.isArray(source.expectedKeyPoints) && source.expectedKeyPoints.length > 0
        ? source.expectedKeyPoints
        : ['Core concept coverage', 'Tradeoff analysis', 'Practical implementation detail'],
    });

    index += 1;
  }

  return result;
};

const BASE_RANDOM_QUESTIONS = {
  'Java': [
    { type: 'mcq', question: 'Which Java concurrency primitive is used to guard shared state and ensure visibility across threads?', difficulty: 'medium', tags: ['java', 'concurrency', 'threading'], options: ['A) HashMap', 'B) synchronized block', 'C) StringBuilder', 'D) final keyword'], correctAnswer: 1, expectedKeyPoints: ['synchronized blocks guard shared state', 'thread safety', 'visibility guarantees'] },
    { type: 'mcq', question: 'How does Java\'s volatile keyword differ from synchronized when handling shared state?', difficulty: 'hard', tags: ['java', 'concurrency', 'memory-model'], options: ['A) volatile prevents thread creation', 'B) volatile provides visibility guarantees but not mutual exclusion', 'C) synchronized avoids all CPU cache usage', 'D) volatile always requires lock acquisition'], correctAnswer: 1, expectedKeyPoints: ['volatile ensures visibility and ordering', 'synchronized provides locking and atomicity'] },
    { type: 'mcq', question: 'What is the practical difference between == and .equals() in Java?', difficulty: 'easy', tags: ['java', 'comparison', 'objects'], options: ['A) == compares references while .equals() compares logical value', 'B) == compares logical value while .equals() compares references', 'C) Both compare primitive values only', 'D) Both are identical for all object types'], correctAnswer: 0, expectedKeyPoints: ['== compares references', '.equals() compares value semantics when overridden'] },
    { type: 'mcq', question: 'Why is ConcurrentHashMap preferred over synchronized HashMap in highly concurrent applications?', difficulty: 'hard', tags: ['java', 'collections', 'scalability'], options: ['A) It locks the whole map for every operation', 'B) It uses finer-grained locking and partitioned concurrency control', 'C) It avoids all locking by design', 'D) It works only for single-threaded code'], correctAnswer: 1, expectedKeyPoints: ['Finer-grained locking', 'better concurrency', 'safe multi-thread access'] },
    { type: 'mcq', question: 'Which Java data structure is most efficient for frequent insertion and deletion at both ends?', difficulty: 'medium', tags: ['java', 'collections', 'data-structures'], options: ['A) ArrayList', 'B) LinkedList', 'C) HashSet', 'D) TreeMap'], correctAnswer: 1, expectedKeyPoints: ['LinkedList supports efficient head and tail operations', 'Node-based structure', 'O(1) at both ends'] },
    { type: 'mcq', question: 'Which collector is generally preferred for large Java heaps with lower pause times?', difficulty: 'hard', tags: ['java', 'garbage-collection', 'jvm'], options: ['A) Serial GC', 'B) G1 GC', 'C) Copy GC', 'D) Stop-the-world Mark Sweep only'], correctAnswer: 1, expectedKeyPoints: ['G1 collector', 'Large heap tuning', 'lower pause times'] },
  ],
  'Python': [
    { type: 'mcq', question: 'What is the primary effect of Python\'s GIL on CPU-bound multithreading?', difficulty: 'medium', tags: ['python', 'gil', 'concurrency'], options: ['A) It improves CPU scaling across cores', 'B) It prevents multiple threads from executing Python bytecode simultaneously', 'C) It only affects network operations', 'D) It ensures thread safety by default'], correctAnswer: 1, expectedKeyPoints: ['GIL prevents true simultaneous execution of Python bytecode', 'multiprocessing is used for CPU-bound work'] },
    { type: 'mcq', question: 'When should you choose asyncio over threading in Python?', difficulty: 'medium', tags: ['python', 'asyncio', 'performance'], options: ['A) For CPU-heavy computation', 'B) For non-blocking I/O-heavy services', 'C) For all tasks equally', 'D) Only for synchronous code'], correctAnswer: 1, expectedKeyPoints: ['asyncio is ideal for I/O-bound concurrency', 'event loop handles scheduling efficiently'] },
    { type: 'mcq', question: 'What is the difference between a shallow copy and a deep copy in Python?', difficulty: 'medium', tags: ['python', 'memory', 'copying'], options: ['A) Shallow copy duplicates nested objects recursively', 'B) Deep copy duplicates nested objects recursively while shallow copy duplicates only the outer container', 'C) Both behave identically for all containers', 'D) Deep copy cannot be used with dictionaries'], correctAnswer: 1, expectedKeyPoints: ['Shallow copy duplicates the top-level object', 'deep copy recursively duplicates nested objects'] },
    { type: 'mcq', question: 'What is the purpose of decorators in Python?', difficulty: 'hard', tags: ['python', 'decorators', 'metaprogramming'], options: ['A) They replace the interpreter', 'B) They wrap functions to add reusable behavior', 'C) They only work with classes', 'D) They are used only for type hints'], correctAnswer: 1, expectedKeyPoints: ['Decorators wrap functions or methods to modify behavior', 'Useful for logging, auth, caching, metrics'] },
    { type: 'mcq', question: 'For CPU-bound parallelism in Python, which approach is typically preferred?', difficulty: 'hard', tags: ['python', 'parallelism', 'optimization'], options: ['A) threading', 'B) asyncio', 'C) multiprocessing', 'D) deepcopy'], correctAnswer: 2, expectedKeyPoints: ['multiprocessing bypasses GIL', 'separate processes', 'CPU-intensive workloads'] },
    { type: 'mcq', question: 'Which statement is correct about Python lists and tuples?', difficulty: 'easy', tags: ['python', 'data-structures', 'immutability'], options: ['A) Lists are mutable and tuples are immutable', 'B) Lists are immutable and tuples are mutable', 'C) Both are mutable', 'D) Both are immutable'], correctAnswer: 0, expectedKeyPoints: ['Lists are mutable', 'Tuples are immutable', 'Memory/performance differences'] },
  ],
  'Node.js': [
    { type: 'mcq', question: 'What is Node.js and why is it used for backend development?', difficulty: 'easy', tags: ['nodejs', 'backend', 'javascript'], options: ['A) A database management system', 'B) A JavaScript runtime for server-side development', 'C) A frontend framework', 'D) A CSS preprocessor'], correctAnswer: 1, expectedKeyPoints: ['V8 engine', 'Event-driven', 'Non-blocking I/O', 'Single-threaded'] },
    { type: 'mcq', question: 'Which phase of the Node.js event loop handles I/O callbacks?', difficulty: 'medium', tags: ['nodejs', 'event-loop', 'asynchronous'], options: ['A) Timers phase', 'B) Poll phase', 'C) Check phase', 'D) Close callbacks phase'], correctAnswer: 1, expectedKeyPoints: ['Poll phase', 'I/O callback execution', 'Event loop phases'] },
    { type: 'mcq', question: 'Which module is commonly used to create an HTTP server in Node.js?', difficulty: 'easy', tags: ['nodejs', 'http', 'server'], options: ['A) fs', 'B) http', 'C) path', 'D) crypto'], correctAnswer: 1, expectedKeyPoints: ['http module', 'server creation', 'request/response handling'] },
    { type: 'mcq', question: 'What is the purpose of the EventEmitter class in Node.js?', difficulty: 'medium', tags: ['nodejs', 'events', 'architecture'], options: ['A) To execute shell commands', 'B) To emit and listen for named events', 'C) To parse JSON', 'D) To render HTML'], correctAnswer: 1, expectedKeyPoints: ['EventEmitter', 'publish-subscribe pattern', 'event-driven design'] },
    { type: 'mcq', question: 'Why do Node.js applications typically use async APIs for file operations?', difficulty: 'medium', tags: ['nodejs', 'filesystem', 'performance'], options: ['A) They block the main thread less and improve concurrency', 'B) They are required for browser compatibility', 'C) They remove the need for callbacks', 'D) They guarantee faster CPU execution'], correctAnswer: 0, expectedKeyPoints: ['non-blocking', 'event loop', 'better scalability'] },
    { type: 'mcq', question: 'Which Node.js feature is best suited for handling many concurrent network requests efficiently?', difficulty: 'hard', tags: ['nodejs', 'scalability', 'async'], options: ['A) Synchronous file reads', 'B) Async I/O with the event loop', 'C) Heavy CPU loops in the main thread', 'D) Full page rendering'], correctAnswer: 1, expectedKeyPoints: ['async I/O', 'event loop', 'concurrent requests'] },
  ],
  'React.js': [
    { type: 'mcq', question: 'What is the purpose of React state?', difficulty: 'easy', tags: ['react', 'state', 'ui'], options: ['A) To store mutable data that triggers re-render', 'B) To replace CSS', 'C) To configure your database', 'D) To manage server-side routing'], correctAnswer: 0, expectedKeyPoints: ['component state', 'rerender behavior', 'user interaction'] },
    { type: 'mcq', question: 'Why is the Virtual DOM useful in React?', difficulty: 'medium', tags: ['react', 'performance', 'dom'], options: ['A) It improves CSS performance only', 'B) It helps React minimize direct DOM updates', 'C) It replaces the browser', 'D) It runs on the server only'], correctAnswer: 1, expectedKeyPoints: ['efficient diffing', 'DOM update batching', 'render optimization'] },
    { type: 'mcq', question: 'Which hook is best suited for fetching data after a component mounts?', difficulty: 'medium', tags: ['react', 'hooks', 'effects'], options: ['A) useState', 'B) useEffect', 'C) useMemo', 'D) useRef'], correctAnswer: 1, expectedKeyPoints: ['side effects after mount', 'data fetching lifecycle', 'cleanup patterns'] },
    { type: 'mcq', question: 'What does JSX allow you to do in React?', difficulty: 'easy', tags: ['react', 'jsx', 'components'], options: ['A) Write JavaScript code only in external files', 'B) Write HTML-like syntax directly in JavaScript to describe UI', 'C) Replace CSS completely', 'D) Manage server-side routing'], correctAnswer: 1, expectedKeyPoints: ['HTML-like syntax', 'JavaScript expressions', 'UI description'] },
    { type: 'mcq', question: 'What is the main purpose of useMemo in React?', difficulty: 'medium', tags: ['react', 'performance', 'memoization'], options: ['A) To trigger layout effects', 'B) To memoize expensive computed values between renders', 'C) To set component state', 'D) To render static HTML'], correctAnswer: 1, expectedKeyPoints: ['memoization', 'performance optimization', 'dependency-based recomputation'] },
    { type: 'mcq', question: 'Why are keys important when rendering lists in React?', difficulty: 'medium', tags: ['react', 'rendering', 'lists'], options: ['A) They improve CSS styling', 'B) They help React identify which items changed, were added, or removed', 'C) They define component classes', 'D) They are required for CSS modules'], correctAnswer: 1, expectedKeyPoints: ['React reconciliation', 'stable identity', 'list updates', 'avoid reordering bugs'] },
  ],
  'C++': [
    { type: 'mcq', question: 'What is std::vector in C++ mainly used for?', difficulty: 'easy', tags: ['cpp', 'containers', 'stl'], options: ['A) Dynamic array with contiguous storage', 'B) A file stream', 'C) A network socket', 'D) A symbol table'], correctAnswer: 0, expectedKeyPoints: ['dynamic array', 'contiguous memory', 'resizable'] },
    { type: 'mcq', question: 'What is the primary difference between stack and heap memory in C++?', difficulty: 'medium', tags: ['cpp', 'memory', 'lifecycle'], options: ['A) Stack is for global variables only; heap is for local variables only', 'B) Stack is LIFO and automatically managed; heap is dynamic and manually managed', 'C) Heap is always faster than stack', 'D) They are the same memory area'], correctAnswer: 1, expectedKeyPoints: ['stack lifetime', 'heap allocation', 'manual management'] },
    { type: 'mcq', question: 'Why is const used in C++?', difficulty: 'easy', tags: ['cpp', 'immutability', 'safety'], options: ['A) To force recursion', 'B) To indicate that a value should not be modified', 'C) To create templates', 'D) To disable constructors'], correctAnswer: 1, expectedKeyPoints: ['immutability', 'const correctness', 'safe APIs'] },
    { type: 'mcq', question: 'Which C++ feature is primarily used to transfer ownership of resources without duplicating memory?', difficulty: 'medium', tags: ['cpp', 'move-semantics', 'performance'], options: ['A) Virtual inheritance', 'B) Move semantics', 'C) Static dispatch', 'D) Operator overloading'], correctAnswer: 1, expectedKeyPoints: ['move semantics', 'rvalue references', 'resource transfer without copy'] },
    { type: 'mcq', question: 'What is the purpose of a virtual table (vtable) in C++?', difficulty: 'hard', tags: ['cpp', 'polymorphism', 'runtime'], options: ['A) It stores static members of the class', 'B) It enables dynamic dispatch for virtual functions', 'C) It optimizes stack memory allocation', 'D) It manages template instantiation'], correctAnswer: 1, expectedKeyPoints: ['vtable stores function pointers', 'runtime polymorphism', 'dynamic dispatch'] },
    { type: 'mcq', question: 'Which of the following best describes RAII in C++?', difficulty: 'hard', tags: ['cpp', 'raii', 'resources'], options: ['A) A design pattern for data serialization', 'B) Automatic resource management tied to object lifetime', 'C) A way to disable garbage collection', 'D) A method for compile-time optimization'], correctAnswer: 1, expectedKeyPoints: ['RAII', 'resource cleanup', 'exception-safe management'] },
  ],
  'System Design': [
    { type: 'mcq', question: 'What is eventual consistency in distributed systems?', difficulty: 'medium', tags: ['system-design', 'consistency', 'distributed-systems'], options: ['A) Data is instantly consistent everywhere', 'B) Updates may become visible at different times across replicas', 'C) Consistency is never guaranteed', 'D) Only one node is allowed to write'], correctAnswer: 1, expectedKeyPoints: ['replica lag', 'availability trade-off', 'distributed consistency'] },
    { type: 'mcq', question: 'Why is sharding commonly used in large-scale systems?', difficulty: 'medium', tags: ['system-design', 'scaling', 'database'], options: ['A) It reduces the number of servers', 'B) It partitions data across multiple machines to improve scalability', 'C) It removes the need for backups', 'D) It guarantees strict consistency'], correctAnswer: 1, expectedKeyPoints: ['data partitioning', 'horizontal scaling', 'distribution'] },
    { type: 'mcq', question: 'What does idempotency mean in API design?', difficulty: 'medium', tags: ['system-design', 'api', 'reliability'], options: ['A) Requests can be safely retried without unintended side effects', 'B) Requests are always processed in order', 'C) All responses are cached forever', 'D) APIs never fail'], correctAnswer: 0, expectedKeyPoints: ['safe retries', 'duplicate request handling', 'reliability'] },
    { type: 'mcq', question: 'What is the difference between vertical and horizontal scaling?', difficulty: 'easy', tags: ['system-design', 'scalability', 'architecture'], options: ['A) Vertical: add more servers, Horizontal: upgrade existing server', 'B) Vertical: upgrade existing server, Horizontal: add more servers', 'C) Both are the same', 'D) Vertical: scale out, Horizontal: scale up'], correctAnswer: 1, expectedKeyPoints: ['Vertical: scale up', 'Horizontal: scale out', 'Cost implications', 'Complexity differences'] },
    { type: 'mcq', question: 'What is the primary advantage of caching in a distributed system?', difficulty: 'easy', tags: ['system-design', 'caching', 'performance'], options: ['A) It increases database writes', 'B) It reduces repeated backend load and improves latency', 'C) It eliminates database indexes', 'D) It replaces load balancers'], correctAnswer: 1, expectedKeyPoints: ['reduced latency', 'lower backend load', 'read optimization'] },
    { type: 'mcq', question: 'What is the purpose of a rate limiter in a system design interview?', difficulty: 'medium', tags: ['system-design', 'rate-limiting', 'security'], options: ['A) To store persistent user sessions', 'B) To prevent abuse and control request volume', 'C) To optimize the UI layer', 'D) To replace database indexes'], correctAnswer: 1, expectedKeyPoints: ['protect backend', 'manage traffic', 'avoid overload'] },
  ],
  'SQL & DB': [
    { type: 'mcq', question: 'What is the purpose of an index in SQL?', difficulty: 'easy', tags: ['sql', 'database', 'indexing'], options: ['A) To speed up read queries by improving lookup performance', 'B) To duplicate data in a new table', 'C) To hide columns from users', 'D) To disable joins'], correctAnswer: 0, expectedKeyPoints: ['fast lookups', 'fewer scans', 'index efficiency'] },
    { type: 'mcq', question: 'What is transaction isolation in a database?', difficulty: 'medium', tags: ['sql', 'transactions', 'consistency'], options: ['A) It defines how concurrent transactions interact', 'B) It deletes duplicate rows', 'C) It converts SQL to JSON', 'D) It prevents table creation'], correctAnswer: 0, expectedKeyPoints: ['concurrency visibility', 'read anomalies', 'consistency levels'] },
    { type: 'mcq', question: 'Why are foreign keys used in relational data models?', difficulty: 'easy', tags: ['sql', 'relationships', 'schema'], options: ['A) To enforce referential integrity', 'B) To optimize memory on the client', 'C) To create loops in SQL', 'D) To disable indexes'], correctAnswer: 0, expectedKeyPoints: ['referential integrity', 'relationships', 'constraint enforcement'] },
    { type: 'mcq', question: 'Which SQL join returns all rows from the left table and matching rows from the right table?', difficulty: 'medium', tags: ['sql', 'joins', 'database'], options: ['A) INNER JOIN', 'B) LEFT JOIN', 'C) RIGHT JOIN', 'D) FULL OUTER JOIN'], correctAnswer: 1, expectedKeyPoints: ['LEFT JOIN returns all left rows', 'matching right rows', 'NULL for unmatched data'] },
    { type: 'mcq', question: 'Which clause is used to filter records after grouping and aggregation?', difficulty: 'medium', tags: ['sql', 'aggregation', 'grouping'], options: ['A) WHERE', 'B) HAVING', 'C) ORDER BY', 'D) LIMIT'], correctAnswer: 1, expectedKeyPoints: ['HAVING filters grouped results', 'WHERE filters rows before grouping'] },
    { type: 'mcq', question: 'Which command creates an index on a column to improve lookup performance?', difficulty: 'easy', tags: ['sql', 'indexing', 'performance'], options: ['A) CREATE INDEX', 'B) ALTER TABLE', 'C) INSERT INTO', 'D) UPDATE INDEX'], correctAnswer: 0, expectedKeyPoints: ['CREATE INDEX', 'faster queries', 'index maintenance'] },
  ],
};

const RANDOM_QUESTIONS = Object.fromEntries(
  Object.entries(BASE_RANDOM_QUESTIONS).map(([topic, questions]) => [
    topic,
    expandQuestionBank(topic, questions, 100),
  ])
);

const getTopicQuestionBank = (topic, mode = 'mixed') => {
  const bank = ensureMinimumQuestionBank(RANDOM_QUESTIONS[topic] || RANDOM_QUESTIONS['React.js'], 100);
  if (mode === 'mcq') {
    return bank.filter((question) => question.type === 'mcq');
  }

  return bank;
};

export const VoiceInterviewRoom = ({ onCompleteReport, isDark: propIsDark, setIsDark: propSetIsDark }) => {
  // Topic and difficulty selection
  const [selectedTopic, setSelectedTopic] = useState('React.js');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [practiceMode, setPracticeMode] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(1);
  
  // Modal states
  const [showSmartMatchModal, setShowSmartMatchModal] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showForceSubmit, setShowForceSubmit] = useState(false);
  
  // Session states
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  
  // Validation states
  const [responseValidation, setResponseValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  
  // Question states
  const askedQuestionsRef = useRef(new Set());
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionMetrics, setQuestionMetrics] = useState([]);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [questionTypeProgress, setQuestionTypeProgress] = useState({
    mcq: { answered: 0, correct: 0, total: 2 },
    coding: { answered: 0, total: 2 },
    text: { answered: 0, total: 1 }
  });
  
  // Answer states
  const [selectedMcqOption, setSelectedMcqOption] = useState(null);
  const [codeEditorContent, setCodeEditorContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Voice/AI states
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [liveCaption, setLiveCaption] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "Can you explain how React's Virtual DOM reconciliation diffing algorithm works, and why unique keys are required for list elements?",
    difficulty: 'medium',
    tags: ['react', 'performance', 'virtual-dom'],
    expectedKeyPoints: ["Tree comparison O(N) heuristic", "Component type matching", "Keyed element reordering"],
  });
  const [candidateResponse, setCandidateResponse] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState([
    {
      speaker: 'AI Technical Evaluator',
      text: "Can you explain how React's Virtual DOM reconciliation diffing algorithm works, and why unique keys are required for list elements?",
      time: 'Just now',
    },
  ]);
  const [evaluating, setEvaluating] = useState(false);
  const [lastEval, setLastEval] = useState(null);
  const [cumulativeScores, setCumulativeScores] = useState([]);
  
  // Interaction states
  const [hasInteracted, setHasInteracted] = useState(false);
  const recognitionRef = useRef(null);
  
  // Use props if provided, otherwise use local state for backward compatibility
  const [localIsDark, setLocalIsDark] = useState(false);
  const isDark = propIsDark !== undefined ? propIsDark : localIsDark;
  const setIsDark = propSetIsDark !== undefined ? propSetIsDark : setLocalIsDark;

  // Question timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (!sessionComplete && !evaluating) {
        setQuestionTimer(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionComplete, evaluating]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const finishCurrentSession = () => {
    const metricScores = questionMetrics.map((metric) => Number(metric.score ?? 0));
    const totalScore = metricScores.length > 0
      ? Math.round(metricScores.reduce((a, b) => a + b, 0) / metricScores.length)
      : cumulativeScores.length > 0
        ? Math.round(cumulativeScores.reduce((a, b) => a + b, 0) / cumulativeScores.length)
        : 0;

    const summary = {
      totalQuestions: Math.max(0, questionMetrics.length),
      mcqScore: questionTypeProgress.mcq.correct,
      mcqTotal: questionTypeProgress.mcq.total,
      mcqAnswered: questionTypeProgress.mcq.answered,
      codingCompleted: questionTypeProgress.coding.answered,
      codingTotal: questionTypeProgress.coding.total,
      textCompleted: questionTypeProgress.text.answered,
      textTotal: questionTypeProgress.text.total,
      overallScore: totalScore,
      totalTime: questionTimer,
      questionMetrics: questionMetrics,
      sessionScores: cumulativeScores.length > 0 ? cumulativeScores : metricScores,
      topic: selectedTopic,
    };

    setSessionSummary(summary);
    setSessionComplete(true);

    if (onCompleteReport) {
      onCompleteReport(summary);
    }
  };

  const ensureMcqQuestion = (question) => {
    if (!question || typeof question !== 'object') {
      return question;
    }

    if (practiceMode !== 'mcq') {
      return question;
    }

    if (question.type === 'mcq') {
      return question;
    }

    return {
      ...question,
      type: 'mcq',
      options: question.options && question.options.length > 0 ? question.options : [
        `A) ${question.expectedKeyPoints?.[0] || 'Primary concept'}`,
        `B) ${question.expectedKeyPoints?.[1] || 'Secondary concept'}`,
        `C) ${question.expectedKeyPoints?.[2] || 'Alternative technical explanation'}`,
        `D) ${question.expectedKeyPoints?.[3] || 'Another possible interpretation'}`
      ],
      correctAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
    };
  };

  const uniqueQuestionKey = (question) => {
    const text = typeof question === 'string' ? question : question?.question || '';
    const normalizedText = String(text).trim().toLowerCase().replace(/\s+/g, ' ');

    if (!normalizedText) {
      return `${selectedTopic}::empty`;
    }

    return `${selectedTopic}::${normalizedText}`;
  };

  const markQuestionAsAsked = (question) => {
    const key = uniqueQuestionKey(question);
    if (!key.includes('::empty')) {
      const nextAsked = new Set(askedQuestionsRef.current);
      nextAsked.add(key);
      askedQuestionsRef.current = nextAsked;
    }
  };

  const generateRandomQuestion = () => {
    const topicQuestions = getTopicQuestionBank(selectedTopic, practiceMode);
    const shuffledQuestions = [...topicQuestions].sort(() => Math.random() - 0.5);
    const currentAsked = askedQuestionsRef.current;

    const availableQuestions = shuffledQuestions.filter(
      (question) => !currentAsked.has(uniqueQuestionKey(question))
    );

    if (availableQuestions.length === 0) {
      askedQuestionsRef.current = new Set();
      return generateRandomQuestion();
    }

    const selectedQuestion = ensureMcqQuestion(availableQuestions[0]);
    markQuestionAsAsked(selectedQuestion);

    setQuestionStartTime(Date.now());
    setQuestionTimer(0);
    setSelectedMcqOption(null);
    setCodeEditorContent(selectedQuestion.starterCode || `// Accepted solution example:\n// function solve(input) {\n//   // Write your code solution here...\n//   return "15";\n// }`);
    setUploadedFile(null);

    return selectedQuestion;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCandidateResponse(event.target.result);
        setUploadedFile(file.name);
        setValidationError(null);
        setValidationWarnings([]);
        setValidationResult(null);
      };
      reader.readAsText(file);
    }
  };

  const checkAnswerValidation = (response) => {
    const errors = [];
    const warnings = [];
    const questionText = typeof currentQuestion === 'object' ? currentQuestion.question : currentQuestion;
    const expectedPoints = currentQuestion?.expectedKeyPoints || [];

    if (!response || response.trim().length === 0) {
      errors.push('Response cannot be empty. Please provide an answer.');
      return { isValid: false, errors, warnings, score: 0 };
    }

    if (response.trim().length < 10) {
      errors.push('Response is too short. Please provide a more detailed answer (minimum 10 characters).');
    }

    const normalize = (value = '') =>
      value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    const getSignificantWords = (phrase = '') => {
      const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'but', 'by', 'can', 'do', 'for', 'from', 'have', 'how', 'if', 'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'their', 'there', 'these', 'this', 'to', 'using', 'was', 'we', 'when', 'which', 'with', 'without', 'why', 'you', 'your']);
      return normalize(phrase).split(' ').filter((word) => word.length > 2 && !stopWords.has(word));
    };

    let correctnessScore = 0;
    let matchedPoints = [];
    let missingPoints = [];

    if (expectedPoints.length > 0) {
      const lowerResponse = normalize(response);
      matchedPoints = expectedPoints.filter((point) => {
        const normalizedPoint = normalize(point);
        if (!normalizedPoint) return false;
        if (lowerResponse.includes(normalizedPoint)) return true;

        const significantWords = getSignificantWords(point);
        if (significantWords.length === 0) return false;
        const coveredWords = significantWords.filter((word) => lowerResponse.includes(word));
        return coveredWords.length / significantWords.length >= 0.45;
      });

      missingPoints = expectedPoints.filter((point) => !matchedPoints.includes(point));
      correctnessScore = Math.round((matchedPoints.length / expectedPoints.length) * 100);

      if (matchedPoints.length === 0) {
        warnings.push('Your answer does not yet cover the key technical concepts. Add the main ideas and tradeoffs to make it stronger.');
      } else if (correctnessScore < 50) {
        warnings.push(`Your answer only covers ${matchedPoints.length} out of ${expectedPoints.length} important concepts. Consider adding more technical depth.`);
      }
    }

    const lowerResponse = normalize(response);
    const lowerQuestion = normalize(questionText);
    if (lowerResponse.includes(lowerQuestion.substring(0, 20))) {
      errors.push('Your answer appears to repeat the question. Please provide a substantive response.');
    }

    const wordCount = response.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 6) {
      warnings.push('Your answer is quite brief. Consider providing a fuller explanation with examples or tradeoffs.');
    }

    if (/(because|however|therefore|for example|in contrast|first|second|finally)/.test(lowerResponse)) {
      warnings.push('Good structure: your answer uses reasoning and comparison cues, which is a strong signal for technical clarity.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: correctnessScore,
      matchedPoints,
      missingPoints,
      wordCount,
      totalExpectedPoints: expectedPoints.length
    };
  };

  // Session timer
  useEffect(() => {
    if (hasInteracted && !sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  }, [hasInteracted, sessionStartTime]);

  const getSessionDuration = () => {
    if (!sessionStartTime) return '0:00';
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const buildQuestionMetric = ({
    question,
    questionNumber,
    userAnswer,
    difficulty,
    tags,
    timeSpent,
    score,
    feedback,
    keyPointsCovered,
    questionType,
    isMcqCorrect,
    selectedOption,
  }) => {
    const questionObject = typeof question === 'object' && question !== null ? question : { question, difficulty: 'medium', tags: [], type: questionType || 'text' };
    const questionText = typeof question === 'string' ? question : questionObject.question || 'Untitled question';
    const normalizedAnswer = typeof userAnswer === 'string' ? userAnswer : '';
    const normalizedTags = Array.isArray(questionObject.tags) ? questionObject.tags : Array.isArray(tags) ? tags : [];

    return {
      questionNumber,
      question: questionText,
      difficulty: questionObject.difficulty || difficulty || 'medium',
      tags: normalizedTags,
      timeSpent: Number(timeSpent ?? 0),
      score: Number(score ?? 0),
      keyPointsCovered: Array.isArray(keyPointsCovered) ? keyPointsCovered : [],
      feedback: feedback || '',
      questionType: questionObject.type || questionType || 'text',
      isMcqCorrect: questionObject.type === 'mcq' ? Boolean(isMcqCorrect) : undefined,
      candidateAnswer: normalizedAnswer,
      selectedOption: selectedOption ?? null,
    };
  };
  
  useEffect(() => {
    if (practiceMode === 'mcq' || practiceMode === 'mixed') {
      setSelectedMcqOption(null);
      askedQuestionsRef.current = new Set();
      setQuestionCount(1);
      const nextQuestion = generateRandomQuestion();
      setCurrentQuestion(nextQuestion);
      return;
    }
  }, [practiceMode]);

  useEffect(() => {
    if (hasInteracted && currentQuestion) {
      const questionText = typeof currentQuestion === 'object' ? currentQuestion.question : currentQuestion;
      speakAiText(questionText);
    }
  }, [hasInteracted, currentQuestion]);

  const speakAiText = (text) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsAiSpeaking(true);
        utterance.onend = () => setIsAiSpeaking(false);
        utterance.onerror = () => setIsAiSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis error:', error);
        setIsAiSpeaking(false);
      }
    }
  };

  const handleTopicChange = async (topicId) => {
    setSelectedTopic(topicId);
    askedQuestionsRef.current = new Set();
    setQuestionCount(1);
    setEvaluating(true);
    try {
      const res = await API.get(`/ai/question?topic=${encodeURIComponent(topicId)}&difficulty=${selectedDifficulty}&questionCount=1`);
      if (res.data.success && res.data.data) {
        const qObj = res.data.data;
        const normalizedQuestion = ensureMcqQuestion(qObj);

        setCurrentQuestion(normalizedQuestion);
        const questionText = typeof normalizedQuestion === 'object' ? normalizedQuestion.question : normalizedQuestion;
        const newRecord = {
          speaker: 'AI Technical Evaluator',
          text: `[Switched to ${topicId}] ${questionText}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setTranscriptHistory((prev) => [...prev, newRecord]);
        speakAiText(questionText);
      }
    } catch (err) {
      console.warn('API question fetch fallback engaged');
      const randomQuestion = generateRandomQuestion();
      const normalizedFallback = ensureMcqQuestion(randomQuestion);
      setCurrentQuestion(normalizedFallback);
      const questionText = typeof normalizedFallback === 'object' ? normalizedFallback.question : normalizedFallback;
      const newRecord = {
        speaker: 'AI Technical Evaluator',
        text: `[Switched to ${topicId}] ${questionText}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscriptHistory((prev) => [...prev, newRecord]);
      speakAiText(questionText);
    } finally {
      setEvaluating(false);
    }
  };

  const handleApplyPersona = (persona) => {
    setSelectedTopic(persona.topic);
    askedQuestionsRef.current = new Set();
    setSelectedDifficulty(persona.difficulty);
    setShowSmartMatchModal(false);
    handleTopicChange(persona.topic);
  };

  const toggleMicListening = () => {
    if (!isListening) {
      setIsListening(true);
      setLiveCaption('');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
          let interimText = '';
          let finalText = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalText += transcript + ' ';
            } else {
              interimText += transcript;
            }
          }
          
          // Update live caption with interim results
          setLiveCaption(finalText + interimText);
          // Update candidate response with final text
          if (finalText) {
            setCandidateResponse(prev => prev + finalText);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setValidationError('Microphone access denied. Please allow microphone access in your browser settings.');
          } else if (event.error === 'no-speech') {
            setValidationError('No speech detected. Please try again.');
          } else {
            setValidationError('Speech recognition error: ' + event.error);
          }
          setIsListening(false);
          setLiveCaption('');
        };

        recognition.onend = () => {
          if (isListening && recognitionRef.current) {
            // Restart if still supposed to be listening
            recognition.start();
          }
        };

        recognition.start();
      } else {
        console.error('Speech recognition not supported in this browser');
        setIsListening(false);
      }
    } else {
      setIsListening(false);
      setLiveCaption('');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  };

  const handleSubmitAnswer = async (force = false) => {
    let userText = '';
    let isMcqCorrect = false;

    if (practiceMode === 'mcq' && currentQuestion?.type !== 'mcq') {
      setValidationError('MCQ Practice mode only allows multiple-choice questions.');
      return;
    }

    // Handle different question types
    if (currentQuestion?.type === 'mcq') {
      if (selectedMcqOption === null) {
        setValidationError('Please select an option before submitting.');
        return;
      }
      userText = currentQuestion.options[selectedMcqOption];
      isMcqCorrect = selectedMcqOption === currentQuestion.correctAnswer;
      
      // For MCQ, if answer is wrong, show error
      if (!isMcqCorrect && !force) {
        setValidationError('Incorrect answer. Please try again.');
        return;
      }
    } else if (currentQuestion?.type === 'coding') {
      if (!codeEditorContent.trim()) {
        setValidationError('Please provide a code solution before submitting.');
        return;
      }
      userText = codeEditorContent;
    } else if (currentQuestion?.type === 'text') {
      if (!candidateResponse.trim() && !uploadedFile) {
        setValidationError('Please provide an answer before submitting.');
        return;
      }
      userText = candidateResponse;
    } else {
      // Fallback for questions without explicit type
      if (!candidateResponse.trim() && !uploadedFile) {
        setValidationError('Please provide an answer before submitting.');
        return;
      }
      userText = candidateResponse;
    }

    // Validate the response for text/coding questions
    if (currentQuestion?.type !== 'mcq') {
      setIsCheckingAnswer(true);
      setValidationError(null);
      setValidationWarnings([]);
      setValidationResult(null);
      setShowForceSubmit(false);
      
      const validation = checkAnswerValidation(userText);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        setValidationError(validation.errors[0]);
        setIsCheckingAnswer(false);
        return;
      }

      if (validation.warnings.length > 0 && !force) {
        setValidationWarnings(validation.warnings);
        setShowForceSubmit(true);
        setIsCheckingAnswer(false);
        return;
      }
    }

    setIsCheckingAnswer(false);
    setCandidateResponse('');
    setUploadedFile(null);
    setIsListening(false);

    const answeredQuestion = typeof currentQuestion === 'object' && currentQuestion !== null ? { ...currentQuestion } : { question: currentQuestion, difficulty: 'medium', tags: [], type: 'text' };
    const answeredQuestionText = answeredQuestion.question || '';
    const answeredQuestionNumber = questionCount;
    const timeSpent = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
    const selectedChoiceText = answeredQuestion?.type === 'mcq' && typeof selectedMcqOption === 'number' && Array.isArray(answeredQuestion.options)
      ? answeredQuestion.options[selectedMcqOption] || null
      : null;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newTranscript = [
      ...transcriptHistory,
      { speaker: 'Candidate', text: userText, time: timeStr },
    ];
    setTranscriptHistory(newTranscript);

    setEvaluating(true);
    try {
      const nextQNum = questionCount + 1;
      
      const res = await API.post('/ai/evaluate', {
        question: answeredQuestionText,
        candidateAnswer: userText,
        topic: selectedTopic,
        questionCount: nextQNum,
        expectedKeyPoints: answeredQuestion.expectedKeyPoints || [],
        questionType: answeredQuestion?.type || 'text',
        isMcqCorrect: answeredQuestion?.type === 'mcq' ? isMcqCorrect : undefined,
      });

      if (res.data.success && res.data.data) {
        const evalData = res.data.data;
        const resolvedScore = answeredQuestion?.type === 'mcq'
          ? (isMcqCorrect ? 100 : 0)
          : Number(evalData.score ?? 0);

        setLastEval(evalData);
        setCumulativeScores((prev) => [...prev, resolvedScore]);

        const metric = buildQuestionMetric({
          question: answeredQuestion,
          questionNumber: answeredQuestionNumber,
          userAnswer: userText,
          difficulty: answeredQuestion.difficulty || 'medium',
          tags: answeredQuestion.tags || [],
          timeSpent,
          score: resolvedScore,
          keyPointsCovered: evalData.mlAnalysis?.foundTerms || [],
          feedback: evalData.feedback,
          questionType: answeredQuestion?.type || 'text',
          isMcqCorrect: answeredQuestion?.type === 'mcq' ? isMcqCorrect : undefined,
          selectedOption: selectedChoiceText,
        });
        setQuestionMetrics(prev => [...prev, metric]);

        if (answeredQuestion?.type) {
          setQuestionTypeProgress(prev => ({
            ...prev,
            [answeredQuestion.type]: {
              ...prev[answeredQuestion.type],
              answered: prev[answeredQuestion.type].answered + 1,
              correct: answeredQuestion.type === 'mcq' && isMcqCorrect 
                ? prev[answeredQuestion.type].correct + 1 
                : prev[answeredQuestion.type].correct
            }
          }));
        }

        const aiFollowUp = evalData.followUpQuestion || `Great response! Now let's explore deeper memory management in ${selectedTopic}.`;

        if (practiceMode === 'mcq' || practiceMode === 'mixed') {
          const nextQuestionObj = ensureMcqQuestion(generateRandomQuestion());
          setCurrentQuestion(nextQuestionObj);
          setQuestionCount(nextQNum);

          newTranscript.push({
            speaker: 'AI Technical Evaluator',
            text: `[Question #${nextQNum}] ${nextQuestionObj.question}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          setTranscriptHistory(newTranscript);
          speakAiText(nextQuestionObj.question);
          return;
        }

        const nextQuestionObj = { question: aiFollowUp, difficulty: answeredQuestion?.difficulty || 'medium', tags: answeredQuestion?.tags || [] };
        setCurrentQuestion(nextQuestionObj);
        setQuestionCount(nextQNum);

        newTranscript.push({
          speaker: 'AI Technical Evaluator',
          text: `[Question #${nextQNum}] ${aiFollowUp}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setTranscriptHistory(newTranscript);
        speakAiText(aiFollowUp);
      }
    } catch (err) {
      console.warn('API evaluation fallback engaged');
      const nextQNum = questionCount + 1;
      const randomQuestionObj = ensureMcqQuestion(generateRandomQuestion());
      const randomQuestion = typeof randomQuestionObj === 'object' ? randomQuestionObj.question : randomQuestionObj;

      const fallbackScore = answeredQuestion?.type === 'mcq'
        ? (isMcqCorrect ? 100 : 0)
        : (validationResult?.score ?? 70);

      const metric = buildQuestionMetric({
        question: answeredQuestion,
        questionNumber: answeredQuestionNumber,
        userAnswer: userText,
        difficulty: answeredQuestion.difficulty || 'medium',
        tags: answeredQuestion.tags || [],
        timeSpent,
        score: fallbackScore,
        keyPointsCovered: validationResult?.matchedPoints || [],
        feedback: validationResult?.warnings?.join('. ') || 'API unavailable - using offline evaluation',
        questionType: answeredQuestion?.type || 'text',
        isMcqCorrect: answeredQuestion?.type === 'mcq' ? isMcqCorrect : undefined,
        selectedOption: selectedChoiceText,
      });
      setCumulativeScores((prev) => [...prev, fallbackScore]);
      setQuestionMetrics(prev => [...prev, metric]);

      if (answeredQuestion?.type) {
        setQuestionTypeProgress(prev => ({
          ...prev,
          [answeredQuestion.type]: {
            ...prev[answeredQuestion.type],
            answered: prev[answeredQuestion.type].answered + 1,
            correct: answeredQuestion.type === 'mcq' && isMcqCorrect 
              ? prev[answeredQuestion.type].correct + 1 
              : prev[answeredQuestion.type].correct
          }
        }));
      }

      setCurrentQuestion(randomQuestionObj);
      setQuestionCount(nextQNum);

      newTranscript.push({
        speaker: 'AI Technical Evaluator',
        text: `[Question #${nextQNum}] ${randomQuestion}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setTranscriptHistory(newTranscript);
      speakAiText(randomQuestion);
    } finally {
      setEvaluating(false);
    }
  };

  const avgScore = questionMetrics.length > 0
    ? Math.round(questionMetrics.reduce((a, metric) => a + Number(metric.score ?? 0), 0) / questionMetrics.length)
    : cumulativeScores.length > 0
      ? Math.round(cumulativeScores.reduce((a, b) => a + b, 0) / cumulativeScores.length)
      : 0;

  const handleSkipQuestion = () => {
    setShowSkipConfirm(false);
    const answeredQuestion = typeof currentQuestion === 'object' && currentQuestion !== null ? { ...currentQuestion } : { question: currentQuestion, difficulty: 'medium', tags: [], type: 'text' };
    const nextQNum = questionCount + 1;
    const randomQuestionObj = ensureMcqQuestion(generateRandomQuestion());
    const randomQuestion = typeof randomQuestionObj === 'object' ? randomQuestionObj.question : randomQuestionObj;

    const timeSpent = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
    const metric = buildQuestionMetric({
      question: answeredQuestion,
      questionNumber: questionCount,
      userAnswer: '[Skipped]',
      difficulty: answeredQuestion.difficulty || 'medium',
      tags: answeredQuestion.tags || [],
      timeSpent,
      score: 0,
      keyPointsCovered: [],
      feedback: 'Question skipped by candidate',
      questionType: answeredQuestion?.type || 'text',
      isMcqCorrect: answeredQuestion?.type === 'mcq' ? false : undefined,
    });
    setQuestionMetrics(prev => [...prev, metric]);

    setCurrentQuestion(randomQuestionObj);
    setQuestionCount(nextQNum);

    const newTranscript = [
      ...transcriptHistory,
      { speaker: 'Candidate', text: '[Question Skipped]', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      { speaker: 'AI Technical Evaluator', text: `[Question #${nextQNum}] ${randomQuestion}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ];
    setTranscriptHistory(newTranscript);
    speakAiText(randomQuestion);
  };

  const renderReportModal = () => {
    if (!onCompleteReport) return null;
    
    const totalSessionTime = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
    const avgTimePerQuestion = questionMetrics.length > 0 
      ? Math.round(questionMetrics.reduce((sum, m) => sum + m.timeSpent, 0) / questionMetrics.length)
      : 0;
    
    const difficultyBreakdown = {
      easy: questionMetrics.filter(m => m.difficulty === 'easy'),
      medium: questionMetrics.filter(m => m.difficulty === 'medium'),
      hard: questionMetrics.filter(m => m.difficulty === 'hard'),
    };

    const avgScoreByDifficulty = {
      easy: difficultyBreakdown.easy.length > 0 
        ? Math.round(difficultyBreakdown.easy.reduce((sum, m) => sum + m.score, 0) / difficultyBreakdown.easy.length)
        : 0,
      medium: difficultyBreakdown.medium.length > 0 
        ? Math.round(difficultyBreakdown.medium.reduce((sum, m) => sum + m.score, 0) / difficultyBreakdown.medium.length)
        : 0,
      hard: difficultyBreakdown.hard.length > 0 
        ? Math.round(difficultyBreakdown.hard.reduce((sum, m) => sum + m.score, 0) / difficultyBreakdown.hard.length)
        : 0,
    };

    const allTags = [...new Set(questionMetrics.flatMap(m => m.tags))];
    const tagPerformance = allTags.map(tag => {
      const tagQuestions = questionMetrics.filter(m => m.tags.includes(tag));
      const avgTagScore = tagQuestions.length > 0 
        ? Math.round(tagQuestions.reduce((sum, m) => sum + m.score, 0) / tagQuestions.length)
        : 0;
      return { tag, avgScore: avgTagScore, questionCount: tagQuestions.length };
    });

    const reportData = {
      sessionScores: cumulativeScores.length > 0 ? cumulativeScores : questionMetrics.map((metric) => Number(metric.score ?? 0)),
      transcriptHistory,
      topic: selectedTopic,
      questionMetrics,
      totalSessionTime,
      avgTimePerQuestion,
      difficultyBreakdown,
      avgScoreByDifficulty,
      tagPerformance,
      overallAvgScore: avgScore,
      questionTypeProgress,
    };

    return null; // Report modal is handled by parent component
  };

  const renderSessionCompleteModal = () => {
    if (!sessionComplete || !sessionSummary) return null;

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in ${isDark ? 'bg-slate-950/80' : 'bg-slate-900/50'}`}>
        <div className={`w-full max-w-2xl p-6 rounded-2xl border space-y-4 shadow-2xl ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h3 className={`text-lg font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Trophy className="w-5 h-5 text-amber-400" /> Session Complete!
            </h3>
            <button
              onClick={() => setSessionComplete(false)}
              className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-base font-bold px-2 py-1 rounded-lg`}
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-2xl font-heading font-extrabold text-indigo-400`}>{sessionSummary.overallScore}%</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Overall Score</span>
            </div>
            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-2xl font-heading font-extrabold text-emerald-400`}>{sessionSummary.mcqScore}/{sessionSummary.mcqTotal}</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>MCQ Correct</span>
            </div>
            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-2xl font-heading font-extrabold text-purple-400`}>{formatTime(sessionSummary.totalTime)}</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Time</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Question Type Breakdown:</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'}`}>
                <span className={`text-xs font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>MCQ</span>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sessionSummary.mcqScore}/{sessionSummary.mcqTotal}</span>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
                <span className={`text-xs font-semibold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Coding</span>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sessionSummary.codingCompleted}/{sessionSummary.codingTotal}</span>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-500/10 border-slate-500/30' : 'bg-slate-100 border-slate-300'}`}>
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Text</span>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sessionSummary.textCompleted}/{sessionSummary.textTotal}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setSessionComplete(false);
                setQuestionCount(1);
                setQuestionTypeProgress({
                  mcq: { answered: 0, correct: 0, total: 2 },
                  coding: { answered: 0, total: 2 },
                  text: { answered: 0, total: 1 }
                });
                setQuestionMetrics([]);
                setCumulativeScores([]);
                askedQuestionsRef.current = new Set();
                setQuestionTimer(0);
                const randomQuestion = generateRandomQuestion();
                setCurrentQuestion(randomQuestion);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'}`}
            >
              Start New Session
            </button>
            <button
              onClick={() => onCompleteReport(sessionSummary)}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all"
            >
              View Detailed Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className={`rounded-2xl border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className={`${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'} rounded-lg px-3 py-1.5 text-[11px] font-medium border focus:outline-none focus:border-indigo-500`}
          >
            <option value="Junior">Junior Level</option>
            <option value="Medium">Mid-Level</option>
            <option value="Senior Architect">Senior Architect</option>
            <option value="Staff Principal">Staff Principal</option>
          </select>

          <select
            value={practiceMode}
            onChange={(e) => setPracticeMode(e.target.value)}
            className={`${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'} rounded-lg px-3 py-1.5 text-[11px] font-medium border focus:outline-none focus:border-indigo-500`}
          >
            <option value="mixed">Mixed Practice</option>
            <option value="mcq">MCQ Practice</option>
          </select>

          <button
            onClick={() => setShowSmartMatchModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-[11px] shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Smart Match
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className={`rounded-2xl border p-4 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[240px] ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div
              className={`absolute inset-x-8 top-8 h-32 rounded-full blur-3xl opacity-80 ${
                isAiSpeaking
                  ? 'bg-purple-500/20'
                  : isListening
                  ? 'bg-emerald-500/20'
                  : 'bg-indigo-500/10'
              }`}
            ></div>

            <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-1 mb-3 ${isAiSpeaking ? 'scale-105' : ''}`}>
              <div className={`w-full h-full rounded-[15px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <Bot className="w-10 h-10 text-pink-400" />
              </div>
            </div>

            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AI Technical Interviewer
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
              <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {selectedTopic} • Q#{questionCount}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-semibold">
                {selectedDifficulty}
              </span>
              {sessionStartTime && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                  ⏱ {getSessionDuration()}
                </span>
              )}
            </div>

            <div className={`flex items-center gap-1.5 h-9 mt-4 px-3 py-2 rounded-full border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              {[40, 70, 30, 90, 50, 100, 60, 80, 45, 95, 35].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isAiSpeaking
                      ? 'bg-pink-400 animate-pulse'
                      : isListening
                      ? 'bg-emerald-400 animate-pulse'
                      : isDark ? 'bg-slate-700' : 'bg-slate-400'
                  }`}
                  style={{ height: isAiSpeaking || isListening ? `${h}%` : '18%' }}
                ></span>
              ))}
            </div>

            <button
              onClick={() => {
                setHasInteracted(true);
                toggleMicListening();
              }}
              className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold transition-all ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? 'Stop speaking' : 'Start answer'}
            </button>

            {liveCaption && (
              <div className={`mt-3 w-full px-3 py-2 rounded-lg text-[11px] text-center ${
                isDark ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Live caption</span>
                </div>
                <p className="leading-relaxed">"{liveCaption}"</p>
              </div>
            )}
          </div>

          {lastEval && (
            <div className={`rounded-2xl border p-3 space-y-3 ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" /> Q#{questionCount - 1} review
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                  Grade {lastEval.mlAnalysis?.grade || 'A'} • {lastEval.score}%
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'Concept coverage', value: lastEval.mlAnalysis?.conceptScore ?? 85, color: 'bg-emerald-500' },
                  { label: 'Terminology', value: lastEval.mlAnalysis?.terminologyScore ?? 80, color: 'bg-purple-500' },
                  { label: 'Clarity', value: lastEval.mlAnalysis?.clarityScore ?? 90, color: 'bg-cyan-500' }
                ].map((item) => (
                  <div key={item.label}>
                    <div className={`flex justify-between text-[10px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span>{item.label}</span>
                      <span className="font-bold">{item.value}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
                      <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {lastEval.mlAnalysis?.foundTerms?.length > 0 && (
                <div className="pt-1">
                  <div className={`text-[10px] mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    {lastEval.mlAnalysis.foundTerms.map((term, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded text-[10px] ${isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{lastEval.feedback}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className={`rounded-2xl border p-3 space-y-2 ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`flex items-center justify-between gap-2 border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-pink-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Q#{questionCount}
              </span>
              <div className="flex items-center gap-2">
                {currentQuestion?.type && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    currentQuestion.type === 'mcq' 
                      ? isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-cyan-100 text-cyan-700'
                      : currentQuestion.type === 'coding'
                      ? isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-100 text-purple-700'
                      : isDark ? 'bg-slate-500/15 text-slate-400' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {currentQuestion.type}
                  </span>
                )}
                {currentQuestion?.difficulty && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    currentQuestion.difficulty === 'easy' 
                      ? isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      : currentQuestion.difficulty === 'medium'
                      ? isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-700'
                      : isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>
            </div>
            <h4 className={`text-base font-semibold leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {currentQuestion ? (typeof currentQuestion === 'object' ? currentQuestion.question : currentQuestion) : 'Loading question...'}
            </h4>
            {currentQuestion?.tags && currentQuestion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {currentQuestion.tags.map((tag, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded text-[10px] ${isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-2xl border p-3 flex flex-col gap-3 ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            {currentQuestion?.type === 'mcq' && currentQuestion?.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedMcqOption === idx;
                  const showResult = selectedMcqOption !== null;
                  const isCorrect = idx === currentQuestion.correctAnswer;
                  const isWrongSelection = isSelected && !isCorrect;
                  const isCorrectSelection = isSelected && isCorrect;

                  return (
                    <button
                      key={idx}
                      onClick={() => selectedMcqOption === null && setSelectedMcqOption(idx)}
                      disabled={selectedMcqOption !== null}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                        isCorrectSelection
                          ? isDark
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                            : 'bg-emerald-100 border-emerald-500 text-emerald-700'
                          : isWrongSelection
                          ? isDark
                            ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                            : 'bg-rose-100 border-rose-500 text-rose-700'
                          : showResult && isCorrect
                          ? isDark
                            ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400'
                            : 'bg-emerald-50 border-emerald-500/50 text-emerald-600'
                          : isSelected
                          ? isDark
                            ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                            : 'bg-indigo-100 border-indigo-500 text-indigo-700'
                          : isDark
                            ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold mr-2">{option}</span>
                        {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {showResult && isWrongSelection && <XCircle className="w-4 h-4 text-rose-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion?.type === 'coding' && (
              <div className="h-64">
                <MonacoCodeEditor
                  code={codeEditorContent}
                  onChange={setCodeEditorContent}
                  language={codeLanguage}
                  onLanguageChange={setCodeLanguage}
                  onRunCode={() => handleSubmitAnswer(false)}
                  onSubmitCode={() => handleSubmitAnswer()}
                  isDark={isDark}
                />
              </div>
            )}

            {(currentQuestion?.type === 'text' || !currentQuestion?.type) && (
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={candidateResponse}
                    onChange={(e) => {
                      setCandidateResponse(e.target.value);
                      setValidationError(null);
                      setValidationWarnings([]);
                      setValidationResult(null);
                    }}
                    placeholder={`Type your response for ${selectedTopic} or click the microphone to speak...`}
                    className={`w-full h-24 border rounded-lg p-3 text-xs resize-none focus:outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  />

                  <button
                    onClick={toggleMicListening}
                    className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : isDark
                          ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                    title={isListening ? 'Stop recording' : 'Start voice input (requires microphone permission)'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                {liveCaption && (
                  <div className={`text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-600'} italic`}>
                    🎤 {liveCaption}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-indigo-300'}`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Upload File</span>
                    <input
                      type="file"
                      accept=".txt,.md,.js,.py,.java,.cpp,.c"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadedFile && (
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      <CheckCircle className="w-3 h-3" />
                      {uploadedFile}
                    </span>
                  )}
                </div>
              </div>
            )}

            {validationError && (
              <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${isDark ? 'bg-rose-950/50 border border-rose-800/50 text-rose-300' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {validationError}
              </div>
            )}

            {validationResult && validationResult.isValid && currentQuestion?.type !== 'mcq' && (
              <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Answer correctness</span>
                  <span className={`text-sm font-bold ${validationResult.score >= 70 ? 'text-emerald-400' : validationResult.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {validationResult.score}%
                  </span>
                </div>

                {validationResult.totalExpectedPoints > 0 && (
                  <div className="space-y-1 mt-2">
                    <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Key points: {validationResult.matchedPoints.length}/{validationResult.totalExpectedPoints}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {validationResult.matchedPoints.map((point, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300">
                          ✓ {point}
                        </span>
                      ))}
                      {validationResult.missingPoints.map((point, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-rose-500/15 text-rose-300">
                          ✗ {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {validationWarnings.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-700">
                    {validationWarnings.map((warning, idx) => (
                      <div key={idx} className={`text-[10px] flex items-start gap-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        <span>⚠</span>
                        <span>{warning}</span>
                      </div>
                    ))}
                    {showForceSubmit && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleSubmitAnswer(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
                        >
                          Submit anyway
                        </button>
                        <button
                          onClick={() => {
                            setShowForceSubmit(false);
                            setValidationWarnings([]);
                            setValidationResult(null);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-200 text-slate-600 hover:text-slate-900'} transition-colors`}
                        >
                          Revise answer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {currentQuestion?.type === 'mcq'
                  ? `Selected: ${selectedMcqOption !== null ? currentQuestion.options[selectedMcqOption].substring(0, 20) + '...' : 'None'}`
                  : currentQuestion?.type === 'coding'
                  ? `Characters: ${codeEditorContent.length}`
                  : currentQuestion?.type === 'text'
                  ? `Characters: ${candidateResponse.length} | File: ${uploadedFile || 'None'}`
                  : `Characters: ${candidateResponse.length}`}
              </span>

              <div className="flex items-center gap-2">
                {currentQuestion?.type === 'mcq' && selectedMcqOption !== null && selectedMcqOption !== currentQuestion.correctAnswer && (
                  <button
                    onClick={() => setSelectedMcqOption(null)}
                    className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-[11px] font-bold text-white shadow-sm transition-all"
                  >
                    Try again
                  </button>
                )}

                <button
                  onClick={finishCurrentSession}
                  className="px-3 py-2 rounded-lg border border-slate-500/30 bg-slate-900/70 text-[11px] font-bold text-slate-200 hover:border-slate-400 transition-all"
                >
                  End Session
                </button>

                <button
                  onClick={() => handleSubmitAnswer(false)}
                  disabled={evaluating || isCheckingAnswer ||
                    (currentQuestion?.type === 'mcq' && selectedMcqOption === null) ||
                    (currentQuestion?.type === 'mcq' && selectedMcqOption !== null && selectedMcqOption !== currentQuestion.correctAnswer) ||
                    (currentQuestion?.type === 'coding' && !codeEditorContent.trim()) ||
                    (currentQuestion?.type === 'text' && !candidateResponse.trim() && !uploadedFile) ||
                    (!currentQuestion?.type && !candidateResponse.trim() && !uploadedFile)
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {isCheckingAnswer ? (
                    'Validating...'
                  ) : evaluating ? (
                    'AI analyzing...'
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" /> Submit & next
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border flex-1 flex flex-col min-h-[180px] ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`flex items-center justify-between border-b pb-2 mb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-[11px] font-semibold flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <FileText className="w-4 h-4 text-indigo-400" /> Transcript ({transcriptHistory.length})
              </span>
              {onCompleteReport && (
                <button
                  onClick={() => {
                    const scorecardSummary = {
                      totalQuestions: Math.max(0, questionCount - 1),
                      mcqScore: questionTypeProgress.mcq.correct,
                      mcqTotal: questionTypeProgress.mcq.total,
                      mcqAnswered: questionTypeProgress.mcq.answered,
                      codingCompleted: questionTypeProgress.coding.answered,
                      codingTotal: questionTypeProgress.coding.total,
                      textCompleted: questionTypeProgress.text.answered,
                      textTotal: questionTypeProgress.text.total,
                      overallScore: cumulativeScores.length > 0
                        ? Math.round(cumulativeScores.reduce((a, b) => a + b, 0) / cumulativeScores.length)
                        : 0,
                      totalTime: questionTimer,
                      questionMetrics,
                      sessionScores: cumulativeScores,
                      transcriptHistory,
                      topic: selectedTopic,
                      questionTypeProgress,
                    };

                    onCompleteReport(scorecardSummary);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-[10px] font-bold text-white"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Scorecard
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 max-h-[240px]">
              {transcriptHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    item.speaker.includes('AI')
                      ? isDark ? 'bg-purple-500/10 border border-purple-500/20 text-purple-200' : 'bg-purple-50 border border-purple-200 text-purple-800'
                      : isDark ? 'bg-slate-950 border border-slate-800 text-slate-200 ml-4' : 'bg-slate-50 border border-slate-200 text-slate-700 ml-4'
                  }`}
                >
                  <div className={`flex items-center justify-between text-[10px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="font-bold">{item.speaker}</span>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI / ML Smart Match Persona Selection Modal */}
      {showSmartMatchModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in ${isDark ? 'bg-slate-950/80' : 'bg-slate-900/50'}`}>
          <div className={`w-full max-w-xl p-4 rounded-2xl border space-y-3 shadow-2xl ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className={`text-lg font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Sparkles className="w-5 h-5 text-amber-400" /> AI / ML Smart Persona Matcher
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Select an architectural target persona to auto-tune questions</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSmartMatchModal(false)}
                className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-base font-bold px-2 py-1 rounded-lg`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {AI_PERSONAS.map((persona, idx) => (
                <div
                  key={idx}
                  onClick={() => handleApplyPersona(persona)}
                  className={`p-3 rounded-xl border hover:border-purple-500/50 transition-all cursor-pointer flex items-center justify-between group ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                        {persona.topic}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                        {persona.difficulty}
                      </span>
                    </div>
                    <h4 className={`text-sm font-bold group-hover:text-purple-300 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {persona.role}
                    </h4>
                    <p className={`text-xs leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{persona.desc}</p>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white text-purple-400 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>

            <div className={`pt-2 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                onClick={() => setShowSmartMatchModal(false)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Complete Report Modal */}
      {renderReportModal()}

      {/* Skip Question Confirmation Modal */}
      {showSkipConfirm && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in ${isDark ? 'bg-slate-950/80' : 'bg-slate-900/50'}`}>
          <div className={`w-full max-w-md p-4 rounded-2xl border space-y-4 shadow-2xl ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`text-lg font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Skip Question?
              </h3>
              <button
                type="button"
                onClick={() => setShowSkipConfirm(false)}
                className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-base font-bold px-2 py-1 rounded-lg`}
              >
                ✕
              </button>
            </div>
            
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Are you sure you want to skip this question? This will move to the next question without evaluating your response.
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSkipQuestion}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md"
              >
                Skip Question
              </button>
            </div>
          </div>
        </div>
      )}

      {renderSessionCompleteModal()}
    </div>
  );
};
