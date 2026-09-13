const pluralRules = new Intl.PluralRules("lt-LT")

export function formatCount(count: number, labels: { one: string; few: string; other: string }) {
  const plural = pluralRules.select(count)
  return `${count} ${plural === "one" || plural === "few" ? labels[plural] : labels.other}`
}
