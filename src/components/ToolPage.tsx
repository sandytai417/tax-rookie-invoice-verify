'use client'

import { useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { AppFooter } from '@/components/AppFooter'
import { ExcelImportWizard } from '@/components/ExcelImportWizard'
import { FeedbackButton } from '@/components/FeedbackButton'
import { Header } from '@/components/Header'
import { SummaryBar } from '@/components/SummaryBar'
import { useApp } from '@/context/AppContext'

const InvoiceGrid = dynamic(() => import('@/components/InvoiceGrid').then((mod) => mod.InvoiceGrid), {
  ssr: false,
  loading: () => <div className="grid-panel grid-loading" />,
})

export function ToolPage() {
  const { translate, computedRows } = useApp()
  const gridAreaRef = useRef<HTMLDivElement>(null)

  const handleVerify = useCallback(() => {
    const anomaly = computedRows.find(
      (row) => !row.isTotalRow && row.status === 'out_of_tolerance',
    )
    const incomplete = computedRows.find(
      (row) => !row.isTotalRow && row.status === 'incomplete',
    )
    const target = anomaly ?? incomplete
    if (!target) {
      gridAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    const cell = document.querySelector(`[row-id="${target.id}"]`)
    cell?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [computedRows])

  return (
    <div className="tool-shell">
      <Header />
      <SummaryBar />
      <div className="grid-scroll-area" ref={gridAreaRef}>
        <InvoiceGrid />
      </div>
      <AppFooter onVerify={handleVerify} />
      <p className="privacy-line">{translate('footer.privacy')}</p>
      <FeedbackButton />
      <ExcelImportWizard />
    </div>
  )
}
