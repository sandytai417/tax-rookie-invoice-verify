'use client'

import dynamic from 'next/dynamic'
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
  const { translate } = useApp()

  return (
    <div className="tool-shell">
      <Header />
      <SummaryBar />
      <div className="grid-scroll-area">
        <p className="grid-hint">{translate('empty.hint')}</p>
        <InvoiceGrid />
      </div>
      <footer className="app-footer">{translate('footer.privacy')}</footer>
      <FeedbackButton />
      <ExcelImportWizard />
    </div>
  )
}
