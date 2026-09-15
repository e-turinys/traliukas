import { mockLocations } from "@/lib/mock/locations"
import { findMockCarrierRoute } from "@/lib/mock/carrier-routes"
import { calendarDate, parseCalendarDate, readDate, writeDate } from "../search-query"
import { matchRoutes } from "../search-matching"
import { canFitVehicleCount } from "@/lib/route-capacity"
import { routeCanServeCompleteRequest } from "../request-matching"
import { requestCategories, type Errors, type Step, type TransportRequestDraft, type VehicleDraft, type VehicleErrors } from "./model"
import type { LocationOption } from "@/lib/types/location"

export const maxRequestVehicles = 10

export function createVehicleDraft(id = "vehicle-1", pickupLocation: LocationOption | null = null, deliveryLocation: LocationOption | null = null): VehicleDraft {
  return { id, category: "", make: "", model: "", year: "", condition: "", rolls: "", photos: [], pickupLocation, deliveryLocation, usesDefaultRoute: true }
}

export function addRequestVehicle(vehicles: VehicleDraft[], pickupLocation: LocationOption | null = null, deliveryLocation: LocationOption | null = null): VehicleDraft[] {
  if (vehicles.length >= maxRequestVehicles) return vehicles
  const used = new Set(vehicles.map(vehicle => vehicle.id))
  let number = vehicles.length + 1
  while (used.has(`vehicle-${number}`)) number++
  return [...vehicles, createVehicleDraft(`vehicle-${number}`, pickupLocation, deliveryLocation)]
}

export function removeRequestVehicle(vehicles: VehicleDraft[], id: string): VehicleDraft[] {
  if (vehicles.length <= 1 || vehicles[0]?.id === id || !vehicles.some(vehicle => vehicle.id === id)) return vehicles
  return vehicles.filter(vehicle => vehicle.id !== id)
}

export function createRequestDraft(params: URLSearchParams): TransportRequestDraft {
  const requested = params.get("visibility") === "targeted" || params.has("targetCarrier") || params.has("targetRoute")
  const candidate = findMockCarrierRoute(params.get("targetRoute") ?? "")
  const targetRoute = candidate?.carrier.id === params.get("targetCarrier") ? candidate : null
  const review = params.get("review")
  const route = {
    from: mockLocations.find(place => place.id === params.get("from")) ?? null,
    to: mockLocations.find(place => place.id === params.get("to")) ?? null,
    date: readDate(params).value,
  }
  const multiReview = ["multi-vehicle", "multi-location-pickups", "multi-location-mixed"].includes(review ?? "")
  const first = multiReview ? { ...createVehicleDraft("vehicle-1", route.from, route.to), category: "suv" as const, make: "BMW", model: "X5", year: "2020", condition: "running" as const,
    photos: [new File(["review"], "bmw-priekis.jpg", { type: "image/jpeg" })] } : createVehicleDraft()
  const secondPickup = review?.startsWith("multi-location") ? mockLocations.find(place => place.id === "berlin-de")! : route.from
  const secondDelivery = review === "multi-location-mixed" ? mockLocations.find(place => place.id === "vilnius-lt")! : route.to
  const second = { ...createVehicleDraft("vehicle-2", secondPickup, secondDelivery), usesDefaultRoute: !review?.startsWith("multi-location"), category: "suv" as const, make: "Audi", model: "Q5", year: "2021", condition: review === "multi-location-mixed" ? "running" as const : "non-running" as const, rolls: review === "multi-location-mixed" ? "" as const : "yes" as const,
    photos: [new File(["review"], "audi-sonas.jpg", { type: "image/jpeg" }), new File(["review"], "audi-galas.png", { type: "image/png" })] }
  return {
    route,
    privateDetails: { pickup: "", delivery: "" },
    vehicles: multiReview ? [first, second] : [{ ...first, pickupLocation: route.from, deliveryLocation: route.to }],
    notes: "", contact: { name: "", phone: "", email: "" },
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
  if (draft.vehicles.some(vehicle => vehicle.category === "other")) return "Bent viena transporto priemonės kategorija nenurodyta pasirinktame maršrute. Galite kreiptis į kitus vežėjus."
  if (!canFitVehicleCount(route, draft.vehicles.length)) return "Pasirinktame maršrute nepakanka vietos visiems automobiliams. Galite kreiptis į kitus vežėjus."
  if (draft.vehicles.every(vehicle => vehicle.category && vehicle.pickupLocation && vehicle.deliveryLocation) && !routeCanServeCompleteRequest(route, draft.vehicles)) return "Pasirinktas maršrutas netinka visam automobilių ir vietų rinkiniui. Patikslinkite duomenis arba tęskite su kitais vežėjais."
  if (!matchRoutes([route], params, today).exact.length) return "Pasirinktas maršrutas nepasiekiamas arba netinka nurodytoms vietoms ar datoms. Patikslinkite duomenis arba tęskite su kitais vežėjais."
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
    if (draft.vehicles.length < 1) errors.vehicleCount = "Pridėkite bent vieną automobilį."
    if (draft.vehicles.length > maxRequestVehicles) errors.vehicleCount = "Vienoje užklausoje gali būti ne daugiau kaip 10 automobilių."
    const vehicleErrors = Object.fromEntries(draft.vehicles.map(vehicle => [vehicle.id, validateVehicle(vehicle, today)]).filter(([, value]) => Object.keys(value).length))
    if (Object.keys(vehicleErrors).length) errors.vehicles = vehicleErrors
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

export function validateVehicle(vehicle: VehicleDraft, today: string): VehicleErrors {
  const errors: VehicleErrors = {}
  if (!Object.hasOwn(requestCategories, vehicle.category)) errors.category = "Pasirinkite transporto priemonės kategoriją."
  if (!vehicle.make.trim()) errors.make = "Įrašykite markę."
  if (!vehicle.model.trim()) errors.model = "Įrašykite modelį."
  if (!mockLocations.some(place => place.id === vehicle.pickupLocation?.id)) errors.pickupLocation = "Pasirinkite automobilio paėmimo vietą."
  if (!mockLocations.some(place => place.id === vehicle.deliveryLocation?.id)) errors.deliveryLocation = "Pasirinkite automobilio pristatymo vietą."
  else if (vehicle.pickupLocation && vehicle.pickupLocation.id === vehicle.deliveryLocation?.id) errors.deliveryLocation = "Automobilio paėmimo ir pristatymo vietos turi skirtis."
  if (vehicle.year && (!/^\d{4}$/.test(vehicle.year) || Number(vehicle.year) < 1886 || Number(vehicle.year) > Number(today.slice(0, 4)) + 1)) errors.year = "Įrašykite tinkamus keturių skaitmenų metus."
  if (!["running", "non-running"].includes(vehicle.condition)) errors.condition = "Pasirinkite automobilio būklę."
  if (vehicle.condition === "non-running" && !["yes", "no", "unknown"].includes(vehicle.rolls)) errors.rolls = "Nurodykite, ar automobilis rieda."
  const photos = photoSelectionError(vehicle.photos, 0)
  if (photos) errors.photos = photos
  return errors
}

export const photoLimit = 5
export function photoSelectionError(files: Pick<File, "type" | "size">[], existingCount: number): string | undefined {
  if (files.some(file => !["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type))) return "Pasirinkite JPG, PNG, WebP arba HEIC nuotraukas."
  if (files.some(file => file.size > 10 * 1024 * 1024)) return "Viena nuotrauka gali būti iki 10 MB."
  if (files.length + existingCount > photoLimit) return "Galite pasirinkti ne daugiau kaip 5 nuotraukas."
}
