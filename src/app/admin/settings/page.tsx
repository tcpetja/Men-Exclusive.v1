import type { Metadata } from 'next'
import { saveSettingsAction } from '@/app/actions/admin'
import { AdminForm, AField } from '@/components/admin/AdminForm'
import { emailConfigured } from '@/lib/email'
import { getSettings, siteUrl } from '@/lib/settings'
import { yocoConfig } from '@/lib/yoco'

export const metadata: Metadata = { title: 'Store settings' }

export default async function AdminSettings() {
  const s = await getSettings()
  const yoco = yocoConfig()
  const ready = Boolean(yoco.secretKey && yoco.webhookSecret)
  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Store settings</h1>
          <p className="a-sub">These details appear across the website, in emails and in your policies. Anything left empty is simply not shown.</p>
        </div>
      </div>

      <section className="a-card">
        <h2>Contact details</h2>
        <p className="a-help">Customers tap these to call, email or message you.</p>
        <AdminForm action={saveSettingsAction} submitLabel="Save contact details">
          <div className="a-row a-row-3">
            <AField label="WhatsApp number" name="whatsapp" defaultValue={s.whatsapp} inputMode="tel" help="Every WhatsApp button on the website opens a chat with this number." />
            <AField label="Phone number" name="phone" defaultValue={s.phone} inputMode="tel" />
            <AField label="Second phone number" name="phoneAlt" defaultValue={s.phoneAlt} inputMode="tel" />
          </div>
          <div className="a-row">
            <AField label="Email address shown to customers" name="email" defaultValue={s.email} inputMode="email" />
            <AField label="Send order and enquiry notifications to" name="notifyEmail" defaultValue={s.notifyEmail} inputMode="email" help="Leave empty to use the address on the left." />
          </div>
        </AdminForm>
      </section>

      <section className="a-card">
        <h2>Store address and hours</h2>
        <AdminForm action={saveSettingsAction} submitLabel="Save address and hours">
          <div className="a-row">
            <AField label="Building" name="building" defaultValue={s.building} />
            <AField label="Street address" name="street" defaultValue={s.street} />
          </div>
          <div className="a-row a-row-3">
            <AField label="City" name="city" defaultValue={s.city} />
            <AField label="Province" name="province" defaultValue={s.province} />
            <AField label="Postal code" name="postalCode" defaultValue={s.postalCode} />
          </div>
          <AField label="Google Maps link" name="mapUrl" defaultValue={s.mapUrl} inputMode="url" help="Used for the “Get directions” links." />
          <AField label="Trading hours" name="hours" defaultValue={s.hours} rows={4} placeholder={'Monday to Friday: 09:00 to 17:00\nSaturday: 09:00 to 15:00\nSunday and public holidays: Closed'} help="One line per entry. Leave empty to hide trading hours." />
        </AdminForm>
      </section>

      <section className="a-card">
        <h2>Business details</h2>
        <p className="a-help">South African law (the ECT Act) requires an online store to show its registered name, registration number and contact details. These appear in your terms and the footer.</p>
        <AdminForm action={saveSettingsAction} submitLabel="Save business details">
          <div className="a-row">
            <AField label="Registered business name" name="legalName" defaultValue={s.legalName} placeholder="For example: Men Exclusive (Pty) Ltd" />
            <AField label="Company registration number" name="registrationNumber" defaultValue={s.registrationNumber} />
          </div>
          <div className="a-row">
            <AField label="VAT number" name="vatNumber" defaultValue={s.vatNumber} help="Only if the business is registered for VAT." />
            <AField label="Information Officer (POPIA)" name="informationOfficer" defaultValue={s.informationOfficer} help="The person customers contact about their personal information." />
          </div>
        </AdminForm>
      </section>

      <section className="a-card">
        <h2>Social media</h2>
        <AdminForm action={saveSettingsAction} submitLabel="Save social links">
          <div className="a-row a-row-3">
            <AField label="Instagram" name="instagram" defaultValue={s.instagram} placeholder="https://instagram.com/…" inputMode="url" />
            <AField label="Facebook" name="facebook" defaultValue={s.facebook} placeholder="https://facebook.com/…" inputMode="url" />
            <AField label="TikTok" name="tiktok" defaultValue={s.tiktok} placeholder="https://tiktok.com/@…" inputMode="url" />
          </div>
        </AdminForm>
      </section>

      <section className="a-card">
        <h2>Checkout and search engines</h2>
        <AdminForm action={saveSettingsAction} submitLabel="Save">
          <div className="a-row a-row-3">
            <AField label="Hold stock for unpaid orders (minutes)" name="reservationMinutes" type="number" defaultValue={s.reservationMinutes} help="If payment is not completed in this time, the order is cancelled and the stock is released." />
            <AField label="Google Analytics ID" name="gaMeasurementId" defaultValue={s.gaMeasurementId} placeholder="G-XXXXXXXXXX" help="Analytics only runs for visitors who accept it." />
            <AField label="Google Search Console code" name="searchConsoleVerification" defaultValue={s.searchConsoleVerification} help="The verification code from the HTML tag method." />
          </div>
        </AdminForm>
      </section>

      <section className="a-card">
        <h2>Connections</h2>
        <p className="a-help">These are set up by your developer in the hosting environment, not on this page, so that secret keys are never stored in the website or the database.</p>
        <ul className="a-list">
          <li>
            <span className={`a-dot ${ready ? (yoco.mode === 'live' ? 'a-dot-ok' : '') : 'a-dot-bad'}`} aria-hidden />
            <span>
              <strong>Yoco payments:</strong> {ready ? (yoco.mode === 'live' ? 'connected in live mode.' : 'connected in test mode. No real money is taken.') : `not connected. ${yoco.problems.join(' ')}`}
            </span>
          </li>
          <li>
            <span className={`a-dot ${emailConfigured() ? 'a-dot-ok' : 'a-dot-bad'}`} aria-hidden />
            <span>
              <strong>Email:</strong> {emailConfigured() ? 'connected.' : 'not connected. Customers will not receive order confirmations until SMTP details are added.'}
            </span>
          </li>
          <li>
            <span className="a-dot a-dot-ok" aria-hidden />
            <span>
              <strong>Website address:</strong> {siteUrl()}. Yoco webhook address: {siteUrl()}/api/webhooks/yoco
            </span>
          </li>
        </ul>
      </section>
    </>
  )
}
