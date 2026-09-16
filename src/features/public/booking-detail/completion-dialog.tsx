import { useRef, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { bookingCompletionCopy } from "./logic"

export function BookingCompletionDialog({ open, onOpenChange, onConfirm, finalFocus, vehicleCount }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  finalFocus?: RefObject<HTMLElement | null>
  vehicleCount: number
}) {
  const cancel = useRef<HTMLButtonElement>(null)
  const copy = bookingCompletionCopy(vehicleCount)
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent role="alertdialog" showCloseButton={false} initialFocus={cancel} finalFocus={finalFocus}>
      <DialogHeader>
        <DialogTitle>{copy.dialogTitle}</DialogTitle>
        <DialogDescription>{copy.dialogDescription}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button ref={cancel} variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>Atšaukti</Button>
        <Button className="h-auto min-h-11 whitespace-normal py-3" onClick={onConfirm}>Patvirtinti gavimą</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
