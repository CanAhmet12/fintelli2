import asyncio
from src.integrations.discord_bot import FintelliDiscordBot

async def main():
    bot = FintelliDiscordBot()
    await bot.start_bot()

if __name__ == "__main__":
    asyncio.run(main()) 