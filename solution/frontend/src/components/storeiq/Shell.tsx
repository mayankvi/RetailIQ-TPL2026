import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Dashboard" },
  { to: "/ask-ai", label: "Ask AI" },
  { to: "/staff", label: "Staff & Events" },
  { to: "/inventory", label: "Inventory" },
] as const;

export function Shell({ children, fullHeight = false }: { children: ReactNode; fullHeight?: boolean }) {
  const loc = useLocation();
  const path = loc.pathname;
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#f0f0f0", fontFamily: "system-ui, sans-serif", fontSize: 13, color: "#1a1a1a" }}>
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-3" style={{ background: "#1a1a2e" }}>
        <div style={{ color: "#e9c46a", letterSpacing: 3, fontSize: 14, fontWeight: 700 }}>
          RetailIQ
        </div>
        <div className="flex items-center gap-2">
          {["● Live Data", "⬡ 5 Agents Active", "✦ Claude AI"].map((b) => (
            <span key={b} className="px-2.5 py-1 text-[11px]" style={{ border: "1px solid #e9c46a44", color: "#e9c46a", letterSpacing: 1, borderRadius: 4 }}>
              {b}
            </span>
          ))}
          <span className="px-2.5 py-1 text-[11px] ml-1" style={{ background: "#4361ee", color: "white", borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>
            SM
          </span>
        </div>
      </header>

      {/* Architecture layer strip */}
      <div className="flex items-center gap-2 px-6 py-1.5" style={{ background: "#16213e" }}>
        {["Experience Layer", "Orchestration Layer", "Knowledge Layer", "Observability Layer"].map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <span style={{
              background: "rgba(67,97,238,0.2)",
              border: "1px solid rgba(67,97,238,0.4)",
              color: "#a8b2d8",
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 20,
              letterSpacing: 0.5,
            }}>
              {l}
            </span>
            {i < 3 && <span style={{ color: "#4361ee", fontSize: 11 }}>→</span>}
          </div>
        ))}
        <div className="ml-auto" style={{ color: "#8892b0", fontSize: 11 }}>
          Fifth Avenue Flagship · New York · May 20, 2025
        </div>
      </div>

      {/* Nav */}
      <nav className="w-full flex items-center justify-between px-6" style={{ background: "#1a1a3e", borderBottom: "1px solid #2a2a5e" }}>
        <div className="flex">
          {tabs.map((t) => {
            const active = t.to === "/" ? path === "/" : path.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className="px-5 py-3 transition-colors"
                style={{
                  color: active ? "#e9c46a" : "#8892b0",
                  background: active ? "rgba(233,196,106,0.08)" : "transparent",
                  borderBottom: `2px solid ${active ? "#e9c46a" : "transparent"}`,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: 1,
                  fontSize: 12,
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-[11px]" style={{ background: "rgba(233,196,106,0.1)", color: "#e9c46a", border: "1px solid #e9c46a44", borderRadius: 4, letterSpacing: 1 }}>
            ● May 20, 2025 · Live
          </span>
          <button
            onClick={() => {
              sessionStorage.removeItem("persona_selected");
              navigate({ to: "/persona" });
            }}
            className="px-3 py-1 text-[11px] transition-opacity hover:opacity-80"
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#8892b0",
              borderRadius: 4,
              cursor: "pointer",
              letterSpacing: 1,
            }}
          >
            Switch Role
          </button>
        </div>
      </nav>

      <main className={fullHeight ? "flex-1 flex flex-col overflow-hidden" : "flex-1 overflow-y-auto p-6"}>
        {children}
      </main>
    </div>
  );
}

export function Card({ title, children, className = "", style }: { title?: string; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`bg-white ${className}`} style={{ border: "1px solid #e0e0e0", borderRadius: 8, ...style }}>
      {title && (
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0f0f0", letterSpacing: 1.5, fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>
          {title}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function GoldButton({ children, onClick, type = "button" }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="px-4 py-2 text-[12px] font-medium transition-opacity hover:opacity-90"
      style={{ background: "#e9c46a", color: "#1a1a2e", border: "none", borderRadius: 4, letterSpacing: 0.5, fontWeight: 600 }}
    >
      {children}
    </button>
  );
}