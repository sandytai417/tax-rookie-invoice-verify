'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'

export function FeedbackButton() {
  const { translate } = useApp()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!message.trim()) {
      setError(translate('feedback.required'))
      return
    }

    const subject = encodeURIComponent(translate('feedback.mailtoSubject'))
    const body = encodeURIComponent(
      `${message.trim()}${email.trim() ? `\n\nEmail: ${email.trim()}` : ''}`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setOpen(false)
    setMessage('')
    setEmail('')
    setError('')
  }

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

            {error && <div className="alert">{error}</div>}

            <label className="form-field">
              <span>{translate('feedback.message')}</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="form-textarea"
                rows={4}
              />
            </label>

            <label className="form-field">
              <span>{translate('feedback.email')}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="control-input"
              />
            </label>

            <div className="wizard-actions">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                {translate('feedback.cancel')}
              </button>
              <button type="button" className="btn-primary" onClick={handleSubmit}>
                {translate('feedback.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
