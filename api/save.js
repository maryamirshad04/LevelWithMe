// api/save.js — POST /api/save
// Accepts { photo: base64string, quote: string, audio?: base64string }
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
    const { photo, quote, audio } = req.body;

    if (!photo || !quote) return res.status(400).json({ error: 'photo and quote are required' });
    if (quote.length > 200) return res.status(400).json({ error: 'Quote too long (max 200 chars)' });
    if (photo.length > 4_000_000) return res.status(400).json({ error: 'Photo too large (max ~3MB)' });
    // audio is optional but if present cap at ~8MB base64 (~6MB file)
    if (audio && audio.length > 10_000_000) return res.status(400).json({ error: 'Audio too large (max ~6MB)' });

    const col = await getDb();
    const result = await col.insertOne({
      photo,
      quote: quote.trim(),
      audio: audio || null,   // null = no custom audio
      createdAt: new Date(),
    });

    return res.status(200).json({ id: result.insertedId.toString() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};