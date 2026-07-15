'use client'

import { useApp } from '@/context/AppContext'
import type { Locale, ThemeMode, TolerancePreset } from '@/types'

export function Header() {
  const {
    translate,
    taxRate,
    setTaxRate,
    tolerancePreset,
    setTolerancePreset,
    customTolerance,
    setCustomTolerance,
    locale,
    setLocale,
    theme,
    setTheme,
    setImportWizardOpen,
  } = useApp()

  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-title">{translate('brand.title')}</div>
        <div className="brand-subtitle">{translate('brand.subtitle')}</div>
      </div>

      <div className="header-controls">
        <label className="control">
          <span>{translate('header.taxRate')}</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={taxRate}
            onChange={(event) => setTaxRate(Number(event.target.value))}
            className="control-input narrow"
          />
          <span>{translate('units.percent')}</span>
        </label>

        <label className="control">
          <span>{translate('header.tolerance')}</span>
          <select
            value={tolerancePreset}
            onChange={(event) => setTolerancePreset(event.target.value as TolerancePreset)}
            className="control-input"
          >
            {(['0', '0.01', '0.5', '1', 'custom'] as TolerancePreset[]).map((preset) => (
              <option key={preset} value={preset}>
                {translate(`tolerance.${preset}`)}
              </option>
            ))}
          </select>
        </label>

        {tolerancePreset === 'custom' && (
          <label className="control">
            <input
              type="number"
              min={0}
              step={0.01}
              value={customTolerance}
              onChange={(event) => setCustomTolerance(Number(event.target.value))}
              className="control-input narrow"
            />
          </label>
        )}

        <label className="control">
          <span>{translate('header.language')}</span>
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            className="control-input"
          >
            <option value="en">{translate('language.en')}</option>
            <option value="zh-TW">{translate('language.zh-TW')}</option>
          </select>
        </label>

        <label className="control">
          <span>{translate('header.theme')}</span>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeMode)}
            className="control-input"
          >
            <option value="light">{translate('theme.light')}</option>
            <option value="dark">{translate('theme.dark')}</option>
            <option value="system">{translate('theme.system')}</option>
          </select>
        </label>

        <button type="button" className="btn-primary" onClick={() => setImportWizardOpen(true)}>
          {translate('header.importExcel')}
        </button>
      </div>
    </header>
  )
}
