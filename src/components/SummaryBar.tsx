'use client'

import { useApp } from '@/context/AppContext'
import { formatMoney } from '@/lib/numbers'

function ItemsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function NetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="7" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 11h16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function TaxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h8l4 4v14H7V3z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15 3v4h4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 13h6M10 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function TotalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="14" r="1.2" fill="currentColor" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  )
}

export function SummaryBar() {
  const { summary, locale, translate } = useApp()
  const numberLocale = locale === 'zh-TW' ? 'zh-TW' : 'en-US'

  const cards = [
    {
      key: 'items',
      label: translate('summary.rowCount'),
      value: String(summary.rowCount),
      icon: <ItemsIcon />,
      tone: 'neutral',
    },
    {
      key: 'net',
      label: translate('summary.netTotal'),
      value: formatMoney(summary.netTotal, numberLocale),
      icon: <NetIcon />,
      tone: 'blue',
    },
    {
      key: 'tax',
      label: translate('summary.taxTotal'),
      value: formatMoney(summary.taxTotal, numberLocale),
      icon: <TaxIcon />,
      tone: 'blue',
    },
    {
      key: 'gross',
      label: translate('summary.grossTotal'),
      value: formatMoney(summary.grossTotal, numberLocale),
      icon: <TotalIcon />,
      tone: 'blue',
    },
    {
      key: 'errors',
      label: translate('summary.anomalies'),
      value: String(summary.anomalyCount),
      icon: <ErrorIcon />,
      tone: summary.anomalyCount > 0 ? 'danger' : 'neutral',
    },
  ] as const

  return (
    <div className="summary-bar" role="status">
      {cards.map((card) => (
        <div key={card.key} className={`summary-card summary-card-${card.tone}`}>
          <div className="summary-card-icon">{card.icon}</div>
          <div className="summary-card-body">
            <div className="summary-card-label">{card.label}</div>
            <div className="summary-card-value">{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
