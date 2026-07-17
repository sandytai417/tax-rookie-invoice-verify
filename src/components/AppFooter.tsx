'use client'

import { useApp } from '@/context/AppContext'

const FEEDBACK_FORM_URL = 'https://forms.gle/XM7MziNAFZUFznCF8'

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
      <div className="footer-right">
        <p className="footer-live-hint">{translate('footer.liveHint')}</p>
        <a
          className="footer-feedback-link"
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {translate('feedback.button')}: {FEEDBACK_FORM_URL}
        </a>
      </div>
    </footer>
  )
}
