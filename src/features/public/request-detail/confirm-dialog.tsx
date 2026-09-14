import { useRef, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ConfirmRequestDialog({ open, onOpenChange, title, description, action, onConfirm, finalFocus }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string
  action: string; onConfirm: () => void; finalFocus?: RefObject<HTMLElement | null>
}) {
  const cancel = useRef<HTMLButtonElement>(null)
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent role="alertdialog" showCloseButton={false} initialFocus={cancel} finalFocus={finalFocus}>
      <DialogHeader><DialogTitle className="leading-snug">{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <DialogFooter>
        <Button ref={cancel} variant="outline" className="h-auto min-h-11 py-3 whitespace-normal" onClick={() => onOpenChange(false)}>Atšaukti</Button>
        <Button variant="destructive" className="h-auto min-h-11 py-3 whitespace-normal" onClick={onConfirm}>{action}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
