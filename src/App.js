import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ── Simple client-side routing ─────────────────────────────────
function getGameId() {
  const match = window.location.pathname.match(/^\/play\/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

// ── Game states ────────────────────────────────────────────────
const STATES = {
  IDLE: 'idle',
  ZOOMED: 'zoomed',
  CRANE_DOWN: 'crane_down',
  CRANE_SWING: 'crane_swing',
  CATCH: 'catch',
  REVEAL: 'reveal',
};

export default function App() {
  const gameId = getGameId();
  if (!gameId) return <LandingPage />;
  return <GamePage gameId={gameId} />;
}

// ─────────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────────
function LandingPage() {
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [quote, setQuote] = useState('');
  const [audio, setAudio] = useState(null);         // base64 or null
  const [audioName, setAudioName] = useState('');   // filename for display
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [stars, setStars] = useState([]);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    setStars(
      Array.from({ length: 40 }, (_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        size: Math.random() * 3 + 1, delay: Math.random() * 3,
      }))
    );
  }, []);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    if (file.size > 3 * 1024 * 1024) { setError('Image must be under 3MB'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => { setPhoto(ev.target.result); setPhotoPreview(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function handleAudioFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { setError('Please upload an audio file (mp3, wav, etc.)'); return; }
    if (file.size > 6 * 1024 * 1024) { setError('Audio must be under 6MB'); return; }
    setError('');
    setAudioName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setAudio(ev.target.result);
    reader.readAsDataURL(file);
  }

  function removeAudio() {
    setAudio(null);
    setAudioName('');
    if (audioRef.current) audioRef.current.value = '';
  }

  async function handleSubmit() {
    if (!photo) { setError('Upload a photo first ♥'); return; }
    if (!quote.trim()) { setError('Write something from the heart ♥'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo, quote: quote.trim(), audio: audio || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setLink(`${window.location.origin}/play/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="app">
      <div className="starfield">
        {stars.map((s) => (
          <div key={s.id} className="star"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
        ))}
      </div>
      <div className="scanlines" />

      <div className="scene landing-scene">
        <div className="landing-card">
          <div className="landing-header">
            <h1 className="landing-title">★ CRANE GAME ★</h1>
            <p className="landing-subtitle">make someone play for your photo</p>
          </div>

          <div className="how-it-works">
            <p className="how-step">① upload your photo</p>
            <p className="how-step">② write them something</p>
            <p className="how-step">③ add a song (optional)</p>
            <p className="how-step">④ send them the link ♥</p>
          </div>

          {/* Photo upload */}
          <div className="upload-area" onClick={() => fileRef.current.click()}>
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="upload-preview" />
            ) : (
              <div className="upload-placeholder">
                <img src="/camera.png" alt="camera" className="upload-icon" />
                <span className="upload-hint">CLICK TO UPLOAD PHOTO</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </div>

          {/* Quote input */}
          <div className="quote-area">
            <label className="quote-label">YOUR MESSAGE</label>
            <textarea
              className="quote-input"
              placeholder="sorry for not calling..."
              maxLength={200}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
            <span className="char-count">{quote.length}/200</span>
          </div>

          {/* Audio upload */}
          <div className="audio-upload-area">
            <label className="quote-label">YOUR SONG <span className="optional-tag">(OPTIONAL)</span></label>
            {!audio ? (
              <div className="audio-drop-zone" onClick={() => audioRef.current.click()}>
                <span className="audio-icon">🎵</span>
                <span className="audio-hint">CLICK TO UPLOAD AUDIO</span>
                <span className="audio-hint-sub">mp3 · wav · ogg · max 6MB</span>
              </div>
            ) : (
              <div className="audio-loaded">
                <span className="audio-loaded-icon">♪</span>
                <span className="audio-loaded-name">{audioName}</span>
                <button className="audio-remove-btn" onClick={removeAudio}>✕</button>
              </div>
            )}
            <input
              ref={audioRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFile}
              style={{ display: 'none' }}
            />
          </div>

          {error && <p className="landing-error">⚠ {error}</p>}

          {!link && (
            <button className="arcade-button landing-btn" onClick={handleSubmit} disabled={loading}>
              <span className="button-label">{loading ? 'SAVING...' : '▶ GENERATE LINK'}</span>
            </button>
          )}

          {link && (
            <div className="link-result">
              <p className="link-label">✦ SEND THIS LINK ✦</p>
              <div className="link-box">
                <span className="link-text">{link}</span>
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
              <button className="reset-button pixel-text" onClick={() => {
                setLink(''); setPhoto(null); setPhotoPreview(null);
                setQuote(''); setAudio(null); setAudioName('');
              }}>
                ↩ MAKE ANOTHER
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// GAME PAGE  (/play/:id)
// ─────────────────────────────────────────────────────────────────
function GamePage({ gameId }) {
  useEffect(() => {
    document.body.classList.add('game-mode');
    return () => document.body.classList.remove('game-mode');
  }, []);

  const [dedication, setDedication] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [state, setState] = useState(STATES.IDLE);
  const [craneX, setCraneX] = useState(50);
  const [craneY, setCraneY] = useState(0);
  const [grabbed, setGrabbed] = useState(false);
  const [stars, setStars] = useState([]);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef(null);
  const swingRef = useRef(null);

  useEffect(() => {
    setStars(
      Array.from({ length: 40 }, (_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        size: Math.random() * 3 + 1, delay: Math.random() * 3,
      }))
    );
  }, []);

  useEffect(() => {
    fetch(`/api/get?id=${gameId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDedication(data);
      })
      .catch((err) => setFetchError(err.message));
  }, [gameId]);

  // Keep audio element in sync with muted state
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (!next && audioRef.current && state === STATES.REVEAL) {
      audioRef.current.play().catch(() => {});
    }
  }

  function handleMachineClick() {
    if (state === STATES.IDLE) setState(STATES.ZOOMED);
  }

  function handleButtonPress() {
    if (state === STATES.ZOOMED) {
      setState(STATES.CRANE_DOWN);
    } else if (state === STATES.CRANE_SWING) {
      setState(STATES.CATCH);
      setGrabbed(true);
      setTimeout(() => {
        setState(STATES.REVEAL);
        // Only play if there's actual audio uploaded
        if (audioRef.current && dedication?.audio) {
          audioRef.current.volume = 0.7;
          audioRef.current.play().catch(() => {});
        }
      }, 1200);
    }
  }

  useEffect(() => {
    if (state === STATES.CRANE_DOWN) {
      let y = 0;
      const interval = setInterval(() => {
        y += 3; setCraneY(y);
        if (y >= 65) { clearInterval(interval); setState(STATES.CRANE_SWING); }
      }, 30);
      return () => clearInterval(interval);
    }
    if (state !== STATES.CRANE_SWING && state !== STATES.CATCH) setCraneY(0);
  }, [state]);

  useEffect(() => {
    if (state === STATES.CRANE_SWING) {
      let t = 0;
      swingRef.current = setInterval(() => {
        t += 0.05;
        setCraneX(50 + Math.sin(t * 2.5) * 22);
      }, 30);
      return () => clearInterval(swingRef.current);
    } else {
      clearInterval(swingRef.current);
    }
  }, [state]);

  function handleReset() {
    setState(STATES.IDLE); setCraneX(50); setCraneY(0); setGrabbed(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }

  if (fetchError) {
    return (
      <div className="app">
        <div className="scene" style={{ flexDirection: 'column', gap: '1rem' }}>
          <p className="pixel-text" style={{ color: '#ff80b0', fontSize: '10px' }}>⚠ LINK NOT FOUND</p>
          <p className="pixel-text" style={{ fontSize: '8px' }}>{fetchError}</p>
          <button className="reset-button pixel-text" onClick={() => window.location.href = '/'}>← GO HOME</button>
        </div>
      </div>
    );
  }

  if (!dedication) {
    return (
      <div className="app">
        <div className="scene">
          <p className="pixel-text blink">LOADING...</p>
        </div>
      </div>
    );
  }

  const hasAudio = !!dedication.audio;

  return (
    <div className="app">
      <div className="starfield">
        {stars.map((s) => (
          <div key={s.id} className="star"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
        ))}
      </div>
      <div className="scanlines" />

      {/* Mute toggle — only shown if there's audio to play */}
      {hasAudio && (
        <button className="mute-btn" onClick={toggleMute} title={muted ? 'Unmute music' : 'Mute music'}>
          {muted ? '🔇' : '🔊'}
        </button>
      )}

      {state === STATES.IDLE && (
        <div className="scene idle-scene" onClick={handleMachineClick}>
          <p className="click-hint blink">[ INSERT COIN ]</p>
          <CraneMachineFull />
          <p className="click-hint small blink-slow">CLICK MACHINE TO PLAY</p>
        </div>
      )}

      {(state === STATES.ZOOMED || state === STATES.CRANE_DOWN ||
        state === STATES.CRANE_SWING || state === STATES.CATCH) && (
        <div className="scene zoomed-scene">
          <ZoomedMachine
            state={state} craneX={craneX} craneY={craneY}
            grabbed={grabbed} onButtonPress={handleButtonPress}
          />
          <div className="instruction-bar">
            {state === STATES.ZOOMED     && <p className="pixel-text blink">▶ PRESS THE BUTTON TO LOWER CRANE</p>}
            {state === STATES.CRANE_DOWN && <p className="pixel-text">CRANE DESCENDING...</p>}
            {state === STATES.CRANE_SWING && <p className="pixel-text blink">▶ PRESS BUTTON TO GRAB!</p>}
            {state === STATES.CATCH      && <p className="pixel-text">GOTCHA! ★</p>}
          </div>
        </div>
      )}

      {state === STATES.REVEAL && (
        <div className="scene reveal-scene">
          <Polaroid onReset={handleReset} photo={dedication.photo} quote={dedication.quote} />
        </div>
      )}

      {/* Audio element — only rendered if sender uploaded audio */}
      {hasAudio && (
        <audio ref={audioRef} src={dedication.audio} loop muted />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Full machine (idle view) – pixel-art SVG
// ─────────────────────────────────────────────────────────────────
function CraneMachineFull() {
  return (
    <div className="machine-full-wrap">
      <svg viewBox="0 0 220 340" width="220" height="340" className="machine-svg pixel-render" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="80" width="160" height="230" rx="4" fill="#c060c8" />
        <rect x="36" y="86" width="148" height="218" rx="2" fill="#9040a0" />
        <rect x="44" y="94" width="132" height="160" rx="2" fill="#1a0a4e" stroke="#ff80ff" strokeWidth="2" />
        <rect x="48" y="98" width="20" height="150" fill="#ffffff" opacity="0.07" />
        <rect x="25" y="60" width="170" height="28" rx="4" fill="#e040fb" />
        <rect x="30" y="64" width="160" height="20" rx="2" fill="#1a0a2e" />
        <text x="110" y="78" textAnchor="middle" fontFamily="'Press Start 2P'" fontSize="7" fill="#ff80ff">CRANE GAME</text>
        <polygon points="110,30 115,45 130,45 118,54 122,69 110,60 98,69 102,54 90,45 105,45" fill="#ffe066" stroke="#ffaa00" strokeWidth="1" />
        <ellipse cx="78" cy="210" rx="22" ry="18" fill="#ff80b0" />
        <circle cx="70" cy="204" r="4" fill="#ff60a0" />
        <circle cx="86" cy="204" r="4" fill="#ff60a0" />
        <circle cx="72" cy="206" r="2" fill="#1a0a2e" />
        <circle cx="84" cy="206" r="2" fill="#1a0a2e" />
        <circle cx="68" cy="211" r="3" fill="#ff4090" opacity="0.6" />
        <circle cx="88" cy="211" r="3" fill="#ff4090" opacity="0.6" />
        <ellipse cx="140" cy="215" rx="20" ry="17" fill="#e060c0" />
        <circle cx="133" cy="208" r="3.5" fill="#c050b0" />
        <circle cx="147" cy="208" r="3.5" fill="#c050b0" />
        <circle cx="135" cy="210" r="2" fill="#1a0a2e" />
        <circle cx="145" cy="210" r="2" fill="#1a0a2e" />
        <circle cx="131" cy="215" r="3" fill="#ff4090" opacity="0.6" />
        <circle cx="149" cy="215" r="3" fill="#ff4090" opacity="0.6" />
        <polygon points="107,175 109,181 115,181 110,185 112,191 107,187 102,191 104,185 99,181 105,181" fill="#ffe066" />
        <polygon points="130,155 131,159 135,159 132,162 133,166 130,163 127,166 128,162 125,159 129,159" fill="#ffe066" />
        <rect x="105" y="96" width="10" height="40" fill="#c0c0ff" />
        <rect x="98" y="134" width="24" height="6" fill="#a0a0e0" />
        <line x1="104" y1="140" x2="98" y2="152" stroke="#c0c0ff" strokeWidth="2" />
        <line x1="110" y1="140" x2="110" y2="154" stroke="#c0c0ff" strokeWidth="2" />
        <line x1="116" y1="140" x2="122" y2="152" stroke="#c0c0ff" strokeWidth="2" />
        <rect x="60" y="254" width="100" height="16" rx="2" fill="#7020a0" />
        <rect x="72" y="258" width="76" height="8" rx="1" fill="#1a0a2e" />
        <rect x="36" y="270" width="148" height="36" rx="2" fill="#7020a0" />
        <rect x="88" y="278" width="44" height="8" rx="4" fill="#1a0a2e" stroke="#ff80ff" strokeWidth="1" />
        <text x="110" y="285" textAnchor="middle" fontFamily="'Press Start 2P'" fontSize="4" fill="#ff80ff">COIN</text>
        <rect x="46" y="306" width="16" height="24" rx="2" fill="#8030b0" />
        <rect x="158" y="306" width="16" height="24" rx="2" fill="#8030b0" />
        <rect x="30" y="94" width="6" height="160" fill="#ff80ff" opacity="0.15" />
        <rect x="184" y="94" width="6" height="160" fill="#ff80ff" opacity="0.15" />
        <text x="42" y="230" fontFamily="'Press Start 2P'" fontSize="8" fill="#ffe066">★</text>
        <text x="168" y="230" fontFamily="'Press Start 2P'" fontSize="8" fill="#ffe066">★</text>
      </svg>
      <div className="ground-stars">
        {['★','✦','★','✦','★'].map((s,i) => (
          <span key={i} className="ground-star" style={{ animationDelay: `${i * 0.3}s` }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Zoomed-in machine interior
// ─────────────────────────────────────────────────────────────────
function ZoomedMachine({ state, craneX, craneY, grabbed, onButtonPress }) {
  const isCatch = state === STATES.CATCH;
  return (
    <div className="zoomed-wrapper">
      <div className="zoomed-machine">
        <div className="marquee-bar">
          <span className="pixel-text marquee-title">★ CRANE GAME ★</span>
        </div>
        <div className="glass-area">
          <div className="glass-bg" />
          <div className="crane-wire" style={{ left: `${craneX}%`, height: `${craneY + 8}%` }} />
          <div className={`crane-head ${isCatch ? 'crane-catch' : ''}`}
            style={{ left: `${craneX}%`, top: `${craneY}%`, transform: 'translateX(-50%)' }}>
            <svg viewBox="0 0 48 28" width="48" height="28">
              <rect x="12" y="0" width="24" height="12" rx="2" fill="#c0c0ff" />
              <line x1="16" y1="12" x2={grabbed ? '12' : '6'} y2="24" stroke="#a0a0e0" strokeWidth="3" strokeLinecap="round" />
              <line x1="24" y1="12" x2="24" y2="26" stroke="#a0a0e0" strokeWidth="3" strokeLinecap="round" />
              <line x1="32" y1="12" x2={grabbed ? '36' : '42'} y2="24" stroke="#a0a0e0" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          {!grabbed && (
            <>
              <div className="prize prize-1"><PrizeBlob color="#ff80b0" eyeColor="#ff4090" /></div>
              <div className="prize prize-2"><PrizeBlob color="#e060c0" eyeColor="#c050b0" /></div>
              <div className="prize prize-3"><PrizeBlob color="#ff9ad0" eyeColor="#ff60b8" small /></div>
            </>
          )}
          {grabbed && (
            <div className="prize prize-caught"><PrizeBlob color="#ff80b0" eyeColor="#ff4090" /></div>
          )}
          <div className="float-star s1">★</div>
          <div className="float-star s2">✦</div>
          <div className="float-star s3">★</div>
        </div>
        <div className="bottom-panel">
          <div className="screen-area">
            <div className="crt-screen">
              {state === STATES.ZOOMED      && <p>READY</p>}
              {state === STATES.CRANE_DOWN  && <p className="blink">LOWER...</p>}
              {state === STATES.CRANE_SWING && <p className="blink-fast">GRAB NOW!</p>}
              {state === STATES.CATCH       && <p>GOT IT! ♥</p>}
            </div>
          </div>
          <button
            className={`arcade-button ${state === STATES.CRANE_SWING ? 'button-pulse' : ''}`}
            onClick={onButtonPress}
            disabled={state === STATES.CRANE_DOWN || state === STATES.CATCH}
          >
            <span className="button-label">
              {state === STATES.ZOOMED ? '▼ DROP' : state === STATES.CRANE_SWING ? '✦ GRAB' : '●'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PrizeBlob({ color, eyeColor, small }) {
  const s = small ? 0.75 : 1;
  return (
    <svg viewBox="0 0 60 52" width={60 * s} height={52 * s}>
      <ellipse cx="30" cy="30" rx="26" ry="22" fill={color} />
      <circle cx="14" cy="16" r="8" fill={eyeColor} />
      <circle cx="46" cy="16" r="8" fill={eyeColor} />
      <circle cx="22" cy="26" r="4" fill="#1a0a2e" />
      <circle cx="38" cy="26" r="4" fill="#1a0a2e" />
      <circle cx="23" cy="25" r="1.5" fill="#fff" />
      <circle cx="39" cy="25" r="1.5" fill="#fff" />
      <path d="M24 35 Q30 40 36 35" stroke="#1a0a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="33" r="5" fill="#ff4090" opacity="0.5" />
      <circle cx="44" cy="33" r="5" fill="#ff4090" opacity="0.5" />
      <ellipse cx="20" cy="50" rx="8" ry="5" fill={eyeColor} />
      <ellipse cx="40" cy="50" rx="8" ry="5" fill={eyeColor} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Polaroid reveal
// ─────────────────────────────────────────────────────────────────
function Polaroid({ onReset, photo, quote }) {
  return (
    <div className="polaroid-scene">
      <div className="polaroid-wrapper">
        <div className="polaroid">
          <div className="polaroid-photo">
            <img src={photo} alt="sorry" className="polaroid-img" />
          </div>
          <div className="polaroid-caption">
            <p className="caption-text">{quote}</p>
          </div>
        </div>
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="confetti-star"
            style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 1}s`, fontSize: `${Math.random() * 10 + 8}px` }}>
            {['★', '✦', '♥', '✿'][i % 4]}
          </div>
        ))}
      </div>
      <button className="reset-button pixel-text" onClick={onReset}>↩ PLAY AGAIN</button>
    </div>
  );
}