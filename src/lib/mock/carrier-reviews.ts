type ReviewPreview = {
  id: string
  carrierId: string
  author: string
  rating: number
  comment: string
  completedOn: string
  bookingStatus: "completed"
}

// Fictional previews of completed transports, not reviews of the upcoming route.
export const mockCarrierReviews: ReviewPreview[] = [
  { id: "bk-1", carrierId: "baltijos-kelias", author: "Tomas", rating: 5, comment: "Automobilį pristatė sutartu laiku. Apie paėmimą ir pristatymą informavo iš anksto.", completedOn: "2026-08-28", bookingStatus: "completed" },
  { id: "bk-2", carrierId: "baltijos-kelias", author: "Rasa", rating: 5, comment: "Aiškiai suderinome paėmimo vietą. Automobilis atvyko tvarkingas.", completedOn: "2026-08-12", bookingStatus: "completed" },
  { id: "sa-1", carrierId: "siaures-autovezis", author: "Marius", rating: 5, comment: "Patogiai suderinome pristatymą Vilniuje. Bendravimas buvo sklandus.", completedOn: "2026-08-25", bookingStatus: "completed" },
  { id: "sa-2", carrierId: "siaures-autovezis", author: "Ieva", rating: 4, comment: "Pristatymas šiek tiek vėlavo, bet apie pasikeitimą pranešė. Automobiliui pastabų neturiu.", completedOn: "2026-08-08", bookingStatus: "completed" },
  { id: "nl-1", carrierId: "nemuno-logistika", author: "Andrius", rating: 5, comment: "Padėjo pakrauti nevažiuojantį automobilį. Visas sąlygas aptarėme prieš pervežimą.", completedOn: "2026-09-03", bookingStatus: "completed" },
  { id: "nl-2", carrierId: "nemuno-logistika", author: "Dalia", rating: 5, comment: "Automobilis pasiekė Kauną sutartą dieną. Viskas vyko pagal susitarimą.", completedOn: "2026-08-19", bookingStatus: "completed" },
  { id: "vk-1", carrierId: "vakaru-kryptis", author: "Jonas", rating: 5, comment: "Vežė automobilį iš Nyderlandų. Patiko aiškus paėmimo laiko derinimas.", completedOn: "2026-08-30", bookingStatus: "completed" },
  { id: "vk-2", carrierId: "vakaru-kryptis", author: "Lina", rating: 4, comment: "Pristatymo laiką teko pakeisti, bet vežėjas apie tai informavo. Automobilį gavau tvarkingą.", completedOn: "2026-08-14", bookingStatus: "completed" },
  { id: "pp-1", carrierId: "pajurio-pervezimai", author: "Paulius", rating: 5, comment: "Mikroautobusą pristatė į sutartą vietą. Pakrovimas ir iškrovimas vyko atsargiai.", completedOn: "2026-08-22", bookingStatus: "completed" },
  { id: "pp-2", carrierId: "pajurio-pervezimai", author: "Monika", rating: 4, comment: "Pervežimas pavyko sklandžiai. Norėjosi kiek ankstesnio pranešimo apie atvykimo laiką.", completedOn: "2026-08-05", bookingStatus: "completed" },
]
