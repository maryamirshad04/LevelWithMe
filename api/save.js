// api/save.js — POST /api/save
// Accepts { photoUrl, quote, audioUrl? } — URLs from Cloudinary, not raw files
// Saves to MongoDB, returns { id }

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
let client;

async function getDb() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db('arcade-sorry').collection('dedications');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { photoUrl, quote, audioUrl } = req.body;

    if (!photoUrl || !quote) return res.status(400).json({ error: 'photoUrl and quote are required' });
    if (quote.length > 200) return res.status(400).json({ error: 'Quote too long (max 200 chars)' });

    const col = await getDb();
    const result = await col.insertOne({
      photoUrl,
      quote: quote.trim(),
      audioUrl: audioUrl || null,
      createdAt: new Date(),
    });

    return res.status(200).json({ id: result.insertedId.toString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};