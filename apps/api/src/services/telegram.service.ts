export interface TelegramProvider {
  sendChannelMessage(text: string): Promise<void>
  sendDirectMessage(chatId: string, text: string): Promise<void>
}

const mockProvider: TelegramProvider = {
  async sendChannelMessage(text) {
    console.log(`[Telegram MOCK] → canal: ${text}`)
  },
  async sendDirectMessage(chatId, text) {
    console.log(`[Telegram MOCK] → DM ${chatId}: ${text}`)
  },
}

function createBotApiProvider(
  token:      string,
  channelId:  string,
  catalogUrl?: string,
): TelegramProvider {
  async function send(
    chatId:      string,
    text:        string,
    replyMarkup?: object,
  ): Promise<void> {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:      chatId,
        text,
        parse_mode:   'HTML',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.json() as { description?: string }
      throw new Error(body.description ?? 'telegram_send_failed')
    }
  }

  // Inline keyboard with URL button — web_app type is only valid in private chats,
  // so we use a plain url button which works in channels and opens Telegram's in-app browser
  const miniAppMarkup = catalogUrl
    ? {
        inline_keyboard: [[
          { text: '🛒 Ver catálogo', url: catalogUrl },
        ]],
      }
    : undefined

  return {
    sendChannelMessage: (text) => send(channelId, text, miniAppMarkup),
    sendDirectMessage:  (chatId, text) => send(chatId, text),
  }
}

export function createTelegramProvider(
  provider:    'mock' | 'bot-api',
  token?:      string,
  channel?:    string,
  catalogUrl?: string,
): TelegramProvider {
  if (provider === 'bot-api') {
    if (!token || !channel) {
      throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID are required for bot-api provider')
    }
    return createBotApiProvider(token, channel, catalogUrl)
  }
  return mockProvider
}
