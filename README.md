# 🕹️ Sorry For Not Calling — Arcade Crane Machine

A pixel-art crane machine experience. Press the button, swing the claw, catch the photo — and reveal your message.

## 📁 Asset Setup (required before deploy)

Place these files in the `/public` folder:

| File | Description |
|------|-------------|
| `public/photo.png` | Your polaroid photo image (square recommended, e.g. 400×400px) |
| `public/catch-music.mp3` | Music that plays when the photo is caught |

**photo.png** — anything you want shown in the polaroid frame  
**catch-music.mp3** — plays on loop after a successful catch

---

## 🚀 Running locally

```bash
npm install
npm start
```

## 🌐 Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework preset: **Create React App**
4. Click **Deploy** ✓

No environment variables needed.

---

## 🎮 How to play

1. **Click the crane machine** — it zooms in
2. **Press DROP button** — crane descends
3. **Press GRAB button** while crane swings — it catches the photo
4. **Polaroid reveals** with your message + music 🎵

---

## 🎨 Aesthetic

90s pixel art • neon pink & purple • CRT scanlines • floating stars
