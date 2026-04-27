export interface WhatsappProvider {
  sendOtp(phone: string, otp: string): Promise<void>
}

const mockProvider: WhatsappProvider = {
  async sendOtp(phone, otp) {
    console.log(`[WhatsApp MOCK] → ${phone}: tu código es ${otp}`)
  },
}

export function createWhatsappProvider(provider: 'mock' | 'meta-cloud'): WhatsappProvider {
  if (provider === 'meta-cloud') {
    throw new Error('Meta Cloud provider not implemented yet')
  }
  return mockProvider
}
