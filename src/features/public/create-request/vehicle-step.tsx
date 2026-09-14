import { Choices, TextField } from "./fields"
import { VehiclePhotos } from "./photos"
import { requestCategories, type Errors, type TransportRequestDraft } from "./model"

export function VehicleStep({ draft, update, errors }: { draft: TransportRequestDraft; update: (value: Partial<TransportRequestDraft>) => void; errors: Errors }) {
  const vehicle = draft.vehicle
  const setVehicle = (value: Partial<typeof vehicle>) => update({ vehicle: { ...vehicle, ...value } })
  return <div className="space-y-6">
    <Choices id="request-category" label="Transporto priemonės kategorija" options={requestCategories} value={vehicle.category} onChange={category => setVehicle({ category: category as typeof vehicle.category })} error={errors.category} />
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField id="request-make" label="Markė" required maxLength={80} value={vehicle.make} onChange={e => setVehicle({ make: e.target.value })} error={errors.make} />
      <TextField id="request-model" label="Modelis" required maxLength={80} value={vehicle.model} onChange={e => setVehicle({ model: e.target.value })} error={errors.model} />
    </div>
    <TextField id="request-year" label="Metai (neprivaloma)" inputMode="numeric" maxLength={4} value={vehicle.year} onChange={e => setVehicle({ year: e.target.value })} error={errors.year} />
    <Choices id="request-condition" label="Automobilio būklė" options={{ running: "Važiuojantis", "non-running": "Nevažiuojantis" }} value={vehicle.condition} onChange={condition => setVehicle({ condition: condition as typeof vehicle.condition })} error={errors.condition} />
    {vehicle.condition === "non-running" && <Choices id="request-rolls" label="Ar automobilį galima laisvai užridenti / ar jis rieda?" options={{ yes: "Taip", no: "Ne", unknown: "Nežinau" }} value={vehicle.rolls} onChange={rolls => setVehicle({ rolls: rolls as typeof vehicle.rolls })} error={errors.rolls} />}
    <VehiclePhotos files={draft.photos} onChange={photos => update({ photos })} />
  </div>
}
