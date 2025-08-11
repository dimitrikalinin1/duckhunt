const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function sendTelegramNotification(chatId: number, message: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN not configured")
    return
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    if (!response.ok) {
      console.error("Failed to send Telegram notification:", await response.text())
    }
  } catch (error) {
    console.error("Telegram notification error:", error)
  }
}

export async function notifyPlayerTurn(chatId: number, playerRole: "duck" | "hunter", gameState: string) {
  const messages = {
    duck: {
      "duck-initial": "🦆 Выбери стартовую позицию!",
      duck: "🦆 Твой ход! Перелети в новую клетку",
      hunter: "⏳ Ход охотника... Жди выстрела",
      ended: "🎯 Игра окончена!",
    },
    hunter: {
      "duck-initial": "⏳ Утка выбирает позицию...",
      hunter: "🏹 Твой ход! Стреляй по клетке",
      duck: "⏳ Ход утки... Она перелетает",
      ended: "🎯 Игра окончена!",
    },
  }

  const message = messages[playerRole][gameState as keyof typeof messages.duck]
  if (message) {
    await sendTelegramNotification(chatId, message)
  }
}
