import { Choices, FieldError, TextField } from "./fields"
import { VehiclePhotos } from "./photos"
import { LocationPicker } from "@/components/shared/location-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { addRequestVehicle, maxRequestVehicles, removeRequestVehicle } from "./logic"
import { requestCategories, type Errors, type TransportRequestDraft, type VehicleDraft } from "./model"

export function VehicleStep({ draft, update, errors }: { draft: TransportRequestDraft; update: (value: Partial<TransportRequestDraft>) => void; errors: Errors }) {
  return <VehicleEditor vehicles={draft.vehicles} defaultRoute={draft.route} onChange={vehicles => update({ vehicles })} errors={errors} idPrefix="request" />
}

export function VehicleEditor({ vehicles, defaultRoute, onChange, errors, idPrefix }: {
  vehicles: VehicleDraft[]; defaultRoute: TransportRequestDraft["route"]; onChange: (vehicles: VehicleDraft[]) => void; errors: Errors; idPrefix: string
}) {
  const updateVehicle = (id: string, patch: Partial<VehicleDraft>) => onChange(vehicles.map(vehicle => vehicle.id === id ? { ...vehicle, ...patch } : vehicle))
  return <div id={`${idPrefix}-vehicles`} className="space-y-5">
    {errors.vehicleCount && <p role="alert" className="text-sm text-destructive">{errors.vehicleCount}</p>}
    {vehicles.map((vehicle, index) => {
      const field = (name: string) => `${idPrefix}-${vehicle.id}-${name}`
      const vehicleErrors = errors.vehicles?.[vehicle.id] ?? {}
      return <Card key={vehicle.id} className="min-w-0 bg-muted/15">
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Automobilis {index + 1}</h3>
            {index > 0 && <Button type="button" variant="ghost" className="min-h-11" onClick={() => onChange(removeRequestVehicle(vehicles, vehicle.id))}>Pašalinti automobilį</Button>}
          </div>
          <section className="space-y-3 rounded-lg border bg-background p-4" aria-labelledby={field("route-heading")}>
            <h4 id={field("route-heading")} className="font-medium">Paėmimas ir pristatymas</h4>
            {vehicle.usesDefaultRoute ? <>
              <p className="text-sm text-muted-foreground">Naudoti pagrindinį maršrutą: {defaultRoute.from?.city ?? "—"} → {defaultRoute.to?.city ?? "—"}</p>
              <Button type="button" variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-3" onClick={() => updateVehicle(vehicle.id, { usesDefaultRoute: false })}>Keisti šio automobilio maršrutą</Button>
            </> : <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <LocationPicker id={field("pickupLocation")} label="Paėmimo vieta" required value={vehicle.pickupLocation} onValueChange={pickupLocation => updateVehicle(vehicle.id, { pickupLocation })} invalid={!!vehicleErrors.pickupLocation} describedBy={vehicleErrors.pickupLocation ? `${field("pickupLocation")}-error` : undefined} />
                  <FieldError id={field("pickupLocation")} error={vehicleErrors.pickupLocation} />
                </div>
                <div className="min-w-0 space-y-2">
                  <LocationPicker id={field("deliveryLocation")} label="Pristatymo vieta" required value={vehicle.deliveryLocation} onValueChange={deliveryLocation => updateVehicle(vehicle.id, { deliveryLocation })} invalid={!!vehicleErrors.deliveryLocation} describedBy={vehicleErrors.deliveryLocation ? `${field("deliveryLocation")}-error` : undefined} />
                  <FieldError id={field("deliveryLocation")} error={vehicleErrors.deliveryLocation} />
                </div>
              </div>
              <Button type="button" variant="ghost" className="h-auto min-h-11 w-full whitespace-normal py-3" onClick={() => updateVehicle(vehicle.id, { pickupLocation: defaultRoute.from, deliveryLocation: defaultRoute.to, usesDefaultRoute: true })}>Naudoti pagrindinį maršrutą</Button>
            </>}
          </section>
          <Choices id={field("category")} label="Transporto priemonės kategorija" options={requestCategories} value={vehicle.category} onChange={category => updateVehicle(vehicle.id, { category: category as VehicleDraft["category"] })} error={vehicleErrors.category} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id={field("make")} label="Markė" required maxLength={80} value={vehicle.make} onChange={event => updateVehicle(vehicle.id, { make: event.target.value })} error={vehicleErrors.make} />
            <TextField id={field("model")} label="Modelis" required maxLength={80} value={vehicle.model} onChange={event => updateVehicle(vehicle.id, { model: event.target.value })} error={vehicleErrors.model} />
          </div>
          <TextField id={field("year")} label="Metai (neprivaloma)" inputMode="numeric" maxLength={4} value={vehicle.year} onChange={event => updateVehicle(vehicle.id, { year: event.target.value })} error={vehicleErrors.year} />
          <Choices id={field("condition")} label="Automobilio būklė" options={{ running: "Važiuojantis", "non-running": "Nevažiuojantis" }} value={vehicle.condition} onChange={condition => updateVehicle(vehicle.id, { condition: condition as VehicleDraft["condition"], rolls: condition === "running" ? "" : vehicle.rolls })} error={vehicleErrors.condition} />
          {vehicle.condition === "non-running" && <Choices id={field("rolls")} label="Ar automobilį galima laisvai užridenti / ar jis rieda?" options={{ yes: "Taip", no: "Ne", unknown: "Nežinau" }} value={vehicle.rolls} onChange={rolls => updateVehicle(vehicle.id, { rolls: rolls as VehicleDraft["rolls"] })} error={vehicleErrors.rolls} />}
          <VehiclePhotos id={field("photos")} files={vehicle.photos} onChange={photos => updateVehicle(vehicle.id, { photos })} externalError={vehicleErrors.photos} />
        </CardContent>
      </Card>
    })}
    <Button type="button" variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-3" disabled={vehicles.length >= maxRequestVehicles} onClick={() => onChange(addRequestVehicle(vehicles, defaultRoute.from, defaultRoute.to))}>+ Pridėti kitą automobilį</Button>
    <p className="text-sm text-muted-foreground">Vienoje užklausoje galite nurodyti iki 10 automobilių. Visiems taikomas tas pats maršrutas ir paėmimo laikas.</p>
  </div>
}
