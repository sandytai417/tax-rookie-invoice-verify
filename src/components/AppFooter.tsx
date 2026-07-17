'use client'

import { useApp } from '@/context/AppContext'

export function AppFooter() {
  const { translate } = useApp()

  return (
    <footer className="app-footer-bar">
      <div className="status-legend" aria-label={translate('footer.legend')}>
        <span className="legend-item">
          <span className="legend-dot legend-exact" />
          {translate('status.exact')}
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-within" />
          {translate('status.within_tolerance')}
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-out" />
          {translate('status.out_of_tolerance')}
        </span>
      </div>
      <p className="footer-live-hint">{translate('footer.liveHint')}</p>
    </footer>
  )
}
