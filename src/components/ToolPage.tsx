'use client'

import dynamic from 'next/dynamic'
import { AppFooter } from '@/components/AppFooter'
import { ExcelImportWizard } from '@/components/ExcelImportWizard'
import { FeedbackButton } from '@/components/FeedbackButton'
import { Header } from '@/components/Header'
import { MobileInvoiceTable } from '@/components/MobileInvoiceTable'
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
        <p className="mobile-scroll-hint">{translate('empty.mobileScrollHint')}</p>
        <div className="grid-panel desktop-only">
          <InvoiceGrid />
        </div>
        <div className="grid-panel mobile-only mobile-grid-panel">
          <MobileInvoiceTable />
        </div>
      </div>
      <AppFooter />
      <p className="privacy-line">{translate('footer.privacy')}</p>
      <FeedbackButton />
      <ExcelImportWizard />
    </div>
  )
}
