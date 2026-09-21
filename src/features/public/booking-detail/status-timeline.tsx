import { Check } from "lucide-react"
import type { BookingStatus } from "@/lib/types/booking"
import { bookingTimeline } from "./logic"

export function BookingStatusTimeline({ status, vehicleCount }: { status: BookingStatus; vehicleCount: number }) {
  return <ol aria-label="Pervežimo būsenos" className="grid gap-2 md:grid-cols-6 md:gap-0">
    {bookingTimeline(status, vehicleCount).map((step, index) => {
      const complete = step.state === "complete"
      const current = step.state === "current"
      return <li key={step.status} data-timeline-state={step.state} aria-current={current ? "step" : undefined} className="min-w-0 md:flex md:flex-col">
        <div className="hidden items-center md:flex" aria-hidden="true">
          <span data-timeline-connector className={`h-0.5 flex-1 ${index === 0 ? "invisible" : "bg-border"}`} />
          <span data-timeline-node className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${complete ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 ring-offset-2" : "border-border bg-background text-muted-foreground"}`}>
            {complete ? <Check className="size-4" /> : index + 1}
          </span>
          <span data-timeline-connector className={`h-0.5 flex-1 ${index === 5 ? "invisible" : "bg-border"}`} />
        </div>
        <div className={`flex items-center gap-3 rounded-lg border p-3 md:mt-3 md:flex-1 md:flex-col md:gap-1 md:px-2 md:text-center ${current ? "border-primary/20 bg-primary/5" : "border-transparent"}`}>
          <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold md:hidden ${complete ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
            {complete ? <Check className="size-4" /> : index + 1}
          </span>
          <div className="min-w-0 space-y-1">
            <p className={`break-words text-sm leading-snug ${current ? "font-semibold text-primary" : complete ? "font-medium" : "text-muted-foreground"}`}>{step.label}</p>
            <p className="text-xs text-muted-foreground">{complete ? "Atlikta" : current ? "Dabartinė būsena" : "Dar neatlikta"}</p>
          </div>
        </div>
      </li>
    })}
  </ol>
}
