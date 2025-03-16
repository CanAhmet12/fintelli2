import requests
from datetime import datetime, timedelta
from src.config import Config
from transformers import pipeline

class NewsCollector:
    def __init__(self):
        self.api_key = Config.NEWS_API_KEY
        # Duygu analizi modeli yükleniyor
        self.sentiment_analyzer = pipeline("sentiment-analysis", model="finbert-sentiment")
        
    async def get_financial_news(self, symbol=None, days=1):
        """Finansal haberleri toplar"""
        endpoint = "https://newsapi.org/v2/everything"
        
        # Tarih aralığı belirleme
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Arama parametreleri
        query = f"{symbol} stock" if symbol else "stock market OR cryptocurrency"
        
        params = {
            'q': query,
            'from': start_date.strftime('%Y-%m-%d'),
            'to': end_date.strftime('%Y-%m-%d'),
            'language': 'tr',
            'sortBy': 'relevancy',
            'apiKey': self.api_key
        }
        
        try:
            response = requests.get(endpoint, params=params)
            news_data = response.json()
            
            if news_data['status'] == 'ok':
                processed_news = []
                for article in news_data['articles']:
                    # Her haber için duygu analizi yapılıyor
                    sentiment = await self.analyze_sentiment(article['title'] + " " + article['description'])
                    
                    processed_news.append({
                        'title': article['title'],
                        'description': article['description'],
                        'url': article['url'],
                        'published_at': article['publishedAt'],
                        'sentiment': sentiment
                    })
                
                return processed_news
            return []
            
        except Exception as e:
            print(f"Haber toplama hatası: {e}")
            return []
    
    async def analyze_sentiment(self, text):
        """Metin üzerinde duygu analizi yapar"""
        try:
            result = self.sentiment_analyzer(text)[0]
            return {
                'label': result['label'],
                'score': float(result['score'])
            }
        except Exception as e:
            print(f"Duygu analizi hatası: {e}")
            return {'label': 'NEUTRAL', 'score': 0.5} 