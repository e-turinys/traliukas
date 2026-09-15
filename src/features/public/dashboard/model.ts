export type DashboardTab = "requests" | "transports" | "history"

export type DashboardAttentionItem = {
  id: string
  route: string
  vehicle: string
  status: string
  actionableOfferCount: number
  updated: boolean
}

export type DashboardRequestItem = {
  id: string
  route: string
  vehicle: string
  requestedDate: string
  visibility: string
  status: string
  offerCount: number
}

export type DashboardTransportItem = {
  id: string
  bookingId: string
  route: string
  vehicle: string
  carrier: string
  pickupDate: string
  deliveryDate: string
  status: string
}

export type DashboardHistoryItem = {
  id: string
  route: string
  vehicle: string
  status: string
  dateLabel: string
  date: string
  carrier?: string
}

export type DashboardViewModel = {
  attention: DashboardAttentionItem[]
  requests: DashboardRequestItem[]
  transports: DashboardTransportItem[]
  history: DashboardHistoryItem[]
  defaultTab: DashboardTab
  empty: boolean
}
