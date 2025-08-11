import { type NextRequest, NextResponse } from "next/server"

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
  }
  callback_query?: {
    id: string
    from: {
      id: number
      first_name: string
      username?: string
    }
    message: {
      message_id: number
      chat: {
        id: number
      }
    }
    data: string
  }
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
      parse_mode: "HTML",
    }),
  })

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()

    if (update.message) {
      const { chat, text, from } = update.message

      if (text === "/start") {
        const keyboard = {
          inline_keyboard: [
            [
              { text: "🦆 Играть за утку", callback_data: "play_duck" },
              { text: "🏹 Играть за охотника", callback_data: "play_hunter" },
            ],
            [
              { text: "🎮 Создать лобби", callback_data: "create_lobby" },
              { text: "🔍 Найти игру", callback_data: "find_game" },
            ],
            [
              { text: "📊 Статистика", callback_data: "stats" },
              { text: "🛍️ Магазин", callback_data: "shop" },
            ],
          ],
        }

        await sendTelegramMessage(
          chat.id,
          `🦆 <b>Добро пожаловать в Duck Hunter!</b>\n\n` + `Привет, ${from.first_name}! Выбери действие:`,
          keyboard,
        )
      }

      if (text === "/help") {
        await sendTelegramMessage(
          chat.id,
          `🎯 <b>Как играть:</b>\n\n` +
            `🦆 <b>За утку:</b> Выбери стартовую позицию и перелетай, избегая выстрелов\n` +
            `🏹 <b>За охотника:</b> Стреляй по клеткам, чтобы найти и подстрелить утку\n\n` +
            `<b>Команды:</b>\n` +
            `/start - Главное меню\n` +
            `/help - Помощь\n` +
            `/stats - Статистика\n` +
            `/shop - Магазин`,
        )
      }
    }

    if (update.callback_query) {
      const { data, from, message } = update.callback_query
      const chatId = message.chat.id

      switch (data) {
        case "play_duck":
          await sendTelegramMessage(
            chatId,
            `🦆 Ты выбрал играть за утку!\n\n` +
              `Перейди в веб-приложение для игры: ${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}`,
          )
          break

        case "play_hunter":
          await sendTelegramMessage(
            chatId,
            `🏹 Ты выбрал играть за охотника!\n\n` +
              `Перейди в веб-приложение для игры: ${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}`,
          )
          break

        case "create_lobby":
          await sendTelegramMessage(
            chatId,
            `🎮 Создание лобби...\n\n` +
              `Перейди в веб-приложение: ${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/lobby`,
          )
          break

        case "find_game":
          await sendTelegramMessage(
            chatId,
            `🔍 Поиск игры...\n\n` +
              `Перейди в веб-приложение: ${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/lobby`,
          )
          break

        case "stats":
          await sendTelegramMessage(
            chatId,
            `📊 Твоя статистика:\n\n` +
              `🏆 Побед: 0\n` +
              `💀 Поражений: 0\n` +
              `🎯 Точность: 0%\n\n` +
              `Начни играть, чтобы увидеть статистику!`,
          )
          break

        case "shop":
          await sendTelegramMessage(
            chatId,
            `🛍️ Магазин предметов:\n\n` +
              `Перейди в веб-приложение для покупок: ${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/shop`,
          )
          break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
