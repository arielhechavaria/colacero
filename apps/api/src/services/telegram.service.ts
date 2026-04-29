export interface TelegramProvider {
  sendChannelMessage(text: string): Promise<void>
}

const mockProvider: TelegramProvider = {
  async sendChannelMessage(text) {
    console.log(`[Telegram MOCK] → canal: ${text}`)
  },
}

function createBotApiProvider(token: string, channelId: string): TelegramProvider {
  return {
    async sendChannelMessage(text) {
      const url = `https://api.telegram.org/bot${token}/sendMessage`
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: channelId, text, parse_mode: 'HTML' }),
      })
      if (!res.ok) {
        const body = await res.json() as { description?: string }
        throw new Error(body.description ?? 'telegram_send_failed')
      }
    },
  }
}

export function createTelegramProvider(
  provider: 'mock' | 'bot-api',
  token?:   string,
  channel?: string,
): TelegramProvider {
  if (provider === 'bot-api') {
    if (!token || !channel) {
      throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID are required for bot-api provider')
    }
    return createBotApiProvider(token, channel)
  }
  return mockProvider
}
