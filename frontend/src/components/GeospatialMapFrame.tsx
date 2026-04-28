import type { ReactNode } from 'react'
import clsx from 'clsx'

/** Dark navy shell + header like the “Geospatial Tracking” dashboard card (light map inside). */
export function GeospatialMapFrame({
  children,
  subtitle = 'Mumbai MMR · live layers',
  className,
}: {
  children: ReactNode
  subtitle?: string
  className?: string
}) {
  return (
    <div
      className={clsx(
        'rounded-3xl overflow-hidden border border-slate-700/90 bg-[#0b1220] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)]',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-slate-700/80 bg-[#0f172a]">
        <h2 className="text-sm font-semibold tracking-wide text-slate-100">Geospatial Tracking</h2>
        <span className="text-xs text-slate-400">{subtitle}</span>
      </div>
      <div className="p-3 bg-[#0b1220]">{children}</div>
    </div>
  )
}
