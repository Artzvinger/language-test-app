export const sanitizeName = (value: string): string =>
  value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '')

export const sanitizeGroup = (value: string): string =>
  value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\-]/g, '')
