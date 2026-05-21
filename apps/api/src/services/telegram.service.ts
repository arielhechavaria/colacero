export interface TelegramProvider {
  sendChannelMessage(text: string): Promise<void>
  sendChannelPhoto(photoUrl: string, caption?: string): Promise<void>
  sendDirectMessage(chatId: string, text: string): Promise<void>
}

const mockProvider: TelegramProvider = {
  async sendChannelMessage(text) {
    console.log(`[Telegram MOCK] → canal: ${text}`)
  },
  async sendChannelPhoto(photoUrl, caption) {
    console.log(`[Telegram MOCK] → canal photo: ${photoUrl}${caption ? ` · caption: ${caption}` : ''}`)
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

  async function sendPhoto(
    chatId:      string,
    photoUrl:    string,
    caption:     string | undefined,
    replyMarkup?: object,
  ): Promise<void> {
    const url = `https://api.telegram.org/bot${token}/sendPhoto`
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:    chatId,
        photo:      photoUrl,
        ...(caption ? { caption, parse_mode: 'HTML' } : {}),
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.json() as { description?: string }
      throw new Error(body.description ?? 'telegram_send_photo_failed')
    }
  }

  const miniAppMarkup = catalogUrl
    ? {
        inline_keyboard: [[
          { text: '🛒 Ver catálogo', url: catalogUrl },
        ]],
      }
    : undefined

  return {
    sendChannelMessage: (text)               => send(channelId, text, miniAppMarkup),
    sendChannelPhoto:   (photoUrl, caption)  => sendPhoto(channelId, photoUrl, caption, miniAppMarkup),
    sendDirectMessage:  (chatId, text)       => send(chatId, text),
  }
}

export function createTelegramProvider(
  provider:    'mock' | 'bot-api',
  token?:      string,
  channel?:    string,
  catalogUrl?: string,
): TelegramProvider {
  if (provider === 'bot-api') {
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required for bot-api provider')
    }
    // channel solo es requerido para sendChannelMessage/sendChannelPhoto
    // sendDirectMessage funciona sin él
    return createBotApiProvider(token, channel ?? '', catalogUrl)
  }
  return mockProvider
}
