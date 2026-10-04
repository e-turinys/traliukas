"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { commandClient, commandError } from "../marketplace-persistence/client"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
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

function MessageItem({ message, carrierName, viewer }: { message: Message; carrierName: string; viewer: "customer" | "carrier" }) {
  if (message.type === "system") return <li data-message-item data-message-kind="system" className="flex justify-center py-2">
    <div role="note" className="min-w-0 max-w-xl space-y-1 rounded-lg bg-muted/50 px-3 py-2 text-center">
      <p className="break-words text-sm font-medium"><span className="sr-only">Sistemos įvykis: </span>{message.body}</p>
      <time className="block text-xs text-muted-foreground" dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
    </div>
  </li>

  const customer = message.senderType === "customer"
  return <li data-message-item data-message-kind={customer ? "customer" : "carrier"} className={`flex ${customer ? "justify-end" : "justify-start"}`}>
    <article className={`min-w-0 max-w-5/6 space-y-1 rounded-xl p-3 sm:max-w-md ${customer ? "bg-primary/10" : "bg-muted/60"}`}>
      <p className="break-words text-sm font-semibold">
        {customer ? viewer === "customer" ? senderLabels.customer : "Klientas" : carrierName}
      </p>
      <p className="whitespace-pre-wrap wrap-anywhere text-sm leading-6">{message.body}</p>
      <time className="block text-xs text-muted-foreground" dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
    </article>
  </li>
}

export function MessageThread({ detail }: { detail: MockConversationDetail & { persisted?: boolean; viewer?: "customer" | "carrier" } }) {
  const { conversation, request, offer } = detail
  const router = useRouter()
  const [busy,setBusy] = useState(false)
  const clientKey = useRef<string | null>(null)
  const viewer = detail.viewer ?? "customer"
  const [localMessages, setMessages] = useState(() => orderedMessages(detail.messages))
  const messages = detail.persisted ? orderedMessages(detail.messages) : localMessages
  const [body, setBody] = useState("")
  const [sentNotice, setSentNotice] = useState("")
  useEffect(() => {
    if (detail.persisted && detail.messages.length) {
      const last = Math.max(...detail.messages.map(m => m.sequence ?? 0))
      void commandClient().then(client => client.rpc("mark_conversation_read",{p_conversation_id:conversation.id,p_sequence:last})).catch(() => {})
    }
  },[detail.messages,detail.persisted,conversation.id])
  const context = useMemo(() => conversationContext(request), [request])
  const active = canSendMessage(conversation)
  const contextHref = conversation.bookingId ? `/bookings/${encodeURIComponent(conversation.bookingId)}` : detail.viewer === "carrier" ? `/offers/${offer.id}` : `/requests/${encodeURIComponent(request.id)}`
  const contextLabel = conversation.bookingId ? "Atidaryti pervežimą" : "Atidaryti užklausą"

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!body.trim() || busy) return
    if (detail.persisted) {
      setBusy(true)
      clientKey.current ??= crypto.randomUUID()
      try {
        const client = await commandClient()
        const {error} = await client.rpc("send_message",{p_conversation_id:conversation.id,p_body:body,p_client_key:clientKey.current})
        if(error) throw error
        clientKey.current = null; setBody(""); setSentNotice("Žinutė išsaugota."); router.refresh()
      } catch(error) { setSentNotice(commandError(error)) }
      finally { setBusy(false) }
      return
    }
    setMessages(current => appendLocalMessage(conversation, current, body, "customer", new Date().toISOString()))
    setBody("")
    setSentNotice("Žinutė pridėta prie pokalbio.")
  }

  return <div className="mx-auto w-full max-w-4xl space-y-6">
    <Link href="/messages" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowLeft aria-hidden="true" className="size-4" />Visi pokalbiai
    </Link>

    <header className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="h-auto whitespace-normal py-1">{statusLabels[conversation.status]}</Badge>
            {conversation.bookingId && active && <span className="text-sm text-muted-foreground">Aktyvus pervežimas</span>}
          </div>
          <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{viewer === "carrier" ? "Pokalbis su klientu" : offer.carrier.name}</h1>
          <p className="break-words font-medium">{context.route}</p>
          <p className="text-sm text-muted-foreground">{context.vehicleLabel} · {requestStatusLabels[request.status]}</p>
        </div>
        <Button nativeButton={false} variant="outline" render={<Link href={contextHref} />} className="h-auto min-h-11 shrink-0 whitespace-normal py-3">
          {contextLabel}<ExternalLink aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </header>

    <Card className="min-w-0 gap-0 border py-0 shadow-none ring-0">
      <CardContent className="p-0">
        <ol data-message-thread aria-label="Žinutės" className="space-y-3 p-4 sm:p-6">
          {messages.map(message => <MessageItem key={message.id} message={message} carrierName={offer.carrier.name} viewer={viewer} />)}
        </ol>

        {active ? <form data-message-composer onSubmit={send} className="sticky bottom-0 z-10 rounded-b-xl border-t bg-card p-4 sm:p-6">
          <label htmlFor="message-body" className="sr-only">Rašyti žinutę</label>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
            <Textarea id="message-body" value={body} onChange={event => { setBody(event.target.value); clientKey.current=null; setSentNotice("") }} placeholder="Rašyti žinutę" rows={2} maxLength={2000} className="min-h-12 min-w-0 flex-1 resize-y bg-card" />
            <Button type="submit" disabled={!body.trim() || busy} className="h-auto min-h-11 w-full shrink-0 whitespace-normal py-3 sm:w-auto">Siųsti<Send aria-hidden="true" className="size-4" /></Button>
          </div>
          <p role="status" className={sentNotice ? "mt-2 text-sm text-muted-foreground" : "sr-only"}>{sentNotice}</p>
        </form> : <div className="space-y-1 rounded-b-xl border-t bg-muted/40 p-4 text-center text-sm text-muted-foreground"><p>Šis pokalbis baigtas.</p>{conversation.status === "completed" && <p>Peržiūrėkite susirašinėjimo istoriją.</p>}</div>}
      </CardContent>
    </Card>
  </div>
}
