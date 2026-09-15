import { test } from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.resolve(import.meta.dirname, "../src", `${specifier.slice(2)}.ts`)).href, context)
  try { return nextResolve(specifier, context) } catch (error) {
    if (specifier.startsWith(".") && !path.extname(specifier)) return nextResolve(`${specifier}.ts`, context)
    throw error
  }
} })

const { compactVehicleSummary, vehicleCountLabel, vehicleDisplayLine, vehiclePriceScope } = await import("../src/features/public/vehicle-summary.ts")
const vehicle = (id, make, model, category = "suv") => ({ id, make, model, category })

test("vehicle count uses Lithuanian singular, few and genitive plural forms", () => {
  assert.equal(vehicleCountLabel(1), "1 automobilis")
  assert.equal(vehicleCountLabel(2), "2 automobiliai")
  assert.equal(vehicleCountLabel(10), "10 automobilių")
  assert.equal(vehiclePriceScope(2), "2 automobilius")
  assert.equal(vehiclePriceScope(10), "10 automobilių")
})

test("compact summaries show one vehicle naturally and collapse three or more", () => {
  const vehicles = [vehicle("1", "BMW", "X5"), vehicle("2", "Audi", "Q5"), vehicle("3", "Volvo", "XC60")]
  assert.equal(compactVehicleSummary(vehicles.slice(0, 1)), "BMW X5 · SUV / Crossover")
  assert.equal(compactVehicleSummary(vehicles.slice(0, 2)), "2 automobiliai · BMW X5, Audi Q5")
  assert.equal(compactVehicleSummary(vehicles), "3 automobiliai · BMW X5, Audi Q5 +1")
  assert.equal(vehicleDisplayLine(vehicles[1]), "Audi Q5 · SUV / Crossover")
})
