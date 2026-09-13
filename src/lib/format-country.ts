const countryLabels: Readonly<Record<string, string>> = {
  Germany: "Vokietija",
  Poland: "Lenkija",
  Lithuania: "Lietuva",
  Netherlands: "Nyderlandai",
}

export function formatCountry(country: string): string {
  return countryLabels[country] ?? country
}
