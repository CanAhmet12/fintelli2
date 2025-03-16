import numpy as np
from datetime import datetime, timedelta
from src.database.models import MarketData, Portfolio
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf

class MarketAnalyzer:
    def __init__(self):
        self.model = self._load_or_create_model()
        self.scaler = MinMaxScaler()
        
    def _load_or_create_model(self):
        """Yapay zeka modelini yükler veya oluşturur"""
        try:
            return tf.keras.models.load_model(f"{Config.MODEL_PATH}/market_predictor.h5")
        except:
            return self._create_model()
    
    def _create_model(self):
        """Yeni bir LSTM modeli oluşturur"""
        model = tf.keras.Sequential([
            tf.keras.layers.LSTM(50, return_sequences=True, input_shape=(60, 1)),
            tf.keras.layers.LSTM(50, return_sequences=False),
            tf.keras.layers.Dense(25),
            tf.keras.layers.Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        return model
    
    async def analyze_trend(self, symbol, days=60):
        """Varlık için trend analizi yapar"""
        try:
            # Geçmiş verileri al
            historical_data = await self._get_historical_data(symbol, days)
            
            if len(historical_data) < days:
                return {
                    'trend': 'NEUTRAL',
                    'confidence': 0.5,
                    'prediction': None
                }
            
            # Veriyi hazırla
            prices = np.array([d['price'] for d in historical_data]).reshape(-1, 1)
            scaled_data = self.scaler.fit_transform(prices)
            
            # Tahmin yap
            prediction = self._predict_next_day(scaled_data)
            last_price = prices[-1][0]
            predicted_price = self.scaler.inverse_transform([[prediction]])[0][0]
            
            # Trend analizi
            trend = 'UP' if predicted_price > last_price else 'DOWN'
            confidence = abs(predicted_price - last_price) / last_price
            
            return {
                'trend': trend,
                'confidence': float(confidence),
                'prediction': float(predicted_price)
            }
            
        except Exception as e:
            print(f"Trend analizi hatası: {e}")
            return None
    
    async def get_investment_advice(self, user_id, symbol):
        """Kullanıcıya özel yatırım tavsiyesi oluşturur"""
        try:
            trend_analysis = await self.analyze_trend(symbol)
            portfolio_data = await self._get_user_portfolio(user_id, symbol)
            market_sentiment = await self._get_market_sentiment(symbol)
            
            # Tavsiye oluştur
            advice = {
                'action': self._determine_action(trend_analysis, portfolio_data, market_sentiment),
                'reasoning': self._generate_reasoning(trend_analysis, market_sentiment),
                'risk_level': self._calculate_risk_level(trend_analysis, market_sentiment)
            }
            
            return advice
            
        except Exception as e:
            print(f"Yatırım tavsiyesi hatası: {e}")
            return None 