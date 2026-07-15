'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { mapSheetToRows, parseExcelFile, previewRows } from '@/lib/excel'
import type { ColumnMapping, ParsedWorkbook } from '@/types'

type Step = 1 | 2 | 3 | 4 | 5

const FIELD_KEYS = ['net', 'tax', 'gross'] as const

export function ExcelImportWizard() {
  const { importWizardOpen, setImportWizardOpen, replaceRowsFromImport, translate } = useApp()
  const [step, setStep] = useState<Step>(1)
  const [fileName, setFileName] = useState('')
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null)
  const [selectedSheet, setSelectedSheet] = useState('')
  const [mapping, setMapping] = useState<ColumnMapping>({ net: null, tax: null, gross: null })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!importWizardOpen) return
    setStep(1)
    setFileName('')
    setWorkbook(null)
    setSelectedSheet('')
    setMapping({ net: null, tax: null, gross: null })
    setError('')
  }, [importWizardOpen])

  const sheet = workbook?.sheets[selectedSheet]
  const preview = useMemo(() => (sheet ? previewRows(sheet) : []), [sheet])

  if (!importWizardOpen) return null

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    try {
      const parsed = await parseExcelFile(file)
      if (parsed.sheetNames.length === 0) {
        setError(translate('import.errors.noSheets'))
        return
      }

      setWorkbook(parsed)
      setFileName(file.name)
      setSelectedSheet(parsed.sheetNames[0])
      setMapping({ net: null, tax: null, gross: null })
      setStep(parsed.sheetNames.length > 1 ? 2 : 3)
    } catch {
      setError(translate('import.errors.readFailed'))
    }
  }

  function handleImport() {
    if (!sheet) return
    if (!mapping.net && !mapping.tax && !mapping.gross) {
      setError(translate('import.errors.selectField'))
      return
    }

    const rows = mapSheetToRows(sheet, mapping)
    if (rows.length === 0) {
      setError(translate('import.errors.noRows'))
      return
    }

    replaceRowsFromImport(rows)
    setImportWizardOpen(false)
  }

  return (
    <div className="modal-backdrop" onClick={() => setImportWizardOpen(false)}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2>{translate('import.title')}</h2>
            <p>{translate('import.step', { current: step, total: 5 })}</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => setImportWizardOpen(false)}>
            {translate('import.close')}
          </button>
        </header>

        {error && <div className="alert">{error}</div>}

        {step === 1 && (
          <section className="wizard-step">
            <h3>{translate('import.selectFileTitle')}</h3>
            <p>{translate('import.selectFileDesc')}</p>
            <label className="upload-box">
              <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
              <span>{translate('import.chooseFile')}</span>
            </label>
          </section>
        )}

        {step === 2 && workbook && (
          <section className="wizard-step">
            <h3>{translate('import.selectSheetTitle')}</h3>
            <p>
              {translate('import.fileLabel')}: {fileName}
            </p>
            <div className="sheet-list">
              {workbook.sheetNames.map((name) => (
                <label key={name} className="sheet-option">
                  <input
                    type="radio"
                    name="sheet"
                    checked={selectedSheet === name}
                    onChange={() => setSelectedSheet(name)}
                  />
                  <span>{name}</span>
                </label>
              ))}
            </div>
            <div className="wizard-actions">
              <button type="button" className="btn-ghost" onClick={() => setStep(1)}>
                {translate('import.back')}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (!selectedSheet) {
                    setError(translate('import.errors.selectSheet'))
                    return
                  }
                  setError('')
                  setStep(3)
                }}
              >
                {translate('import.next')}
              </button>
            </div>
          </section>
        )}

        {step === 3 && sheet && (
          <section className="wizard-step">
            <h3>{translate('import.previewTitle')}</h3>
            <p>
              {translate('import.sheetLabel')}: {selectedSheet}
            </p>
            <div className="table-wrap">
              <table className="preview-table">
                <thead>
                  <tr>
                    {sheet.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="wizard-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setStep(workbook && workbook.sheetNames.length > 1 ? 2 : 1)}
              >
                {translate('import.back')}
              </button>
              <button type="button" className="btn-primary" onClick={() => setStep(4)}>
                {translate('import.next')}
              </button>
            </div>
          </section>
        )}

        {step === 4 && sheet && (
          <section className="wizard-step">
            <h3>{translate('import.mappingTitle')}</h3>
            <p>{translate('import.mappingDesc')}</p>
            <div className="mapping-grid">
              {FIELD_KEYS.map((field) => (
                <label key={field} className="mapping-row">
                  <span>{translate(`grid.${field}`)}</span>
                  <select
                    value={mapping[field] ?? ''}
                    onChange={(event) =>
                      setMapping((current) => ({
                        ...current,
                        [field]: event.target.value || null,
                      }))
                    }
                    className="control-input"
                  >
                    <option value="">{translate('import.notSpecified')}</option>
                    {sheet.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="wizard-actions">
              <button type="button" className="btn-ghost" onClick={() => setStep(3)}>
                {translate('import.back')}
              </button>
              <button type="button" className="btn-primary" onClick={() => setStep(5)}>
                {translate('import.next')}
              </button>
            </div>
          </section>
        )}

        {step === 5 && sheet && (
          <section className="wizard-step">
            <h3>{translate('import.confirmTitle')}</h3>
            <ul className="confirm-list">
              <li>
                {translate('import.fileLabel')}: {fileName}
              </li>
              <li>
                {translate('import.sheetLabel')}: {selectedSheet}
              </li>
              <li>
                {translate('grid.net')}: {mapping.net ?? translate('import.notSpecified')}
              </li>
              <li>
                {translate('grid.tax')}: {mapping.tax ?? translate('import.notSpecified')}
              </li>
              <li>
                {translate('grid.gross')}: {mapping.gross ?? translate('import.notSpecified')}
              </li>
            </ul>
            <div className="wizard-actions">
              <button type="button" className="btn-ghost" onClick={() => setStep(4)}>
                {translate('import.back')}
              </button>
              <button type="button" className="btn-primary" onClick={handleImport}>
                {translate('import.import')}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
