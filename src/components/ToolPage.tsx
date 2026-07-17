'use client'

import { useEffect, useState } from 'react'
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

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px), (pointer: coarse)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isMobile
}

export function ToolPage() {
  const { translate } = useApp()
  const isMobile = useIsMobileViewport()

  return (
    <div className="tool-shell">
      <Header />
      <SummaryBar />
      <div className="grid-scroll-area">
        {isMobile ? (
          <div className="grid-panel mobile-grid-panel">
            <MobileInvoiceTable />
          </div>
        ) : (
          <InvoiceGrid />
        )}
      </div>
      <AppFooter />
      <p className="privacy-line">{translate('footer.privacy')}</p>
      <FeedbackButton />
      <ExcelImportWizard />
    </div>
  )
}
