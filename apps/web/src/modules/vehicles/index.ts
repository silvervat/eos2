/**
 * Vehicles Module - Sõidukite haldus
 *
 * Täielik näidismoodul mis demonstreerib EOS2 mooduli struktuuri
 *
 * @example
 * import { vehiclesModule, VehicleForm, VehicleCard } from '@/modules/vehicles'
 */

// Mooduli definitsioon
export { default as vehiclesModule } from './definition'

// Komponendid
export { VehicleForm, VehicleCard } from './components'
export type { VehicleFormData, VehicleFormProps, Vehicle, VehicleCardProps } from './components'

// Lehed (need registreeritakse automaatselt Next.js App Routeriga)
// pages/index.tsx -> /vehicles
// pages/[id].tsx -> /vehicles/:id
// pages/new.tsx -> /vehicles/new
// pages/edit.tsx -> /vehicles/:id/edit
