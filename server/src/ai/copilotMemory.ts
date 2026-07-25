import { randomUUID } from "node:crypto";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  conversationId: string;
  messages: ConversationMessage[];
}

const conversations = new Map<string, Conversation>();

export const createConversation = (): Conversation => {
  const conversation: Conversation = {
    conversationId: randomUUID(),
    messages: []
  };
  conversations.set(conversation.conversationId, conversation);
  return { ...conversation, messages: [] };
};

export const addMessage = (
  conversationId: string,
  role: ConversationMessage["role"],
  content: string
): ConversationMessage | undefined => {
  const conversation = conversations.get(conversationId);
  const normalizedContent = content.trim();
  if (!conversation || !normalizedContent) return undefined;
  const message: ConversationMessage = {
    role,
    content: normalizedContent,
    timestamp: new Date().toISOString()
  };
  conversation.messages.push(message);
  return { ...message };
};

export const getConversationHistory = (conversationId: string): ConversationMessage[] | undefined => {
  const conversation = conversations.get(conversationId);
  return conversation?.messages.map((message) => ({ ...message }));
};
