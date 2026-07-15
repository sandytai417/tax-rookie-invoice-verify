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
import {
  computeRows,
  createEmptyRow,
  getToleranceValue,
  summarizeRows,
} from '@/lib/verification'
import type {
  ComputedInvoiceRow,
  InvoiceRow,
  Locale,
  ThemeMode,
  TolerancePreset,
} from '@/types'

const LOCALE_KEY = 'tri-locale'
const THEME_KEY = 'tri-theme'
const TAX_RATE_KEY = 'tri-tax-rate'
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
  taxRate: number
  setTaxRate: (value: number) => void
  tolerancePreset: TolerancePreset
  setTolerancePreset: (value: TolerancePreset) => void
  customTolerance: number
  setCustomTolerance: (value: number) => void
  tolerance: number
  rows: InvoiceRow[]
  setRows: (rows: InvoiceRow[]) => void
  computedRows: ComputedInvoiceRow[]
  summary: ReturnType<typeof summarizeRows>
  importWizardOpen: boolean
  setImportWizardOpen: (open: boolean) => void
  replaceRowsFromImport: (
    imported: Array<{ net: number | null; tax: number | null; gross: number | null }>,
  ) => void
  applyPaste: (matrix: Array<Array<number | null>>, startRowIndex: number, field: 'net' | 'tax' | 'gross') => void
  updateRow: (id: string, field: keyof Pick<InvoiceRow, 'net' | 'tax' | 'gross'>, value: number | null) => void
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

function createInitialRows(): InvoiceRow[] {
  return Array.from({ length: 20 }, () => createEmptyRow())
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [theme, setThemeState] = useState<ThemeMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [taxRate, setTaxRateState] = useState(5)
  const [tolerancePreset, setTolerancePresetState] = useState<TolerancePreset>('0.01')
  const [customTolerance, setCustomToleranceState] = useState(0.01)
  const [rows, setRows] = useState<InvoiceRow[]>(createInitialRows)
  const [importWizardOpen, setImportWizardOpen] = useState(false)

  useEffect(() => {
    setLocaleState(readStoredLocale())
    setThemeState(readStoredTheme())
    const storedRate = window.localStorage.getItem(TAX_RATE_KEY)
    if (storedRate) setTaxRateState(Number(storedRate) || 5)
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

  const setTaxRate = useCallback((value: number) => {
    const safe = Number.isFinite(value) ? Math.max(0, value) : 5
    setTaxRateState(safe)
    window.localStorage.setItem(TAX_RATE_KEY, String(safe))
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

  const computedRows = useMemo(
    () => computeRows(rows, taxRate, tolerance),
    [rows, taxRate, tolerance],
  )
  const summary = useMemo(() => summarizeRows(computedRows), [computedRows])

  const updateRow = useCallback(
    (id: string, field: keyof Pick<InvoiceRow, 'net' | 'tax' | 'gross'>, value: number | null) => {
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      )
    },
    [],
  )

  const replaceRowsFromImport = useCallback(
    (
      imported: Array<{ net: number | null; tax: number | null; gross: number | null }>,
    ) => {
      setRows(
        imported.map((row) => ({
          id: crypto.randomUUID(),
          ...row,
        })),
      )
    },
    [],
  )

  const applyPaste = useCallback(
    (
      matrix: Array<Array<number | null>>,
      startRowIndex: number,
      field: 'net' | 'tax' | 'gross',
    ) => {
      const fieldIndex = ['net', 'tax', 'gross'].indexOf(field)
      setRows((current) => {
        const next = [...current]
        const isSingleColumn = matrix.every((row) => row.length === 1)

        if (isSingleColumn) {
          matrix.forEach((row, offset) => {
            const targetIndex = startRowIndex + offset
            while (targetIndex >= next.length) next.push(createEmptyRow())
            const target = next[targetIndex]
            next[targetIndex] = { ...target, [field]: row[0] }
          })
          return next
        }

        matrix.forEach((row, offset) => {
          const targetIndex = startRowIndex + offset
          while (targetIndex >= next.length) next.push(createEmptyRow())
          const target = next[targetIndex]
          next[targetIndex] = {
            ...target,
            net: row[fieldIndex] ?? row[0] ?? target.net,
            tax: row[fieldIndex + 1] ?? row[1] ?? target.tax,
            gross: row[fieldIndex + 2] ?? row[2] ?? target.gross,
          }
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
    taxRate,
    setTaxRate,
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
