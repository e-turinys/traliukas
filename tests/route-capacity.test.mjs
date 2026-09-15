import { test } from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"
import path from "node:path"

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) return nextResolve(pathToFileURL(path.resolve(import.meta.dirname, "../src", `${specifier.slice(2)}.ts`)).href, context)
    try { return nextResolve(specifier, context) }
    catch (error) {
      if (specifier.startsWith(".") && !path.extname(specifier)) return nextResolve(`${specifier}.ts`, context)
      throw error
    }
  },
})

const { canFitRequest, canFitVehicleCount, getAvailableCapacity, releaseCapacity, reserveCapacity, setCapacityTotal } = await import("../src/lib/route-capacity.ts")
const { findMockCarrierRoute } = await import("../src/lib/mock/carrier-routes.ts")
const { findMockRequestDetail } = await import("../src/lib/mock/request-details.ts")
const { findMockOfferDetail } = await import("../src/lib/mock/offer-details.ts")

test("available capacity is derived and never negative", () => {
  assert.equal(getAvailableCapacity({ capacityTotal: 5, capacityReserved: 2 }), 3)
  assert.equal(getAvailableCapacity({ capacityTotal: 2, capacityReserved: 4 }), 0)
})

test("one vehicle consumes one space for every category", () => {
  const one = { capacityTotal: 3, capacityReserved: 2 }
  assert.equal(canFitVehicleCount(one, 1), true)
  assert.equal(canFitVehicleCount(one, 2), false)
  assert.equal(canFitVehicleCount({ capacityTotal: 5, capacityReserved: 3 }, 2), true)
  assert.equal(canFitVehicleCount(one, 0), false)
})

test("the complete vehicle set must fit category and non-running capability", () => {
  const route = findMockCarrierRoute("siaures-autovezis-0916")
  const running = [
    { category: "car", condition: "running" },
    { category: "suv", condition: "running" },
  ]
  assert.equal(canFitRequest(route, running), true)
  assert.equal(canFitRequest({ ...route, capacityTotal: 5, capacityReserved: 4 }, running), false)
  assert.equal(canFitRequest(route, [...running.slice(0, 1), { category: "suv", condition: "non-running" }]), false)
  assert.equal(canFitRequest(route, [...running.slice(0, 1), { category: "motorcycle", condition: "running" }]), false)
})

test("offer submission leaves route capacity unchanged", () => {
  const route = findMockCarrierRoute("baltijos-kelias-0915")
  const before = structuredClone(route)
  assert.ok(findMockOfferDetail("multi-vehicle-demo-001-offer-1"))
  assert.deepEqual(route, before)
})

test("mock booking reserves and cancellation releases the request vehicle count", () => {
  const route = findMockCarrierRoute("baltijos-kelias-0915")
  const request = findMockRequestDetail("multi-vehicle-demo-001")
  const booked = reserveCapacity(route, request.vehicles.length)
  assert.equal(booked.capacityReserved, 4)
  assert.equal(getAvailableCapacity(booked), 1)
  const cancelled = releaseCapacity(booked, request.vehicles.length)
  assert.equal(cancelled.capacityReserved, route.capacityReserved)
  assert.equal(getAvailableCapacity(cancelled), 3)
  assert.equal(route.capacityReserved, 2)
})

test("reservation, release and capacity adjustment enforce invariants", () => {
  const route = { capacityTotal: 5, capacityReserved: 3 }
  assert.throws(() => reserveCapacity(route, 3), /enough available capacity/)
  assert.throws(() => reserveCapacity(route, 0), /positive integer/)
  assert.throws(() => releaseCapacity(route, 4), /more capacity/)
  assert.throws(() => releaseCapacity(route, 0), /positive integer/)
  assert.throws(() => setCapacityTotal(route, 2), /lower than reserved/)
  assert.throws(() => setCapacityTotal(route, 0), /positive integer/)
  assert.equal(setCapacityTotal(route, 3).capacityTotal, 3)
})
