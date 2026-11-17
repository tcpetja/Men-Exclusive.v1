import type { Metadata } from 'next'
import { saveContentAction } from '@/app/actions/admin'
import { AdminForm, AField } from '@/components/admin/AdminForm'
import { CONTENT_DEFAULTS } from '@/content/defaults'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Website content' }

export default async function AdminContent() {
  const overrides = new Map((await db.contentBlock.findMany()).map((b) => [b.key, b]))
  const groups = [...new Set(CONTENT_DEFAULTS.map((c) => c.group))]
  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Website content</h1>
          <p className="a-sub">
            Edit the wording on the website and your policies. Longer texts use simple formatting: start a line with ## for a heading, ### for a smaller heading and a hyphen for a list item. Put **two stars** around words to make them bold. Details such
            as your address, phone number and email are filled in from Store settings wherever you see {'{{address}}'}, {'{{phone}}'} or {'{{email}}'}.
          </p>
        </div>
      </div>
      {groups.map((group) => (
        <section key={group} className="a-card">
          <h2>{group}</h2>
          {group === 'Policies' && (
            <p className="a-help">These follow the Consumer Protection Act, the ECT Act and POPIA, but they are templates. Have them reviewed, and do not remove the rights they describe.</p>
          )}
          <div style={{ marginTop: 10 }}>
            {CONTENT_DEFAULTS.filter((c) => c.group === group).map((c) => {
              const override = overrides.get(c.key)
              return (
                <details key={c.key} className="a-details">
                  <summary>
                    <span>
                      {c.label} <span className="a-meta">{c.help}</span>
                    </span>
                    {override && (
                      <span className="a-pill a-pill-ok" style={{ marginLeft: 'auto', marginRight: 10 }}>
                        Edited
                      </span>
                    )}
                  </summary>
                  <div className="a-details-body">
                    <AdminForm
                      action={saveContentAction}
                      hidden={{ key: c.key }}
                      extra={
                        override ? (
                          <button type="submit" name="intent" value="reset" className="a-btn a-btn-sm">
                            Restore original text
                          </button>
                        ) : undefined
                      }
                    >
                      <AField label={c.label} name="body" defaultValue={override?.body ?? c.body} rows={c.multiline ? Math.min(28, Math.max(4, Math.ceil((override?.body ?? c.body).length / 90) + 2)) : undefined} />
                    </AdminForm>
                  </div>
                </details>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
