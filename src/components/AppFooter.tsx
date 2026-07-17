'use client'

import { useApp } from '@/context/AppContext'

export function AppFooter({ onVerify }: { onVerify: () => void }) {
  const { translate, summary } = useApp()

  return (
    <footer className="app-footer-bar">
      <div className="workflow-steps" aria-label={translate('footer.workflow')}>
        <span className="workflow-step">{translate('footer.stepImport')}</span>
        <span className="workflow-sep" aria-hidden="true">
          →
        </span>
        <span className="workflow-step">{translate('footer.stepEnter')}</span>
        <span className="workflow-sep" aria-hidden="true">
          →
        </span>
        <span className="workflow-step workflow-step-active">{translate('footer.stepCheck')}</span>
      </div>

      <div className="status-legend">
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

      <button
        type="button"
        className={`btn-verify${summary.anomalyCount > 0 ? ' btn-verify-alert' : ''}`}
        onClick={onVerify}
      >
        {translate('footer.verify')}
        {summary.anomalyCount > 0 ? ` (${summary.anomalyCount})` : ''}
      </button>
    </footer>
  )
}
