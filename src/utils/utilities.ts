import { FileData } from "../model"

/**
 * Gets the position of the last occupied row in the provided column, in the provided sheet
 */
export function lastRowInColumn(sheet: GoogleAppsScript.Spreadsheet.Sheet, c: string): number {
  return sheet
    .getRange(c + (sheet.getLastRow() + 1)) // e.g. "A7"
    .getNextDataCell(SpreadsheetApp.Direction.UP)
    .getRow()
}

export function saveFileToFolder(
  fileData: FileData,
  folder: GoogleAppsScript.Drive.Folder
): GoogleAppsScript.Drive.File {
  if ("data" in fileData) {
    const blob = Utilities.newBlob(fileData.data, fileData.contentType, fileData.name)
    return folder.createFile(blob)
  } else return folder.createFile(fileData.name, fileData.content)
}

export function decodeFile(fileBase64: string): GoogleAppsScript.Byte[] {
  return Utilities.base64Decode(fileBase64.substring(fileBase64.indexOf("base64,") + 7))
}

export function getMimeType(fileBase64: string): string {
  // omit the "data:" at the start of the data string
  return fileBase64.substring(5, fileBase64.indexOf(";"))
}

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
