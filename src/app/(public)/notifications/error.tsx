"use client"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/layout/page-container"

export default function NotificationsError({ reset }: { reset: () => void }) {
  return <PageContainer className="space-y-4 py-8">
    <h1 className="text-2xl font-semibold">Pranešimai</h1>
    <p role="alert">Nepavyko įkelti pranešimų.</p>
    <Button onClick={reset}>Bandyti dar kartą</Button>
  </PageContainer>
}
