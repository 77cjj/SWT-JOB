import { api } from "@/services/api";

export interface DemoConversation {
  id: string;
  title?: string | null;
  description?: string | null;
  question: string;
  answer?: string | null;
  sortOrder?: number | null;
  pinned?: number | null;
}

export async function listDemoConversations(): Promise<DemoConversation[]> {
  return api.get<DemoConversation[]>("/rag/demo-conversations");
}
