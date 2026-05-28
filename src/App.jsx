import { useState } from "react";

const FRAMEWORKS = [
  {
    id: "summary",
    label: "📋 Summary",
    emoji: "📋",
    name: "Core Summary",
    prompt: "Give a concise 5-point bullet summary of the key ideas in this video transcript. Be direct and clear.",
  },
  {
    id: "argument",
    label: "🧠 Argument Map",
    emoji: "🧠",
    name: "Argument Map",
    prompt: "Identify the main argument/thesis of this video. Then list 3-5 supporting claims the speaker makes. Finally, note any counterarguments they address.",
  },
  {
    id: "business",
    label: "💼 Business Lens",
    emoji: "💼",
    name: "Business Lens",
    prompt: "Analyze this video from a business perspective. What is the core value proposition? What market problem is discussed? What opportunities or risks are mentioned? Use bullet points.",
  },
  {
    id: "swot",
    label: "📊 SWOT Analysis",
    emoji: "📊",
    name: "SWOT Analysis",
    prompt: "Based on this video, create a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) of the main topic or subject being discussed.",
  },
  {
    id: "sentiment",
    label: "❤️ Sentiment",
    emoji: "❤️",
    name: "Sentiment & Tone",
    prompt: "Analyze the emotional tone and sentiment of this video. Is it optimistic/pessimistic? Urgent/calm? Confident/uncertain? Give a tone score out of 10 for each dimension and explain why.",
  },
  {
    id: "actionable",
    label: "✅ Action Items",
    emoji: "✅",
    name: "Action Items",
    prompt: "Extract all actionable advice, steps, or recommendations from this video. Format as a numbered to-do list. Be specific and practical.",
  },
  {
    id: "critique",
    label: "🔍 Critical Review",
    emoji: "🔍",
    name: "Critical Review",
    prompt: "Critically evaluate this video. What are its strongest points? What claims are unsupported or weak? What important information is missing? Be balanced and analytical.",
  },
  {
    id: "asia",
    label: "🌏 Asia Market",
    emoji: "🌏",
    name: "Asia Market Angle",
    prompt: "Analyze this video through the lens of South and Southeast Asian markets (India, Nepal, Vietnam, Indonesia, Thailand, etc.). What parts of this content are relevant or applicable to those markets? What would need to be adapted? What opportunities exist?",
  },
];

const callClaude = async (transcript, frameworkPrompt) => {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer "Authorization": "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: "You are an expert video analyst. Analyze the provided YouTube video transcript using the requested framework. Be insightful, concise, and well-structured. Use markdown formatting (bullet points, bold, headers) where appropriate.",
        },
        {
          role: "user",
          content: `Here is the YouTube video transcript to analyze:\n\n---\n${transcript}\n---\n\n${frameworkPrompt}`,
        },
      ],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
};

const parseMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.*$)/gm, "<h3 style='color:#f59e0b;margin:12px 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:1px;'>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2 style='color:#f59e0b;margin:14px 0 8px;font-size:16px;'>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1 style='color:#f59e0b;margin:16px 0 10px;font-size:18px;'>$1</h1>")
    .replace(/^\d+\.\s(.+)/gm, "<div style='display:flex;gap:8px;margin:4px 0;'><span style='color:#f59e0b;min-width:20px;'>•</span><span>$1</span></div>")
    .replace(/^[-*]\s(.+)/gm, "<div style='display:flex;gap:8px;margin:4px 0;'><span style='color:#f59e0b;'>▸</span><span>$1</span></div>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
};

export default function YouTubeAnalyzer() {
  const [transcript, setTranscript] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [activeFramework, setActiveFramework] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("input"); // input | analyze

  const handleAnalyze = async (framework) => {
    if (!transcript.trim()) {
      setError("Please paste the video transcript first.");
      return;
    }
    setError("");
    setActiveFramework(framework.id);
    setLoading(true);
    setStep("analyze");
    try {
      if (!results[framework.id]) {
        const result = await callClaude(transcript, framework.prompt);
        setResults((prev) => ({ ...prev, [framework.id]: result }));
      }
    } catch (e) {
      setError("API error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const activeResult = results[activeFramework];
  const activeFrameworkData = FRAMEWORKS.find((f) => f.id === activeFramework);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e8e0d0",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a0a00 0%, #0a0a0a 50%, #001a0a 100%)",
        borderBottom: "1px solid #2a1a00",
        padding: "28px 24px 20px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#f59e0b", textTransform: "uppercase", marginBottom: "8px", opacity: 0.8 }}>
          AI-Powered Intelligence Suite
        </div>
        <h1 style={{
          fontSize: "clamp(22px, 5vw, 34px)",
          fontWeight: "700",
          margin: "0 0 6px",
          color: "#fff",
          letterSpacing: "-0.5px",
        }}>
          YouTube <span style={{ color: "#f59e0b" }}>Analyzer</span>
        </h1>
        <p style={{ margin: 0, color: "#7a6a50", fontSize: "13px", fontStyle: "italic" }}>
          8 analytical frameworks · Powered by Claude Sonnet 4
        </p>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Input Section */}
        <div style={{
          background: "#111",
          border: "1px solid #222",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <label style={{ display: "block", fontSize: "11px", letterSpacing: "3px", color: "#f59e0b", textTransform: "uppercase", marginBottom: "10px" }}>
            Video Title (optional)
          </label>
          <input
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="e.g. How to Build an AI Startup in 2025"
            style={{
              width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a",
              borderRadius: "8px", padding: "10px 14px", color: "#e8e0d0",
              fontSize: "14px", fontFamily: "inherit", marginBottom: "16px",
              outline: "none", boxSizing: "border-box",
            }}
          />

          <label style={{ display: "block", fontSize: "11px", letterSpacing: "3px", color: "#f59e0b", textTransform: "uppercase", marginBottom: "10px" }}>
            Paste Transcript Here *
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={"Paste the full YouTube video transcript here...\n\nHow to get it:\n1. Open YouTube video\n2. Click '...' under video → 'Show transcript'\n3. Copy all the text and paste here"}
            rows={7}
            style={{
              width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a",
              borderRadius: "8px", padding: "12px 14px", color: "#e8e0d0",
              fontSize: "13px", fontFamily: "'Courier New', monospace", resize: "vertical",
              outline: "none", boxSizing: "border-box", lineHeight: "1.6",
            }}
          />
          {transcript && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#4a3a20" }}>
              {transcript.split(" ").length.toLocaleString()} words · {transcript.length.toLocaleString()} characters
            </div>
          )}
          {error && (
            <div style={{ marginTop: "10px", padding: "10px 14px", background: "#1a0a0a", border: "1px solid #5a1a1a", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Framework Grid */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#5a4a30", textTransform: "uppercase", marginBottom: "14px" }}>
            Select Analysis Framework
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: "10px",
          }}>
            {FRAMEWORKS.map((fw) => {
              const isActive = activeFramework === fw.id;
              const hasResult = !!results[fw.id];
              return (
                <button
                  key={fw.id}
                  onClick={() => {
                    setActiveFramework(fw.id);
                    if (!results[fw.id]) handleAnalyze(fw);
                    else setStep("analyze");
                  }}
                  style={{
                    background: isActive ? "rgba(245,158,11,0.12)" : hasResult ? "rgba(34,197,94,0.06)" : "#111",
                    border: isActive ? "1px solid #f59e0b" : hasResult ? "1px solid rgba(34,197,94,0.3)" : "1px solid #222",
                    borderRadius: "10px",
                    padding: "14px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    color: isActive ? "#f59e0b" : hasResult ? "#86efac" : "#8a7a60",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>{fw.emoji}</div>
                  <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "2px" }}>{fw.name}</div>
                  {hasResult && !isActive && (
                    <div style={{ fontSize: "10px", color: "#4ade80", letterSpacing: "1px" }}>✓ DONE</div>
                  )}
                  {isActive && loading && (
                    <div style={{ fontSize: "10px", color: "#f59e0b", letterSpacing: "1px" }}>⟳ ANALYZING...</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Panel */}
        {activeFramework && (
          <div style={{
            background: "#111",
            border: activeResult ? "1px solid #1a2a1a" : "1px solid #222",
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            {/* Result Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #1a1a1a",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(245,158,11,0.04)",
            }}>
              <span style={{ fontSize: "22px" }}>{activeFrameworkData?.emoji}</span>
              <div>
                <div style={{ fontWeight: "700", color: "#e8e0d0", fontSize: "15px" }}>{activeFrameworkData?.name}</div>
                {videoTitle && <div style={{ fontSize: "12px", color: "#5a4a30", fontStyle: "italic", marginTop: "2px" }}>{videoTitle}</div>}
              </div>
              {activeResult && (
                <button
                  onClick={() => navigator.clipboard?.writeText(activeResult)}
                  style={{
                    marginLeft: "auto", background: "transparent", border: "1px solid #2a2a2a",
                    borderRadius: "6px", padding: "6px 12px", color: "#5a4a30", cursor: "pointer",
                    fontSize: "12px", fontFamily: "inherit",
                  }}
                >
                  Copy
                </button>
              )}
            </div>

            {/* Result Content */}
            <div style={{ padding: "20px" }}>
              {loading && activeFramework && !activeResult ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{
                    display: "inline-block",
                    width: "36px", height: "36px",
                    border: "2px solid #1a1a1a",
                    borderTop: "2px solid #f59e0b",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <div style={{ marginTop: "16px", color: "#5a4a30", fontSize: "13px", fontStyle: "italic" }}>
                    Claude is analyzing your transcript...
                  </div>
                </div>
              ) : activeResult ? (
                <div
                  style={{ fontSize: "14px", lineHeight: "1.8", color: "#c8b898" }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(activeResult) }}
                />
              ) : (
                <div style={{ color: "#3a3a3a", fontSize: "13px", fontStyle: "italic", textAlign: "center", padding: "30px" }}>
                  Click a framework above to analyze your transcript.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analyze All Button */}
        {transcript && Object.keys(results).length === 0 && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              onClick={() => handleAnalyze(FRAMEWORKS[0])}
              style={{
                background: "linear-gradient(135deg, #b45309, #f59e0b)",
                border: "none", borderRadius: "10px",
                padding: "14px 32px", color: "#0a0a0a",
                fontWeight: "700", fontSize: "14px",
                cursor: "pointer", fontFamily: "inherit",
                letterSpacing: "0.5px",
              }}
            >
              ▶ Start Analysis
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "32px", padding: "16px", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: "11px", color: "#3a2a10", letterSpacing: "2px" }}>
            BUILT BY PUSPA THAPA · POWERED BY CLAUDE SONNET 4 · AI PM PORTFOLIO PROJECT
          </div>
        </div>
      </div>
    </div>
  );
}
