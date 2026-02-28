import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
// import { kv } from '@vercel/kv';
import { kv } from './lib/kv.js';
import { getAllPosts, getPost } from './lib/posts.js';

const MS_PER_SECOND = 1000;
const SECONDS_PER_DAY = 60 * 60 * 24;
const MS_PER_DAY = SECONDS_PER_DAY * MS_PER_SECOND; // 86,400,000

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean); // 빈값 제거

app.use(cors({
  origin: (origin, callback) => {
    // same-origin / server-to-server 허용
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json());

// ============ Rate Limiters ============
const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const analyticsWindowMs = toInt(process.env.RATE_LIMIT_ANALYTICS_WINDOW_MS, 60_000);
const analyticsMax      = toInt(process.env.RATE_LIMIT_ANALYTICS_MAX, 30);

const analyticsLimiter = rateLimit({
  windowMs: analyticsWindowMs,
  max: analyticsMax,
  standardHeaders: true,
  legacyHeaders: false,
});

// ============ Analytics API ============

// 접속 기록 추가
app.post('/api/analytics/view', analyticsLimiter, async (req, res) => {
  try {
    const { post_id } = req.body;
    
    if (!post_id) {
      return res.status(400).json({ error: 'post_id required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const key = `views:${post_id}:${today}`;
    
    // 오늘 조회수 증가
    await kv.incr(key);
    
    // 전체 조회수 증가
    await kv.incr(`views:${post_id}:total`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to record view' });
  }
});



// 조회수 조회
app.get('/api/analytics/:post_id', async (req, res) => {
  try {
    const { post_id } = req.params;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().split('T')[0];
    
    const todayViews = await kv.get(`views:${post_id}:${today}`) || 0;
    const yesterdayViews = await kv.get(`views:${post_id}:${yesterday}`) || 0;
    const totalViews = await kv.get(`views:${post_id}:total`) || 0;
    
    res.json({
      post_id,
      today: parseInt(todayViews),
      yesterday: parseInt(yesterdayViews),
      total: parseInt(totalViews)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// posting된 글 불러오기
app.get('/api/posts', async (_, res) => {
  res.json(await getAllPosts());
});

app.get('/api/posts/:id', async (req, res) => {
  res.json(await getPost(req.params.id));
});

// ============ Profile ============
app.get('/api/profile', (_, res) => {
  res.json({
    github:   process.env.GITHUB_URL   || null,
    linkedin: process.env.LINKEDIN_URL || null,
  });
});

// ============ Health Check ============
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ Static Files (Fallback) ============
app.use(express.static('public'));

// SPA Fallback
app.get('*', (_, res) => {
  res.sendFile('public/index.html', { root: '.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
