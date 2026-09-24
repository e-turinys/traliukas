import type { TransportRequestDraft } from "../create-request/model"
import { calendarDate } from "../search-query"
import { requireE164 } from "@/lib/auth/validation"

// Technical acceptance version for the existing terms checkbox; no new legal copy.
export const requestTermsVersion = "2026-09-24"
export function publicationPhone(value: string) {
  const phone = value.trim().replace(/[ ()-]/g, "")
  try { return requireE164(phone) } catch { throw new Error("Įrašykite telefono numerį su šalies kodu, pvz. +370.") }
}

export function requestPayload(draft: TransportRequestDraft) {
  if (!draft.termsAccepted) throw new Error("Patvirtinkite taisykles ir privatumo politiką.")
  if (draft.visibility !== "marketplace" || draft.target.requested) throw new Error("Pasirinktas demonstracinis maršrutas nepasiekiamas. Grįžkite ir pasirinkite „Tęsti su kitais vežėjais“.")
  if (draft.vehicles.some(v => v.photos.length)) throw new Error("Nuotraukų įkėlimas dar nepasiekiamas. Grįžkite ir pašalinkite pasirinktas nuotraukas, jei norite paskelbti be jų.")
  if (!draft.route.from || !draft.route.to || draft.vehicles.length < 1 || draft.vehicles.length > 10) throw new Error("Patikrinkite maršrutą ir automobilius.")
  if (draft.contact.name.trim().length > 200 || draft.contact.email.trim().length > 254 || draft.notes.trim().length > 4000
    || draft.privateDetails.pickup.trim().length > 4000 || draft.privateDetails.delivery.trim().length > 4000) throw new Error("Sutrumpinkite kontaktų ar papildomos informacijos laukus.")
  const date = draft.route.date
  const pickup = date.type === "anytime" ? { kind: date.type }
    : date.type === "single" && date.date ? { kind: date.type, from: calendarDate(date.date), to: calendarDate(date.date) }
      : date.type === "range" && date.from && date.to ? { kind: date.type, from: calendarDate(date.from), to: calendarDate(date.to) }
        : date.type === "flexible" && date.option ? { kind: date.type, option: date.option } : null
  if (!pickup) throw new Error("Patikrinkite paėmimo laiką.")
  return {
    name: draft.contact.name.trim(), email: draft.contact.email.trim(), phone: publicationPhone(draft.contact.phone),
    terms_version: requestTermsVersion, pickup,
    from: draft.route.from.id, to: draft.route.to.id, notes: draft.notes.trim(),
    private_pickup: draft.privateDetails.pickup.trim(), private_delivery: draft.privateDetails.delivery.trim(),
    budget_amount: draft.budgetAmount ?? null, budget_currency: draft.budgetCurrency ?? null,
    vehicles: draft.vehicles.map(v => {
      if (!v.pickupLocation || !v.deliveryLocation || !v.category || !v.condition || !v.make.trim() || !v.model.trim()
        || v.make.trim().length > 100 || v.model.trim().length > 100) throw new Error("Patikrinkite automobilio duomenis (markė ir modelis – iki 100 simbolių).")
      return {
        category: v.category, make: v.make.trim(), model: v.model.trim(), year: v.year ? Number(v.year) : null,
        condition: v.condition === "non-running" ? "non_running" : "running",
        rolling_ability: v.condition === "non-running" ? v.rolls : null,
        pickup: v.pickupLocation.id, delivery: v.deliveryLocation.id, uses_default_route: v.usesDefaultRoute,
      }
    }),
  }
}
export type RequestPayload = ReturnType<typeof requestPayload>
