import { randomUUID } from "node:crypto";
const conversations = new Map();
export const createConversation = () => {
    const conversation = {
        conversationId: randomUUID(),
        messages: []
    };
    conversations.set(conversation.conversationId, conversation);
    return { ...conversation, messages: [] };
};
export const addMessage = (conversationId, role, content) => {
    const conversation = conversations.get(conversationId);
    const normalizedContent = content.trim();
    if (!conversation || !normalizedContent)
        return undefined;
    const message = {
        role,
        content: normalizedContent,
        timestamp: new Date().toISOString()
    };
    conversation.messages.push(message);
    return { ...message };
};
export const getConversationHistory = (conversationId) => {
    const conversation = conversations.get(conversationId);
    return conversation?.messages.map((message) => ({ ...message }));
};
