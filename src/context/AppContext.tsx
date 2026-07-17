'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMessages, t, type Messages } from '@/lib/i18n'
import { parseAmount } from '@/lib/numbers'
import {
  computeRows,
  createEmptyRow,
  getToleranceValue,
  summarizeRows,
} from '@/lib/verification'
import type {
  ComputedOrderLineRow,
  EditableOrderField,
  Locale,
  OrderLineRow,
  ThemeMode,
  TolerancePreset,
} from '@/types'
import { EDITABLE_ORDER_FIELDS, NUMERIC_ORDER_FIELDS } from '@/types'

const LOCALE_KEY = 'tri-locale'
const THEME_KEY = 'tri-theme'
const TOLERANCE_PRESET_KEY = 'tri-tolerance-preset'
const TOLERANCE_CUSTOM_KEY = 'tri-tolerance-custom'

interface AppContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: Messages
  translate: (key: string, vars?: Record<string, string | number>) => string
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  resolvedTheme: 'light' | 'dark'
  tolerancePreset: TolerancePreset
  setTolerancePreset: (value: TolerancePreset) => void
  customTolerance: number
  setCustomTolerance: (value: number) => void
  tolerance: number
  rows: OrderLineRow[]
  setRows: (rows: OrderLineRow[]) => void
  computedRows: ComputedOrderLineRow[]
  summary: ReturnType<typeof summarizeRows>
  importWizardOpen: boolean
  setImportWizardOpen: (open: boolean) => void
  replaceRowsFromImport: (imported: OrderLineRow[]) => void
  applyPaste: (matrix: string[][], startRowIndex: number, field: EditableOrderField) => void
  updateRow: (
    id: string,
    field: EditableOrderField,
    value: string | number | null,
  ) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(LOCALE_KEY)
  return stored === 'zh-TW' ? 'zh-TW' : 'en'
}

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'light') return 'light'
  if (theme === 'dark') return 'dark'
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function createInitialRows(): OrderLineRow[] {
  return Array.from({ length: 20 }, () => createEmptyRow())
}

function parsePastedValue(field: EditableOrderField, raw: string): string | number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if ((NUMERIC_ORDER_FIELDS as readonly string[]).includes(field)) {
    return parseAmount(trimmed)
  }

  return trimmed
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [theme, setThemeState] = useState<ThemeMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [tolerancePreset, setTolerancePresetState] = useState<TolerancePreset>('0.01')
  const [customTolerance, setCustomToleranceState] = useState(0.01)
  const [rows, setRows] = useState<OrderLineRow[]>(createInitialRows)
  const [importWizardOpen, setImportWizardOpen] = useState(false)

  useEffect(() => {
    setLocaleState(readStoredLocale())
    setThemeState(readStoredTheme())
    const storedPreset = window.localStorage.getItem(TOLERANCE_PRESET_KEY) as TolerancePreset | null
    if (storedPreset) setTolerancePresetState(storedPreset)
    const storedCustom = window.localStorage.getItem(TOLERANCE_CUSTOM_KEY)
    if (storedCustom) setCustomToleranceState(Number(storedCustom) || 0.01)
  }, [])

  useEffect(() => {
    const next = resolveTheme(theme)
    setResolvedTheme(next)
    document.documentElement.dataset.theme = next
    document.documentElement.classList.toggle('dark', next === 'dark')
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolvedTheme(resolveTheme('system'))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const setLocale = useCallback((value: Locale) => {
    setLocaleState(value)
    window.localStorage.setItem(LOCALE_KEY, value)
    document.documentElement.lang = value === 'zh-TW' ? 'zh-Hant' : 'en'
  }, [])

  const setTheme = useCallback((value: ThemeMode) => {
    setThemeState(value)
    window.localStorage.setItem(THEME_KEY, value)
  }, [])

  const setTolerancePreset = useCallback((value: TolerancePreset) => {
    setTolerancePresetState(value)
    window.localStorage.setItem(TOLERANCE_PRESET_KEY, value)
  }, [])

  const setCustomTolerance = useCallback((value: number) => {
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0
    setCustomToleranceState(safe)
    window.localStorage.setItem(TOLERANCE_CUSTOM_KEY, String(safe))
  }, [])

  const tolerance = getToleranceValue(tolerancePreset, customTolerance)
  const messages = getMessages(locale)
  const translate = useCallback(
    (key: string, vars?: Record<string, string | number>) => t(messages, key, vars),
    [messages],
  )

  const computedRows = useMemo(() => computeRows(rows, tolerance), [rows, tolerance])
  const summary = useMemo(() => summarizeRows(computedRows), [computedRows])

  const updateRow = useCallback(
    (id: string, field: EditableOrderField, value: string | number | null) => {
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      )
    },
    [],
  )

  const replaceRowsFromImport = useCallback((imported: OrderLineRow[]) => {
    setRows(imported)
  }, [])

  const applyPaste = useCallback(
    (matrix: string[][], startRowIndex: number, field: EditableOrderField) => {
      const fieldIndex = EDITABLE_ORDER_FIELDS.indexOf(field)
      setRows((current) => {
        const next = [...current]
        const isSingleColumn = matrix.every((row) => row.length === 1)

        if (isSingleColumn) {
          matrix.forEach((row, offset) => {
            const targetIndex = startRowIndex + offset
            while (targetIndex >= next.length) next.push(createEmptyRow())
            const target = next[targetIndex]
            next[targetIndex] = {
              ...target,
              [field]: parsePastedValue(field, row[0] ?? ''),
            }
          })
          return next
        }

        matrix.forEach((row, offset) => {
          const targetIndex = startRowIndex + offset
          while (targetIndex >= next.length) next.push(createEmptyRow())
          const target = next[targetIndex]
          const updates: Partial<OrderLineRow> = {}

          EDITABLE_ORDER_FIELDS.forEach((editableField, index) => {
            const cell = row[fieldIndex + index] ?? row[index]
            if (cell === undefined) return
            updates[editableField] = parsePastedValue(editableField, cell) as never
          })

          next[targetIndex] = { ...target, ...updates }
        })
        return next
      })
    },
    [],
  )

  const value: AppContextValue = {
    locale,
    setLocale,
    messages,
    translate,
    theme,
    setTheme,
    resolvedTheme,
    tolerancePreset,
    setTolerancePreset,
    customTolerance,
    setCustomTolerance,
    tolerance,
    rows,
    setRows,
    computedRows,
    summary,
    importWizardOpen,
    setImportWizardOpen,
    replaceRowsFromImport,
    applyPaste,
    updateRow,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
