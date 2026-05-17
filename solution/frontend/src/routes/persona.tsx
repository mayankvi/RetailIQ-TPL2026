import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/persona")({
  component: PersonaSelector,
});

const GOLD = "#e9c46a";
const BLUE = "#4361ee";
const DARK = "#1a1a2e";

const personas = [
  {
    id: "executive",
    label: "Executive",
    subtitle: "CEO, COO, VP — all regions",
    icon: "💼",
    scope: "All Regions · All Stores",
    color: "#4361ee",
  },
  {
    id: "region",
    label: "Region Head",
    subtitle: "Regional or department leadership",
    icon: "🗺️",
    scope: "Northeast Region · 4 Stores",
    color: "#2d6a4f",
  },
  {
    id: "manager",
    label: "Store Manager",
    subtitle: "Single store operations",
    icon: "🏪",
    scope: "Fifth Avenue Flagship · New York",
    color: "#e9c46a",
  },
  {
    id: "associate",
    label: "Associate",
    subtitle: "Sales floor, tasks, orders",
    icon: "👤",
    scope: "Leather Goods · Fifth Avenue",
    color: "#f4a261",
  },
];

export function PersonaSelector() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
  if (!selected) return;
  sessionStorage.setItem("persona_selected", "true");
  if (selected === "executive") navigate({ to: "/executive" });
  else if (selected === "associate") navigate({ to: "/associate" });
  else if (selected === "region") navigate({ to: "/" });
  else if (selected === "manager") navigate({ to: "/" });
};

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      {/* Logo */}
      <div className="mb-2 text-center">
        <div style={{ color: GOLD, fontSize: 32, fontWeight: 700, letterSpacing: 4 }}>
          RetailIQ
        </div>
        <div style={{ color: "#8892b0", fontSize: 13, letterSpacing: 2, marginTop: 4 }}>
          RETAIL INTELLIGENCE FOR EVERY ROLE
        </div>
      </div>

      {/* Architecture layer strip */}
      <div className="flex items-center gap-2 mb-8 mt-4">
        {["Experience","Orchestration","Knowledge","Observability"].map((layer, i) => (
          <div key={layer} className="flex items-center gap-2">
            <span
              style={{
                background: "rgba(67,97,238,0.2)",
                border: "1px solid rgba(67,97,238,0.5)",
                color: "#a8b2d8",
                fontSize: 10,
                padding: "3px 10px",
                borderRadius: 20,
                letterSpacing: 1,
              }}
            >
              {layer}
            </span>
            {i < 3 && <span style={{ color: "#4361ee", fontSize: 12 }}>→</span>}
          </div>
        ))}
      </div>

      {/* Subtitle */}
      <div style={{ color: "#ccd6f6", fontSize: 14, marginBottom: 32, letterSpacing: 0.5 }}>
        Select your role to personalize your view and data access
      </div>

      {/* Persona cards */}
      <div className="grid grid-cols-2 gap-4 mb-8" style={{ width: 580 }}>
        {personas.map((p) => {
          const isSelected = selected === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setSelected(p.id)}
              className="cursor-pointer transition-all"
              style={{
                background: isSelected ? "rgba(67,97,238,0.15)" : "rgba(255,255,255,0.05)",
                border: `2px solid ${isSelected ? p.color : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12,
                padding: "24px 20px",
                backdropFilter: "blur(10px)",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
              <div style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                {p.label}
              </div>
              <div style={{ color: "#8892b0", fontSize: 12, marginBottom: 12 }}>
                {p.subtitle}
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  color: p.color,
                  display: "inline-block",
                  letterSpacing: 0.5,
                }}
              >
                {p.scope}
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={!selected}
        style={{
          background: selected ? GOLD : "rgba(255,255,255,0.1)",
          color: selected ? DARK : "#555",
          border: "none",
          borderRadius: 8,
          padding: "14px 48px",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 1,
          cursor: selected ? "pointer" : "not-allowed",
          transition: "all 0.2s",
          width: 580,
        }}
      >
        {selected
          ? `Continue as ${personas.find((p) => p.id === selected)?.label} →`
          : "Select a role to continue"}
      </button>

      {/* Footer */}
      <div style={{ color: "#4a5568", fontSize: 11, marginTop: 24, letterSpacing: 1 }}>
        TIGER ANALYTICS · TPL 2026 · THEME 2: AGENTIC AI FOR BUSINESS
      </div>
    </div>
  );
}
