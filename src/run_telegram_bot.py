import asyncio
from src.integrations.telegram_bot import FintelliTelegramBot

async def main():
    bot = FintelliTelegramBot()
    await bot.start()

if __name__ == "__main__":
    asyncio.run(main()) 