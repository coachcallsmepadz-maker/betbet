import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Settings,
  Search,
  Zap,
  Activity,
  AlertTriangle,
  Plus,
  X,
  ChevronRight,
  TrendingUp,
  Dna,
  ShieldCheck,
  Target,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';

// --- CONSTANTS & MOCK DATA ---
const apiKey = ""; // Gemini API Key

const SPORTS = [
  { id: 'nba', name: 'NBA', icon: '🏀' },
  { id: 'nfl', name: 'NFL', icon: '🏈' },
  { id: 'epl', name: 'Premier League', icon: '⚽' },
  { id: 'mlb', name: 'MLB', icon: '⚾' },
  { id: 'laliga', name: 'La Liga', icon: '⚽' },
];

const TEAMS = [
  { name: 'Antigravity Default', primary: '#00F2FF', secondary: '#FF3131', sport: 'all' },
  { name: 'LA Lakers', primary: '#552583', secondary: '#FDB927', sport: 'nba' },
  { name: 'Boston Celtics', primary: '#007A33', secondary: '#BA9653', sport: 'nba' },
  { name: 'GS Warriors', primary: '#1D428A', secondary: '#FFC72C', sport: 'nba' },
  { name: 'Dallas Cowboys', primary: '#003594', secondary: '#869397', sport: 'nfl' },
  { name: 'KC Chiefs', primary: '#E31837', secondary: '#FFB81C', sport: 'nfl' },
  { name: 'Man City', primary: '#6CABDD', secondary: '#FFFFFF', sport: 'epl' },
  { name: 'Arsenal', primary: '#EF0107', secondary: '#FFFFFF', sport: 'epl' },
  { name: 'Real Madrid', primary: '#FEBE10', secondary: '#00529F', sport: 'laliga' },
  { name: 'NY Yankees', primary: '#003087', secondary: '#E31837', sport: 'mlb' },
];

const MOCK_GAMES = {
  nba: [
    { id: 1, home: 'LA Lakers', away: 'GS Warriors', odds: [1.85, 2.05], time: 'LIVE IN 2H', venue: 'CRYPTO.COM ARENA' },
    { id: 2, home: 'Boston Celtics', away: 'Miami Heat', odds: [1.45, 2.85], time: 'LIVE IN 5H', venue: 'TD GARDEN' },
  ],
  nfl: [
    { id: 3, home: 'Dallas Cowboys', away: 'NY Giants', odds: [1.35, 3.40], time: 'SUN 8:00PM', venue: 'AT&T STADIUM' },
  ],
  epl: [
    { id: 4, home: 'Man City', away: 'Arsenal', odds: [1.95, 3.80], time: 'SAT 12:30PM', venue: 'ETIHAD STADIUM' },
  ]
};

// --- API INTEGRATION (Gemini 2.5 Flash) ---
const fetchSportsData = async (gameInfo, key) => {
  if (!key) {
    // Fallback if no key is provided
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          injuries: ["LeBron James (Active)", "Stephen Curry (Active)", "Kevon Looney (GTD)"],
          venueHistory: "Lakers have won 65% of H2H matchups at Crypto.com Arena since 2022.",
          currentForm: "Warriors are 4-1 in their last 5 games; Lakers are 3-2.",
          gravityScore: 78
        });
      }, 1500);
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`;

  const prompt = `Analyze the sports game: ${gameInfo.home} vs ${gameInfo.away} at ${gameInfo.venue}. 
  Find real-time:
  1. Injury List (active/out/GTD).
  2. Arena/Matchup History at ${gameInfo.venue}.
  3. Current Form (last 5 games).
  Calculate a percentage "Gravity Score" (Confidence score) for the Home Team win.
  Respond ONLY as a JSON object: { "injuries": ["list"], "venueHistory": "string", "currentForm": "string", "gravityScore": number }`;

  const performFetch = async (retries = 5, backoff = 1000) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }]
        })
      });
      if (!response.ok) throw new Error("API Failure");
      const result = await response.json();
      const content = result.candidates[0].content.parts[0].text;
      return JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));
    } catch (err) {
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, backoff));
      return performFetch(retries - 1, backoff * 2);
    }
  };

  return performFetch();
};

const App = () => {
  const [selectedSport, setSelectedSport] = useState('nba');
  const [theme, setTheme] = useState(TEAMS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [parlay, setParlay] = useState([]);
  const [targetOdds, setTargetOdds] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--team-primary', theme.primary);
    document.documentElement.style.setProperty('--team-secondary', theme.secondary);
  }, [theme]);

  const totalOddsString = useMemo(() => {
    if (parlay.length === 0) return (1.00).toFixed(2);
    return parlay.reduce((acc, leg) => acc * leg.odds, 1).toFixed(2);
  }, [parlay]);

  const addLeg = (leg) => {
    if (!parlay.find(l => l.id === leg.id)) {
      setParlay([...parlay, leg]);
    }
  };

  const removeLeg = (id) => setParlay(parlay.filter(l => l.id !== id));

  const runAnalysis = async (game) => {
    setIsAnalyzing(game.id);
    setAnalysisResult(null);
    try {
      const data = await fetchSportsData(game, apiKey);
      setAnalysisResult({ ...data, gameId: game.id });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(null);
    }
  };

  const generateEdge = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const target = parseFloat(targetOdds) || 5.0;
      const mockResult = [
        { id: 101, team: 'Lakers', market: 'Moneyline', odds: 1.85, score: 82 },
        { id: 102, team: 'Celtics', market: 'Over 220.5', odds: 1.91, score: 75 },
        { id: 103, team: 'Man City', market: 'Win', odds: 1.45, score: 91 },
      ];
      setParlay(mockResult);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[var(--team-primary)]/30 overflow-hidden relative">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.8; filter: brightness(1.5) drop-shadow(0 0 10px var(--team-primary)); }
        }
        .scanline {
          width: 100%;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--team-primary), transparent);
          position: absolute;
          top: 0;
          z-index: 10;
          pointer-events: none;
          animation: scan 4s linear infinite;
        }
        .slanted {
          clip-path: polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%);
        }
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .text-glow {
          text-shadow: 0 0 15px var(--team-primary);
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="scanline"></div>

      {/* Background Portal Glow */}
      <div
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] blur-[150px] rounded-full -z-10"
        style={{ backgroundColor: `${theme.primary}11`, animation: 'pulse-glow 4s infinite' }}
      ></div>

      {/* Header */}
      <header className="border-b border-white/5 px-8 py-5 flex justify-between items-center backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => window.location.reload()}>
            <div
              className="w-12 h-12 bg-black border-2 flex items-center justify-center rotate-45 group-hover:rotate-[225deg] transition-all duration-700"
              style={{ borderColor: theme.primary }}
            >
              <Trophy
                className="-rotate-45 group-hover:-rotate-[225deg] transition-all duration-700"
                size={24}
                style={{ color: theme.primary }}
              />
            </div>
            <div
              className="absolute -inset-1 blur opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: `${theme.primary}33` }}
            ></div>
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              Antigravity<span style={{ color: theme.primary }}>.Multi</span>
            </h1>
            <div className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase mt-1">Grounded Intelligence Engine</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-none transition-all group"
          >
            <Settings size={20} className="text-white/60 group-hover:rotate-90 transition-all" style={{ color: theme.primary }} />
          </button>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] h-[calc(100vh-89px)]">

        {/* Main Feed Area */}
        <section className="p-8 overflow-y-auto border-r border-white/5">

          {/* Sport Selection Hub */}
          <div className="flex gap-4 mb-10 overflow-x-auto pb-4">
            {SPORTS.map(sport => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={`flex items-center gap-3 px-8 py-4 slanted transition-all duration-500 min-w-[160px] relative group ${selectedSport === sport.id
                    ? 'text-black font-black scale-105'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                style={selectedSport === sport.id ? { backgroundColor: theme.primary, boxShadow: `0 0 20px ${theme.primary}55` } : {}}
              >
                <span className="text-xl">{sport.icon}</span>
                <span className="uppercase text-xs tracking-[0.2em] font-bold">{sport.name}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* AI Control Center */}
            <div className="space-y-8">
              <div className="glass p-10 relative overflow-hidden group">
                <div
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
                  style={{ backgroundColor: theme.primary }}
                ></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4" style={{ color: theme.primary }}>
                    <Activity size={18} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Multi-Gen Active</span>
                  </div>
                  <h2 className="text-5xl font-black italic uppercase leading-none tracking-tighter mb-6">
                    Target the <span className="text-glow" style={{ color: theme.primary }}>Value Gap</span>
                  </h2>
                  <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-sm font-medium">
                    Input your desired multiplier. AI scans real-time injury logs and venue metrics to reach your target odds.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 bg-black border border-white/10 flex items-center p-1 focus-within:border-white/30 transition-colors">
                      <Target className="ml-5" size={20} style={{ color: theme.primary }} />
                      <input
                        type="text"
                        placeholder="Target Odds (e.g. 5.0)"
                        value={targetOdds}
                        onChange={(e) => setTargetOdds(e.target.value)}
                        className="bg-transparent border-none outline-none px-5 py-4 text-xl font-bold w-full placeholder:text-white/10 focus:ring-0"
                      />
                    </div>
                    <button
                      onClick={generateEdge}
                      disabled={isGenerating}
                      className="bg-white text-black font-black uppercase tracking-tighter px-10 py-5 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
                      style={{ backgroundColor: isGenerating ? '#333' : theme.primary }}
                    >
                      {isGenerating ? (
                        <Dna className="animate-spin" size={24} />
                      ) : (
                        <>
                          <TrendingUp size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          <span>Generate Edge</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Analysis Display */}
              {analysisResult && (
                <div className="glass p-8 border-l-4 animate-in fade-in slide-in-from-left-4 duration-500" style={{ borderLeftColor: theme.primary }}>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: theme.primary }}>Grounded Deep-Dive Result</h4>
                    <div className="px-3 py-1 text-[10px] font-black italic" style={{ backgroundColor: `${theme.primary}22`, color: theme.primary }}>ID: {analysisResult.gameId}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={14} className="text-red-500" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Injury Protocol</span>
                        </div>
                        <ul className="text-xs font-bold space-y-1">
                          {analysisResult.injuries.map((injury, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                              {injury}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Activity size={14} style={{ color: theme.primary }} />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Current Form</span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed">{analysisResult.currentForm}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={14} style={{ color: theme.primary }} />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Arena Dynamics</span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed">{analysisResult.venueHistory}</p>
                      </div>
                      <div className="bg-white/5 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Confidence Score</div>
                        <div className="text-4xl font-black italic" style={{ color: theme.primary }}>{analysisResult.gravityScore}%</div>
                        <div className="absolute bottom-0 left-0 h-[2px] w-full" style={{ backgroundColor: `${theme.primary}44` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Board */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white/60">
                  <LayoutDashboard size={14} />
                  Live Board
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-bold" style={{ color: theme.primary }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }}></div>
                  REAL-TIME SYNC
                </div>
              </div>

              {(MOCK_GAMES[selectedSport] || []).map(game => (
                <div key={game.id} className="glass p-6 group hover:border-white/20 transition-all border-l-2 border-l-transparent hover:border-l-[var(--team-primary)]" style={{ borderLeftColor: theme.primary }}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between group/row">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center font-black group-hover/row:border-white/20 transition-colors">
                            {game.home[0]}
                          </div>
                          <span className="font-black italic uppercase tracking-tighter text-lg">{game.home}</span>
                        </div>
                        <span className="text-xs font-mono text-white/30">{game.odds[0]}</span>
                      </div>
                      <div className="flex items-center justify-between group/row">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center font-black group-hover/row:border-white/20 transition-colors">
                            {game.away[0]}
                          </div>
                          <span className="font-black italic uppercase tracking-tighter text-lg">{game.away}</span>
                        </div>
                        <span className="text-xs font-mono text-white/30">{game.odds[1]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="text-[10px] font-bold tracking-widest text-white/30 truncate max-w-[150px]">
                      {game.venue}
                    </div>
                    <div className="text-[10px] font-black" style={{ color: theme.primary }}>
                      {game.time}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => runAnalysis(game)}
                      disabled={isAnalyzing === game.id}
                      className="flex-1 bg-white/5 border border-white/10 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-colors flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {isAnalyzing === game.id ? <Activity className="animate-pulse" style={{ color: theme.primary }} size={16} /> : <Search size={16} />}
                      Deep Dive
                    </button>
                    <button
                      onClick={() => addLeg({ id: game.id, team: game.home, market: 'Moneyline', odds: game.odds[0], score: 85 })}
                      className="px-6 bg-white/5 border border-white/10 hover:text-black transition-all flex items-center justify-center active:scale-90"
                      style={{ hoverBackgroundColor: theme.primary }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = theme.primary}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sidebar / Multi-Slip */}
        <aside className="bg-white/[0.01] p-8 flex flex-col h-full border-l border-white/5 shadow-2xl relative">
          <div
            className="absolute top-0 right-0 w-full h-[1px]"
            style={{ backgroundImage: `linear-gradient(to right, transparent, ${theme.primary}55, transparent)` }}
          ></div>

          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <Zap style={{ color: theme.primary }} size={20} strokeWidth={3} />
              <h3 className="font-black italic uppercase tracking-tighter text-2xl">
                Multi-Builder
              </h3>
            </div>
            <div className="bg-white/5 px-3 py-1 border border-white/10 text-[10px] font-black tracking-widest">
              {parlay.length} SELECTIONS
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pb-10">
            {parlay.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-none group hover:border-white/10 transition-colors">
                <div className="w-16 h-16 bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Plus size={32} className="text-white/10" />
                </div>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/20">Awaiting Selections</p>
              </div>
            ) : (
              parlay.map(leg => (
                <div key={leg.id} className="bg-black border border-white/5 p-6 relative group hover:border-white/20 transition-all border-l-4" style={{ borderLeftColor: theme.primary }}>
                  <button
                    onClick={() => removeLeg(leg.id)}
                    className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors z-20"
                  >
                    <X size={16} />
                  </button>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black italic uppercase text-lg leading-none mb-1" style={{ color: theme.primary }}>{leg.team}</h4>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em]">{leg.market}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black italic tracking-tighter">{leg.odds.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black italic leading-none">{leg.score}%</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Gravity</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-50">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`w-1 h-3 ${i <= (leg.score / 20) ? 'bg-white' : 'bg-white/10'}`} style={i <= (leg.score / 20) ? { backgroundColor: theme.primary } : {}}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Totals */}
          <div className="mt-auto border-t border-white/10 pt-8 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Combined Multi Odds</p>
                <div className="text-4xl font-black italic tracking-tighter leading-none text-glow" style={{ color: theme.primary }}>{totalOddsString}</div>
              </div>
            </div>

            <div className="bg-white/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} style={{ color: theme.primary }} />
                <div className="leading-none">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1">Risk Assessment</div>
                  <div className="text-xs font-bold text-white/60 uppercase">Physics Validated</div>
                </div>
              </div>
              <div className="text-2xl font-black italic" style={{ color: theme.primary }}>
                {parlay.length > 0 ? (parlay.reduce((acc, l) => acc + l.score, 0) / parlay.length).toFixed(0) : 0}%
              </div>
            </div>

            <button
              className="w-full text-black py-5 font-black italic uppercase tracking-tighter text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl group relative overflow-hidden"
              disabled={parlay.length === 0}
              style={{ backgroundColor: theme.primary, boxShadow: `0 15px 40px -10px ${theme.primary}66` }}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <Zap size={20} fill="currentColor" />
                Lock In Protocol
              </span>
            </button>
          </div>
        </aside>
      </main>

      {/* Settings Tray */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setShowSettings(false)}></div>
          <div className="w-full max-w-2xl glass p-10 relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] -z-10 opacity-20" style={{ backgroundColor: theme.primary }}></div>

            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
              <div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Vanity <span style={{ color: theme.primary }}>Protocol</span></h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Holographic UI Customization</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="bg-white/5 hover:bg-white/10 p-3 rounded-none border border-white/10 transition-all hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-6 block">Select Influence Profile</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-4">
                  {TEAMS.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTheme(t)}
                      className={`flex flex-col items-start gap-4 p-5 border-2 transition-all duration-300 relative group ${theme.name === t.name
                          ? 'bg-white/5 border-white'
                          : 'bg-black/40 border-white/5 hover:border-white/20'
                        }`}
                      style={theme.name === t.name ? { borderColor: theme.primary } : {}}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div
                          className="w-5 h-5 rounded-none border border-white/20"
                          style={{ backgroundColor: t.primary, boxShadow: `0 0 15px ${t.primary}55` }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: t.secondary }}
                        ></div>
                      </div>
                      <span className="font-black italic uppercase text-[10px] tracking-widest text-left leading-tight">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 border border-white/10 bg-white/5 rounded-none relative">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: theme.primary }}></div>
                <div className="flex items-center gap-3 mb-3" style={{ color: theme.primary }}>
                  <ShieldCheck size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronization Notice</span>
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                  Applying a team profile will recalibrate the holographic light-field and accent nodes.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-10 text-black py-5 font-black uppercase tracking-tighter text-lg hover:brightness-110 transition-all shadow-2xl"
              style={{ backgroundColor: theme.primary }}
            >
              Initialize Profile Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
