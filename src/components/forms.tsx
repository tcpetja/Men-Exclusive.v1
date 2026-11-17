'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import type { ActionState } from '@/lib/validation'

type FieldProps = {
  label: string
  name: string
  state?: ActionState
  type?: string
  required?: boolean
  hint?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'decimal'
  defaultValue?: string
  placeholder?: string
  min?: string
  maxLength?: number
  textarea?: boolean
  rows?: number
  options?: readonly string[] | { value: string; label: string }[]
  emptyOption?: string
}

/** A labelled input, select or textarea that shows its own validation message and keeps what was typed. */
export function Field(p: FieldProps) {
  const error = p.state?.fields?.[p.name]
  const value = p.state?.values?.[p.name] ?? p.defaultValue ?? ''
  const id = `f-${p.name}`
  const describedBy = [error ? `${id}-err` : null, p.hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined
  const common = { id, name: p.name, required: p.required, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy } as const
  return (
    <div className="field">
      <label htmlFor={id}>
        {p.label}
        {!p.required && <span className="muted"> (optional)</span>}
      </label>
      {p.options ? (
        <select {...common} className="select" defaultValue={value}>
          {p.emptyOption !== undefined && <option value="">{p.emptyOption}</option>}
          {p.options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            )
          })}
        </select>
      ) : p.textarea ? (
        <textarea {...common} className="textarea" rows={p.rows ?? 4} defaultValue={value} maxLength={p.maxLength} placeholder={p.placeholder} />
      ) : (
        <input
          {...common}
          className="input"
          type={p.type ?? 'text'}
          defaultValue={p.type === 'password' ? undefined : value}
          autoComplete={p.autoComplete}
          inputMode={p.inputMode}
          placeholder={p.placeholder}
          min={p.min}
          maxLength={p.maxLength}
        />
      )}
      {p.hint && (
        <span className="hint" id={`${id}-hint`}>
          {p.hint}
        </span>
      )}
      {error && (
        <span className="error" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  )
}

export function SubmitButton({ children, pendingLabel, className = 'btn btn-gold' }: { children: ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending && <span className="spinner" aria-hidden />}
      {pending ? (pendingLabel ?? 'Please wait…') : children}
    </button>
  )
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state?.message) return null
  return (
    <p className={state.ok ? 'notice notice-ok' : 'notice notice-error'} role={state.ok ? 'status' : 'alert'}>
      {state.message}
    </p>
  )
}

/** Hidden field that real people never fill in. */
export function Honeypot() {
  return (
    <div className="hp" aria-hidden>
      <label>
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}
