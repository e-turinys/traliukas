import { mockLocations } from "@/lib/mock/locations"
import { findMockCarrierRoute } from "@/lib/mock/carrier-routes"
import { calendarDate, parseCalendarDate, readDate, writeDate } from "../search-query"
import { matchRoutes } from "../search-matching"
import { requestCategories, type Errors, type Step, type TransportRequestDraft } from "./model"

export function createRequestDraft(params: URLSearchParams): TransportRequestDraft {
  const requested = params.get("visibility") === "targeted" || params.has("targetCarrier") || params.has("targetRoute")
  const candidate = findMockCarrierRoute(params.get("targetRoute") ?? "")
  const targetRoute = candidate?.carrier.id === params.get("targetCarrier") ? candidate : null
  return {
    route: {
      from: mockLocations.find(place => place.id === params.get("from")) ?? null,
      to: mockLocations.find(place => place.id === params.get("to")) ?? null,
      date: readDate(params).value,
    },
    privateDetails: { pickup: "", delivery: "" },
    vehicle: { category: "", make: "", model: "", year: "", condition: "", rolls: "" },
    photos: [], notes: "", contact: { name: "", phone: "", email: "" },
    visibility: requested && params.get("visibility") !== "marketplace" ? "targeted" : "marketplace",
    target: { requested, route: targetRoute ?? null }, termsAccepted: false,
  }
}

export function targetIssue(draft: TransportRequestDraft, today: string): string | undefined {
  if (!draft.target.requested) return undefined
  const route = draft.target.route
  if (!route) return "Pasirinkto vežėjo maršruto nepavyko rasti. Galite tęsti užklausą kitiems vežėjams."
  const params = new URLSearchParams({ from: draft.route.from?.id ?? "", to: draft.route.to?.id ?? "" })
  writeDate(params, draft.route.date)
  if (draft.vehicle.category === "other") return "Ši transporto priemonės kategorija nenurodyta pasirinktame maršrute. Galite kreiptis į kitus vežėjus."
  if (draft.vehicle.category) params.set("vehicle", draft.vehicle.category)
  if (draft.vehicle.condition === "non-running") params.set("nonRunning", "true")
  if (!matchRoutes([route], params, today).exact.length) return "Pasirinktas maršrutas nepasiekiamas arba netinka nurodytoms vietoms, datoms ar automobiliui. Patikslinkite duomenis arba tęskite su kitais vežėjais."
}

export function switchToMarketplace(draft: TransportRequestDraft): TransportRequestDraft {
  return { ...draft, visibility: "marketplace", target: { requested: false, route: null } }
}

export function validateStep(draft: TransportRequestDraft, step: Step, today: string): Errors {
  const errors: Errors = {}
  if (step === 1) {
    if (!mockLocations.some(place => place.id === draft.route.from?.id)) errors.from = "Pasirinkite paėmimo vietą iš sąrašo."
    if (!mockLocations.some(place => place.id === draft.route.to?.id)) errors.to = "Pasirinkite pristatymo vietą iš sąrašo."
    else if (draft.route.from?.id === draft.route.to?.id) errors.to = "Paėmimo ir pristatymo vietos turi skirtis."
    const date = draft.route.date
    const validDate = (value?: Date) => value && Number.isFinite(value.getTime()) && parseCalendarDate(calendarDate(value))
    if (date.type === "single" && !validDate(date.date)) errors.date = "Pasirinkite datą arba „Bet kada“."
    if (date.type === "range" && (!validDate(date.from) || !validDate(date.to) || date.from! > date.to!)) errors.date = "Pasirinkite tinkamą intervalo pradžią ir pabaigą arba „Bet kada“."
    if (date.type === "flexible" && !["next-week", "next-two-weeks", "this-month"].includes(date.option ?? "")) errors.date = "Pasirinkite lankstų laikotarpį arba „Bet kada“."
  }
  if (step === 2) {
    if (!Object.hasOwn(requestCategories, draft.vehicle.category)) errors.category = "Pasirinkite transporto priemonės kategoriją."
    if (!draft.vehicle.make.trim()) errors.make = "Įrašykite markę."
    if (!draft.vehicle.model.trim()) errors.model = "Įrašykite modelį."
    if (draft.vehicle.year && (!/^\d{4}$/.test(draft.vehicle.year) || Number(draft.vehicle.year) < 1886 || Number(draft.vehicle.year) > Number(today.slice(0, 4)) + 1)) errors.year = "Įrašykite tinkamus keturių skaitmenų metus."
    if (!["running", "non-running"].includes(draft.vehicle.condition)) errors.condition = "Pasirinkite automobilio būklę."
    if (draft.vehicle.condition === "non-running" && !["yes", "no", "unknown"].includes(draft.vehicle.rolls)) errors.rolls = "Nurodykite, ar automobilis rieda."
  }
  if (step === 4) {
    if (!draft.contact.name.trim()) errors.name = "Įrašykite vardą."
    if (!/^\+?[\d ()-]{7,24}$/.test(draft.contact.phone.trim()) || !/^\d{7,15}$/.test(draft.contact.phone.replace(/\D/g, ""))) errors.phone = "Įrašykite tinkamą telefono numerį su šalies kodu."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.email.trim())) errors.email = "Įrašykite tinkamą el. pašto adresą."
    if (!draft.termsAccepted) errors.terms = "Patvirtinkite, kad susipažinote su taisyklėmis ir privatumo politika."
    const issue = targetIssue(draft, today)
    if (issue) errors.target = issue
  }
  return errors
}

export const photoLimit = 5
export function photoSelectionError(files: Pick<File, "type" | "size">[], existingCount: number): string | undefined {
  if (files.some(file => !["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type))) return "Pasirinkite JPG, PNG, WebP arba HEIC nuotraukas."
  if (files.some(file => file.size > 10 * 1024 * 1024)) return "Viena nuotrauka gali būti iki 10 MB."
  if (files.length + existingCount > photoLimit) return "Galite pasirinkti ne daugiau kaip 5 nuotraukas."
}
