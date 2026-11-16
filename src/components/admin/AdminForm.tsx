'use client'

import { useActionState, useId, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import type { ActionState } from '@/lib/validation'

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>

/** Wraps an admin form: runs the server action, then shows what happened and any field problems. */
export function AdminForm({ action, children, submitLabel = 'Save', hidden, extra }: { action: Action; children?: ReactNode; submitLabel?: string; hidden?: Record<string, string>; extra?: ReactNode }) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null)
  const problems = state?.fields ? Object.entries(state.fields).filter(([k]) => k !== '_') : []
  return (
    <form action={formAction} className="a-form">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      {state?.message && (
        <div className={state.ok ? 'a-note a-note-ok' : 'a-note a-note-bad'} role={state.ok ? 'status' : 'alert'}>
          {state.message}
          {problems.length > 0 && (
            <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: 'disc' }}>
              {problems.map(([k, msg]) => (
                <li key={k}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="a-actions">
        <Submit label={submitLabel} />
        {extra}
      </div>
    </form>
  )
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="a-btn a-btn-primary" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  )
}

/** A small button that runs a server action after asking the person to confirm. */
export function ConfirmButton({ action, hidden, label, confirm, className = 'a-btn a-btn-sm a-btn-danger' }: { action: (form: FormData) => Promise<void>; hidden: Record<string, string>; label: string; confirm: string; className?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault()
      }}
      style={{ display: 'inline' }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  )
}

/**
 * A confirm-then-run button for use INSIDE an AdminForm: it submits the surrounding form's fields
 * (including its hidden id) to a different server action, so no nested form is needed.
 */
export function ConfirmSubmit({ action, label, confirm }: { action: (form: FormData) => Promise<void>; label: string; confirm: string }) {
  return (
    <button
      type="submit"
      formAction={action}
      formNoValidate
      className="a-btn a-btn-sm a-btn-danger"
      onClick={(e) => {
        if (!window.confirm(confirm)) e.preventDefault()
      }}
    >
      {label}
    </button>
  )
}

type InputProps = {
  label: string
  name: string
  defaultValue?: string | number | null
  help?: string
  type?: string
  placeholder?: string
  required?: boolean
  rows?: number
  options?: { value: string; label: string }[]
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url'
}

export function AField({ label, name, defaultValue, help, type = 'text', placeholder, required, rows, options, inputMode }: InputProps) {
  const id = useId()
  const value = defaultValue == null ? '' : String(defaultValue)
  return (
    <div className="a-field">
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select id={id} name={name} className="a-select" defaultValue={value}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea id={id} name={name} className="a-textarea" rows={rows} defaultValue={value} placeholder={placeholder} required={required} />
      ) : (
        <input id={id} name={name} type={type} className="a-input" defaultValue={value} placeholder={placeholder} required={required} inputMode={inputMode} />
      )}
      {help && <small>{help}</small>}
    </div>
  )
}

export function ACheck({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="a-check">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  )
}
