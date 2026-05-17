import { API_BASE_URL } from "@/config";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getKpis: () => get<any>("/get_kpis"),
  getWhat: () => get<any>("/get_what"),
  getWhom: () => get<any>("/get_whom"),
  getWho: () => get<any>("/get_who"),
  getTrend: () => get<any>("/get_trend"),
  getAppointments: () => get<any>("/get_appointments"),
  getStaff: () => get<any>("/get_staff"),
  getInventory: () => get<any>("/get_inventory"),
  getEvents: () => get<any>("/get_events"),
  getSuggestedQuestions: () => get<any>("/get_suggested_questions"),

  // NOTE: backend expects { question: string }
  chat: (question: string, persona?: string) =>
  post<{ job_id: string }>("/chat", { question, persona }),

  getChatResult: (jobId: string) =>
    get<{ status: "running" | "done" | "error"; answer?: string; result?: string }>(
      `/get_chat_result/${jobId}`
    ),
};