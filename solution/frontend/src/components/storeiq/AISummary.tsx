import { useEffect, useState } from "react";

const COLORS = { INSIGHT: "#1a6b3c", RECOMMENDATION: "#1565c0", "NEXT STEPS": "#c9a96e" } as const;

export function FormattedAIText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 4 }} />;
        const header = (Object.keys(COLORS) as Array<keyof typeof COLORS>).find((h) => trimmed.toUpperCase().startsWith(h));
        if (header) {
          return (
            <div key={i} style={{ color: COLORS[header], fontWeight: 700, letterSpacing: 1, fontSize: 12, textTransform: "uppercase", marginTop: 6 }}>
              {trimmed}
            </div>
          );
        }
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          return (
            <div key={i} className="flex gap-2" style={{ paddingLeft: 6 }}>
              <span style={{ color: "#c9a96e" }}>•</span>
              <span>{trimmed.replace(/^[-•]\s?/, "")}</span>
            </div>
          );
        }
        return <div key={i}>{trimmed}</div>;
      })}
    </div>
  );
}

export function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block rounded-full"
          style={{
            width: 7, height: 7, background: "#c9a96e",
            animation: `siq-bounce 1.2s infinite ease-in-out`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`@keyframes siq-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}`}</style>
    </div>
  );
}

export function AISummaryBox({ open, mode }: { open: boolean; mode: "summary" | "priorities" | null }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open || !mode) return;
    setLoading(true);
    setText("");

    const question = mode === "priorities"
      ? "What are my 3 priorities today? Give me a full performance summary and action plan."
      : "Give me a full store performance summary — what is happening, what is the key story, what do I need to know right now?";

    const fetchSummary = async () => {
      try {
        const res = await fetch("http://localhost:8000/generate_async", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: mode, period: "mtd" }),
        });
        const { job_id } = await res.json();

        const start = Date.now();
        while (Date.now() - start < 60000) {
          await new Promise((r) => setTimeout(r, 1500));
          const poll = await fetch(`http://localhost:8000/get_result/${job_id}`);
          const data = await poll.json();
          if (data.status === "done") {
            setText(data.result ?? "");
            return;
          }
          if (data.status === "error") {
            setText("Unable to generate summary. Please try again.");
            return;
          }
        }
        setText("Request timed out. Please try again.");
      } catch {
        // Fallback to mock
        setText(
          mode === "priorities"
            ? "INSIGHT\nSales MTD are tracking -9.0% vs LY, driven primarily by a -13% drop in Ready-to-Wear and a -10.8% decline in active clients. SPT and ASP remain healthy (+4.5% / +1.2%), so the gap is a traffic and conversion problem, not a basket problem.\n\nRECOMMENDATION\nProtect ASP, recover traffic. Reactivate the 47 Top Tier clients who haven't visited in 60 days with a personal SS25 preview invitation, and double appointment booking targets through May 26.\n\nNEXT STEPS\n• Run reactivation list at 10am; assign 8 clients per senior CA\n• Move 2 RTW looks into Window B\n• Confirm Mandarin coverage on May 24"
            : "INSIGHT\nThree concentrated risks for today.\n\nNEXT STEPS\n• Close the LY gap: brief team on -9.0% MTD and reactivation list before 11am\n• Staff the SS25 preview (May 27): re-assign senior CA VIPs to available top performers\n• Push Leather Goods (+10% TY): reorder low stock items today"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [open, mode]);

  if (!open) return null;
  return (
    <div className="mb-4" style={{ background: "#fffdf0", borderLeft: "4px solid #c9a96e", borderRadius: 6, padding: "14px 18px", border: "1px solid #f0e9c8", borderLeftWidth: 4 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: "#c9a96e", fontWeight: 700, marginBottom: 6 }}>
        {mode === "priorities" ? "TOP 3 PRIORITIES" : "AI SUMMARY"}
      </div>
      {loading ? <TypingDots /> : <FormattedAIText text={text} />}
    </div>
  );
}
