# AIChat Component

AI Chat bileşeni, kullanıcı ile yapay zeka asistanı arasındaki mesajlaşma arayüzünü sağlar.

## Özellikler

- Real-time mesajlaşma
- Erişilebilirlik desteği
- Hata yönetimi
- Performans optimizasyonları
- i18n desteği

## Kullanım
jsx
import { AIChat } from '../components';
function ChatPage() {
return (
<AIChat
userId="user123"
conversationId="conv456"
initialMessages={[
{ text: "Merhaba!", sender: "user" }
]}
/>
);
}

## Props

| Prop | Tip | Zorunlu | Varsayılan | Açıklama |
|------|-----|---------|------------|-----------|
| userId | string | Evet | - | Aktif kullanıcının ID'si |
| conversationId | string | Evet | - | Aktif konuşma ID'si |
| initialMessages | array | Hayır | [] | Başlangıç mesajları |
| initialIsTyping | boolean | Hayır | false | Başlangıç yazıyor durumu |

## Mesaj Formatı
typescript
interface Message {
text: string; // Mesaj içeriği
sender: 'user' | 'ai'; // Gönderen tipi
timestamp?: number; // Gönderim zamanı
}

## Erişilebilirlik

Bileşen WCAG 2.1 AA standartlarına uygundur:

- Klavye navigasyonu
- Screen reader desteği
- ARIA attributes
- Yüksek kontrast
- Focus yönetimi

## State Management

Redux store'da yönetilen state'ler:
typescript
interface ChatState {
entities: {
messages: Record<string, Message>;
conversations: Record<string, Conversation>;
};
activeConversationId: string | null;
isTyping: boolean;
error: string | null;
}

## Performans

- Lazy loading
- Memoization
- Virtualization
- Bundle optimization

## Hata Yönetimi
typescript
type ErrorTypes =
| 'ValidationError'
| 'NetworkError'
| 'AuthError'
| 'APIError';
interface ErrorInfo {
type: ErrorTypes;
message: string;
context: {
component: string;
action: string;
data?: any;
};
}

## Metrikler

İzlenen performans metrikleri:

- Mesaj gönderme süresi
- Render süreleri
- Memory kullanımı
- Error rates

## Örnek Kullanımlar

### Basit Kullanım
jsx
<AIChat userId="user123" conversationId="conv456" />

### Özel Başlangıç Durumu
jsx
<AIChat
userId="user123"
conversationId="conv456"
initialMessages={[
{ text: "Hoş geldiniz!", sender: "ai" }
]}
initialIsTyping={true}
/>

### Error Boundary ile
jsx
<ErrorBoundary>
<AIChat userId="user123" conversationId="conv456" />
</ErrorBoundary>

## Test

### Unit Tests
javascript
describe('AIChat', () => {
it('renders correctly', () => {
const { getByRole } = render(<AIChat userId="test" conversationId="test" />);
expect(getByRole('region')).toBeInTheDocument();
});
});
### Integration Tests
javascript
describe('AIChat Integration', () => {
it('sends and receives messages', async () => {
const { getByRole, findByText } = render(
<AIChat userId="test" conversationId="test" />
);
await userEvent.type(getByRole('textbox'), 'Test message');
fireEvent.click(getByRole('button'));
expect(await findByText('Test message')).toBeInTheDocument();
});
});
## Stil Özelleştirme
jsx
<AIChat
sx={{
container: {
bgcolor: 'background.paper',
borderRadius: 2
},
messageList: {
maxHeight: 500
}
}}
/>
## İlgili Bileşenler

- ChatMessage
- TypingIndicator
- ErrorBoundary
- NotificationSystem

## Gelecek Geliştirmeler

- [ ] Voice input desteği
- [ ] File sharing
- [ ] Message reactions
- [ ] Thread support# Chat API Service

Chat API servisi, backend ile iletişimi yöneten merkezi servistir.

## Metodlar

### sendMessage

Yeni mesaj gönderir.
typescript
interface SendMessageParams {
userId: string;
text: string;
conversationId: string;
}
interface SendMessageResponse {
response: string;
timestamp: number;
messageId: string;
}
async function sendMessage(params: SendMessageParams): Promise<SendMessageResponse>
### getConversationHistory

Konuşma geçmişini getirir.
typescript
interface GetHistoryResponse {
messages: Array<{
id: string;
text: string;
sender: 'user' | 'ai';
timestamp: number;
}>;
metadata: {
totalMessages: number;
lastMessageTime: number;
};
}
async function getConversationHistory(conversationId: string): Promise<GetHistoryResponse>
### deleteConversation

Konuşmayı siler.
typescript
async function deleteConversation(conversationId: string): Promise<void>
## Hata Yönetimi
typescript
interface APIError {
status: number;
message: string;
code: string;
details?: any;
}
class ChatAPIError extends Error {
constructor(error: APIError) {
super(error.message);
this.status = error.status;
this.code = error.code;
}
}
## Örnek Kullanım
javascript
import chatAPI from '../services/api/chat';
// Mesaj gönderme
try {
const response = await chatAPI.sendMessage({
userId: 'user123',
text: 'Hello!',
conversationId: 'conv456'
});
console.log('AI response:', response.response);
} catch (error) {
console.error('Failed to send message:', error);
}
// Geçmiş getirme
try {
const history = await chatAPI.getConversationHistory('conv456');
console.log('Total messages:', history.metadata.totalMessages);
} catch (error) {
console.error('Failed to fetch history:', error);
}
## Rate Limiting

- 1 saniye başına maksimum 1 mesaj
- 1 dakika başına maksimum 30 mesaj
- 1 saat başına maksimum 500 mesaj

## Error Codes

| Code | Description |
|------|-------------|
| RATE_LIMIT_EXCEEDED | Rate limit aşıldı |
| INVALID_INPUT | Geçersiz input |
| UNAUTHORIZED | Yetkilendirme hatası |
| SERVER_ERROR | Sunucu hatası |

## Monitoring

- Request süreleri
- Error rates
- Success rates
- Response size

## Security

- Input validation
- CSRF protection
- Rate limiting
- Error sanitization