import { useState, useRef, useEffect } from "react";

const CATEGORIES = [
  { id: "personal", label: "Personal Decisions", icon: "🪞", color: "#C4915E", personal: true },
  { id: "social", label: "Social Issues", icon: "⚖️", color: "#D4733C" },
  { id: "cultural", label: "Cultural Debates", icon: "🌍", color: "#8B6E4E" },
  { id: "ethical", label: "Ethical Dilemmas", icon: "🧭", color: "#5B7A5E" },
  { id: "political", label: "Policy & Politics", icon: "🏛️", color: "#6B5B8A" },
  { id: "tech", label: "Technology & Society", icon: "⚡", color: "#4A6B8A" },
  { id: "economic", label: "Economics & Inequality", icon: "📊", color: "#8A5B5B" },
];

const DIFFICULTY_LABELS = [
  { level: 1, name: "Foundation", desc: "Clear-cut scenarios to build confidence" },
  { level: 2, name: "Developing", desc: "Multiple valid perspectives emerge" },
  { level: 3, name: "Advanced", desc: "Deep tensions with no easy answers" },
  { level: 4, name: "Expert", desc: "Systemic complexity and real-world tradeoffs" },
];

const CT_COMPONENTS = [
  { id: "analysis", name: "Analysis", desc: "Breaking down complex situations into parts", icon: "◈" },
  { id: "evaluation", name: "Evaluation", desc: "Assessing evidence, assumptions & credibility", icon: "◇" },
  { id: "inference", name: "Inference", desc: "Drawing reasoned conclusions from evidence", icon: "△" },
  { id: "explanation", name: "Explanation", desc: "Articulating reasoning clearly to others", icon: "○" },
  { id: "self_regulation", name: "Self-Regulation", desc: "Examining your own biases and blind spots", icon: "◎" },
];

const BASE_SYSTEM_PROMPT = `You are a Socratic critical thinking coach. Your role is to help users develop stronger reasoning, argumentation, and analytical skills.

You internally use the 5 components of critical thinking to guide your coaching, but you NEVER label or name them during conversation. They should be invisible scaffolding:
- Analysis: Ask questions that make the user break down their situation into component parts
- Evaluation: Challenge their evidence, sources, and assumptions without telling them you're doing so
- Inference: Push them to draw conclusions and examine whether those conclusions actually follow from their evidence
- Explanation: Ask them to articulate WHY they think what they think — make them put fuzzy intuitions into clear words
- Self-Regulation: Gently surface their biases, emotional reasoning, and blind spots — this is the hardest one, handle with care but don't shy away from it

TONE:
- Warm but intellectually rigorous — non-negotiable
- You are a thinking partner, not a therapist and not a yes-man
- Never agree just to be nice. Never validate weak reasoning.
- When reasoning is strong, say so specifically and then push deeper
- When reasoning is weak, don't say "that's a great point" — instead ask the question that reveals the gap
- You can be direct. You can be uncomfortable. But always with warmth underneath.
- Never be condescending. Never lecture. Always question.

RULES:
- Never give your own opinion
- Never tell the user what to think or do
- Always end with exactly ONE targeted follow-up question
- Keep responses under 200 words
- Point out logical fallacies by asking questions, not by labeling them
- If someone is rationalizing, help them see it through questions, not accusations`;

const SCENARIO_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + `

You operate in these modes:

MODE: generate_scenario
When asked to generate a scenario, respond ONLY with a valid JSON object (no markdown, no backticks):
{"title":"<short title>","scenario":"<2-4 paragraph real-world scenario or dilemma>","opening_question":"<one thought-provoking question to start>","key_tensions":["<tension1>","<tension2>","<tension3>"]}

The scenario difficulty should match the level (1=straightforward, 2=nuanced, 3=deeply complex, 4=systemic/wicked problems).

MODE: coach
When coaching, respond conversationally. Keep responses under 200 words. Always end with exactly ONE targeted follow-up question.

MODE: evaluate
When asked to evaluate, respond ONLY with a valid JSON object (no markdown, no backticks):
{"strengths":["<strength1>","<strength2>"],"areas_to_improve":["<area1>","<area2>"],"critical_thinking_score":N,"reasoning":"<brief explanation of score>","component_scores":{"analysis":N,"evaluation":N,"inference":N,"explanation":N,"self_regulation":N},"next_level_ready":true/false}
Score each component 1-10. Be honest but encouraging. The component_scores should reflect how well the user demonstrated each component naturally throughout the conversation.`;

const PERSONAL_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + `

PERSONAL DECISIONS MODE:
You are helping someone think through a real personal decision or life situation. This is not hypothetical — it's their actual life.

Additional rules for personal mode:
- The stakes are real. Treat them that way.
- Don't be a therapist. Be a thinking partner who happens to care.
- It's okay to ask uncomfortable questions. In fact, it's your job. But signal that you know it's uncomfortable: "This might be a hard question, but..." or "I want to push on something here..."
- If someone is clearly rationalizing a decision they've already made, gently surface that pattern. Don't let them use you as a rubber stamp.
- If someone seems to be avoiding the real issue, notice it and name it as a question: "I notice you've talked a lot about X but haven't mentioned Y — is that deliberate?"
- Never say "that's totally valid" unless you can explain WHY it's valid
- Help them separate what they WANT to be true from what they have EVIDENCE for
- Ask about second-order consequences: "And if that happens, then what?"

MODE: personal_opening
When someone shares a personal situation, respond conversationally with warmth. Acknowledge what they've shared briefly, then ask ONE incisive opening question that starts to break down the situation. Keep it under 100 words.

MODE: coach
When coaching, respond conversationally. Keep responses under 200 words. Always end with exactly ONE targeted follow-up question.

MODE: evaluate
When asked to evaluate, respond ONLY with a valid JSON object (no markdown, no backticks):
{"strengths":["<strength1>","<strength2>"],"areas_to_improve":["<area1>","<area2>"],"critical_thinking_score":N,"reasoning":"<brief explanation of score>","component_scores":{"analysis":N,"evaluation":N,"inference":N,"explanation":N,"self_regulation":N},"next_level_ready":true/false,"personal_insight":"<one sentence observation about a pattern in how they approach personal decisions>"}
Score each component 1-10. Be honest but encouraging.`;

export default function CriticalThinkingCoach() {
  const [screen, setScreen] = useState("home");
  const [category, setCategory] = useState(null);
  const [difficulty, setDifficulty] = useState(1);
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [personalPrompt, setPersonalPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const personalInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (screen === "chat" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [screen, loading]);

  useEffect(() => {
    if (screen === "personal-entry" && personalInputRef.current) {
      personalInputRef.current.focus();
    }
  }, [screen]);

  const isPersonal = category?.personal;

  const callAPI = async (msgs, systemPrompt) => {
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt || (isPersonal ? PERSONAL_SYSTEM_PROMPT : SCENARIO_SYSTEM_PROMPT),
          messages: msgs,
        }),
      });
      const data = await res.json();
      return data.content?.map((b) => b.text || "").join("\n") || "";
    } catch (e) {
      return "I'm having trouble connecting. Please try again.";
    }
  };

  const startScenarioSession = async (cat) => {
    setCategory(cat);
    setScreen("chat");
    setMessages([]);
    setConversationHistory([]);
    setEvaluation(null);
    setLoading(true);
    setLoadingText("Crafting your scenario...");

    const userMsg = {
      role: "user",
      content: `MODE: generate_scenario\nCategory: ${cat.label}\nDifficulty: ${difficulty}\nGenerate a thought-provoking real-world scenario.`,
    };

    const response = await callAPI([userMsg], SCENARIO_SYSTEM_PROMPT);
    try {
      const parsed = JSON.parse(response.replace(/```json|```/g, "").trim());
      setScenario(parsed);
      const history = [userMsg, { role: "assistant", content: response }];
      setConversationHistory(history);
      setMessages([
        {
          role: "scenario",
          title: parsed.title,
          content: parsed.scenario,
          question: parsed.opening_question,
          tensions: parsed.key_tensions,
        },
      ]);
    } catch {
      setMessages([{ role: "assistant", content: "Something went wrong generating the scenario. Let me try again..." }]);
    }
    setLoading(false);
  };

  const startPersonalSession = async () => {
    if (!personalPrompt.trim()) return;
    const text = personalPrompt.trim();
    setScreen("chat");
    setMessages([]);
    setConversationHistory([]);
    setEvaluation(null);
    setLoading(true);
    setLoadingText("Taking this in...");
    setScenario({ title: "Personal Decision" });

    const userMsg = {
      role: "user",
      content: `MODE: personal_opening\nThe user has shared a personal situation they want to think through:\n\n"${text}"`,
    };

    const response = await callAPI([userMsg], PERSONAL_SYSTEM_PROMPT);
    const history = [userMsg, { role: "assistant", content: response }];
    setConversationHistory(history);
    setMessages([
      { role: "personal-context", content: text },
      { role: "assistant", content: response },
    ]);
    setLoading(false);
    setPersonalPrompt("");
  };

  const handleCategoryClick = (cat) => {
    if (cat.personal) {
      setCategory(cat);
      setScreen("personal-entry");
    } else {
      startScenarioSession(cat);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);
    setLoadingText("Thinking...");

    const sysPrompt = isPersonal ? PERSONAL_SYSTEM_PROMPT : SCENARIO_SYSTEM_PROMPT;
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: `MODE: coach\nUser's response: ${userText}` },
    ];

    const response = await callAPI(newHistory, sysPrompt);
    const updatedHistory = [...newHistory, { role: "assistant", content: response }];
    setConversationHistory(updatedHistory);
    setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const requestEvaluation = async () => {
    setLoading(true);
    setLoadingText("Evaluating your reasoning...");

    const sysPrompt = isPersonal ? PERSONAL_SYSTEM_PROMPT : SCENARIO_SYSTEM_PROMPT;
    const evalHistory = [
      ...conversationHistory,
      {
        role: "user",
        content: `MODE: evaluate\nEvaluate the user's critical thinking performance across this entire conversation. Assess each of the 5 components: analysis, evaluation, inference, explanation, and self-regulation. Be specific about what they did well and where they have room to grow.`,
      },
    ];

    const response = await callAPI(evalHistory, sysPrompt);
    try {
      const parsed = JSON.parse(response.replace(/```json|```/g, "").trim());
      setEvaluation(parsed);
      setSessionCount((c) => c + 1);
      if (parsed.next_level_ready && difficulty < 4) {
        setDifficulty((d) => d + 1);
      }
    } catch {
      setEvaluation({
        strengths: ["Engaged thoughtfully with the topic"],
        areas_to_improve: ["Continue developing your arguments"],
        critical_thinking_score: 5,
        reasoning: "Could not fully evaluate this session.",
        component_scores: { analysis: 5, evaluation: 5, inference: 5, explanation: 5, self_regulation: 5 },
        next_level_ready: false,
      });
    }
    setLoading(false);
    setScreen("results");
  };

  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Voice input isn't supported in this browser.");
      setTimeout(() => setMicError(""), 4000);
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    setMicError("");
    const recognition = new SpeechRecognition();
    // continuous:false works more reliably in Arc/Chromium variants
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) {
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
      }
    };

    recognition.onerror = (e) => {
      setIsRecording(false);
      recognitionRef.current = null;
      const errorMessages = {
        "not-allowed": "Microphone access denied. Allow mic access in Arc → Settings → Privacy.",
        "network": "Can't reach speech service. In Arc, go to Settings → Privacy and allow speech recognition.",
        "service-not-allowed": "Speech service blocked. Try: Arc menu → Settings → Privacy → allow microphone.",
        "no-speech": "No speech detected — try again.",
        "audio-capture": "Microphone not found. Check your mic is connected.",
        "aborted": "",
      };
      const msg = errorMessages[e.error] || `Voice error (${e.error}) — try again.`;
      if (msg) {
        setMicError(msg);
        setTimeout(() => setMicError(""), 6000);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 50);
    };

    try {
      recognition.start();
    } catch (err) {
      setIsRecording(false);
      setMicError("Could not start microphone. Check mic permissions in Arc.");
      setTimeout(() => setMicError(""), 5000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── HOME SCREEN ───
  if (screen === "home") {
    return (
      <div style={styles.container}>
        <div style={styles.homeInner}>
          <div style={styles.headerBlock}>
            <div style={styles.brandMark}>CT</div>
            <h1 style={styles.title}>Critical Thinking Coach</h1>
            <p style={styles.subtitle}>
              Sharpen your reasoning through real-world scenarios and personal decisions. No right answers — only better questions.
            </p>
          </div>

          <div style={styles.difficultySection}>
            <span style={styles.diffLabel}>Your Level</span>
            <div style={styles.diffPills}>
              {DIFFICULTY_LABELS.map((d) => (
                <button
                  key={d.level}
                  onClick={() => setDifficulty(d.level)}
                  style={{
                    ...styles.diffPill,
                    ...(difficulty === d.level ? styles.diffPillActive : {}),
                  }}
                >
                  <span style={styles.diffPillLevel}>{d.level}</span>
                  <span style={styles.diffPillName}>{d.name}</span>
                </button>
              ))}
            </div>
            <p style={styles.diffDesc}>
              {DIFFICULTY_LABELS.find((d) => d.level === difficulty)?.desc}
            </p>
          </div>

          <div style={styles.catSection}>
            <span style={styles.catLabel}>Choose a domain</span>
            <div style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  style={{
                    ...styles.catCard,
                    borderColor: cat.color + "44",
                    ...(cat.personal ? styles.personalCard : {}),
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = cat.color;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = cat.color + "44";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span style={styles.catIcon}>{cat.icon}</span>
                  <span style={styles.catName}>{cat.label}</span>
                  {cat.personal && <span style={styles.personalBadge}>Your life, your thinking</span>}
                </button>
              ))}
            </div>
          </div>

          {sessionCount > 0 && (
            <div style={styles.streak}>
              {sessionCount} session{sessionCount !== 1 ? "s" : ""} completed
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PERSONAL ENTRY SCREEN ───
  if (screen === "personal-entry") {
    return (
      <div style={styles.container}>
        <div style={styles.personalEntryInner}>
          <button onClick={() => setScreen("home")} style={styles.backBtn}>← Back</button>
          <div style={styles.personalEntryHeader}>
            <span style={{ fontSize: 36 }}>🪞</span>
            <h2 style={styles.personalEntryTitle}>What's on your mind?</h2>
            <p style={styles.personalEntryDesc}>
              Share a decision you're wrestling with, a crossroads you're at, or something you keep going back and forth on. Be as honest as you can — the more real you are, the more useful this will be.
            </p>
            <p style={styles.personalEntryNote}>
              This isn't therapy. It's a space to think out loud with something that will push back.
            </p>
          </div>
          <textarea
            ref={personalInputRef}
            value={personalPrompt}
            onChange={(e) => setPersonalPrompt(e.target.value)}
            placeholder="I'm trying to decide whether to... / I keep telling myself that... / I'm stuck on..."
            style={styles.personalTextarea}
            rows={6}
          />
          <button
            onClick={startPersonalSession}
            disabled={!personalPrompt.trim()}
            style={{
              ...styles.primaryBtn,
              opacity: personalPrompt.trim() ? 1 : 0.4,
              width: "100%",
              marginTop: 16,
            }}
          >
            Let's think this through
          </button>
        </div>
      </div>
    );
  }

  // ─── RESULTS SCREEN ───
  if (screen === "results" && evaluation) {
    const score = evaluation.critical_thinking_score;
    const pct = (score / 10) * 100;
    const cs = evaluation.component_scores || {};

    return (
      <div style={styles.container}>
        <div style={styles.resultsInner}>
          <h2 style={styles.resultsTitle}>Session Review</h2>
          <p style={styles.resultsScenario}>{scenario?.title}</p>

          <div style={styles.scoreRing}>
            <svg viewBox="0 0 120 120" style={{ width: 140, height: 140 }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#2a2a2a" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={score >= 7 ? "#5B7A5E" : score >= 4 ? "#D4733C" : "#8A5B5B"}
                strokeWidth="8"
                strokeDasharray={`${(pct / 100) * 327} 327`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
              <text x="60" y="56" textAnchor="middle" style={{ fill: "#e8e0d4", fontSize: 32, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {score}
              </text>
              <text x="60" y="74" textAnchor="middle" style={{ fill: "#8a8078", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                out of 10
              </text>
            </svg>
          </div>

          <div style={styles.componentSection}>
            <h3 style={styles.evalHeading}>The 5 Components — How You Did</h3>
            <p style={styles.componentIntro}>These were working invisibly throughout our conversation. Here's where you naturally showed up strongest — and where there's room to grow.</p>
            {CT_COMPONENTS.map((comp) => {
              const val = cs[comp.id] || 5;
              const barColor = val >= 7 ? "#5B7A5E" : val >= 4 ? "#D4733C" : "#8A5B5B";
              return (
                <div key={comp.id} style={styles.componentRow}>
                  <div style={styles.componentHeader}>
                    <span style={styles.componentIcon}>{comp.icon}</span>
                    <span style={styles.componentName}>{comp.name}</span>
                    <span style={{ ...styles.componentScore, color: barColor }}>{val}/10</span>
                  </div>
                  <div style={styles.componentBarBg}>
                    <div style={{ ...styles.componentBarFill, width: `${val * 10}%`, background: barColor }} />
                  </div>
                  <p style={styles.componentDesc}>{comp.desc}</p>
                </div>
              );
            })}
          </div>

          <div style={styles.evalSection}>
            <h3 style={styles.evalHeading}>Strengths</h3>
            {evaluation.strengths.map((s, i) => (
              <div key={i} style={styles.evalItem}>
                <span style={{ color: "#5B7A5E" }}>✦</span> {s}
              </div>
            ))}
          </div>

          <div style={styles.evalSection}>
            <h3 style={styles.evalHeading}>Areas to Develop</h3>
            {evaluation.areas_to_improve.map((a, i) => (
              <div key={i} style={styles.evalItem}>
                <span style={{ color: "#D4733C" }}>◆</span> {a}
              </div>
            ))}
          </div>

          <p style={styles.evalReasoning}>{evaluation.reasoning}</p>

          {evaluation.personal_insight && (
            <div style={styles.personalInsight}>
              <span style={styles.insightIcon}>🪞</span>
              <p style={styles.insightText}>{evaluation.personal_insight}</p>
            </div>
          )}

          {evaluation.next_level_ready && difficulty <= 4 && (
            <div style={styles.levelUp}>
              ↑ You've levelled up to {DIFFICULTY_LABELS.find((d) => d.level === difficulty)?.name}
            </div>
          )}

          <button onClick={() => setScreen("home")} style={styles.primaryBtn}>
            New Session
          </button>
        </div>
      </div>
    );
  }

  // ─── CHAT SCREEN ───
  return (
    <div style={styles.container}>
      <div style={styles.chatWrapper}>
        <div style={styles.chatHeader}>
          <button onClick={() => setScreen("home")} style={styles.backBtn}>← Back</button>
          <div style={styles.chatHeaderInfo}>
            <span style={{ fontSize: 14, color: "#8a8078" }}>{category?.icon} {category?.label}</span>
            {!isPersonal && (
              <span style={styles.levelBadge}>
                Level {difficulty} · {DIFFICULTY_LABELS.find((d) => d.level === difficulty)?.name}
              </span>
            )}
            {isPersonal && <span style={{ ...styles.levelBadge, color: "#C4915E" }}>Personal Mode</span>}
          </div>
          {messages.filter((m) => m.role === "user").length >= 2 && (
            <button onClick={requestEvaluation} style={styles.evalBtn} disabled={loading}>
              Evaluate Me
            </button>
          )}
        </div>

        <div style={styles.chatMessages}>
          {messages.map((msg, i) => {
            if (msg.role === "scenario") {
              return (
                <div key={i} style={styles.scenarioCard}>
                  <div style={styles.scenarioTag}>SCENARIO</div>
                  <h3 style={styles.scenarioTitle}>{msg.title}</h3>
                  <p style={styles.scenarioText}>{msg.content}</p>
                  {msg.tensions && (
                    <div style={styles.tensionBox}>
                      <span style={styles.tensionLabel}>Key tensions to consider:</span>
                      {msg.tensions.map((t, j) => (
                        <span key={j} style={styles.tensionChip}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div style={styles.openingQ}>
                    <span style={styles.qMark}>?</span>
                    {msg.question}
                  </div>
                </div>
              );
            }
            if (msg.role === "personal-context") {
              return (
                <div key={i} style={styles.personalContextCard}>
                  <div style={{ ...styles.scenarioTag, color: "#C4915E" }}>YOUR SITUATION</div>
                  <p style={styles.scenarioText}>{msg.content}</p>
                </div>
              );
            }
            if (msg.role === "user") {
              return (
                <div key={i} style={styles.userBubble}>
                  <div style={styles.userText}>{msg.content}</div>
                </div>
              );
            }
            return (
              <div key={i} style={styles.aiBubble}>
                <div style={styles.aiTag}>Coach</div>
                <div style={styles.aiText}>{msg.content}</div>
              </div>
            );
          })}
          {loading && (
            <div style={styles.aiBubble}>
              <div style={styles.loadingDots}>
                <span style={styles.loadDot1}>●</span>
                <span style={styles.loadDot2}>●</span>
                <span style={styles.loadDot3}>●</span>
                <span style={styles.loadingLabel}>{loadingText}</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {micError && (
          <div style={styles.micError}>{micError}</div>
        )}
        <div style={styles.inputBar}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening…" : (isPersonal ? "Think out loud..." : "Share your reasoning...")}
            style={{
              ...styles.textarea,
              borderColor: isRecording ? "#D4733C" : undefined,
              boxShadow: isRecording ? "0 0 0 2px #D4733C33" : undefined,
            }}
            rows={1}
            disabled={loading}
          />
          <button
            onClick={toggleRecording}
            disabled={loading}
            title={isRecording ? "Stop recording" : "Record voice"}
            style={{
              ...styles.micBtn,
              background: isRecording ? "#D4733C" : "#2e2a25",
              opacity: loading ? 0.4 : 1,
              animation: isRecording ? "micPulse 1.2s ease-in-out infinite" : "none",
            }}
          >
            {isRecording ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              ...styles.sendBtn,
              opacity: !input.trim() || loading ? 0.4 : 1,
            }}
          >
            →
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeDot1 { 0%,100%{opacity:.2} 33%{opacity:1} }
        @keyframes fadeDot2 { 0%,100%{opacity:.2} 50%{opacity:1} }
        @keyframes fadeDot3 { 0%,100%{opacity:.2} 66%{opacity:1} }
        @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 #D4733C55} 50%{box-shadow:0 0 0 6px #D4733C00} }
        textarea::placeholder { color: #5a5550; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #3a3530; border-radius: 4px; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#1a1714",
    color: "#e8e0d4",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  homeInner: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "48px 24px",
    width: "100%",
  },
  headerBlock: {
    textAlign: "center",
    marginBottom: 40,
  },
  brandMark: {
    display: "inline-block",
    width: 48,
    height: 48,
    lineHeight: "48px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #D4733C, #8B6E4E)",
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    fontSize: 20,
    color: "#fff",
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 32,
    fontWeight: 700,
    margin: "0 0 8px",
    letterSpacing: "-0.02em",
    color: "#e8e0d4",
  },
  subtitle: {
    fontSize: 15,
    color: "#8a8078",
    lineHeight: 1.6,
    margin: 0,
  },
  difficultySection: { marginBottom: 36 },
  diffLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6a6058",
    display: "block",
    marginBottom: 12,
  },
  diffPills: { display: "flex", gap: 8 },
  diffPill: {
    flex: 1,
    padding: "10px 8px",
    border: "1px solid #2a2520",
    borderRadius: 10,
    background: "transparent",
    color: "#8a8078",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  diffPillActive: {
    background: "#2a2520",
    borderColor: "#D4733C",
    color: "#e8e0d4",
  },
  diffPillLevel: {
    fontSize: 18,
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
  },
  diffPillName: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  diffDesc: {
    fontSize: 13,
    color: "#6a6058",
    marginTop: 10,
    textAlign: "center",
  },
  catSection: { marginBottom: 24 },
  catLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6a6058",
    display: "block",
    marginBottom: 12,
  },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  catCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    border: "1px solid #2a2520",
    borderRadius: 12,
    background: "transparent",
    color: "#e8e0d4",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.25s",
    fontSize: 14,
    position: "relative",
  },
  personalCard: {
    gridColumn: "1 / -1",
    background: "#22201c",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "18px 20px",
  },
  personalBadge: {
    fontSize: 11,
    color: "#8a8078",
    fontStyle: "italic",
  },
  catIcon: { fontSize: 20 },
  catName: { fontSize: 13, fontWeight: 500 },
  streak: {
    textAlign: "center",
    fontSize: 12,
    color: "#5B7A5E",
    marginTop: 8,
  },
  personalEntryInner: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "32px 24px",
    width: "100%",
  },
  personalEntryHeader: {
    textAlign: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  personalEntryTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 26,
    fontWeight: 600,
    margin: "16px 0 12px",
    color: "#e8e0d4",
  },
  personalEntryDesc: {
    fontSize: 14,
    color: "#8a8078",
    lineHeight: 1.7,
    margin: "0 0 12px",
  },
  personalEntryNote: {
    fontSize: 12,
    color: "#5a5550",
    fontStyle: "italic",
    margin: 0,
  },
  personalTextarea: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: 14,
    border: "1px solid #2e2a25",
    background: "#22201c",
    color: "#e8e0d4",
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    resize: "vertical",
    outline: "none",
    lineHeight: 1.6,
    minHeight: 140,
  },
  chatWrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: 720,
    margin: "0 auto",
    width: "100%",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderBottom: "1px solid #2a2520",
    flexShrink: 0,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#8a8078",
    cursor: "pointer",
    fontSize: 14,
    padding: "4px 0",
    fontFamily: "'DM Sans', sans-serif",
  },
  chatHeaderInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  levelBadge: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#D4733C",
  },
  evalBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "1px solid #D4733C",
    background: "transparent",
    color: "#D4733C",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
  },
  chatMessages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 20px 8px",
  },
  scenarioCard: {
    background: "#22201c",
    border: "1px solid #2e2a25",
    borderRadius: 14,
    padding: "24px 20px",
    marginBottom: 20,
  },
  personalContextCard: {
    background: "#22201c",
    border: "1px solid #C4915E33",
    borderRadius: 14,
    padding: "20px 20px",
    marginBottom: 20,
  },
  scenarioTag: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#D4733C",
    marginBottom: 10,
    fontWeight: 600,
  },
  scenarioTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 20,
    margin: "0 0 12px",
    fontWeight: 600,
    color: "#e8e0d4",
  },
  scenarioText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#b0a898",
    margin: "0 0 16px",
    whiteSpace: "pre-wrap",
  },
  tensionBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    marginBottom: 16,
  },
  tensionLabel: {
    fontSize: 11,
    color: "#6a6058",
    width: "100%",
    marginBottom: 4,
  },
  tensionChip: {
    fontSize: 11,
    padding: "4px 10px",
    background: "#1a1714",
    border: "1px solid #2e2a25",
    borderRadius: 20,
    color: "#8a8078",
  },
  openingQ: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 15,
    color: "#e8e0d4",
    fontFamily: "'Playfair Display', Georgia, serif",
    fontStyle: "italic",
    lineHeight: 1.5,
    padding: "12px 0 0",
    borderTop: "1px solid #2e2a25",
  },
  qMark: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "#D4733C22",
    color: "#D4733C",
    fontSize: 14,
    fontStyle: "normal",
    flexShrink: 0,
    marginTop: 2,
  },
  userBubble: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  userText: {
    background: "#2e2a25",
    padding: "12px 16px",
    borderRadius: "14px 14px 4px 14px",
    maxWidth: "80%",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#e8e0d4",
  },
  aiBubble: { marginBottom: 16 },
  aiTag: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#5B7A5E",
    marginBottom: 6,
    fontWeight: 600,
  },
  aiText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#b0a898",
    maxWidth: "85%",
    whiteSpace: "pre-wrap",
  },
  loadingDots: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    color: "#6a6058",
    fontSize: 14,
  },
  loadDot1: { animation: "fadeDot1 1.2s infinite", fontSize: 10 },
  loadDot2: { animation: "fadeDot2 1.2s infinite", fontSize: 10 },
  loadDot3: { animation: "fadeDot3 1.2s infinite", fontSize: 10 },
  loadingLabel: { fontSize: 12, marginLeft: 8, color: "#5a5550" },
  inputBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "12px 20px 20px",
    borderTop: "1px solid #2a2520",
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #2e2a25",
    background: "#22201c",
    color: "#e8e0d4",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    resize: "none",
    outline: "none",
    lineHeight: 1.5,
    maxHeight: 120,
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "none",
    color: "#e8e0d4",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  micError: {
    fontSize: 12,
    color: "#D4733C",
    padding: "6px 20px 2px",
    textAlign: "center",
    lineHeight: 1.5,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "#D4733C",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  resultsInner: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "48px 24px",
    textAlign: "center",
  },
  resultsTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 28,
    fontWeight: 700,
    margin: "0 0 6px",
    color: "#e8e0d4",
  },
  resultsScenario: {
    fontSize: 13,
    color: "#6a6058",
    marginBottom: 32,
  },
  scoreRing: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 32,
  },
  componentSection: {
    textAlign: "left",
    marginBottom: 28,
    padding: "20px",
    background: "#22201c",
    borderRadius: 14,
    border: "1px solid #2e2a25",
  },
  componentIntro: {
    fontSize: 13,
    color: "#6a6058",
    lineHeight: 1.6,
    marginTop: 4,
    marginBottom: 20,
  },
  componentRow: { marginBottom: 16 },
  componentHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  componentIcon: { fontSize: 12, color: "#6a6058" },
  componentName: { fontSize: 13, fontWeight: 600, color: "#e8e0d4", flex: 1 },
  componentScore: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  componentBarBg: {
    height: 4,
    background: "#2a2520",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  componentBarFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.8s ease",
  },
  componentDesc: { fontSize: 11, color: "#5a5550", margin: 0 },
  evalSection: { textAlign: "left", marginBottom: 24 },
  evalHeading: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6a6058",
    marginBottom: 10,
  },
  evalItem: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#b0a898",
    marginBottom: 6,
    display: "flex",
    gap: 8,
  },
  evalReasoning: {
    fontSize: 13,
    color: "#6a6058",
    lineHeight: 1.6,
    fontStyle: "italic",
    borderTop: "1px solid #2a2520",
    paddingTop: 16,
    marginBottom: 24,
    textAlign: "left",
  },
  personalInsight: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: "16px 18px",
    background: "#C4915E11",
    border: "1px solid #C4915E33",
    borderRadius: 12,
    marginBottom: 24,
    textAlign: "left",
  },
  insightIcon: { fontSize: 20, flexShrink: 0, marginTop: 2 },
  insightText: {
    fontSize: 13,
    color: "#C4915E",
    lineHeight: 1.6,
    margin: 0,
    fontStyle: "italic",
  },
  levelUp: {
    padding: "12px 20px",
    background: "#5B7A5E22",
    border: "1px solid #5B7A5E44",
    borderRadius: 10,
    color: "#5B7A5E",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 24,
  },
  primaryBtn: {
    padding: "14px 40px",
    borderRadius: 12,
    border: "none",
    background: "#D4733C",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
};
