import requests
from datetime import datetime
from src.config import Config

class MarketDataCollector:
    def __init__(self):
        self.api_key = Config.ALPHA_VANTAGE_API_KEY
        
    async def get_stock_data(self, symbol):
        """Hisse senedi verilerini Alpha Vantage'dan çeker"""
        endpoint = f'https://www.alphavantage.co/query'
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(endpoint, params=params)
            data = response.json()
            
            if 'Global Quote' in data:
                return {
                    'symbol': symbol,
                    'price': float(data['Global Quote']['05. price']),
                    'volume': float(data['Global Quote']['06. volume']),
                    'timestamp': datetime.now()
                }
            return None
        except Exception as e:
            print(f"Veri çekme hatası: {e}")
            return None
            
    async def get_crypto_data(self, symbol):
        """Kripto para verilerini Alpha Vantage'dan çeker"""
        endpoint = f'https://www.alphavantage.co/query'
        params = {
            'function': 'CURRENCY_EXCHANGE_RATE',
            'from_currency': symbol,
            'to_currency': 'USD',
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(endpoint, params=params)
            data = response.json()
            
            if 'Realtime Currency Exchange Rate' in data:
                return {
                    'symbol': symbol,
                    'price': float(data['Realtime Currency Exchange Rate']['5. Exchange Rate']),
                    'timestamp': datetime.now()
                }
            return None
        except Exception as e:
            print(f"Veri çekme hatası: {e}")
            return None 