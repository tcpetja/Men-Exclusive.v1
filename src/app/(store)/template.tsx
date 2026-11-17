import type { ReactNode } from 'react'

/** Each page eases in when it arrives. A template re-mounts on navigation, which restarts the animation. */
export default function StoreTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>
}
