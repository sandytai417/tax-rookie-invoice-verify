'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'

const FEEDBACK_FORM_URL = 'https://forms.gle/XM7MziNAFZUFznCF8'

export function FeedbackButton() {
  const { translate } = useApp()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="feedback-button" onClick={() => setOpen(true)}>
        {translate('feedback.button')}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal modal-small" onClick={(event) => event.stopPropagation()}>
            <header className="modal-header">
              <h2>{translate('feedback.title')}</h2>
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                {translate('feedback.cancel')}
              </button>
            </header>

            <p className="feedback-desc">{translate('feedback.message')}</p>

            <a
              className="feedback-form-link"
              href={FEEDBACK_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {FEEDBACK_FORM_URL}
            </a>

            <div className="wizard-actions">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                {translate('feedback.cancel')}
              </button>
              <a
                className="btn-primary feedback-open-btn"
                href={FEEDBACK_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {translate('feedback.openForm')}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
