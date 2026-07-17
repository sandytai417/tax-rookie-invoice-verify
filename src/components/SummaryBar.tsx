'use client'

import { useApp } from '@/context/AppContext'
import { formatAmount } from '@/lib/numbers'

export function SummaryBar() {
  const { summary, locale, translate } = useApp()
  const numberLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  return (
    <div className="summary-bar" role="status">
      <span>
        {translate('summary.rowCount')}: {summary.rowCount}
      </span>
      <span>
        {translate('summary.netTotal')}: {formatAmount(summary.netTotal, numberLocale)}
      </span>
      <span>
        {translate('summary.taxTotal')}: {formatAmount(summary.taxTotal, numberLocale)}
      </span>
      <span>
        {translate('summary.grossTotal')}: {formatAmount(summary.grossTotal, numberLocale)}
      </span>
      <span className={summary.anomalyCount > 0 ? 'summary-anomaly' : ''}>
        {translate('summary.anomalies')}: {summary.anomalyCount}
      </span>
    </div>
  )
}
