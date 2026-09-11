export type FlexibleDateOption =
  | "next-week"
  | "next-two-weeks"
  | "this-month"

export type DateWindowValue =
  | {
      type: "anytime"
    }
  | {
      type: "single"
      date?: Date
    }
  | {
      type: "range"
      from?: Date
      to?: Date
    }
  | {
      type: "flexible"
      option?: FlexibleDateOption
    }