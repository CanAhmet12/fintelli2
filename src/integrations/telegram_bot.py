from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from src.ai_engine.chat_engine import FinancialChatBot
from src.config import Config
import asyncio

class FintelliTelegramBot:
    def __init__(self):
        self.token = Config.TELEGRAM_BOT_TOKEN
        self.chatbot = FinancialChatBot()
        self.app = Application.builder().token(self.token).build()
        
        # Komut işleyicilerini ekle
        self.app.add_handler(CommandHandler("start", self.start_command))
        self.app.add_handler(CommandHandler("help", self.help_command))
        self.app.add_handler(CommandHandler("analiz", self.analysis_command))
        self.app.add_handler(CommandHandler("portfoy", self.portfolio_command))
        self.app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
    async def start(self):
        """Bot'u başlatır"""
        await self.app.initialize()
        await self.app.start()
        await self.app.run_polling()
        
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Başlangıç mesajı"""
        welcome_message = """
        🤖 Fintelli'ye hoş geldiniz!
        
        Ben sizin finansal asistanınızım. Size yardımcı olabileceğim konular:
        
        📊 Piyasa Analizi
        📈 Yatırım Tavsiyeleri
        📰 Finansal Haberler
        💼 Portföy Takibi
        
        Nasıl yardımcı olabilirim?
        
        /help komutu ile tüm komutları görebilirsiniz.
        """
        await update.message.reply_text(welcome_message)
        
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Yardım mesajı"""
        help_message = """
        🔍 Kullanılabilir Komutlar:
        
        /analiz [sembol] - Bir hisse veya kripto için analiz
        /portfoy - Portföyünüzün durumu
        /haberler [sembol] - İlgili haberleri göster
        
        Ayrıca benimle doğal dilde konuşabilirsiniz!
        Örnek: "Bitcoin'in durumu nasıl?" veya "THYAO hakkında ne düşünüyorsun?"
        """
        await update.message.reply_text(help_message)
        
    async def analysis_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Analiz komutu"""
        try:
            if not context.args:
                await update.message.reply_text("Lütfen analiz yapmak istediğiniz sembolü girin.\nÖrnek: /analiz THYAO")
                return
                
            symbol = context.args[0].upper()
            response = await self.chatbot._handle_market_analysis(f"analiz {symbol}")
            await update.message.reply_text(response)
            
        except Exception as e:
            await update.message.reply_text("Analiz yapılırken bir hata oluştu. Lütfen tekrar deneyin.")
            
    async def portfolio_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Portföy komutu"""
        try:
            user_id = update.effective_user.id
            response = await self.chatbot._handle_portfolio_advice(user_id, "portföy durumu")
            await update.message.reply_text(response)
            
        except Exception as e:
            await update.message.reply_text("Portföy bilgileri alınırken bir hata oluştu. Lütfen tekrar deneyin.")
            
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Genel mesaj işleyici"""
        try:
            user_id = update.effective_user.id
            message = update.message.text
            
            # Yazıyor... aksiyonu
            await update.message.chat.send_action(action="typing")
            
            # Chatbot'tan yanıt al
            response = await self.chatbot.generate_response(
                user_id=user_id,
                message=message
            )
            
            await update.message.reply_text(response)
            
        except Exception as e:
            await update.message.reply_text("Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.") 