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
  // Support keys with dots inside segments (e.g. tolerance.0.5).
  const parts = key.split('.')
  let current: unknown = messages
  let index = 0

  while (index < parts.length) {
    if (!current || typeof current !== 'object') {
      current = undefined
      break
    }

    let matched = false
    for (let end = parts.length; end > index; end -= 1) {
      const candidate = parts.slice(index, end).join('.')
      if (candidate in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[candidate]
        index = end
        matched = true
        break
      }
    }

    if (!matched) {
      current = undefined
      break
    }
  }

  if (typeof current !== 'string') return key

  if (!vars) return current

  return Object.entries(vars).reduce(
    (result, [name, replacement]) => result.replace(`{${name}}`, String(replacement)),
    current,
  )
}
