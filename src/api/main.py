from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from src.database.models import User, Portfolio, MarketData
from src.ai_engine.market_analyzer import MarketAnalyzer
from src.data_collectors.news_collector import NewsCollector
from src.data_collectors.market_data import MarketDataCollector
from src.ai_engine.chat_engine import FinancialChatBot

app = FastAPI(title="Fintelli API", version="1.0.0")

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servis örnekleri
market_analyzer = MarketAnalyzer()
news_collector = NewsCollector()
market_data_collector = MarketDataCollector()
chatbot = FinancialChatBot()

@app.get("/api/v1/market/analysis/{symbol}")
async def get_market_analysis(symbol: str):
    """Piyasa analizi endpoint'i"""
    try:
        # Piyasa verilerini topla
        market_data = await market_data_collector.get_stock_data(symbol)
        if not market_data:
            market_data = await market_data_collector.get_crypto_data(symbol)
            
        if not market_data:
            raise HTTPException(status_code=404, detail="Veri bulunamadı")
            
        # Trend analizi yap
        trend_analysis = await market_analyzer.analyze_trend(symbol)
        
        # Haberleri topla
        news = await news_collector.get_financial_news(symbol, days=3)
        
        return {
            "current_data": market_data,
            "trend_analysis": trend_analysis,
            "related_news": news
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/portfolio/{user_id}")
async def get_portfolio(user_id: int):
    """Kullanıcı portföyü endpoint'i"""
    try:
        portfolio = await get_user_portfolio(user_id)
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portföy bulunamadı")
            
        # Her varlık için güncel değerleri al
        enriched_portfolio = []
        for asset in portfolio:
            current_price = None
            if asset.asset_type == "stock":
                data = await market_data_collector.get_stock_data(asset.symbol)
            else:
                data = await market_data_collector.get_crypto_data(asset.symbol)
                
            if data:
                current_price = data['price']
                
            enriched_portfolio.append({
                "symbol": asset.symbol,
                "type": asset.asset_type,
                "quantity": asset.quantity,
                "purchase_price": asset.purchase_price,
                "current_price": current_price,
                "profit_loss": (current_price - asset.purchase_price) * asset.quantity if current_price else None
            })
            
        return enriched_portfolio
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/advice/{user_id}/{symbol}")
async def get_investment_advice(user_id: int, symbol: str):
    """Yatırım tavsiyesi endpoint'i"""
    try:
        advice = await market_analyzer.get_investment_advice(user_id, symbol)
        if not advice:
            raise HTTPException(status_code=404, detail="Tavsiye oluşturulamadı")
        return advice
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/chat/{user_id}")
async def chat_with_ai(user_id: int, message: dict):
    """Yapay zeka ile sohbet endpoint'i"""
    try:
        chat_response = await chatbot.generate_response(
            user_id=user_id,
            message=message['text'],
            context=message.get('context', [])
        )
        return {"response": chat_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/chat/history/{user_id}")
async def get_chat_history(user_id: int, limit: int = 10):
    """Kullanıcının sohbet geçmişini getirir"""
    try:
        history = await get_user_chat_history(user_id, limit)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 