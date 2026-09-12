const months = ["saus.", "vas.", "kov.", "bal.", "geg.", "birž.", "liep.", "rugp.", "rugs.", "spal.", "lapkr.", "gruod."]

// Display valid ISO calendar dates directly, without constructing timestamps.
export function formatDateRange(from: string, to = from): string {
  const [year, month, day] = from.split("-").map(Number)
  const start = `${year} m. ${months[month - 1]} ${day}`
  if (from === to) return `${start} d.`

  const [endYear, endMonth, endDay] = to.split("-").map(Number)
  if (year === endYear && month === endMonth) return `${start}–${endDay} d.`
  if (year === endYear) return `${start} d. – ${months[endMonth - 1]} ${endDay} d.`
  return `${start} d. – ${endYear} m. ${months[endMonth - 1]} ${endDay} d.`
}
