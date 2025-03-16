from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from src.config import Config
from src.ai_engine.market_analyzer import MarketAnalyzer
from src.data_collectors.news_collector import NewsCollector

class FinancialChatBot:
    def __init__(self):
        # LLM modelini yükle
        self.tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-Instruct-v0.2")
        self.model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-Instruct-v0.2")
        
        # Diğer modülleri başlat
        self.market_analyzer = MarketAnalyzer()
        self.news_collector = NewsCollector()
        
        # Sistem promptu
        self.system_prompt = """Sen Fintelli'nin yapay zeka destekli finansal asistanısın. 
        Görevin kullanıcılara finansal piyasalar, yatırımlar ve portföy yönetimi konusunda 
        yardımcı olmak. Her zaman nazik, profesyonel ve bilgilendirici ol. Belirsizlik 
        durumunda daha fazla bilgi iste. Asla kesin yatırım tavsiyesi verme, bunun yerine 
        analiz ve önerilerde bulun."""
        
    async def generate_response(self, user_id: int, message: str, context: list = None):
        """Kullanıcı mesajına yanıt üretir"""
        try:
            # Mesaj içeriğini analiz et
            intent = self._analyze_intent(message)
            
            # Bağlama göre yanıt oluştur
            if intent == "MARKET_ANALYSIS":
                response = await self._handle_market_analysis(message)
            elif intent == "PORTFOLIO_ADVICE":
                response = await self._handle_portfolio_advice(user_id, message)
            elif intent == "NEWS_QUERY":
                response = await self._handle_news_query(message)
            else:
                response = await self._generate_general_response(message, context)
                
            return response
            
        except Exception as e:
            print(f"Chat yanıt hatası: {e}")
            return "Üzgünüm, şu anda yanıt üretirken bir sorun oluştu. Lütfen tekrar deneyin."
            
    def _analyze_intent(self, message: str) -> str:
        """Kullanıcı mesajının amacını analiz eder"""
        message = message.lower()
        
        if any(word in message for word in ["fiyat", "trend", "analiz", "tahmin"]):
            return "MARKET_ANALYSIS"
        elif any(word in message for word in ["portföy", "yatırım", "al", "sat"]):
            return "PORTFOLIO_ADVICE"
        elif any(word in message for word in ["haber", "gelişme", "duyuru"]):
            return "NEWS_QUERY"
        else:
            return "GENERAL"
            
    async def _handle_market_analysis(self, message: str):
        """Piyasa analizi ile ilgili sorulara yanıt verir"""
        # Sembolü mesajdan çıkar
        symbol = self._extract_symbol(message)
        if not symbol:
            return "Hangi hisse senedi veya kripto para hakkında bilgi almak istersiniz?"
            
        # Analiz yap
        trend_analysis = await self.market_analyzer.analyze_trend(symbol)
        
        response = f"{symbol} için piyasa analizi:\n"
        if trend_analysis:
            response += f"Trend: {trend_analysis['trend']}\n"
            response += f"Güven Seviyesi: %{trend_analysis['confidence']*100:.2f}\n"
            if trend_analysis['prediction']:
                response += f"Tahmin Edilen Fiyat: {trend_analysis['prediction']:.2f}\n"
                
        return response
        
    async def _handle_portfolio_advice(self, user_id: int, message: str):
        """Portföy tavsiyeleri ile ilgili sorulara yanıt verir"""
        symbol = self._extract_symbol(message)
        if symbol:
            advice = await self.market_analyzer.get_investment_advice(user_id, symbol)
            if advice:
                return f"""
                {symbol} için yatırım analizi:
                Önerilen Aksiyon: {advice['action']}
                Gerekçe: {advice['reasoning']}
                Risk Seviyesi: {advice['risk_level']}
                """
        
        return "Portföyünüz hakkında daha spesifik bilgi verebilir misiniz?"
        
    def _extract_symbol(self, message: str) -> str:
        """Mesajdan hisse/kripto sembolünü çıkarır"""
        # Bu fonksiyon geliştirilecek
        # Şimdilik basit bir implementasyon
        words = message.upper().split()
        for word in words:
            if word.isalpha() and len(word) <= 5:
                return word
        return None 