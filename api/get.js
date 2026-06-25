// api/get.js — GET /api/get?id=...
// Returns { photo, quote, audio } for a given MongoDB ObjectId

const { MongoClient, ObjectId } = require('mongodb');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const col = await getDb();
    const doc = await col.findOne({ _id: objectId });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      photo: doc.photo,
      quote: doc.quote,
      audio: doc.audio || null,  // null if sender didn't upload audio
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};