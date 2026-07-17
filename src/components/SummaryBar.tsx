'use client'

import { useApp } from '@/context/AppContext'
import { formatAmount } from '@/lib/numbers'

export function SummaryBar() {
  const { summary, locale, translate } = useApp()
  const numberLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  return (
    <div className="summary-bar" role="status">
      <span>
        {translate('summary.orderCount')}: {summary.orderCount}
      </span>
      <span>
        {translate('summary.lineCount')}: {summary.lineCount}
      </span>
      <span>
        {translate('summary.amountTotal')}: {formatAmount(summary.amountTotal, numberLocale)}
      </span>
      <span className={summary.anomalyCount > 0 ? 'summary-anomaly' : ''}>
        {translate('summary.anomalies')}: {summary.anomalyCount}
      </span>
    </div>
  )
}
