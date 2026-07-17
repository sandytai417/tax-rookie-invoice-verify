'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { parseClipboardMatrix } from '@/lib/verification'
import type { Locale, TolerancePreset } from '@/types'

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 9l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
    </svg>
  )
}

const RATE_PRESETS = [0, 5, 10] as const

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
    setImportWizardOpen,
    applyPaste,
  } = useApp()
  const [pasteError, setPasteError] = useState('')
  const [forceCustomRate, setForceCustomRate] = useState(false)
  const isCustomRate = forceCustomRate || !RATE_PRESETS.includes(taxRate as 0 | 5 | 10)

  async function handlePasteClick() {
    setPasteError('')
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        setPasteError(translate('header.pasteEmpty'))
        return
      }
      const matrix = parseClipboardMatrix(text)
      if (matrix.length === 0) {
        setPasteError(translate('header.pasteEmpty'))
        return
      }
      applyPaste(matrix, 1, 'net')
    } catch {
      setPasteError(translate('header.pasteFailed'))
    }
  }

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <div className="brand-title">{translate('brand.title')}</div>
            <div className="brand-subtitle">{translate('brand.subtitle')}</div>
          </div>
        </div>

        <div className="header-actions">
          <button type="button" className="btn-action" onClick={handlePasteClick}>
            <ClipboardIcon />
            <span>{translate('header.pasteClipboard')}</span>
          </button>
          <button
            type="button"
            className="btn-action btn-action-primary"
            onClick={() => setImportWizardOpen(true)}
          >
            <UploadIcon />
            <span>{translate('header.importExcel')}</span>
          </button>
        </div>

        <div className="header-settings">
          <label className="control control-stack">
            <span>{translate('header.taxRate')}</span>
            <select
              value={isCustomRate ? 'custom' : String(taxRate)}
              onChange={(event) => {
                if (event.target.value === 'custom') {
                  setForceCustomRate(true)
                  return
                }
                setForceCustomRate(false)
                setTaxRate(Number(event.target.value))
              }}
              className="control-input"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="custom">{translate('header.customRate')}</option>
            </select>
          </label>

          {isCustomRate && (
            <label className="control control-inline">
              <input
                type="number"
                min={0}
                step={0.01}
                value={taxRate}
                onChange={(event) => setTaxRate(Number(event.target.value))}
                className="control-input narrow"
              />
              <span>%</span>
            </label>
          )}

          <label className="control control-stack">
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
            <label className="control control-inline">
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

          <label className="control control-stack">
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
        </div>

        <div className="header-tip">
          <InfoIcon />
          <span>{translate('header.tip')}</span>
        </div>
      </div>

      {pasteError && <div className="header-alert">{pasteError}</div>}
    </header>
  )
}
