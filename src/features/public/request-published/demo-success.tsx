"use client"

import { useRef, useState } from "react"
import type { PublishedRequestSummary } from "./context"
import { RequestSuccessCard } from "./success-card"

// Mounted only by explicit demo IDs. Future publication uses the presentation component
// with an authoritative result; this local review interaction must not become a save operation.
export function DemoRequestSuccess({ id, initialSummary }: { id: string; initialSummary: PublishedRequestSummary }) {
  const [summary, setSummary] = useState(initialSummary)
  const status = useRef<HTMLParagraphElement>(null)
  const expanded = initialSummary.visibility === "targeted" && summary.visibility === "marketplace"
  return (
    <div className="space-y-4">
      <RequestSuccessCard id={id} summary={summary} onExpand={() => {
        setSummary(current => ({ ...current, visibility: "marketplace" }))
        status.current?.focus()
      }} />
      <p ref={status} role="status" tabIndex={-1} className={expanded ? "rounded-lg border p-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" : "sr-only"}>
        {expanded ? "Užklausą mato ir kiti tinkami vežėjai." : ""}
      </p>
    </div>
  )
}
