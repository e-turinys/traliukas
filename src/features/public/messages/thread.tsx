"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { ArrowLeft, ExternalLink, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { requestStatusLabels } from "../request-detail/model"
import { appendLocalMessage, canSendMessage, conversationContext, orderedMessages } from "./logic"
import type { MockConversationDetail } from "@/lib/mock/conversations"
import type { Message } from "@/lib/types/conversation"

const statusLabels = { active: "Aktyvus pokalbis", archived: "Baigtas", completed: "Užbaigtas" } as const
const senderLabels = { customer: "Jūs", carrier: "Vežėjas" } as const

function formatMessageTime(value: string) {
  const parts = new Intl.DateTimeFormat("lt-LT", {
    timeZone: "Europe/Vilnius", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(value))
  const valueOf = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? ""
  return `${valueOf("month")}-${valueOf("day")} ${valueOf("hour")}:${valueOf("minute")}`
}

function MessageItem({ message, carrierName }: { message: Message; carrierName: string }) {
  if (message.type === "system") return <li data-message-item data-message-kind="system" className="flex justify-center py-0.5">
    <div role="note" className="max-w-[92%] rounded-lg bg-muted/70 px-3 py-1.5 text-center sm:max-w-xl">
      <p className="break-words text-sm font-medium"><span className="sr-only">Sistemos įvykis: </span>{message.body}</p>
      <time className="mt-0.5 block text-[0.6875rem] leading-4 text-muted-foreground" dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
    </div>
  </li>

  const customer = message.senderType === "customer"
  return <li data-message-item data-message-kind={customer ? "customer" : "carrier"} className={`flex ${customer ? "justify-end" : "justify-start"}`}>
    <article className={`max-w-[86%] space-y-0.5 rounded-2xl px-3.5 py-2.5 sm:max-w-md ${customer ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-card"}`}>
      <p className={`text-xs font-semibold ${customer ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {customer ? senderLabels.customer : carrierName}
      </p>
      <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
      <time className={`block text-xs ${customer ? "text-primary-foreground/75" : "text-muted-foreground"}`} dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
    </article>
  </li>
}

export function MessageThread({ detail }: { detail: MockConversationDetail }) {
  const { conversation, request, offer } = detail
  const [messages, setMessages] = useState(() => orderedMessages(detail.messages))
  const [body, setBody] = useState("")
  const [sentNotice, setSentNotice] = useState("")
  const context = useMemo(() => conversationContext(request), [request])
  const active = canSendMessage(conversation)
  const contextHref = conversation.bookingId ? `/bookings/${encodeURIComponent(conversation.bookingId)}` : `/requests/${encodeURIComponent(request.id)}`
  const contextLabel = conversation.bookingId ? "Atidaryti pervežimą" : "Atidaryti užklausą"

  const send = (event: FormEvent) => {
    event.preventDefault()
    if (!body.trim()) return
    setMessages(current => appendLocalMessage(conversation, current, body, "customer", new Date().toISOString()))
    setBody("")
    setSentNotice("Žinutė pridėta prie pokalbio.")
  }

  return <div className="mx-auto w-full max-w-5xl space-y-5 pb-8">
    <Link href="/messages" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowLeft aria-hidden="true" className="size-4" />Visi pokalbiai
    </Link>

    <header className="min-w-0 space-y-4 border-b pb-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={active ? "default" : "secondary"}>{statusLabels[conversation.status]}</Badge>
            {conversation.bookingId && active && <Badge variant="outline">Aktyvus pervežimas</Badge>}
          </div>
          <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{offer.carrier.name}</h1>
          <p className="break-words font-medium">{context.route}</p>
          <p className="text-sm text-muted-foreground">{context.vehicleLabel} · {requestStatusLabels[request.status]}</p>
        </div>
        <Button nativeButton={false} variant="outline" render={<Link href={contextHref} />} className="h-auto min-h-11 shrink-0 whitespace-normal py-3">
          {contextLabel}<ExternalLink aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </header>

    <Card className="min-w-0 gap-0 py-0">
      <CardContent className="p-0">
        <ol data-message-thread aria-label="Žinutės" className="space-y-2.5 p-4 pb-5 sm:p-5 sm:pb-6">
          {messages.map(message => <MessageItem key={message.id} message={message} carrierName={offer.carrier.name} />)}
        </ol>

        {active ? <form data-message-composer onSubmit={send} className="sticky bottom-0 z-10 border-t bg-background/95 p-3 shadow-[0_-6px_16px_-14px_rgba(0,0,0,0.45)] backdrop-blur sm:p-4">
          <label htmlFor="message-body" className="sr-only">Rašyti žinutę</label>
          <div className="flex min-w-0 items-end gap-2">
            <Textarea id="message-body" value={body} onChange={event => { setBody(event.target.value); setSentNotice("") }} placeholder="Rašyti žinutę" rows={2} maxLength={2000} className="min-h-11 min-w-0 flex-1 resize-y" />
            <Button type="submit" disabled={!body.trim()} className="min-h-11 shrink-0">Siųsti<Send aria-hidden="true" className="size-4" /></Button>
          </div>
          <p role="status" className={sentNotice ? "mt-2 text-xs text-muted-foreground" : "sr-only"}>{sentNotice}</p>
        </form> : <div className="border-t bg-muted/40 p-4 text-center text-sm text-muted-foreground">Šis pokalbis baigtas.</div>}
      </CardContent>
    </Card>
  </div>
}
