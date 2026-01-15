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
  LayoutDashboard,
  RefreshCw,
  Calendar,
  Clock,
  Users,
  TrendingDown,
  Sparkles
} from 'lucide-react';

// --- API KEYS ---
const GEMINI_API_KEY = "AIzaSyBQVkejqgQKPykDd2nlNE8d2SW1guvHLcw"; // Your Gemini API Key
const ODDS_API_KEY = "e6ea43b0ec41228fa519a024a781d909"; // The Odds API Key (get free at https://the-odds-api.com)

// --- CONSTANTS ---
const SPORTS = [
  { id: 'basketball_nba', apiId: 'basketball_nba', name: 'NBA', icon: '🏀' },
  { id: 'americanfootball_nfl', apiId: 'americanfootball_nfl', name: 'NFL', icon: '🏈' },
  { id: 'soccer_epl', apiId: 'soccer_epl', name: 'Premier League', icon: '⚽' },
  { id: 'baseball_mlb', apiId: 'baseball_mlb', name: 'MLB', icon: '⚾' },
];

const TEAMS = [
  { name: 'Antigravity Default', primary: '#00F2FF', secondary: '#FF3131', sport: 'all' },
  { name: 'LA Lakers', primary: '#552583', secondary: '#FDB927', sport: 'basketball_nba' },
  { name: 'Boston Celtics', primary: '#007A33', secondary: '#BA9653', sport: 'basketball_nba' },
  { name: 'GS Warriors', primary: '#1D428A', secondary: '#FFC72C', sport: 'basketball_nba' },
  { name: 'Dallas Cowboys', primary: '#003594', secondary: '#869397', sport: 'americanfootball_nfl' },
  { name: 'KC Chiefs', primary: '#E31837', secondary: '#FFB81C', sport: 'americanfootball_nfl' },
  { name: 'Man City', primary: '#6CABDD', secondary: '#FFFFFF', sport: 'soccer_epl' },
  { name: 'Arsenal', primary: '#EF0107', secondary: '#FFFFFF', sport: 'soccer_epl' },
  { name: 'NY Yankees', primary: '#003087', secondary: '#E31837', sport: 'baseball_mlb' },
];

// Mock bet types for SGM builder
const BET_TYPES = {
  basketball_nba: [
    { id: 'player_points', label: 'Player Points', category: 'Player Props' },
    { id: 'player_rebounds', label: 'Player Rebounds', category: 'Player Props' },
    { id: 'player_assists', label: 'Player Assists', category: 'Player Props' },
    { id: 'team_total', label: 'Team Total Points', category: 'Team Props' },
    { id: 'spread', label: 'Point Spread', category: 'Game Lines' },
    { id: 'moneyline', label: 'Moneyline', category: 'Game Lines' },
  ],
  americanfootball_nfl: [
    { id: 'player_passing_yards', label: 'Passing Yards', category: 'Player Props' },
    { id: 'player_rushing_yards', label: 'Rushing Yards', category: 'Player Props' },
    { id: 'player_touchdowns', label: 'Touchdowns', category: 'Player Props' },
    { id: 'team_total', label: 'Team Total Points', category: 'Team Props' },
    { id: 'spread', label: 'Point Spread', category: 'Game Lines' },
  ],
};

// --- API FUNCTIONS ---

// Fetch tomorrow's games from The Odds API
const fetchTomorrowGames = async (sport, apiKey) => {
  if (!apiKey) {
    // Return mock data if no API key
    return getMockGames(sport);
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`
    );

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();

    // Filter for games in the next 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return data
      .filter(game => {
        const gameDate = new Date(game.commence_time);
        return gameDate >= now && gameDate <= sevenDaysFromNow;
      })
      .map(game => ({
        id: game.id,
        home: game.home_team,
        away: game.away_team,
        time: new Date(game.commence_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        date: new Date(game.commence_time).toLocaleDateString(),
        odds: game.bookmakers[0]?.markets.find(m => m.key === 'h2h')?.outcomes.map(o => o.price) || [1.90, 1.90],
        venue: 'TBD',
        sport: sport
      }));
  } catch (error) {
    console.error('Error fetching games:', error);
    return getMockGames(sport);
  }
};

// Mock games fallback
const getMockGames = (sport) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const mockData = {
    basketball_nba: [
      { id: 'nba1', home: 'LA Lakers', away: 'GS Warriors', odds: [1.85, 2.05], time: '7:30 PM', date: tomorrow.toLocaleDateString(), venue: 'CRYPTO.COM ARENA', sport: 'basketball_nba' },
      { id: 'nba2', home: 'Boston Celtics', away: 'Miami Heat', odds: [1.45, 2.85], time: '7:00 PM', date: tomorrow.toLocaleDateString(), venue: 'TD GARDEN', sport: 'basketball_nba' },
      { id: 'nba3', home: 'Phoenix Suns', away: 'Denver Nuggets', odds: [2.10, 1.78], time: '9:00 PM', date: tomorrow.toLocaleDateString(), venue: 'FOOTPRINT CENTER', sport: 'basketball_nba' },
    ],
    americanfootball_nfl: [
      { id: 'nfl1', home: 'Dallas Cowboys', away: 'NY Giants', odds: [1.35, 3.40], time: '8:00 PM', date: tomorrow.toLocaleDateString(), venue: 'AT&T STADIUM', sport: 'americanfootball_nfl' },
    ],
    soccer_epl: [
      { id: 'epl1', home: 'Man City', away: 'Arsenal', odds: [1.95, 3.80], time: '12:30 PM', date: tomorrow.toLocaleDateString(), venue: 'ETIHAD STADIUM', sport: 'soccer_epl' },
    ],
  };

  return mockData[sport] || [];
};

// AI-Powered Same Game Multi Generator
const generateSameGameMulti = async (game, targetOdds, apiKey) => {
  if (!apiKey) {
    // Return mock SGM if no API key
    return getMockSGM(game, targetOdds);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const prompt = `You are a professional sports betting analyst. Analyze this upcoming game and generate a Same Game Multi (SGM) parlay.

**Game Details:**
- Sport: ${game.sport}
- Matchup: ${game.home} (Home) vs ${game.away} (Away)
- Venue: ${game.venue}
- Date/Time: ${game.date} at ${game.time}
- Current Moneyline Odds: Home ${game.odds[0]}, Away ${game.odds[1]}

**Target:** Generate a same-game multi with total odds close to ${targetOdds || '5.0'}.

**Research Required (use Google Search):**
1. **Player Performance Analysis:**
   - Find key players for both teams
   - Historical stats of these players against this specific opponent
   - Recent form (last 5 games)
   - Arena-specific performance if playing at ${game.venue}

2. **Team Trends:**
   - Recent scoring averages
   - Pace of play
   - Defensive ratings
   - Head-to-head history

3. **Matchup Factors:**
   - Current injuries or lineup changes
   - Rest days between games
   - Home/away splits

4. **Correlation Analysis:**
   - Identify positively correlated bets (e.g., high team total + player over props)
   - Avoid negatively correlated bets

**Output Format (JSON only, no markdown):**
{
  "suggestedBets": [
    {
      "type": "player_points",
      "player": "Player Name",
      "team": "Team Name",
      "line": 25.5,
      "selection": "over",
      "odds": 1.91,
      "confidence": 78,
      "reasoning": "Brief explanation"
    }
  ],
  "totalOdds": 5.2,
  "gravityScore": 72,
  "correlationWarnings": [],
  "overallReasoning": "Why these bets work together as a SGM"
}

Respond with ONLY valid JSON, no additional text.`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) throw new Error('Gemini API failed');

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating SGM:', error);
    return getMockSGM(game, targetOdds);
  }
};

// Mock SGM fallback
const getMockSGM = (game, targetOdds) => {
  const target = parseFloat(targetOdds) || 5.0;
  return {
    suggestedBets: [
      {
        type: 'player_points',
        player: 'LeBron James',
        team: game.home,
        line: 25.5,
        selection: 'over',
        odds: 1.85,
        confidence: 82,
        reasoning: 'Averaging 27.5 PPG in last 5 games vs this opponent'
      },
      {
        type: 'team_total',
        player: null,
        team: game.home,
        line: 112.5,
        selection: 'over',
        odds: 1.91,
        confidence: 75,
        reasoning: 'Team averaging 115 PPG at home this season'
      },
      {
        type: 'player_assists',
        player: 'Stephen Curry',
        team: game.away,
        line: 6.5,
        selection: 'over',
        odds: 1.83,
        confidence: 79,
        reasoning: 'Historic success in this arena (7.2 APG average)'
      }
    ],
    totalOdds: (1.85 * 1.91 * 1.83).toFixed(2),
    gravityScore: 79,
    correlationWarnings: ['Home team total and home player points are positively correlated - good!'],
    overallReasoning: 'This SGM targets a high-scoring game with strong individual performances from key players who have historical success in this matchup.'
  };
};

// --- MAIN COMPONENT ---

const App = () => {
  const [selectedSport, setSelectedSport] = useState('basketball_nba');
  const [theme, setTheme] = useState(TEAMS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showSGMBuilder, setShowSGMBuilder] = useState(false);
  const [targetSGMOdds, setTargetSGMOdds] = useState('5.0');
  const [generatingSGM, setGeneratingSGM] = useState(false);
  const [sgmResult, setSgmResult] = useState(null);
  const [parlay, setParlay] = useState([]);

  // Theme engine
  useEffect(() => {
    document.documentElement.style.setProperty('--team-primary', theme.primary);
    document.documentElement.style.setProperty('--team-secondary', theme.secondary);
  }, [theme]);

  // Fetch games on sport change
  useEffect(() => {
    loadGames();
  }, [selectedSport]);

  const loadGames = async () => {
    setLoadingGames(true);
    const gamesData = await fetchTomorrowGames(selectedSport, ODDS_API_KEY);
    setGames(gamesData);
    setLoadingGames(false);
  };

  const openSGMBuilder = (game) => {
    setSelectedGame(game);
    setShowSGMBuilder(true);
    setSgmResult(null);
  };

  const generateSGM = async () => {
    setGeneratingSGM(true);
    const result = await generateSameGameMulti(selectedGame, targetSGMOdds, GEMINI_API_KEY);
    setSgmResult(result);
    setGeneratingSGM(false);
  };

  const addSGMToSlip = () => {
    if (sgmResult && sgmResult.suggestedBets) {
      const sgmLegs = sgmResult.suggestedBets.map((bet, idx) => ({
        id: `${selectedGame.id}_${idx}`,
        team: bet.team,
        player: bet.player,
        market: `${bet.player || bet.team} ${bet.type.replace('_', ' ')} ${bet.selection} ${bet.line}`,
        odds: bet.odds,
        score: bet.confidence
      }));
      setParlay([...parlay, ...sgmLegs]);
      setShowSGMBuilder(false);
    }
  };

  const totalOdds = useMemo(() => {
    if (parlay.length === 0) return (1.00).toFixed(2);
    return parlay.reduce((acc, leg) => acc * leg.odds, 1).toFixed(2);
  }, [parlay]);

  const removeLeg = (id) => setParlay(parlay.filter(l => l.id !== id));

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
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar-thumb { background: var(--team-primary); }
      `}</style>

      <div className="scanline"></div>

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
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              Antigravity<span style={{ color: theme.primary }}>.SGM</span>
            </h1>
            <div className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase mt-1">Same Game Multi Intelligence</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={loadGames}
            disabled={loadingGames}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <RefreshCw size={14} className={loadingGames ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <Settings size={20} style={{ color: theme.primary }} />
          </button>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] h-[calc(100vh-89px)]">

        {/* Games Feed */}
        <section className="p-8 overflow-y-auto border-r border-white/5">

          {/* Sport Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
            {SPORTS.map(sport => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={`flex items-center gap-3 px-8 py-4 slanted transition-all duration-500 min-w-[180px] ${selectedSport === sport.id ? 'text-black font-black scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                style={selectedSport === sport.id ? { backgroundColor: theme.primary } : {}}
              >
                <span className="text-xl">{sport.icon}</span>
                <span className="uppercase text-xs tracking-[0.2em] font-bold">{sport.name}</span>
              </button>
            ))}
          </div>

          {/* Upcoming Games Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar size={20} style={{ color: theme.primary }} />
              <h2 className="text-xl font-black italic uppercase">Upcoming Games</h2>
            </div>
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest">
              {games.length} {games.length === 1 ? 'Game' : 'Games'} Scheduled
            </div>
          </div>

          {/* Games List */}
          <div className="space-y-4">
            {loadingGames ? (
              <div className="glass p-12 flex flex-col items-center justify-center">
                <Dna className="animate-spin mb-4" size={32} style={{ color: theme.primary }} />
                <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Loading Games...</p>
              </div>
            ) : games.length === 0 ? (
              <div className="glass p-12 flex flex-col items-center justify-center">
                <AlertTriangle size={32} className="text-white/20 mb-4" />
                <p className="text-sm font-bold text-white/40 uppercase tracking-widest">No Games Tomorrow</p>
              </div>
            ) : (
              games.map(game => (
                <div key={game.id} className="glass p-6 hover:border-white/20 transition-all border-l-4 group" style={{ borderLeftColor: theme.primary }}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center font-black">
                            {game.home[0]}
                          </div>
                          <span className="font-black italic uppercase text-lg">{game.home}</span>
                        </div>
                        <span className="text-xs font-mono text-white/40">{game.odds[0]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center font-black">
                            {game.away[0]}
                          </div>
                          <span className="font-black italic uppercase text-lg">{game.away}</span>
                        </div>
                        <span className="text-xs font-mono text-white/40">{game.odds[1]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-2">
                        <Calendar size={12} />
                        {game.date}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={12} />
                        {game.time}
                      </span>
                    </div>
                    <span className="truncate max-w-[200px]">{game.venue}</span>
                  </div>

                  <button
                    onClick={() => openSGMBuilder(game)}
                    className="w-full py-4 font-black uppercase tracking-tighter text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: theme.primary, color: '#000' }}
                  >
                    <Sparkles size={18} fill="currentColor" />
                    Build Same Game Multi
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Parlay Sidebar */}
        <aside className="bg-white/[0.01] p-8 flex flex-col h-full border-l border-white/5 overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <Zap style={{ color: theme.primary }} size={20} strokeWidth={3} />
              <h3 className="font-black italic uppercase tracking-tighter text-2xl">Multi-Builder</h3>
            </div>
            <div className="bg-white/5 px-3 py-1 border border-white/10 text-[10px] font-black">
              {parlay.length} LEGS
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pb-10">
            {parlay.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center border-2 border-dashed border-white/5">
                <Plus size={32} className="text-white/10 mb-4" />
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/20">Build Your SGM</p>
              </div>
            ) : (
              parlay.map(leg => (
                <div key={leg.id} className="bg-black border border-white/5 p-6 group hover:border-white/20 transition-all border-l-4 relative" style={{ borderLeftColor: theme.primary }}>
                  <button
                    onClick={() => removeLeg(leg.id)}
                    className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>

                  <div>
                    <h4 className="font-black italic uppercase text-sm leading-none mb-2" style={{ color: theme.primary }}>
                      {leg.player || leg.team}
                    </h4>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-3">{leg.market}</p>

                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black">{leg.score}%</span>
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">Confidence</span>
                      </div>
                      <div className="text-lg font-black italic">{leg.odds.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto border-t border-white/10 pt-8 space-y-6">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Total Odds</p>
              <div className="text-4xl font-black italic" style={{ color: theme.primary }}>{totalOdds}</div>
            </div>

            <button
              className="w-full py-5 font-black italic uppercase text-xl transition-all hover:scale-[1.02] disabled:opacity-30"
              disabled={parlay.length === 0}
              style={{ backgroundColor: theme.primary, color: '#000' }}
            >
              <span className="flex items-center justify-center gap-3">
                <Zap size={20} fill="currentColor" />
                Lock In Multi
              </span>
            </button>
          </div>
        </aside>
      </main>

      {/* SGM Builder Modal */}
      {showSGMBuilder && selectedGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setShowSGMBuilder(false)}></div>
          <div className="w-full max-w-4xl glass p-10 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">

            <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
              <div>
                <h3 className="text-3xl font-black italic uppercase mb-2">
                  Same Game <span style={{ color: theme.primary }}>Multi Builder</span>
                </h3>
                <p className="text-sm text-white/40 font-bold uppercase tracking-widest">
                  {selectedGame.home} vs {selectedGame.away}
                </p>
              </div>
              <button
                onClick={() => setShowSGMBuilder(false)}
                className="bg-white/5 hover:bg-white/10 p-3 border border-white/10 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Target Odds Input */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 block">
                Target Total Odds
              </label>
              <div className="flex gap-4">
                <div className="flex-1 bg-black border border-white/10 flex items-center p-1">
                  <Target className="ml-5" size={20} style={{ color: theme.primary }} />
                  <input
                    type="text"
                    placeholder="e.g. 5.0"
                    value={targetSGMOdds}
                    onChange={(e) => setTargetSGMOdds(e.target.value)}
                    className="bg-transparent border-none outline-none px-5 py-4 text-xl font-bold w-full"
                  />
                </div>
                <button
                  onClick={generateSGM}
                  disabled={generatingSGM}
                  className="px-10 py-5 font-black uppercase tracking-tighter flex items-center gap-3 transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{ backgroundColor: theme.primary, color: '#000' }}
                >
                  {generatingSGM ? (
                    <Dna className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Sparkles size={24} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SGM Result */}
            {sgmResult && (
              <div className="space-y-6">
                <div className="glass p-6 border-l-4" style={{ borderLeftColor: theme.primary }}>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: theme.primary }}>
                      AI-Generated Same Game Multi
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Total Odds</div>
                        <div className="text-2xl font-black italic">{sgmResult.totalOdds}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">Gravity Score</div>
                        <div className="text-2xl font-black italic" style={{ color: theme.primary }}>{sgmResult.gravityScore}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Individual Bets */}
                  <div className="space-y-3 mb-6">
                    {sgmResult.suggestedBets.map((bet, idx) => (
                      <div key={idx} className="bg-black/40 p-4 border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-black uppercase text-sm" style={{ color: theme.primary }}>
                              {bet.player || bet.team}
                            </h5>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">
                              {bet.type.replace('_', ' ')} {bet.selection} {bet.line}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black">{bet.odds}</div>
                            <div className="text-[10px] text-white/40">{bet.confidence}% conf.</div>
                          </div>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">{bet.reasoning}</p>
                      </div>
                    ))}
                  </div>

                  {/* Overall Reasoning */}
                  <div className="bg-white/5 p-4 border border-white/10">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Analysis</h5>
                    <p className="text-sm text-white/80 leading-relaxed">{sgmResult.overallReasoning}</p>
                  </div>

                  {/* Correlation Warnings */}
                  {sgmResult.correlationWarnings && sgmResult.correlationWarnings.length > 0 && (
                    <div className="mt-4 p-4 border border-green-500/20 bg-green-500/5">
                      <div className="flex items-center gap-2 text-green-500 mb-2">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Correlation Check</span>
                      </div>
                      {sgmResult.correlationWarnings.map((warning, idx) => (
                        <p key={idx} className="text-xs text-white/60">{warning}</p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={addSGMToSlip}
                    className="w-full mt-6 py-4 font-black uppercase tracking-tighter text-lg transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: theme.primary, color: '#000' }}
                  >
                    Add to Multi-Builder
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setShowSettings(false)}></div>
          <div className="w-full max-w-2xl glass p-10 relative">
            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
              <h3 className="text-3xl font-black italic uppercase">
                Vanity <span style={{ color: theme.primary }}>Protocol</span>
              </h3>
              <button onClick={() => setShowSettings(false)} className="bg-white/5 p-3 border border-white/10">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-4">
              {TEAMS.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => setTheme(t)}
                  className={`flex flex-col items-start gap-4 p-5 border-2 transition-all ${theme.name === t.name ? 'border-white' : 'border-white/5 hover:border-white/20'
                    }`}
                  style={theme.name === t.name ? { borderColor: theme.primary, backgroundColor: `${theme.primary}11` } : {}}
                >
                  <div className="flex justify-between items-center w-full">
                    <div
                      className="w-5 h-5 border border-white/20"
                      style={{ backgroundColor: t.primary }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.secondary }}
                    ></div>
                  </div>
                  <span className="font-black italic uppercase text-[10px] tracking-widest">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
