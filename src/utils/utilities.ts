export function capitalize(name: string): string {
  return name.charAt(0).toLocaleUpperCase() + name.slice(1)
}

export function calculateAge(birthday: Date): number {
  const ageDifMs = Date.now() - birthday.getTime()
  const ageDate = new Date(ageDifMs) // miliseconds from epoch
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export function formatShortDate(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleString("default", { month: "short" })
  const year = date.getFullYear()

  return `${day}${nthNumber(day)} ${month}, ${year}`
}

export function nthNumber(n: number): string {
  if (n > 3 && n < 21) return "th"
  switch (n % 10) {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
  }
}
