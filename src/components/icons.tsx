import type { SVGProps } from 'react'

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

type P = SVGProps<SVGSVGElement>

export const IconSearch = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
)
export const IconUser = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M4.5 20.5c1-3.8 4-5.6 7.5-5.6s6.500 1.800 7.500 5.600" />
  </svg>
)
export const IconBag = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 8.500h14l-1 12H6l-1-12z" />
    <path d="M9 8.500V7a3 3 0 016 0v1.500" />
  </svg>
)
export const IconMenu = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.500 7.500h17M3.500 12h17M3.500 16.500h17" />
  </svg>
)
export const IconClose = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const IconCalendar = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="5.500" width="16" height="14.500" />
    <path d="M4 10h16M8.500 3.500v4M15.500 3.500v4" />
  </svg>
)
export const IconPhone = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.500 4h3l1.500 4-2 1.500a11 11 0 005.500 5.500l1.500-2 4 1.500v3a1.500 1.500 0 01-1.600 1.500C11 18.500 5.500 13 5 5.600A1.500 1.500 0 016.500 4z" />
  </svg>
)
export const IconMail = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.500" y="5.500" width="17" height="13" />
    <path d="M4 6.500l8 6.500 8-6.500" />
  </svg>
)
export const IconPin = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 21s6.500-6 6.500-11a6.500 6.500 0 10-13 0c0 5 6.500 11 6.500 11z" />
    <circle cx="12" cy="10" r="2.300" />
  </svg>
)
export const IconCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12.500l4.500 4.500L19 7.500" />
  </svg>
)
export const IconChevron = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 5.500l6.500 6.500L9 18.500" />
  </svg>
)
export const IconLock = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="10.500" width="14" height="10" />
    <path d="M8 10.500V8a4 4 0 018 0v2.500" />
  </svg>
)

/** WhatsApp glyph, drawn in the current colour so it stays within the brand palette. */
export const IconWhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12.040 2a9.900 9.900 0 00-8.560 14.900L2 22l5.250-1.380A9.900 9.900 0 1012.040 2zm0 1.800a8.100 8.100 0 11-4.130 15.070l-.300-.180-3.110.820.830-3.030-.200-.310A8.100 8.100 0 0112.040 3.800zM8.530 7.330c-.170 0-.450.060-.680.320-.240.260-.900.880-.900 2.140s.920 2.490 1.050 2.660c.130.170 1.800 2.850 4.440 3.890 2.190.860 2.640.690 3.120.650.480-.040 1.540-.630 1.760-1.240.220-.610.220-1.130.150-1.240-.060-.110-.240-.170-.500-.300-.260-.130-1.540-.760-1.780-.850-.240-.090-.410-.130-.590.130-.170.260-.670.850-.830 1.020-.150.170-.300.200-.560.070-.260-.130-1.100-.410-2.100-1.290a7.900 7.900 0 01-1.450-1.800c-.150-.260-.020-.400.110-.530.120-.120.260-.300.390-.460.130-.150.170-.260.260-.430.090-.170.040-.330-.020-.460-.060-.130-.580-1.420-.800-1.940-.210-.510-.420-.440-.590-.450l-.500-.010z" />
  </svg>
)
