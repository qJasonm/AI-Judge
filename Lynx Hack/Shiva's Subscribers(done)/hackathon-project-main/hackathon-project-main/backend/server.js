require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { analyzeTransactions } = require('./subscriptionEngine');
const { analyzeSubscription, handleChat, getAlternativeSuggestions } = require('./aiService');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Seed the DB using our Data Engine Brain
let db = analyzeTransactions();
// db.subscriptions contains the array

// Rescan endpoint to reset DB or get fresh metrics
app.get('/api/scan', async (req, res) => {
  db = analyzeTransactions();
  res.json({
    metrics: { count: db.rawCount, waste: db.monthlyWaste },
    subscriptions: db.subscriptions
  });
});

// GET all active subscriptions with insights
app.get('/api/subscriptions', async (req, res) => {
  try {
    const activeSubs = db.subscriptions.filter(s => s.status === 'active');
    
    const subsWithInsights = await Promise.all(
      activeSubs.map(async (sub) => {
        const aiMessage = await analyzeSubscription(sub);
        return { ...sub, aiRecommendation: aiMessage };
      })
    );
    res.json(subsWithInsights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// GET overview
app.get('/api/overview', (req, res) => {
  res.json(db.subscriptions);
});

// Action endpoint: cancel a subscription
app.post('/api/subscriptions/:id/cancel', (req, res) => {
  const { id } = req.params;
  const subIndex = db.subscriptions.findIndex(s => s.id === id);
  if (subIndex === -1) return res.status(404).json({ error: 'Not found' });
  
  db.subscriptions[subIndex].status = 'cancelled';
  res.json(db.subscriptions[subIndex]);
});

app.post('/api/subscriptions/:id/keep', (req, res) => {
  const { id } = req.params;
  const subIndex = db.subscriptions.findIndex(s => s.id === id);
  if (subIndex === -1) return res.status(404).json({ error: 'Not found' });
  
  db.subscriptions[subIndex].status = 'kept';
  res.json(db.subscriptions[subIndex]);
});

// Chat AI
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const reply = await handleChat(message, db);
  res.json({ text: reply });
});

// Alternatives Tinder AI
app.post('/api/subscriptions/:id/alternatives', async (req, res) => {
  const { id } = req.params;
  const sub = db.subscriptions.find(s => s.id === id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  
  const alternatives = await getAlternativeSuggestions(sub);
  res.json(alternatives);
});

// Generic Sweeps Endpoint for the Tinder Deck
app.get('/api/sweeps', async (req, res) => {
  if (!db || !db.subscriptions || db.subscriptions.length === 0) {
     return res.json([]);
  }
  // Sort by highest cost to recommend alternatives for the most expensive
  const highestSub = [...db.subscriptions].sort((a,b) => b.cost - a.cost)[0];
  const alternatives = await getAlternativeSuggestions(highestSub);
  res.json(alternatives);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
