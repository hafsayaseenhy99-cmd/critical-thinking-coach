import { useState, useRef, useEffect, useCallback } from "react";

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

const SPEAK_WORDS = [
  "Silence","Ambition","Patience","Regret","Courage","Tradition","Failure","Trust",
  "Boundaries","Loyalty","Change","Comfort","Risk","Honesty","Growth","Freedom",
  "Responsibility","Kindness","Sacrifice","Power","Empathy","Identity","Justice",
  "Fear","Legacy","Simplicity","Curiosity","Home","Time","Purpose","Conflict",
  "Compromise","Authenticity","Discipline","Vulnerability","Perspective","Gratitude",
  "Resilience","Influence","Balance","Doubt","Integrity","Progress","Community",
  "Solitude","Forgiveness","Consistency","Pressure","Creativity","Accountability",
  "Belonging","Standards","Obsession","Privilege","Uncertainty","Respect","Urgency",
  "Nostalgia","Control","Intention","Perception","Worth","Habit","Conviction",
  "Adaptation","Generosity","Ego","Opportunity","Exhaustion","Clarity","Attachment",
];

const SKILL_MAP = [
  {
    id:"analysis",name:"Analysis",icon:"◈",color:"#4A6B8A",
    oneLiner:"Taking things apart to understand them better.",
    everyday:"When your friend says \"my job is terrible,\" analysis is asking: what specifically is terrible? The pay? The people? The work itself? The commute? You can't fix \"terrible\" — but you can fix a specific thing.",
    subskills:[
      {name:"Spotting the pieces",desc:"Breaking a big messy situation into smaller, clearer parts",unlock:1},
      {name:"Finding what's connected",desc:"Seeing how one part of a situation affects another",unlock:2},
      {name:"Separating fact from feeling",desc:"Noticing when you're describing what happened vs. how it made you feel",unlock:3},
      {name:"Seeing the system",desc:"Understanding the bigger forces shaping a situation — not just the surface",unlock:4},
    ],
  },
  {
    id:"evaluation",name:"Evaluation",icon:"◇",color:"#D4733C",
    oneLiner:"Figuring out what's actually true vs. what just sounds true.",
    everyday:"Your uncle shares a health article on WhatsApp. Evaluation is asking: who wrote this? Is it a doctor or a blog? Does it cite studies? Does the headline match what the article actually says? Most people skip this step — that's how misinformation spreads.",
    subskills:[
      {name:"Questioning the source",desc:"Asking where information comes from before accepting it",unlock:1},
      {name:"Spotting assumptions",desc:"Noticing the things you're taking for granted without checking",unlock:2},
      {name:"Weighing evidence",desc:"Not all evidence is equal — learning to tell strong from weak",unlock:3},
      {name:"Challenging your own beliefs",desc:"Being willing to question things you've believed for a long time",unlock:4},
    ],
  },
  {
    id:"inference",name:"Inference",icon:"△",color:"#5B7A5E",
    oneLiner:"Drawing conclusions that actually follow from what you know.",
    everyday:"Your partner hasn't texted back in 3 hours. You conclude they're angry at you. But what do you actually know? That they haven't texted. Everything else is a story you're telling yourself. Inference is noticing the gap between what you know and what you're concluding.",
    subskills:[
      {name:"Following the thread",desc:"Making sure your conclusion actually connects to your evidence",unlock:1},
      {name:"Considering alternatives",desc:"Before landing on one explanation, asking: what else could explain this?",unlock:2},
      {name:"Thinking in consequences",desc:"If I do X, then what happens? And after that?",unlock:3},
      {name:"Holding uncertainty",desc:"Being okay with not knowing — and not rushing to a conclusion just because it feels better",unlock:4},
    ],
  },
  {
    id:"explanation",name:"Explanation",icon:"○",color:"#6B5B8A",
    oneLiner:"Saying what you actually mean — clearly enough that someone could disagree with you.",
    everyday:"\"I just feel like it's wrong\" isn't an explanation. \"I think it's wrong because it harms people who didn't consent\" is one. The difference? The second version gives someone something concrete to engage with. Vague feelings are hard to challenge — and that's exactly why people hide behind them.",
    subskills:[
      {name:"Putting it into words",desc:"Turning a gut feeling into a sentence someone else can understand",unlock:1},
      {name:"Showing your work",desc:"Explaining not just what you think, but why — step by step",unlock:2},
      {name:"Making the implicit explicit",desc:"Saying the thing you're thinking but haven't said out loud yet",unlock:3},
      {name:"Steelmanning",desc:"Explaining the strongest version of a position you disagree with",unlock:4},
    ],
  },
  {
    id:"self_regulation",name:"Self-Regulation",icon:"◎",color:"#8A5B5B",
    oneLiner:"Catching yourself in the act of fooling yourself.",
    everyday:"You're apartment hunting and you've already fallen in love with one place. Now you're finding reasons why the other options won't work. Self-regulation is the moment you pause and ask: am I evaluating these fairly, or am I building a case for the one I already want?",
    subskills:[
      {name:"Noticing your reactions",desc:"When something makes you defensive or uncomfortable, asking why",unlock:1},
      {name:"Catching confirmation bias",desc:"Noticing when you only look for evidence that supports what you already believe",unlock:2},
      {name:"Separating identity from ideas",desc:"Being able to change your mind without feeling like you're losing yourself",unlock:3},
      {name:"Knowing your patterns",desc:"Recognising the ways you consistently fool yourself — and watching for them",unlock:4},
    ],
  },
];

const CT_COMPONENTS = SKILL_MAP.map((s) => ({id:s.id,name:s.name,desc:s.oneLiner,icon:s.icon}));

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
Score each component 1-10. Be honest but encouraging.`;

const PERSONAL_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + `

PERSONAL DECISIONS MODE:
You are helping someone think through a real personal decision or life situation. This is not hypothetical — it's their actual life.

Additional rules for personal mode:
- The stakes are real. Treat them that way.
- Don't be a therapist. Be a thinking partner who happens to care.
- It's okay to ask uncomfortable questions. In fact, it's your job.
- If someone is clearly rationalizing, gently surface that pattern.
- Never say "that's totally valid" unless you can explain WHY it's valid
- Help them separate what they WANT to be true from what they have EVIDENCE for
- Ask about second-order consequences: "And if that happens, then what?"

MODE: personal_opening
When someone shares a personal situation, respond conversationally with warmth. Acknowledge briefly, then ask ONE incisive opening question. Keep it under 100 words.

MODE: coach
When coaching, respond conversationally. Keep responses under 200 words. Always end with exactly ONE targeted follow-up question.

MODE: evaluate
When asked to evaluate, respond ONLY with a valid JSON object (no markdown, no backticks):
{"strengths":["<strength1>","<strength2>"],"areas_to_improve":["<area1>","<area2>"],"critical_thinking_score":N,"reasoning":"<brief explanation of score>","component_scores":{"analysis":N,"evaluation":N,"inference":N,"explanation":N,"self_regulation":N},"next_level_ready":true/false,"personal_insight":"<one sentence observation about a pattern in how they approach personal decisions>"}
Score each component 1-10. Be honest but encouraging.`;

const SPEECH_EVAL_PROMPT = `You are a speaking coach evaluating a 1-minute impromptu speech. The user was given a random word and had to speak on it for one minute.

Evaluate their transcript and respond ONLY with a valid JSON object (no markdown, no backticks):
{
  "overall_score": N,
  "clarity": N,
  "structure": N,
  "depth": N,
  "filler_words_found": ["<word1>","<word2>"],
  "filler_count": N,
  "strengths": ["<strength1>","<strength2>"],
  "improvements": ["<improvement1>","<improvement2>"],
  "summary": "<2-3 sentence overall assessment — warm but honest. Note what worked and what to practice.>"
}

Score each metric 1-10. Be specific.
For filler_words_found, look for: um, uh, like (used as filler), you know, sort of, kind of, basically, actually (used as filler), right, so (at start of sentences repeatedly), I mean, well (as a staller), literally (misused).
Count each occurrence. Be thorough but fair.
For structure: did they have an opening thought, develop it, and close it?
For depth: did they go beyond the obvious?
For clarity: was each sentence understandable? Did ideas connect logically?`;

// ─── STORAGE (localStorage — no window.storage) ───
const loadProgress = () => {
  try { const r = localStorage.getItem("ct-progress"); return r ? JSON.parse(r) : null; } catch { return null; }
};
const saveProgress = (data) => {
  try { localStorage.setItem("ct-progress", JSON.stringify(data)); } catch {}
};

const DEFAULT_PROGRESS = {
  sessionCount:0, difficulty:1,
  bestScores:{analysis:0,evaluation:0,inference:0,explanation:0,self_regulation:0},
  avgScores:{analysis:0,evaluation:0,inference:0,explanation:0,self_regulation:0},
  history:[], speakSessions:0,
};

export default function CriticalThinkingCoach() {
  const [screen, setScreen] = useState("home");
  const [category, setCategory] = useState(null);
  const [difficulty, setDifficulty] = useState(1);
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [personalPrompt, setPersonalPrompt] = useState("");
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [expandedSkill, setExpandedSkill] = useState(null);
  const [speakWord, setSpeakWord] = useState("");
  const [speakPhase, setSpeakPhase] = useState("ready");
  const [speakTime, setSpeakTime] = useState(60);
  const [speakCountdown, setSpeakCountdown] = useState(3);
  const [speakTranscript, setSpeakTranscript] = useState("");
  const [speakEval, setSpeakEval] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [manualTranscript, setManualTranscript] = useState("");

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const personalInputRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    const saved = loadProgress();
    if (saved) { setProgress(saved); setDifficulty(saved.difficulty || 1); }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSpeechSupported(false);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, loading]);
  useEffect(() => { if (screen==="chat" && inputRef.current) inputRef.current.focus(); }, [screen, loading]);
  useEffect(() => { if (screen==="personal-entry" && personalInputRef.current) personalInputRef.current.focus(); }, [screen]);

  useEffect(() => {
    if (speakPhase==="countdown" && speakCountdown>0) {
      const t = setTimeout(()=>setSpeakCountdown(c=>c-1),1000); return ()=>clearTimeout(t);
    }
    if (speakPhase==="countdown" && speakCountdown===0) {
      setSpeakPhase("speaking"); setSpeakTime(60); startSpeechRecognition();
    }
  }, [speakPhase, speakCountdown]);

  useEffect(() => {
    if (speakPhase==="speaking" && speakTime>0) {
      timerRef.current = setTimeout(()=>setSpeakTime(t=>t-1),1000); return ()=>clearTimeout(timerRef.current);
    }
    if (speakPhase==="speaking" && speakTime===0) { stopSpeechRecognition(); setSpeakPhase("done"); }
  }, [speakPhase, speakTime]);

  const startSpeechRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US";
    transcriptRef.current = "";
    recognition.onresult = (event) => {
      let final = "";
      for (let i=0; i<event.results.length; i++) { if (event.results[i].isFinal) final += event.results[i][0].transcript + " "; }
      transcriptRef.current = final.trim(); setSpeakTranscript(final.trim());
    };
    recognition.onerror = () => {};
    recognition.onend = () => { if (speakPhase==="speaking" && speakTime>0) { try { recognition.start(); } catch {} } };
    try { recognition.start(); } catch {}
    recognitionRef.current = recognition;
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    setSpeakTranscript(transcriptRef.current);
  };

  const isPersonal = category?.personal;

  // ─── API — routes through Netlify function ───
  const callAPI = async (msgs, systemPrompt) => {
    try {
      const res = await fetch("/api/ask", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:1000, system:systemPrompt, messages:msgs}),
      });
      const data = await res.json();
      return data.content?.map(b=>b.text||"").join("\n") || "";
    } catch { return "I'm having trouble connecting. Please try again."; }
  };

  const updateProgress = useCallback((evalData) => {
    const cs = evalData.component_scores || {};
    const newHistory = [...progress.history, {scores:cs, date:new Date().toISOString()}].slice(-50);
    const newBest = {...progress.bestScores};
    const totals = {analysis:0,evaluation:0,inference:0,explanation:0,self_regulation:0};
    for (const key of Object.keys(totals)) { if ((cs[key]||0) > (newBest[key]||0)) newBest[key]=cs[key]; }
    for (const entry of newHistory) { for (const key of Object.keys(totals)) { totals[key]+=entry.scores[key]||0; } }
    const newAvg = {};
    for (const key of Object.keys(totals)) { newAvg[key]=Math.round((totals[key]/newHistory.length)*10)/10; }
    const newDiff = evalData.next_level_ready && difficulty<4 ? difficulty+1 : difficulty;
    const updated = {...progress, sessionCount:progress.sessionCount+1, difficulty:newDiff, bestScores:newBest, avgScores:newAvg, history:newHistory};
    setProgress(updated); setDifficulty(newDiff); saveProgress(updated);
  }, [progress, difficulty]);

  const initSpeakExercise = () => {
    const word = SPEAK_WORDS[Math.floor(Math.random()*SPEAK_WORDS.length)];
    setSpeakWord(word); setSpeakPhase("ready"); setSpeakTime(60); setSpeakCountdown(3);
    setSpeakTranscript(""); setSpeakEval(null); setManualTranscript(""); transcriptRef.current=""; setScreen("speak");
  };

  const beginSpeaking = () => { setSpeakPhase("countdown"); setSpeakCountdown(3); };
  const stopEarly = () => { clearTimeout(timerRef.current); stopSpeechRecognition(); setSpeakPhase("done"); };

  const evaluateSpeech = async (transcript) => {
    setSpeakPhase("evaluating"); setLoading(true); setLoadingText("Analysing your speech...");
    const msgs = [{role:"user",content:`The word was: "${speakWord}"\n\nTranscript of the 1-minute speech:\n"${transcript}"\n\nPlease evaluate this impromptu speech.`}];
    const response = await callAPI(msgs, SPEECH_EVAL_PROMPT);
    try {
      const parsed = JSON.parse(response.replace(/```json|```/g,"").trim());
      setSpeakEval(parsed);
      const updated = {...progress, speakSessions:(progress.speakSessions||0)+1};
      setProgress(updated); saveProgress(updated);
    } catch {
      setSpeakEval({overall_score:5,clarity:5,structure:5,depth:5,filler_words_found:[],filler_count:0,strengths:["Completed the exercise"],improvements:["Keep practising"],summary:"Could not fully evaluate. Keep going!"});
    }
    setSpeakPhase("results"); setLoading(false);
  };

  const startScenarioSession = async (cat) => {
    setCategory(cat); setScreen("chat"); setMessages([]); setConversationHistory([]); setEvaluation(null); setLoading(true); setLoadingText("Crafting your scenario...");
    const userMsg = {role:"user",content:`MODE: generate_scenario\nCategory: ${cat.label}\nDifficulty: ${difficulty}\nGenerate a thought-provoking real-world scenario.`};
    const response = await callAPI([userMsg], SCENARIO_SYSTEM_PROMPT);
    try {
      const parsed = JSON.parse(response.replace(/```json|```/g,"").trim());
      setScenario(parsed); setConversationHistory([userMsg,{role:"assistant",content:response}]);
      setMessages([{role:"scenario",title:parsed.title,content:parsed.scenario,question:parsed.opening_question,tensions:parsed.key_tensions}]);
    } catch { setMessages([{role:"assistant",content:"Something went wrong. Let me try again..."}]); }
    setLoading(false);
  };

  const startPersonalSession = async () => {
    if (!personalPrompt.trim()) return;
    const text = personalPrompt.trim();
    setScreen("chat"); setMessages([]); setConversationHistory([]); setEvaluation(null);
    setLoading(true); setLoadingText("Taking this in..."); setScenario({title:"Personal Decision"});
    const userMsg = {role:"user",content:`MODE: personal_opening\nThe user has shared a personal situation they want to think through:\n\n"${text}"`};
    const response = await callAPI([userMsg], PERSONAL_SYSTEM_PROMPT);
    setConversationHistory([userMsg,{role:"assistant",content:response}]);
    setMessages([{role:"personal-context",content:text},{role:"assistant",content:response}]);
    setLoading(false); setPersonalPrompt("");
  };

  const handleCategoryClick = (cat) => { if (cat.personal) { setCategory(cat); setScreen("personal-entry"); } else startScenarioSession(cat); };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim(); setInput(""); setMessages(prev=>[...prev,{role:"user",content:userText}]); setLoading(true); setLoadingText("Thinking...");
    const sysPrompt = isPersonal ? PERSONAL_SYSTEM_PROMPT : SCENARIO_SYSTEM_PROMPT;
    const newHistory = [...conversationHistory,{role:"user",content:`MODE: coach\nUser's response: ${userText}`}];
    const response = await callAPI(newHistory, sysPrompt);
    setConversationHistory([...newHistory,{role:"assistant",content:response}]);
    setMessages(prev=>[...prev,{role:"assistant",content:response}]); setLoading(false);
  };

  const requestEvaluation = async () => {
    setLoading(true); setLoadingText("Evaluating your reasoning...");
    const sysPrompt = isPersonal ? PERSONAL_SYSTEM_PROMPT : SCENARIO_SYSTEM_PROMPT;
    const evalHistory = [...conversationHistory,{role:"user",content:"MODE: evaluate\nEvaluate the user's critical thinking performance across this entire conversation. Assess each of the 5 components."}];
    const response = await callAPI(evalHistory, sysPrompt);
    try { const parsed = JSON.parse(response.replace(/```json|```/g,"").trim()); setEvaluation(parsed); updateProgress(parsed); }
    catch { const fb={strengths:["Engaged thoughtfully"],areas_to_improve:["Keep developing"],critical_thinking_score:5,reasoning:"Could not fully evaluate.",component_scores:{analysis:5,evaluation:5,inference:5,explanation:5,self_regulation:5},next_level_ready:false}; setEvaluation(fb); updateProgress(fb); }
    setLoading(false); setScreen("results");
  };

  const handleKeyDown = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const getSkillLevel = (avg) => { if (avg>=8) return {label:"Strong",color:"#5B7A5E"}; if (avg>=6) return {label:"Developing",color:"#C4915E"}; if (avg>=3) return {label:"Emerging",color:"#D4733C"}; if (avg>0) return {label:"Starting",color:"#8A5B5B"}; return {label:"Unexplored",color:"#3a3530"}; };

  // ─── HOME ───
  if (screen==="home") return (
    <div style={S.container}><div style={S.homeInner}>
      <div style={S.headerBlock}>
        <div style={S.brandMark}>CT</div>
        <h1 style={S.title}>Critical Thinking Coach</h1>
        <p style={S.subtitle}>Sharpen your reasoning through real-world scenarios and personal decisions. No right answers — only better questions.</p>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:28}}>
        <button onClick={()=>setScreen("skillmap")} style={{...S.featureBtn,flex:1}}>
          <span style={{fontSize:20,color:"#D4733C"}}>◎</span>
          <div style={S.featureBtnText}><span style={S.featureBtnTitle}>Skill Map</span><span style={S.featureBtnSub}>{progress.sessionCount===0?"5 skills to develop":`${progress.sessionCount} sessions`}</span></div>
        </button>
        <button onClick={initSpeakExercise} style={{...S.featureBtn,flex:1}}>
          <span style={{fontSize:20,color:"#6B5B8A"}}>◉</span>
          <div style={S.featureBtnText}><span style={S.featureBtnTitle}>Speak</span><span style={S.featureBtnSub}>1-minute challenge</span></div>
        </button>
      </div>
      <div style={S.difficultySection}>
        <span style={S.diffLabel}>Your Level</span>
        <div style={S.diffPills}>
          {DIFFICULTY_LABELS.map(d=>(
            <button key={d.level} onClick={()=>setDifficulty(d.level)} style={{...S.diffPill,...(difficulty===d.level?S.diffPillActive:{})}}>
              <span style={S.diffPillLevel}>{d.level}</span><span style={S.diffPillName}>{d.name}</span>
            </button>
          ))}
        </div>
        <p style={S.diffDesc}>{DIFFICULTY_LABELS.find(d=>d.level===difficulty)?.desc}</p>
      </div>
      <div style={S.catSection}>
        <span style={S.catLabel}>Choose a domain</span>
        <div style={S.catGrid}>
          {CATEGORIES.map(cat=>(
            <button key={cat.id} onClick={()=>handleCategoryClick(cat)}
              style={{...S.catCard,borderColor:cat.color+"44",...(cat.personal?S.personalCard:{})}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=cat.color;e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=cat.color+"44";e.currentTarget.style.transform="translateY(0)";}}>
              <span style={S.catIcon}>{cat.icon}</span><span style={S.catName}>{cat.label}</span>
              {cat.personal && <span style={S.personalBadge}>Your life, your thinking</span>}
            </button>
          ))}
        </div>
      </div>
    </div></div>
  );

  // ─── SPEAK ───
  if (screen==="speak") return (
    <div style={S.container}><div style={S.speakInner}>
      <button onClick={()=>{stopSpeechRecognition();clearTimeout(timerRef.current);setScreen("home");}} style={S.backBtn}>← Back</button>
      {speakPhase==="ready" && (
        <div style={S.speakReady}>
          <p style={S.speakQuote}>"Clear thinking means nothing if you can't put it into words when it counts."</p>
          <div style={S.speakWordReveal}><span style={S.speakWordLabel}>YOUR WORD</span><span style={S.speakWordBig}>{speakWord}</span></div>
          <p style={S.speakInstructions}>You have 60 seconds. Speak out loud about this word — what it means to you, why it matters, a story, an argument. No preparation. No filler words. Just think and speak.</p>
          {speechSupported
            ? <p style={S.speakMicNote}>Your speech will be transcribed automatically. If it doesn't capture, you can type it afterwards.</p>
            : <p style={S.speakMicNote}>Auto-transcription isn't available in this browser — type what you said afterwards to get feedback.</p>}
          <button onClick={beginSpeaking} style={S.primaryBtn}>I'm Ready</button>
          <button onClick={initSpeakExercise} style={S.secondaryBtn}>Different Word</button>
        </div>
      )}
      {speakPhase==="countdown" && (
        <div style={S.speakCountdownScreen}>
          <span style={S.speakWordSmall}>{speakWord}</span>
          <span style={S.speakCountdownNum}>{speakCountdown}</span>
          <span style={S.speakCountdownLabel}>Get ready...</span>
        </div>
      )}
      {speakPhase==="speaking" && (
        <div style={S.speakActive}>
          <span style={S.speakWordSmall}>{speakWord}</span>
          <div style={S.timerRing}>
            <svg viewBox="0 0 120 120" style={{width:160,height:160}}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#2a2520" strokeWidth="6"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke={speakTime>10?"#5B7A5E":"#8A5B5B"} strokeWidth="6"
                strokeDasharray={`${(speakTime/60)*327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)"
                style={{transition:"stroke-dasharray 1s linear"}}/>
              <text x="60" y="56" textAnchor="middle" style={{fill:"#e8e0d4",fontSize:36,fontFamily:"'Playfair Display', Georgia, serif"}}>{speakTime}</text>
              <text x="60" y="76" textAnchor="middle" style={{fill:"#6a6058",fontSize:11,fontFamily:"'DM Sans', sans-serif"}}>seconds</text>
            </svg>
          </div>
          {speechSupported && speakTranscript && (
            <div style={S.liveTranscript}>
              <span style={S.liveTranscriptLabel}>LIVE TRANSCRIPT</span>
              <p style={S.liveTranscriptText}>{speakTranscript}</p>
            </div>
          )}
          <button onClick={stopEarly} style={{...S.secondaryBtn,marginTop:20}}>I'm Done</button>
        </div>
      )}
      {speakPhase==="done" && (
        <div style={S.speakDone}>
          <span style={{fontSize:36}}>✓</span>
          <h3 style={S.speakDoneTitle}>Time's up!</h3>
          {speakTranscript ? (
            <>
              <div style={S.transcriptBox}><span style={S.transcriptLabel}>YOUR TRANSCRIPT</span><p style={S.transcriptText}>{speakTranscript}</p></div>
              <button onClick={()=>evaluateSpeech(speakTranscript)} style={S.primaryBtn}>Get Feedback</button>
            </>
          ) : (
            <>
              <p style={S.speakDoneNote}>Auto-transcription didn't capture your speech — type what you said so I can give you feedback:</p>
              <textarea value={manualTranscript} onChange={e=>setManualTranscript(e.target.value)} placeholder="I talked about..." style={S.personalTextarea} rows={5}/>
              <button onClick={()=>evaluateSpeech(manualTranscript)} disabled={!manualTranscript.trim()}
                style={{...S.primaryBtn,opacity:manualTranscript.trim()?1:0.4,marginTop:12}}>Get Feedback</button>
            </>
          )}
          <button onClick={initSpeakExercise} style={{...S.secondaryBtn,marginTop:10}}>Try Another Word</button>
        </div>
      )}
      {speakPhase==="evaluating" && (
        <div style={S.speakCountdownScreen}>
          <div style={S.loadingDots}><span style={S.loadDot1}>●</span><span style={S.loadDot2}>●</span><span style={S.loadDot3}>●</span><span style={S.loadingLabel}>Analysing your speech...</span></div>
        </div>
      )}
      {speakPhase==="results" && speakEval && (
        <div style={S.speakResults}>
          <h3 style={S.resultsTitle}>Speech Review</h3>
          <p style={{fontSize:13,color:"#6a6058",marginBottom:24}}>Word: <strong style={{color:"#e8e0d4"}}>{speakWord}</strong></p>
          <div style={S.scoreRing}>
            <svg viewBox="0 0 120 120" style={{width:120,height:120}}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#2a2a2a" strokeWidth="8"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke={speakEval.overall_score>=7?"#5B7A5E":speakEval.overall_score>=4?"#D4733C":"#8A5B5B"}
                strokeWidth="8" strokeDasharray={`${(speakEval.overall_score/10)*327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
              <text x="60" y="56" textAnchor="middle" style={{fill:"#e8e0d4",fontSize:28,fontFamily:"'Playfair Display', Georgia, serif"}}>{speakEval.overall_score}</text>
              <text x="60" y="74" textAnchor="middle" style={{fill:"#8a8078",fontSize:10,fontFamily:"'DM Sans', sans-serif"}}>overall</text>
            </svg>
          </div>
          {[{key:"clarity",label:"Clarity"},{key:"structure",label:"Structure"},{key:"depth",label:"Depth"}].map(({key,label})=>{
            const val=speakEval[key]||5; const col=val>=7?"#5B7A5E":val>=4?"#D4733C":"#8A5B5B";
            return (<div key={key} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,color:"#8a8078"}}>{label}</span><span style={{fontSize:12,color:col,fontWeight:600}}>{val}/10</span>
              </div>
              <div style={S.componentBarBg}><div style={{...S.componentBarFill,width:`${val*10}%`,background:col}}/></div>
            </div>);
          })}
          {speakEval.filler_count>0 ? (
            <div style={S.fillerCard}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:"#8A5B5B",fontWeight:600}}>Filler Words Detected</span>
                <span style={{fontSize:20,fontFamily:"'Playfair Display', Georgia, serif",fontWeight:700,color:"#8A5B5B"}}>{speakEval.filler_count}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{speakEval.filler_words_found.map((w,i)=><span key={i} style={S.fillerChip}>{w}</span>)}</div>
            </div>
          ) : (
            <div style={{...S.fillerCard,borderColor:"#5B7A5E33",background:"#5B7A5E11"}}>
              <span style={{fontSize:13,color:"#5B7A5E"}}>No filler words detected — well done.</span>
            </div>
          )}
          <p style={{...S.evalReasoning,borderTop:"none",paddingTop:0}}>{speakEval.summary}</p>
          <div style={S.evalSection}><h3 style={S.evalHeading}>What Worked</h3>{speakEval.strengths.map((s,i)=><div key={i} style={S.evalItem}><span style={{color:"#5B7A5E"}}>✦</span> {s}</div>)}</div>
          <div style={S.evalSection}><h3 style={S.evalHeading}>To Practise</h3>{speakEval.improvements.map((a,i)=><div key={i} style={S.evalItem}><span style={{color:"#D4733C"}}>◆</span> {a}</div>)}</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={initSpeakExercise} style={S.primaryBtn}>Try Another Word</button>
            <button onClick={()=>setScreen("home")} style={S.secondaryBtn}>Home</button>
          </div>
        </div>
      )}
    </div></div>
  );

  // ─── SKILL MAP ───
  if (screen==="skillmap") return (
    <div style={S.container}><div style={S.skillMapInner}>
      <button onClick={()=>setScreen("home")} style={S.backBtn}>← Back</button>
      <div style={{textAlign:"center",marginTop:16,marginBottom:32}}>
        <h2 style={S.skillMapTitle}>Your Skill Map</h2>
        <p style={S.skillMapSubtitle}>{progress.sessionCount===0?"These are the 5 muscles you'll build. Each one shows up naturally in conversations — no textbooks required.":`Your growth across ${progress.sessionCount} sessions. Tap any skill to learn more.`}</p>
      </div>
      {progress.sessionCount>0 && (
        <div style={S.radarCard}>
          <svg viewBox="0 0 300 260" style={{width:"100%",maxWidth:320,margin:"0 auto",display:"block"}}>
            {[1,0.7,0.4].map((scale,si)=>{
              const pts=[0,1,2,3,4].map(i=>{const a=(Math.PI*2*i)/5-Math.PI/2;return `${150+Math.cos(a)*100*scale},${130+Math.sin(a)*100*scale}`;}).join(" ");
              return <polygon key={si} points={pts} fill="none" stroke="#2e2a25" strokeWidth="1"/>;
            })}
            {(()=>{
              const keys=["analysis","evaluation","inference","explanation","self_regulation"];
              const pts=keys.map((k,i)=>{const v=(progress.avgScores[k]||0)/10;const a=(Math.PI*2*i)/5-Math.PI/2;return `${150+Math.cos(a)*100*v},${130+Math.sin(a)*100*v}`;}).join(" ");
              return <polygon points={pts} fill="#D4733C22" stroke="#D4733C" strokeWidth="2"/>;
            })()}
            {["Analysis","Evaluation","Inference","Explanation","Self-Reg."].map((l,i)=>{
              const a=(Math.PI*2*i)/5-Math.PI/2;return <text key={i} x={150+Math.cos(a)*125} y={130+Math.sin(a)*125} textAnchor="middle" dominantBaseline="middle" style={{fill:"#8a8078",fontSize:11,fontFamily:"'DM Sans', sans-serif"}}>{l}</text>;
            })}
          </svg>
        </div>
      )}
      {SKILL_MAP.map(skill=>{
        const avg=progress.avgScores[skill.id]||0; const best=progress.bestScores[skill.id]||0;
        const level=getSkillLevel(avg); const isOpen=expandedSkill===skill.id;
        return (
          <div key={skill.id} style={S.skillCard}>
            <button onClick={()=>setExpandedSkill(isOpen?null:skill.id)} style={S.skillCardHeader}>
              <span style={{...S.skillCardIcon,color:skill.color}}>{skill.icon}</span>
              <div style={S.skillCardTitleArea}><span style={S.skillCardName}>{skill.name}</span><span style={S.skillCardOneLiner}>{skill.oneLiner}</span></div>
              <div style={S.skillCardRight}>
                {progress.sessionCount>0 && <span style={{...S.skillLevelBadge,color:level.color,borderColor:level.color+"44"}}>{level.label}</span>}
                <span style={{...S.expandArrow,transform:isOpen?"rotate(90deg)":"rotate(0)"}}>›</span>
              </div>
            </button>
            {isOpen && (
              <div style={S.skillExpanded}>
                <div style={S.skillEveryday}><span style={S.skillEverydayLabel}>In everyday life</span><p style={S.skillEverydayText}>{skill.everyday}</p></div>
                {progress.sessionCount>0 && <div style={S.skillScoreRow}><div style={S.skillScoreStat}><span style={S.skillScoreNum}>{avg}</span><span style={S.skillScoreLabel}>avg score</span></div><div style={S.skillScoreStat}><span style={S.skillScoreNum}>{best}</span><span style={S.skillScoreLabel}>personal best</span></div></div>}
                <div style={S.subskillsArea}><span style={S.subskillsLabel}>Skills you develop at each level</span>
                  {skill.subskills.map((sub,j)=>{
                    const unlocked=difficulty>=sub.unlock;
                    return (<div key={j} style={{...S.subskillRow,opacity:unlocked?1:0.4}}><div style={S.subskillDot}><span style={{display:"block",width:8,height:8,borderRadius:"50%",background:unlocked?skill.color:"#3a3530"}}/>{j<skill.subskills.length-1&&<div style={S.subskillLine}/>}</div><div style={S.subskillContent}><span style={S.subskillName}>{sub.name}</span><span style={S.subskillDesc}>{sub.desc}</span><span style={S.subskillUnlock}>Level {sub.unlock} · {DIFFICULTY_LABELS[sub.unlock-1].name}</span></div></div>);
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {progress.sessionCount===0 && <div style={S.skillMapCta}><p style={S.skillMapCtaText}>Start a session to begin tracking your progress.</p><button onClick={()=>setScreen("home")} style={S.primaryBtn}>Start Practising</button></div>}
    </div></div>
  );

  // ─── PERSONAL ENTRY ───
  if (screen==="personal-entry") return (
    <div style={S.container}><div style={S.personalEntryInner}>
      <button onClick={()=>setScreen("home")} style={S.backBtn}>← Back</button>
      <div style={S.personalEntryHeader}><span style={{fontSize:36}}>🪞</span><h2 style={S.personalEntryTitle}>What's on your mind?</h2><p style={S.personalEntryDesc}>Share a decision you're wrestling with, a crossroads you're at, or something you keep going back and forth on.</p><p style={S.personalEntryNote}>This isn't therapy. It's a space to think out loud with something that will push back.</p></div>
      <textarea ref={personalInputRef} value={personalPrompt} onChange={e=>setPersonalPrompt(e.target.value)} placeholder="I'm trying to decide whether to... / I keep telling myself that... / I'm stuck on..." style={S.personalTextarea} rows={6}/>
      <button onClick={startPersonalSession} disabled={!personalPrompt.trim()} style={{...S.primaryBtn,opacity:personalPrompt.trim()?1:0.4,width:"100%",marginTop:16}}>Let's think this through</button>
    </div></div>
  );

  // ─── RESULTS ───
  if (screen==="results" && evaluation) {
    const score=evaluation.critical_thinking_score; const cs=evaluation.component_scores||{};
    return (
      <div style={S.container}><div style={S.resultsInner}>
        <h2 style={S.resultsTitle}>Session Review</h2><p style={S.resultsScenario}>{scenario?.title}</p>
        <div style={S.scoreRing}><svg viewBox="0 0 120 120" style={{width:140,height:140}}><circle cx="60" cy="60" r="52" fill="none" stroke="#2a2a2a" strokeWidth="8"/><circle cx="60" cy="60" r="52" fill="none" stroke={score>=7?"#5B7A5E":score>=4?"#D4733C":"#8A5B5B"} strokeWidth="8" strokeDasharray={`${(score/10)*327} 327`} strokeLinecap="round" transform="rotate(-90 60 60)"/><text x="60" y="56" textAnchor="middle" style={{fill:"#e8e0d4",fontSize:32,fontFamily:"'Playfair Display', Georgia, serif"}}>{score}</text><text x="60" y="74" textAnchor="middle" style={{fill:"#8a8078",fontSize:11,fontFamily:"'DM Sans', sans-serif"}}>out of 10</text></svg></div>
        <div style={S.componentSection}><h3 style={S.evalHeading}>The 5 Components — How You Did</h3><p style={S.componentIntro}>These were working invisibly throughout our conversation.</p>
          {CT_COMPONENTS.map(comp=>{const val=cs[comp.id]||5;const col=val>=7?"#5B7A5E":val>=4?"#D4733C":"#8A5B5B";return(<div key={comp.id} style={S.componentRow}><div style={S.componentHeader}><span style={S.componentIcon}>{comp.icon}</span><span style={S.componentName}>{comp.name}</span><span style={{...S.componentScore,color:col}}>{val}/10</span></div><div style={S.componentBarBg}><div style={{...S.componentBarFill,width:`${val*10}%`,background:col}}/></div><p style={S.componentDesc}>{comp.desc}</p></div>);})}
        </div>
        <div style={S.evalSection}><h3 style={S.evalHeading}>Strengths</h3>{evaluation.strengths.map((s,i)=><div key={i} style={S.evalItem}><span style={{color:"#5B7A5E"}}>✦</span> {s}</div>)}</div>
        <div style={S.evalSection}><h3 style={S.evalHeading}>Areas to Develop</h3>{evaluation.areas_to_improve.map((a,i)=><div key={i} style={S.evalItem}><span style={{color:"#D4733C"}}>◆</span> {a}</div>)}</div>
        <p style={S.evalReasoning}>{evaluation.reasoning}</p>
        {evaluation.personal_insight && <div style={S.personalInsight}><span style={S.insightIcon}>🪞</span><p style={S.insightText}>{evaluation.personal_insight}</p></div>}
        {evaluation.next_level_ready && difficulty<=4 && <div style={S.levelUp}>↑ You've levelled up to {DIFFICULTY_LABELS.find(d=>d.level===difficulty)?.name}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setScreen("skillmap")} style={{...S.primaryBtn,background:"transparent",border:"1px solid #D4733C",color:"#D4733C"}}>View Skill Map</button>
          <button onClick={()=>setScreen("home")} style={S.primaryBtn}>New Session</button>
        </div>
      </div></div>
    );
  }

  // ─── CHAT ───
  return (
    <div style={S.container}><div style={S.chatWrapper}>
      <div style={S.chatHeader}>
        <button onClick={()=>setScreen("home")} style={S.backBtn}>← Back</button>
        <div style={S.chatHeaderInfo}><span style={{fontSize:14,color:"#8a8078"}}>{category?.icon} {category?.label}</span>
          {!isPersonal && <span style={S.levelBadge}>Level {difficulty} · {DIFFICULTY_LABELS.find(d=>d.level===difficulty)?.name}</span>}
          {isPersonal && <span style={{...S.levelBadge,color:"#C4915E"}}>Personal Mode</span>}
        </div>
        {messages.filter(m=>m.role==="user").length>=2 && <button onClick={requestEvaluation} style={S.evalBtn} disabled={loading}>Evaluate Me</button>}
      </div>
      <div style={S.chatMessages}>
        {messages.map((msg,i)=>{
          if (msg.role==="scenario") return(<div key={i} style={S.scenarioCard}><div style={S.scenarioTag}>SCENARIO</div><h3 style={S.scenarioTitle}>{msg.title}</h3><p style={S.scenarioText}>{msg.content}</p>{msg.tensions&&<div style={S.tensionBox}><span style={S.tensionLabel}>Key tensions to consider:</span>{msg.tensions.map((t,j)=><span key={j} style={S.tensionChip}>{t}</span>)}</div>}<div style={S.openingQ}><span style={S.qMark}>?</span>{msg.question}</div></div>);
          if (msg.role==="personal-context") return(<div key={i} style={S.personalContextCard}><div style={{...S.scenarioTag,color:"#C4915E"}}>YOUR SITUATION</div><p style={S.scenarioText}>{msg.content}</p></div>);
          if (msg.role==="user") return(<div key={i} style={S.userBubble}><div style={S.userText}>{msg.content}</div></div>);
          return(<div key={i} style={S.aiBubble}><div style={S.aiTag}>Coach</div><div style={S.aiText}>{msg.content}</div></div>);
        })}
        {loading && <div style={S.aiBubble}><div style={S.loadingDots}><span style={S.loadDot1}>●</span><span style={S.loadDot2}>●</span><span style={S.loadDot3}>●</span><span style={S.loadingLabel}>{loadingText}</span></div></div>}
        <div ref={chatEndRef}/>
      </div>
      <div style={S.inputBar}>
        <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder={isPersonal?"Think out loud...":"Share your reasoning..."} style={S.textarea} rows={1} disabled={loading}/>
        <button onClick={sendMessage} disabled={!input.trim()||loading} style={{...S.sendBtn,opacity:!input.trim()||loading?0.4:1}}>→</button>
      </div>
    </div>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
      @keyframes fadeDot1{0%,100%{opacity:.2}33%{opacity:1}}
      @keyframes fadeDot2{0%,100%{opacity:.2}50%{opacity:1}}
      @keyframes fadeDot3{0%,100%{opacity:.2}66%{opacity:1}}
      @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
      textarea::placeholder{color:#5a5550}
      *{box-sizing:border-box}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-thumb{background:#3a3530;border-radius:4px}
    `}</style>
    </div>
  );
}

const S = {
  container:{minHeight:"100vh",background:"#1a1714",color:"#e8e0d4",fontFamily:"'DM Sans', sans-serif",display:"flex",flexDirection:"column"},
  homeInner:{maxWidth:640,margin:"0 auto",padding:"48px 24px",width:"100%"},
  headerBlock:{textAlign:"center",marginBottom:32},
  brandMark:{display:"inline-block",width:48,height:48,lineHeight:"48px",borderRadius:12,background:"linear-gradient(135deg, #D4733C, #8B6E4E)",fontFamily:"'Playfair Display', Georgia, serif",fontWeight:700,fontSize:20,color:"#fff",marginBottom:16},
  title:{fontFamily:"'Playfair Display', Georgia, serif",fontSize:32,fontWeight:700,margin:"0 0 8px",letterSpacing:"-0.02em",color:"#e8e0d4"},
  subtitle:{fontSize:15,color:"#8a8078",lineHeight:1.6,margin:0},
  featureBtn:{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",border:"1px solid #2e2a25",borderRadius:14,background:"#22201c",cursor:"pointer",textAlign:"left",color:"#e8e0d4",transition:"border-color 0.2s"},
  featureBtnText:{display:"flex",flexDirection:"column",gap:1},
  featureBtnTitle:{fontSize:13,fontWeight:600},
  featureBtnSub:{fontSize:11,color:"#6a6058"},
  speakInner:{maxWidth:560,margin:"0 auto",padding:"24px 20px 48px",width:"100%"},
  speakReady:{textAlign:"center",paddingTop:32},
  speakQuote:{fontSize:16,fontFamily:"'Playfair Display', Georgia, serif",fontStyle:"italic",color:"#8a8078",lineHeight:1.6,margin:"0 0 36px",maxWidth:400,marginLeft:"auto",marginRight:"auto"},
  speakWordReveal:{display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginBottom:32},
  speakWordLabel:{fontSize:9,textTransform:"uppercase",letterSpacing:"0.14em",color:"#6a6058",fontWeight:600},
  speakWordBig:{fontSize:48,fontFamily:"'Playfair Display', Georgia, serif",fontWeight:700,color:"#e8e0d4",letterSpacing:"-0.02em"},
  speakInstructions:{fontSize:14,color:"#8a8078",lineHeight:1.7,margin:"0 0 8px",maxWidth:420,marginLeft:"auto",marginRight:"auto"},
  speakMicNote:{fontSize:12,color:"#5a5550",fontStyle:"italic",margin:"0 0 24px"},
  speakCountdownScreen:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16},
  speakWordSmall:{fontSize:14,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6a6058",fontWeight:600},
  speakCountdownNum:{fontSize:96,fontFamily:"'Playfair Display', Georgia, serif",fontWeight:700,color:"#D4733C",animation:"pulse 1s ease infinite"},
  speakCountdownLabel:{fontSize:14,color:"#5a5550"},
  speakActive:{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:32},
  timerRing:{margin:"24px 0"},
  liveTranscript:{width:"100%",padding:"16px",background:"#22201c",border:"1px solid #2e2a25",borderRadius:12,marginTop:16,maxHeight:200,overflowY:"auto"},
  liveTranscriptLabel:{fontSize:9,textTransform:"uppercase",letterSpacing:"0.12em",color:"#5B7A5E",fontWeight:600},
  liveTranscriptText:{fontSize:13,color:"#b0a898",lineHeight:1.6,margin:"8px 0 0"},
  speakDone:{textAlign:"center",paddingTop:32},
  speakDoneTitle:{fontFamily:"'Playfair Display', Georgia, serif",fontSize:24,fontWeight:600,margin:"12px 0 20px",color:"#e8e0d4"},
  speakDoneNote:{fontSize:13,color:"#8a8078",marginBottom:12},
  transcriptBox:{textAlign:"left",padding:"16px",background:"#22201c",border:"1px solid #2e2a25",borderRadius:12,marginBottom:20},
  transcriptLabel:{fontSize:9,textTransform:"uppercase",letterSpacing:"0.12em",color:"#6a6058",fontWeight:600},
  transcriptText:{fontSize:13,color:"#b0a898",lineHeight:1.7,margin:"8px 0 0"},
  speakResults:{maxWidth:520,margin:"0 auto",paddingTop:24,textAlign:"center"},
  fillerCard:{padding:"14px 16px",background:"#8A5B5B11",border:"1px solid #8A5B5B33",borderRadius:12,marginBottom:20,textAlign:"left"},
  fillerChip:{fontSize:11,padding:"3px 10px",background:"#1a1714",border:"1px solid #8A5B5B44",borderRadius:20,color:"#8A5B5B"},
  difficultySection:{marginBottom:28},
  diffLabel:{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6a6058",display:"block",marginBottom:12},
  diffPills:{display:"flex",gap:8},
  diffPill:{flex:1,padding:"10px 8px",border:"1px solid #2a2520",borderRadius:10,background:"transparent",color:"#8a8078",cursor:"pointer",textAlign:"center",transition:"all 0.2s",display:"flex",flexDirection:"column",gap:2},
  diffPillActive:{background:"#2a2520",borderColor:"#D4733C",color:"#e8e0d4"},
  diffPillLevel:{fontSize:18,fontFamily:"'Playfair Display', Georgia, serif",fontWeight:700},
  diffPillName:{fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"},
  diffDesc:{fontSize:13,color:"#6a6058",marginTop:10,textAlign:"center"},
  catSection:{marginBottom:24},
  catLabel:{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6a6058",display:"block",marginBottom:12},
  catGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},
  catCard:{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",border:"1px solid #2a2520",borderRadius:12,background:"transparent",color:"#e8e0d4",cursor:"pointer",textAlign:"left",transition:"all 0.25s",fontSize:14,position:"relative"},
  personalCard:{gridColumn:"1 / -1",background:"#22201c",flexDirection:"column",alignItems:"flex-start",padding:"18px 20px"},
  personalBadge:{fontSize:11,color:"#8a8078",fontStyle:"italic"},
  catIcon:{fontSize:20},
  catName:{fontSize:13,fontWeight:500},
  personalEntryInner:{maxWidth:560,margin:"0 auto",padding:"32px 24px",width:"100%"},
  personalEntryHeader:{textAlign:"center",marginTop:24,marginBottom:32},
  personalEntryTitle:{fontFamily:"'Playfair Display', Georgia, serif",fontSize:26,fontWeight:600,margin:"16px 0 12px",color:"#e8e0d4"},
  personalEntryDesc:{fontSize:14,color:"#8a8078",lineHeight:1.7,margin:"0 0 12px"},
  personalEntryNote:{fontSize:12,color:"#5a5550",fontStyle:"italic",margin:0},
  personalTextarea:{width:"100%",padding:"16px 18px",borderRadius:14,border:"1px solid #2e2a25",background:"#22201c",color:"#e8e0d4",fontSize:15,fontFamily:"'DM Sans', sans-serif",resize:"vertical",outline:"none",lineHeight:1.6,minHeight:140},
  skillMapInner:{maxWidth:600,margin:"0 auto",padding:"24px 20px 48px",width:"100%"},
  skillMapTitle:{fontFamily:"'Playfair Display', Georgia, serif",fontSize:28,fontWeight:700,margin:"0 0 8px",color:"#e8e0d4"},
  skillMapSubtitle:{fontSize:14,color:"#8a8078",lineHeight:1.6,margin:0},
  radarCard:{background:"#22201c",border:"1px solid #2e2a25",borderRadius:14,padding:"20px 16px",marginBottom:24},
  skillCard:{background:"#22201c",border:"1px solid #2e2a25",borderRadius:14,marginBottom:10,overflow:"hidden"},
  skillCardHeader:{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"16px 18px",background:"none",border:"none",cursor:"pointer",textAlign:"left",color:"#e8e0d4"},
  skillCardIcon:{fontSize:20,flexShrink:0},
  skillCardTitleArea:{flex:1,display:"flex",flexDirection:"column",gap:2},
  skillCardName:{fontSize:14,fontWeight:600},
  skillCardOneLiner:{fontSize:12,color:"#6a6058",lineHeight:1.4},
  skillCardRight:{display:"flex",alignItems:"center",gap:8,flexShrink:0},
  skillLevelBadge:{fontSize:10,padding:"3px 8px",border:"1px solid",borderRadius:20,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"},
  expandArrow:{fontSize:20,color:"#6a6058",transition:"transform 0.2s"},
  skillExpanded:{padding:"0 18px 20px",borderTop:"1px solid #2a2520"},
  skillEveryday:{padding:"16px 0"},
  skillEverydayLabel:{fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6a6058",fontWeight:600},
  skillEverydayText:{fontSize:14,color:"#b0a898",lineHeight:1.7,margin:"8px 0 0"},
  skillScoreRow:{display:"flex",gap:20,paddingBottom:16,borderBottom:"1px solid #2a2520"},
  skillScoreStat:{display:"flex",flexDirection:"column",gap:2},
  skillScoreNum:{fontSize:24,fontFamily:"'Playfair Display', Georgia, serif",fontWeight:700,color:"#e8e0d4"},
  skillScoreLabel:{fontSize:10,color:"#6a6058",textTransform:"uppercase",letterSpacing:"0.06em"},
  subskillsArea:{paddingTop:16},
  subskillsLabel:{fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6a6058",fontWeight:600,display:"block",marginBottom:14},
  subskillRow:{display:"flex",gap:12,minHeight:56},
  subskillDot:{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:5,width:8,flexShrink:0},
  subskillLine:{flex:1,width:1,background:"#2e2a25",marginTop:4},
  subskillContent:{display:"flex",flexDirection:"column",gap:2,paddingBottom:14},
  subskillName:{fontSize:13,fontWeight:600,color:"#e8e0d4"},
  subskillDesc:{fontSize:12,color:"#8a8078",lineHeight:1.5},
  subskillUnlock:{fontSize:10,color:"#5a5550",marginTop:2},
  skillMapCta:{textAlign:"center",padding:"24px 0"},
  skillMapCtaText:{fontSize:13,color:"#6a6058",marginBottom:16},
  chatWrapper:{display:"flex",flexDirection:"column",height:"100vh",maxWidth:720,margin:"0 auto",width:"100%"},
  chatHeader:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid #2a2520",flexShrink:0},
  backBtn:{background:"none",border:"none",color:"#8a8078",cursor:"pointer",fontSize:14,padding:"4px 0",fontFamily:"'DM Sans', sans-serif"},
  chatHeaderInfo:{display:"flex",flexDirection:"column",alignItems:"center",gap:2},
  levelBadge:{fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",color:"#D4733C"},
  evalBtn:{padding:"6px 14px",borderRadius:8,border:"1px solid #D4733C",background:"transparent",color:"#D4733C",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans', sans-serif",fontWeight:600},
  chatMessages:{flex:1,overflowY:"auto",padding:"20px 20px 8px"},
  scenarioCard:{background:"#22201c",border:"1px solid #2e2a25",borderRadius:14,padding:"24px 20px",marginBottom:20},
  personalContextCard:{background:"#22201c",border:"1px solid #C4915E33",borderRadius:14,padding:"20px 20px",marginBottom:20},
  scenarioTag:{fontSize:9,textTransform:"uppercase",letterSpacing:"0.14em",color:"#D4733C",marginBottom:10,fontWeight:600},
  scenarioTitle:{fontFamily:"'Playfair Display', Georgia, serif",fontSize:20,margin:"0 0 12px",fontWeight:600,color:"#e8e0d4"},
  scenarioText:{fontSize:14,lineHeight:1.7,color:"#b0a898",margin:"0 0 16px",whiteSpace:"pre-wrap"},
  tensionBox:{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:16},
  tensionLabel:{fontSize:11,color:"#6a6058",width:"100%",marginBottom:4},
  tensionChip:{fontSize:11,padding:"4px 10px",background:"#1a1714",border:"1px solid #2e2a25",borderRadius:20,color:"#8a8078"},
  openingQ:{display:"flex",gap:10,alignItems:"flex-start",fontSize:15,color:"#e8e0d4",fontFamily:"'Playfair Display', Georgia, serif",fontStyle:"italic",lineHeight:1.5,padding:"12px 0 0",borderTop:"1px solid #2e2a25"},
  qMark:{display:"flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"#D4733C22",color:"#D4733C",fontSize:14,fontStyle:"normal",flexShrink:0,marginTop:2},
  userBubble:{display:"flex",justifyContent:"flex-end",marginBottom:16},
  userText:{background:"#2e2a25",padding:"12px 16px",borderRadius:"14px 14px 4px 14px",maxWidth:"80%",fontSize:14,lineHeight:1.6,color:"#e8e0d4"},
  aiBubble:{marginBottom:16},
  aiTag:{fontSize:9,textTransform:"uppercase",letterSpacing:"0.12em",color:"#5B7A5E",marginBottom:6,fontWeight:600},
  aiText:{fontSize:14,lineHeight:1.7,color:"#b0a898",maxWidth:"85%",whiteSpace:"pre-wrap"},
  loadingDots:{display:"flex",gap:4,alignItems:"center",color:"#6a6058",fontSize:14},
  loadDot1:{animation:"fadeDot1 1.2s infinite",fontSize:10},
  loadDot2:{animation:"fadeDot2 1.2s infinite",fontSize:10},
  loadDot3:{animation:"fadeDot3 1.2s infinite",fontSize:10},
  loadingLabel:{fontSize:12,marginLeft:8,color:"#5a5550"},
  inputBar:{display:"flex",alignItems:"flex-end",gap:10,padding:"12px 20px 20px",borderTop:"1px solid #2a2520",flexShrink:0},
  textarea:{flex:1,padding:"12px 16px",borderRadius:12,border:"1px solid #2e2a25",background:"#22201c",color:"#e8e0d4",fontSize:14,fontFamily:"'DM Sans', sans-serif",resize:"none",outline:"none",lineHeight:1.5,maxHeight:120},
  sendBtn:{width:42,height:42,borderRadius:12,border:"none",background:"#D4733C",color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"opacity 0.2s",fontFamily:"'DM Sans', sans-serif"},
  resultsInner:{maxWidth:520,margin:"0 auto",padding:"48px 24px",textAlign:"center"},
  resultsTitle:{fontFamily:"'Playfair Display', Georgia, serif",fontSize:28,fontWeight:700,margin:"0 0 6px",color:"#e8e0d4"},
  resultsScenario:{fontSize:13,color:"#6a6058",marginBottom:32},
  scoreRing:{display:"flex",justifyContent:"center",marginBottom:32},
  componentSection:{textAlign:"left",marginBottom:28,padding:"20px",background:"#22201c",borderRadius:14,border:"1px solid #2e2a25"},
  componentIntro:{fontSize:13,color:"#6a6058",lineHeight:1.6,marginTop:4,marginBottom:20},
  componentRow:{marginBottom:16},
  componentHeader:{display:"flex",alignItems:"center",gap:8,marginBottom:6},
  componentIcon:{fontSize:12,color:"#6a6058"},
  componentName:{fontSize:13,fontWeight:600,color:"#e8e0d4",flex:1},
  componentScore:{fontSize:13,fontWeight:600,fontFamily:"'Playfair Display', Georgia, serif"},
  componentBarBg:{height:4,background:"#2a2520",borderRadius:4,overflow:"hidden",marginBottom:4},
  componentBarFill:{height:"100%",borderRadius:4,transition:"width 0.8s ease"},
  componentDesc:{fontSize:11,color:"#5a5550",margin:0},
  evalSection:{textAlign:"left",marginBottom:24},
  evalHeading:{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6a6058",marginBottom:10},
  evalItem:{fontSize:14,lineHeight:1.6,color:"#b0a898",marginBottom:6,display:"flex",gap:8},
  evalReasoning:{fontSize:13,color:"#6a6058",lineHeight:1.6,fontStyle:"italic",borderTop:"1px solid #2a2520",paddingTop:16,marginBottom:24,textAlign:"left"},
  personalInsight:{display:"flex",gap:12,alignItems:"flex-start",padding:"16px 18px",background:"#C4915E11",border:"1px solid #C4915E33",borderRadius:12,marginBottom:24,textAlign:"left"},
  insightIcon:{fontSize:20,flexShrink:0,marginTop:2},
  insightText:{fontSize:13,color:"#C4915E",lineHeight:1.6,margin:0,fontStyle:"italic"},
  levelUp:{padding:"12px 20px",background:"#5B7A5E22",border:"1px solid #5B7A5E44",borderRadius:10,color:"#5B7A5E",fontSize:14,fontWeight:600,marginBottom:24},
  primaryBtn:{padding:"14px 40px",borderRadius:12,border:"none",background:"#D4733C",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans', sans-serif"},
  secondaryBtn:{padding:"12px 32px",borderRadius:12,border:"1px solid #2e2a25",background:"transparent",color:"#8a8078",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans', sans-serif"},
};
