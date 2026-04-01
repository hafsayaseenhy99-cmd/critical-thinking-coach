import { useState, useRef, useEffect } from "react";
import "./App.css";

const API_URL = "/api";

const CATEGORIES = [
  "Social Issues",
  "Ethical Dilemmas",
  "Politics",
  "Technology",
  "Economics",
  "Cultural Debates",
];

function getCategoryIcon(cat) {
  const icons = {
    "Social Issues": "⚖️",
    "Ethical Dilemmas": "🤔",
    Politics: "🏛️",
    Technology: "💻",
    Economics: "📊",
    "Cultural Debates": "🌍",
  };
  return icons[cat] || "📝";
}

function App() {
  const [level, setLevel] = useState(1);
  const [sessionCount, setSessionCount] = useState(0);
  const [phase, setPhase] = useState("home");
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startSession = async (category) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/scenario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, difficulty: level }),
      });
      const data = await res.json();
      setScenario(data);
      setMessages([]);
      setExchangeCount(0);
      setEvaluation(null);
      setPhase("chatting");
      if (data.question) {
        setMessages([{ role: "assistant", content: data.question }]);
      }
    } catch {
      alert("Failed to start session. Is the server running?");
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setExchangeCount((c) => c + 1);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          scenario: scenario.scenario,
          difficulty: level,
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.response }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I had trouble responding. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const requestEvaluation = async () => {
    setPhase("evaluating");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          scenario: scenario.scenario,
          difficulty: level,
        }),
      });
      const data = await res.json();
      setEvaluation(data.evaluation);
      setSessionCount((c) => c + 1);
      if (data.evaluation.score >= 7 && level < 4) {
        setLevel((l) => l + 1);
      }
      setPhase("results");
    } catch {
      alert("Failed to get evaluation.");
      setPhase("chatting");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (phase === "home") {
    return (
      <div className="app">
        <div className="home">
          <div className="hero">
            <div className="logo">🧠</div>
            <h1>Critical Thinking Coach</h1>
            <p className="subtitle">
              Sharpen your reasoning through Socratic dialogue. No opinions — just
              questions that challenge you to think deeper.
            </p>
          </div>

          <div className="stats-bar">
            <div className="stat">
              <span className="stat-label">Level</span>
              <span className="stat-value">{level}/4</span>
            </div>
            <div className="stat">
              <span className="stat-label">Sessions</span>
              <span className="stat-value">{sessionCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Difficulty</span>
              <div className="difficulty-dots">
                {[1, 2, 3, 4].map((d) => (
                  <span key={d} className={`dot ${d <= level ? "active" : ""}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="level-adjuster">
            <span>Adjust Level:</span>
            <div className="level-buttons">
              {[1, 2, 3, 4].map((l) => (
                <button
                  key={l}
                  className={`level-btn ${l === level ? "active" : ""}`}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <h2 className="pick-heading">Pick a Category</h2>
          <div className="categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className="category-card"
                onClick={() => startSession(cat)}
                disabled={loading}
              >
                <span className="cat-icon">{getCategoryIcon(cat)}</span>
                <span className="cat-name">{cat}</span>
              </button>
            ))}
            <button
              className="category-card random"
              onClick={() => startSession(null)}
              disabled={loading}
            >
              <span className="cat-icon">🎲</span>
              <span className="cat-name">Surprise Me</span>
            </button>
          </div>

          {loading && <div className="loader">Generating scenario...</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-layout">
        <header className="chat-header">
          <button className="back-btn" onClick={() => setPhase("home")}>
            ← Back
          </button>
          <div className="header-info">
            <span className="header-category">
              {getCategoryIcon(scenario?.category)} {scenario?.category}
            </span>
            <span className="header-level">Level {level}</span>
          </div>
          <div className="header-actions">
            {exchangeCount >= 3 && phase === "chatting" && (
              <button className="eval-btn" onClick={requestEvaluation}>
                Get Evaluation
              </button>
            )}
          </div>
        </header>

        <div className="chat-body">
          {scenario && (
            <div className="scenario-banner">
              <div className="scenario-label">Scenario</div>
              <p>{scenario.scenario}</p>
            </div>
          )}

          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === "assistant" ? "🧠" : "💬"}
                </div>
                <div className="message-bubble">
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && phase === "chatting" && (
              <div className="message assistant">
                <div className="message-avatar">🧠</div>
                <div className="message-bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            {phase === "evaluating" && (
              <div className="evaluating-banner">
                <div className="loader">Analyzing your reasoning...</div>
              </div>
            )}

            {phase === "results" && evaluation && (
              <div className="evaluation-card">
                <h3>Evaluation Results</h3>
                <div className="score-ring">
                  <div className="score-number">{evaluation.score}</div>
                  <div className="score-label">/ 10</div>
                </div>
                <p className="eval-summary">{evaluation.summary}</p>

                <div className="eval-section">
                  <h4>Strengths</h4>
                  <ul>
                    {evaluation.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="eval-section improvements">
                  <h4>Areas to Improve</h4>
                  <ul>
                    {evaluation.improvements?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                {evaluation.score >= 7 && level <= 4 && (
                  <div className="level-up">
                    Great work! You've leveled up to Level {level}!
                  </div>
                )}

                <button className="new-session-btn" onClick={() => setPhase("home")}>
                  Start New Session
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {phase === "chatting" && (
          <div className="chat-input-area">
            {exchangeCount < 3 && (
              <div className="exchange-hint">
                {3 - exchangeCount} more exchange{3 - exchangeCount !== 1 ? "s" : ""} before
                evaluation is available
              </div>
            )}
            <div className="input-row">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thinking..."
                rows={2}
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={!input.trim() || loading}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
