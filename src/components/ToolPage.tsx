'use client'

import { useEffect } from 'react'
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

const UI_BUILD_ID = '2026-07-17-d'
const TOUCH_UI_KEY = 'tax-rookie-touch-ui'

function isTouchUiPreferred() {
  if (typeof window === 'undefined') return false
  if (document.documentElement.classList.contains('touch-ui')) return true
  try {
    if (sessionStorage.getItem(TOUCH_UI_KEY) === '1') return true
  } catch {
    // ignore
  }
  return window.matchMedia('(hover: none), (pointer: coarse), (max-width: 900px)').matches
}

function lockTouchUi() {
  document.documentElement.classList.add('touch-ui')
  try {
    sessionStorage.setItem(TOUCH_UI_KEY, '1')
  } catch {
    // ignore
  }
}

/** Keep mobile spreadsheet once a touch/narrow device is detected (incl. landscape / tab restore). */
function useLockTouchUi() {
  useEffect(() => {
    const touchQuery = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 900px)')

    const update = () => {
      if (isTouchUiPreferred() || touchQuery.matches) {
        lockTouchUi()
      }
    }

    update()
    touchQuery.addEventListener('change', update)

    const onPageShow = (event: PageTransitionEvent) => {
      // Restore sticky preference after tab switches / bfcache.
      if (isTouchUiPreferred()) lockTouchUi()
      if (event.persisted) {
        // Stale cached UI can reappear after bfcache; force a fresh load.
        window.location.reload()
      }
    }
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', update)

    return () => {
      touchQuery.removeEventListener('change', update)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', update)
    }
  }, [])
}

export function ToolPage() {
  const { translate } = useApp()
  useLockTouchUi()

  return (
    <div className="tool-shell" data-ui-build={UI_BUILD_ID}>
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
