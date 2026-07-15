import en from './locales/en.json'
import zhTW from './locales/zh-TW.json'
import type { Locale } from '@/types'

export type Messages = typeof en

const catalogs: Record<Locale, Messages> = {
  en,
  'zh-TW': zhTW,
}

export function getMessages(locale: Locale): Messages {
  return catalogs[locale]
}

export function t(
  messages: Messages,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, messages)

  if (typeof value !== 'string') return key

  if (!vars) return value

  return Object.entries(vars).reduce(
    (result, [name, replacement]) => result.replace(`{${name}}`, String(replacement)),
    value,
  )
}
