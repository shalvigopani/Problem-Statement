const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = Number(process.env.MULTIPLAYER_PORT || 3000);
const PYTHON_API = process.env.LEARNAI_API_URL || `http://127.0.0.1:${process.env.PORT || 8000}`;
const MONGODB_URI = process.env.MONGODB_URI || '';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const rooms = new Map();
let mongoReady = false;

const roomSchema = new mongoose.Schema({
  code: { type: String, unique: true, index: true },
  name: String,
  topic: String,
  difficulty: String,
  questionCount: Number,
  timer: Number,
  hostId: String,
  questions: Array,
  status: { type: String, default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
  players: Array
});
const RoomModel = mongoose.models.LearnAIRoom || mongoose.model('LearnAIRoom', roomSchema);

async function initMongo() {
  if (!MONGODB_URI) return;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    mongoReady = true;
    console.log('MongoDB connected — rooms can be persisted.');
  } catch (err) {
    console.log('MongoDB unavailable — using in-memory rooms for this run.');
  }
}

function makeCode() {
  let code;
  do code = String(Math.floor(100000 + Math.random() * 900000));
  while (rooms.has(code));
  return code;
}

function safePlayer(p) {
  return {
    id: p.id,
    name: p.name,
    score: p.score || 0,
    correct: p.correct || 0,
    wrong: p.wrong || 0,
    answered: p.answered || 0,
    timeTaken: p.timeTaken || 0,
    joinedAt: p.joinedAt
  };
}

function publicRoom(room) {
  return {
    code: room.code,
    name: room.name,
    topic: room.topic,
    difficulty: room.difficulty,
    questionCount: room.questionCount,
    timer: room.timer,
    hostId: room.hostId,
    status: room.status,
    players: room.players.map(safePlayer),
    startedAt: room.startedAt || null
  };
}

async function persistRoom(room) {
  if (!mongoReady) return;
  await RoomModel.findOneAndUpdate(
    { code: room.code },
    {
      code: room.code,
      name: room.name,
      topic: room.topic,
      difficulty: room.difficulty,
      questionCount: room.questionCount,
      timer: room.timer,
      hostId: room.hostId,
      questions: room.questions || [],
      status: room.status,
      createdAt: room.createdAt,
      players: room.players.map(safePlayer)
    },
    { upsert: true, new: true }
  ).catch(() => {});
}

async function generateQuestions(config) {
  const prompt = {
    material: `Create a multiplayer quiz about the topic: ${config.topic}. Difficulty: ${config.difficulty}. Generate exactly ${config.questionCount} reliable single-answer MCQs. Each question must have exactly four options and one correct option. Keep questions suitable for a student learning platform. Return JSON only.`,
    count: String(config.questionCount),
    difficulty: config.difficulty,
    focus: config.topic,
    language: 'English',
    assessmentName: `${config.topic} Quiz Battle`,
    requirements: 'Competitive group quiz. Do not reveal answers in question text or options.'
  };

  const response = await fetch(`${PYTHON_API}/api/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Quiz generation failed.');
  const questions = Array.isArray(data.questions) ? data.questions : [];
  if (!questions.length) throw new Error(data.note || 'No reliable questions were generated.');
  return questions.slice(0, config.questionCount).map(q => ({
    q: q.q,
    a: q.a,
    c: Number(q.c),
    source: q.source || config.topic,
    explanation: q.explanation || ''
  }));
}

app.get('/api/multiplayer/health', (_req, res) => {
  res.json({ ok: true, multiplayer: true, mongo: mongoReady });
});

app.post('/api/multiplayer/feedback', async (req, res) => {
  try {
    const { topic, score, accuracy, rank, totalPlayers, weakTopic } = req.body || {};
    const prompt = `Give short encouraging AI learning feedback for a student after a multiplayer quiz. Topic: ${topic}. Score: ${score}. Accuracy: ${accuracy}%. Rank: ${rank}/${totalPlayers}. Weak competency/topic: ${weakTopic || 'not identified'}. Give 2 concise sentences and one concrete next step. Do not invent personal facts.`;
    const response = await fetch(`${PYTHON_API}/api/study-chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, history: [], context: '', language: 'English' })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Feedback failed.');
    res.json({ feedback: data.answer || 'Keep practicing your weaker topic and challenge yourself again.' });
  } catch (err) {
    res.json({ feedback: 'Nice effort! Review the most challenging topic, then replay the quiz to improve your accuracy.' });
  }
});

app.post('/api/multiplayer/generate', async (req, res) => {
  try {
    const config = req.body || {};
    const questions = await generateQuestions({
      topic: String(config.topic || 'General Knowledge'),
      difficulty: String(config.difficulty || 'Intermediate'),
      questionCount: Math.min(20, Math.max(5, Number(config.questionCount || 10)))
    });
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to generate quiz.' });
  }
});

io.on('connection', socket => {
  socket.on('room:create', async (payload, cb) => {
    try {
      const config = payload || {};
      const name = String(config.roomName || 'Quiz Battle').trim().slice(0, 60);
      const topic = String(config.topic || 'General Knowledge').trim().slice(0, 100);
      const difficulty = String(config.difficulty || 'Intermediate');
      const questionCount = Math.min(20, Math.max(5, Number(config.questionCount || 10)));
      const timer = Math.min(120, Math.max(10, Number(config.timer || 30)));
      const playerName = String(config.playerName || 'Host').trim().slice(0, 40) || 'Host';
      const code = makeCode();
      const room = {
        code, name, topic, difficulty, questionCount, timer,
        hostId: socket.id, questions: [], status: 'waiting',
        createdAt: new Date().toISOString(), players: [{
          id: socket.id, name: playerName, score: 0, correct: 0, wrong: 0,
          answered: 0, timeTaken: 0, joinedAt: Date.now()
        }]
      };
      rooms.set(code, room);
      socket.join(code);
      await persistRoom(room);
      cb({ ok: true, room: publicRoom(room), playerId: socket.id });
      io.to(code).emit('room:update', publicRoom(room));
    } catch (err) { cb({ ok: false, error: err.message }); }
  });

  socket.on('room:join', async (payload, cb) => {
    try {
      const code = String(payload?.code || '').trim();
      const playerName = String(payload?.playerName || '').trim().slice(0, 40);
      const room = rooms.get(code);
      if (!room) return cb({ ok: false, error: 'Room not found. Check the 6-digit code.' });
      if (room.status !== 'waiting') return cb({ ok: false, error: 'This quiz has already started.' });
      if (!playerName) return cb({ ok: false, error: 'Please enter your name.' });
      if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) return cb({ ok: false, error: 'That name is already in the room.' });
      room.players.push({ id: socket.id, name: playerName, score: 0, correct: 0, wrong: 0, answered: 0, timeTaken: 0, joinedAt: Date.now() });
      socket.join(code);
      await persistRoom(room);
      cb({ ok: true, room: publicRoom(room), playerId: socket.id });
      io.to(code).emit('room:update', publicRoom(room));
    } catch (err) { cb({ ok: false, error: err.message }); }
  });

  socket.on('room:start', async (payload, cb) => {
    try {
      const room = rooms.get(String(payload?.code || ''));
      if (!room) return cb({ ok: false, error: 'Room not found.' });
      if (room.hostId !== socket.id) return cb({ ok: false, error: 'Only the host can start the quiz.' });
      if (room.players.length < 1) return cb({ ok: false, error: 'At least one player is required.' });
      if (room.status !== 'waiting') return cb({ ok: false, error: 'Quiz has already started.' });
      room.questions = Array.isArray(payload.questions) ? payload.questions : [];
      if (!room.questions.length) return cb({ ok: false, error: 'No quiz questions were supplied.' });
      room.questionCount = room.questions.length;
      room.status = 'playing';
      room.startedAt = Date.now();
      room.players.forEach(p => Object.assign(p, { score: 0, correct: 0, wrong: 0, answered: 0, timeTaken: 0 }));
      await persistRoom(room);
      cb({ ok: true });
      io.to(room.code).emit('quiz:started', {
        room: publicRoom(room),
        questions: room.questions.map(q => ({ q: q.q, a: q.a, source: q.source })),
        total: room.questions.length,
        timer: room.timer
      });
    } catch (err) { cb({ ok: false, error: err.message }); }
  });

  socket.on('quiz:answer', async (payload, cb) => {
    const room = rooms.get(String(payload?.code || ''));
    if (!room || room.status !== 'playing') return cb?.({ ok: false, error: 'Quiz is not active.' });
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return cb?.({ ok: false, error: 'Player not found.' });
    const index = Number(payload.index);
    const question = room.questions[index];
    if (!question) return cb?.({ ok: false, error: 'Invalid question.' });
    if (player.lastAnsweredIndex === index) return cb?.({ ok: true, duplicate: true });
    const selected = Number(payload.answer);
    const correct = selected === Number(question.c);
    const timeMs = Math.max(0, Number(payload.timeMs || 0));
    const speedBonus = correct ? Math.max(0, Math.round((room.timer * 1000 - timeMs) / 1000)) : 0;
    const points = correct ? 100 + speedBonus : 0;
    player.lastAnsweredIndex = index;
    player.answered += 1;
    player.correct += correct ? 1 : 0;
    player.wrong += correct ? 0 : 1;
    player.score += points;
    player.timeTaken += Math.round(timeMs / 1000);
    await persistRoom(room);
    const leaderboard = [...room.players].sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken).map((p, i) => ({ rank: i + 1, ...safePlayer(p) }));
    io.to(room.code).emit('leaderboard:update', leaderboard);
    cb?.({ ok: true, correct, points, leaderboard });
  });

  socket.on('quiz:finish', async (payload, cb) => {
    const room = rooms.get(String(payload?.code || ''));
    if (!room) return cb?.({ ok: false });
    const allDone = room.players.every(p => p.answered >= room.questions.length);
    if (!allDone && socket.id !== room.hostId) return cb?.({ ok: true, waiting: true });
    room.status = 'finished';
    await persistRoom(room);
    const leaderboard = [...room.players].sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken).map((p, i) => ({ rank: i + 1, ...safePlayer(p) }));
    io.to(room.code).emit('quiz:finished', { leaderboard, room: publicRoom(room) });
    cb?.({ ok: true });
  });

  socket.on('disconnect', async () => {
    for (const [code, room] of rooms) {
      const index = room.players.findIndex(p => p.id === socket.id);
      if (index === -1) continue;
      const wasHost = room.hostId === socket.id;
      room.players.splice(index, 1);
      if (wasHost) {
        if (room.players.length) room.hostId = room.players[0].id;
        else rooms.delete(code);
      }
      if (rooms.has(code)) {
        await persistRoom(room);
        io.to(code).emit('room:update', publicRoom(room));
      }
    }
  });
});

initMongo().finally(() => {
  server.listen(PORT, '0.0.0.0', () => console.log(`LearnAI Multiplayer running at http://localhost:${PORT}`));
});
