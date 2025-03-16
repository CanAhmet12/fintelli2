import { createSlice, createSelector } from '@reduxjs/toolkit';
import { normalize, schema } from 'normalizr';

// Normalizr şemaları
const messageSchema = new schema.Entity('messages');
const conversationSchema = new schema.Entity('conversations', {
    messages: [messageSchema]
});

const initialState = {
    entities: {
        messages: {},
        conversations: {}
    },
    activeConversationId: null,
    isTyping: false,
    error: null,
    lastMessageTime: null
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveConversation: (state, action) => {
            state.activeConversationId = action.payload;
        },
        addMessage: (state, action) => {
            const { conversationId, message } = action.payload;
            const messageId = `${Date.now()}-${Math.random()}`;
            
            // Mesajı normalize et
            state.entities.messages[messageId] = {
                id: messageId,
                ...message
            };
            
            // Conversation'a mesajı ekle
            const conversation = state.entities.conversations[conversationId];
            if (conversation) {
                conversation.messages.push(messageId);
                conversation.lastMessageTime = Date.now();
            }
            
            state.lastMessageTime = Date.now();
        },
        setTyping: (state, action) => {
            state.isTyping = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        createConversation: (state, action) => {
            const { id, userId } = action.payload;
            state.entities.conversations[id] = {
                id,
                userId,
                messages: [],
                createdAt: Date.now(),
                lastMessageTime: null
            };
        },
        clearError: (state) => {
            state.error = null;
        }
    }
});

// Memoized selectors
export const selectActiveConversation = createSelector(
    state => state.chat.entities.conversations,
    state => state.chat.activeConversationId,
    (conversations, activeId) => conversations[activeId]
);

export const selectActiveMessages = createSelector(
    state => state.chat.entities.messages,
    selectActiveConversation,
    (messages, conversation) => {
        if (!conversation) return [];
        return conversation.messages
            .map(id => messages[id])
            .filter(Boolean)
            .sort((a, b) => a.timestamp - b.timestamp);
    }
);

export const selectIsTyping = state => state.chat.isTyping;
export const selectError = state => state.chat.error;

export const {
    setActiveConversation,
    addMessage,
    setTyping,
    setError,
    createConversation,
    clearError
} = chatSlice.actions;

export default chatSlice.reducer; 