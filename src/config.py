import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Anahtarları
    ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')
    NEWS_API_KEY = os.getenv('NEWS_API_KEY')
    
    # Veritabanı Yapılandırması
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    # Model Parametreleri
    MODEL_PATH = 'models/'
    SENTIMENT_MODEL_NAME = 'sentiment_model'
    
    # API Yapılandırması
    API_VERSION = 'v1'
    BASE_URL = 'http://localhost:8000'
    
    # Telegram Bot Ayarları
    TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    
    # Discord Bot Ayarları
    DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN') 