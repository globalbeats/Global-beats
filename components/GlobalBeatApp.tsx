"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { tracks, vibePresets } from "@/lib/demo-data";
import type { Plan, Track, VibeRequest } from "@/lib/types";

const themes: Record<string, { a: string; b: string; glow: string; label: string }> = {
  driving: { a: "#6d28ff", b: "#ff3d8d", glow: "rgba(109,40,255,.36)", label: "Night Drive" },
  workout: { a: "#ff3326", b: "#ff9d00", glow: "rgba(255,51,38,.34)", label: "Power Mode" },
  study: { a: "#176b87", b: "#64ccc5", glow: "rgba(23,107,135,.32)", label: "Deep Focus" },
  party: { a: "#ff16c7", b: "#6548ff", glow: "rgba(255,22,199,.32)", label: "After Hours" },
  relax: { a: "#275d55", b: "#86b9b0", glow: "rgba(39,93,85,.32)", label: "Soft Space" },
  morning: { a: "#ff8c24", b: "#ffd45a", glow: "rgba(255,140,36,.3)", label: "Golden Start" }
};

function scoreTrack(track: Track, req: VibeRequest) {
  let score = 0;
  if (track.activity.includes(req.activity)) score += 45;
  if (track.mood.includes(req.mood.toLowerCase())) score += 28;
  score += Math.max(0, 20 - Math.abs(track.energy - req.energy) / 3);
  if (req.language === "Any" || track.language === req.language) score += 12;
  if (req.region === "Global" || track.region === req.region || track.region === "Global") score += 8;
  return score;
}

export default function GlobalBeatApp() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [activity, setActivity] = useState("driving");
  const [mood, setMood] = useState("confident");
  const [energy, setEnergy] = useState(78);
  const [language, setLanguage] = useState("Any");
  const [region, setRegion] = useState("Global");
  const [prompt, setPrompt] = useState("");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<Track>(tracks[0]);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiNote, setAiNote] = useState("Built for a confident drive with steady energy and a smooth finish.");
  const [queue, setQueue] = useState<Track[]>(tracks);
  const [showPricing, setShowPricing] = useState(false);
  const [toast, setToast] = useState("");

  const theme = themes[activity] ?? themes.driving;

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-a", theme.a);
    document.documentElement.style.setProperty("--accent-b", theme.b);
    document.documentElement.style.setProperty("--accent-glow", theme.glow);
  }, [theme]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing, current]);

  const visibleTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return queue.filter((track) => {
      const unlocked = plan === "premium" || !track.premiumOnly;
      const matched = !q || [track.title, track.artist, track.genre, track.language, track.region].join(" ").toLowerCase().includes(q);
      return unlocked && matched;
    });
  }, [plan, query, queue]);

  async function createVibe(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    const body: VibeRequest = { activity, mood, energy, language, region, prompt };

    try {
      const response = await fetch("/api/ai-vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error("AI service unavailable");
      const data = await response.json();
      const ids: string[] = data.trackIds ?? [];
      const recommended = ids.map((id) => tracks.find((track) => track.id === id)).filter(Boolean) as Track[];
      const fallback = [...tracks].sort((a, b) => scoreTrack(b, body) - scoreTrack(a, body));
      const merged = [...recommended, ...fallback.filter((t) => !recommended.some((r) => r.id === t.id))];
      setQueue(merged);
      setAiNote(data.explanation || "Your vibe has been shaped into a fresh queue.");
      const firstUnlocked = merged.find((track) => plan === "premium" || !track.premiumOnly);
      if (firstUnlocked) setCurrent(firstUnlocked);
      setToast("Your AI vibe is ready");
    } catch {
      const fallback = [...tracks].sort((a, b) => scoreTrack(b, body) - scoreTrack(a, body));
      setQueue(fallback);
      setCurrent(fallback[0]);
      setAiNote("I matched the activity, energy, language and mood locally so the experience still responds instantly.");
      setToast("Vibe created in instant mode");
    } finally {
      setLoading(false);
      window.setTimeout(() => setToast(""), 2200);
    }
  }

  function selectTrack(track: Track) {
    if (track.premiumOnly && plan !== "premium") {
      setShowPricing(true);
      return;
    }
    setCurrent(track);
    setPlaying(true);
  }

  function nextTrack() {
    const unlocked = queue.filter((track) => plan === "premium" || !track.premiumOnly);
    const index = unlocked.findIndex((track) => track.id === current.id);
    setCurrent(unlocked[(index + 1) % unlocked.length] ?? unlocked[0]);
    setPlaying(true);
  }

  async function startPremium() {
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else {
        setPlan("premium");
        setShowPricing(false);
        setToast("Premium demo unlocked");
      }
    } catch {
      setPlan("premium");
      setShowPricing(false);
      setToast("Premium demo unlocked");
    }
  }

  return (
    <main className="app-shell">
      <audio ref={audioRef} src={current.audioUrl} onEnded={nextTrack} preload="metadata" />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar glass">
        <a className="brand" href="#top" aria-label="GlobalBeat home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>GlobalBeat</span>
        </a>
        <nav className="desktop-nav">
          <a href="#discover">Discover</a>
          <a href="#vibe">AI Vibe</a>
          <a href="#library">Library</a>
        </nav>
        <div className="top-actions">
          <button className="plan-pill" onClick={() => setShowPricing(true)}>{plan === "premium" ? "Premium" : "Free plan"}</button>
          <a className="avatar" href="/auth" aria-label="Account">AS</a>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <span className="eyebrow">AI music that understands the moment</span>
          <h1>Your world.<br /><span>Your vibe.</span></h1>
          <p>Choose what you are doing, how you feel and how much energy you want. GlobalBeat shapes the sound and the interface around you.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#vibe">Build my vibe <span>→</span></a>
            <button className="secondary-button" onClick={() => selectTrack(current)}>{playing ? "Pause preview" : "Play preview"}</button>
          </div>
          <div className="trust-row">
            <span>Instant matching</span><span>Region-aware</span><span>Artist-first</span>
          </div>
        </div>

        <div className="hero-player glass">
          <div className="hero-cover" style={{ background: current.cover }}>
            <span className="cover-tag">{theme.label}</span>
            <div className="cover-orbit" />
            <div className="cover-title">{current.title}</div>
          </div>
          <div className="hero-player-info">
            <div>
              <strong>{current.title}</strong>
              <span>{current.artist} · {current.genre}</span>
            </div>
            <button className="round-play" onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ" : "▶"}</button>
          </div>
          <div className="waveform" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => <i key={i} style={{ height: `${20 + ((i * 17) % 65)}%` }} />)}
          </div>
        </div>
      </section>

      <section id="vibe" className="section vibe-section">
        <div className="section-heading">
          <div><span className="eyebrow">Vibe intelligence</span><h2>Tell the music where you are.</h2></div>
          <p>The AI endpoint responds with a structured queue. When no API key is configured, the app automatically uses its fast local matching engine.</p>
        </div>

        <div className="vibe-grid">
          <form className="vibe-builder glass" onSubmit={createVibe}>
            <label className="field-label">What are you doing?</label>
            <div className="preset-grid">
              {vibePresets.map((preset) => (
                <button type="button" key={preset.id} className={`preset ${activity === preset.id ? "active" : ""}`} onClick={() => setActivity(preset.id)}>
                  <span>{preset.icon}</span><strong>{preset.label}</strong><small>{preset.description}</small>
                </button>
              ))}
            </div>

            <div className="form-row">
              <label>Mood<input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="confident, calm, romantic..." /></label>
              <label>Language<select value={language} onChange={(e) => setLanguage(e.target.value)}><option>Any</option><option>Punjabi</option><option>English</option><option>Spanish</option><option>Instrumental</option></select></label>
              <label>Region<select value={region} onChange={(e) => setRegion(e.target.value)}><option>Global</option><option>Canada</option><option>Punjab</option><option>USA</option><option>Latin America</option><option>West Africa</option></select></label>
            </div>

            <label className="energy-field">Energy <span>{energy}%</span><input type="range" min="0" max="100" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} /></label>
            <label className="prompt-field">Anything else?<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Example: I am driving at night and want Punjabi songs that feel powerful but not too aggressive." /></label>
            <button className="primary-button full" disabled={loading}>{loading ? "Reading your vibe…" : "Create my AI mix"}</button>
          </form>

          <aside className="ai-result glass">
            <span className="ai-badge">GB AI</span>
            <h3>{theme.label}</h3>
            <p>{aiNote}</p>
            <div className="metric"><span>Energy match</span><strong>{energy}%</strong></div>
            <div className="metric"><span>Context</span><strong>{activity}</strong></div>
            <div className="metric"><span>Language</span><strong>{language}</strong></div>
            <div className="palette-preview"><i style={{ background: theme.a }} /><i style={{ background: theme.b }} /><span>The surface changes with your vibe</span></div>
          </aside>
        </div>
      </section>

      <section id="discover" className="section discover-section">
        <div className="section-heading compact">
          <div><span className="eyebrow">Made for this moment</span><h2>Your current queue</h2></div>
          <div className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search songs, artists, regions..." /></div>
        </div>

        <div className="track-grid">
          {visibleTracks.map((track, index) => (
            <article className={`track-card ${current.id === track.id ? "current" : ""}`} key={track.id} onClick={() => selectTrack(track)}>
              <div className="track-cover" style={{ background: track.cover }}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <button aria-label={`Play ${track.title}`}>▶</button>
                {track.premiumOnly && <b>PREMIUM</b>}
              </div>
              <strong>{track.title}</strong>
              <span>{track.artist}</span>
              <small>{track.genre} · {track.region}</small>
            </article>
          ))}
        </div>
      </section>

      <section id="library" className="section pricing-section">
        <div className="pricing-copy"><span className="eyebrow">Listen your way</span><h2>Free when you need it.<br />Premium when you want more.</h2></div>
        <div className="plans">
          <article className="plan-card glass"><span>FREE</span><h3>$0</h3><p>Ad-supported discovery for everyone.</p><ul><li>AI vibe mixes</li><li>Regional catalogue access</li><li>Standard audio</li><li>Limited skips</li></ul><button onClick={() => setPlan("free")}>Use free</button></article>
          <article className="plan-card premium-card"><span>PREMIUM</span><h3>$9.99 <small>/ month</small></h3><p>Full control, no interruptions.</p><ul><li>Ad-free listening</li><li>Unlimited skips</li><li>High-quality audio</li><li>Offline-ready architecture</li></ul><button onClick={startPremium}>Start premium</button></article>
        </div>
      </section>

      <footer><a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><span>GlobalBeat</span></a><p>Built for licensed music, independent artists and region-aware distribution.</p><div><a href="/admin">Admin</a><a href="/auth">Artist sign in</a></div></footer>

      <div className="sticky-player glass">
        <div className="mini-cover" style={{ background: current.cover }} />
        <div className="sticky-title"><strong>{current.title}</strong><span>{current.artist}</span></div>
        <div className="sticky-controls"><button onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ" : "▶"}</button><button onClick={nextTrack}>›</button></div>
        <div className="sticky-vibe"><span>{theme.label}</span><i style={{ background: theme.a }} /></div>
      </div>

      {showPricing && <div className="modal-backdrop" onClick={() => setShowPricing(false)}><div className="modal glass" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowPricing(false)}>×</button><span className="eyebrow">Unlock every track</span><h2>GlobalBeat Premium</h2><p>Ad-free playback, unlimited skips, premium tracks and higher audio quality.</p><button className="primary-button full" onClick={startPremium}>Continue to premium</button><button className="text-button" onClick={() => setShowPricing(false)}>Stay on free</button></div></div>}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
