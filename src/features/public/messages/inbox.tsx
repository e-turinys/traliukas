import Link from "next/link"
import { ArrowRight, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { mockConversationSummary, type MockConversationDetail } from "@/lib/mock/conversations"
import { unreadMessageCount } from "./logic"

const statusLabels = { active: "Aktyvus", archived: "Baigtas", completed: "Užbaigtas" } as const

function formatInboxTime(value: string) {
  return new Intl.DateTimeFormat("lt-LT", { timeZone: "Europe/Vilnius", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

export function MessagesInbox({ conversations }: { conversations: MockConversationDetail[] }) {
  return <div className="mx-auto w-full max-w-5xl space-y-6 py-8 sm:py-12">
    <header className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight">Pokalbiai</h1>
      <p className="text-muted-foreground">Žinutės apie jūsų užklausas ir pervežimus.</p>
    </header>

    <ol aria-label="Pokalbių sąrašas" className="space-y-3">
      {conversations.map(detail => {
        const { conversation, offer, messages } = detail
        const summary = mockConversationSummary(detail)
        const unread = unreadMessageCount(messages, "customer")
        const secondary = conversation.status !== "active"
        return <li key={conversation.id}>
          <Card className={secondary ? "min-w-0 bg-muted/35" : "min-w-0"}>
            <CardContent className="p-0">
              <Link href={`/messages/${encodeURIComponent(conversation.id)}`} className="group grid min-h-24 min-w-0 gap-3 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="break-words font-semibold">{offer.carrier.name}</h2>
                    <Badge variant={secondary ? "secondary" : "outline"}>{conversation.bookingId && conversation.status === "active" ? "Aktyvus pervežimas" : statusLabels[conversation.status]}</Badge>
                    {unread > 0 && <span aria-label={`${unread} neperskaityta`} className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{unread}</span>}
                  </div>
                  <p className="break-words text-sm font-medium">{summary.route} · {summary.vehicleLabel}</p>
                  <p className="line-clamp-2 break-words text-sm text-muted-foreground">{summary.lastMessage}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <time className="text-xs text-muted-foreground" dateTime={summary.lastMessageAt}>{formatInboxTime(summary.lastMessageAt)}</time>
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </li>
      })}
    </ol>

    {!conversations.length && <div className="rounded-xl border p-8 text-center">
      <MessageSquare aria-hidden="true" className="mx-auto mb-3 size-6 text-muted-foreground" />
      <h2 className="font-semibold">Pokalbių dar nėra</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pokalbis atsiras vežėjui pateikus pasiūlymą.</p>
    </div>}
  </div>
}
