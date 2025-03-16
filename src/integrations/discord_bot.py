import discord
from discord.ext import commands
from src.ai_engine.chat_engine import FinancialChatBot
from src.config import Config
import asyncio

class FintelliDiscordBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix='!', intents=intents)
        
        self.chatbot = FinancialChatBot()
        self.setup_commands()
        
    def setup_commands(self):
        @self.command(name='analiz')
        async def analyze(ctx, symbol: str = None):
            """Bir hisse veya kripto para analizi yapar"""
            if not symbol:
                await ctx.send("Lütfen analiz yapmak istediğiniz sembolü girin.\nÖrnek: !analiz THYAO")
                return
                
            async with ctx.typing():
                try:
                    response = await self.chatbot._handle_market_analysis(f"analiz {symbol}")
                    
                    # Discord embed oluştur
                    embed = discord.Embed(
                        title=f"{symbol} Analizi",
                        description=response,
                        color=discord.Color.blue()
                    )
                    embed.set_footer(text="Fintelli AI | Finansal Asistanınız")
                    
                    await ctx.send(embed=embed)
                except Exception as e:
                    await ctx.send("Analiz yapılırken bir hata oluştu. Lütfen tekrar deneyin.")
        
        @self.command(name='portfoy')
        async def portfolio(ctx):
            """Kullanıcının portföy durumunu gösterir"""
            async with ctx.typing():
                try:
                    user_id = ctx.author.id
                    response = await self.chatbot._handle_portfolio_advice(user_id, "portföy durumu")
                    
                    embed = discord.Embed(
                        title="Portföy Durumu",
                        description=response,
                        color=discord.Color.green()
                    )
                    embed.set_footer(text="Fintelli AI | Finansal Asistanınız")
                    
                    await ctx.send(embed=embed)
                except Exception as e:
                    await ctx.send("Portföy bilgileri alınırken bir hata oluştu.")
        
        @self.command(name='haberler')
        async def news(ctx, symbol: str = None):
            """Finansal haberleri gösterir"""
            async with ctx.typing():
                try:
                    news = await self.chatbot.news_collector.get_financial_news(symbol, days=1)
                    
                    if not news:
                        await ctx.send("Haber bulunamadı.")
                        return
                        
                    embed = discord.Embed(
                        title=f"{'Genel Piyasa' if not symbol else symbol} Haberleri",
                        color=discord.Color.blue()
                    )
                    
                    for article in news[:5]:  # İlk 5 haber
                        embed.add_field(
                            name=article['title'],
                            value=f"{article['description'][:100]}...\n[Devamını Oku]({article['url']})",
                            inline=False
                        )
                        
                    await ctx.send(embed=embed)
                except Exception as e:
                    await ctx.send("Haberler alınırken bir hata oluştu.")
        
        @self.event
        async def on_ready():
            print(f'{self.user} olarak giriş yapıldı!')
            await self.change_presence(activity=discord.Game(name="!help için tıkla"))
            
        @self.event
        async def on_message(message):
            if message.author == self.user:
                return
                
            # Komutları işle
            await self.process_commands(message)
            
            # Eğer komut değilse ve DM ise
            if isinstance(message.channel, discord.DMChannel):
                async with message.channel.typing():
                    try:
                        response = await self.chatbot.generate_response(
                            user_id=message.author.id,
                            message=message.content
                        )
                        await message.reply(response)
                    except Exception as e:
                        await message.reply("Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.")
                        
    async def start_bot(self):
        """Bot'u başlatır"""
        await self.start(Config.DISCORD_BOT_TOKEN) 