import { FormData, FileData } from "./model"
import { calculateAge, capitalize, formatShortDate } from "./utils/utilities"
import { EDUCATION_LEVELS, STATES } from "./utils/constants"

export function doGet(_e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  // form.html
  return HtmlService.createTemplateFromFile("form")
    .evaluate()
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
}

export function include(fileName: string): string {
  return HtmlService.createHtmlOutputFromFile(fileName).getContent()
}

export function registerSubmission(data: FormData): boolean {
  try {
    const files = saveFiles(data.resume, data.additionalDocs, data.givenName, data.familyName)

    return fillSpreadsheetDetails(data, files[0], files.slice(1)) && fillSpreadsheetOverview(data)
  } catch (error) {
    Logger.log(`Error caused by user ${data.givenName} ${data.familyName}, ${data.email}`)
    Logger.log(error)
    throw new Error((error as Error)?.message ?? "Internal server error")
  }
}

/**
 * @param {string}    resume - Resume document in base-64
 * @param {string[]}  docs - Additional documents in base-64
 * @param {string}    firstName - First name of the applicant
 * @param {string}    lastName - Last name of the applicant
 * @returns {GoogleAppsScript.Drive.File[]} Google Drive file objects of the created files
 */
function saveFiles(
  resume: string,
  docs: string[],
  firstName: string,
  lastName: string
): GoogleAppsScript.Drive.File[] {
  const attachmentFolderId = process.env.ATTACHMENT_FOLDER_ID
  if (attachmentFolderId == null) throw new Error("Could not find Drive folder to upload files")

  const attachmentFolder = DriveApp.getFolderById(attachmentFolderId)

  const filesData: FileData[] = [
    {
      contentType: resume.substring(5, resume.indexOf(";")),
      data: Utilities.base64Decode(resume.substring(resume.indexOf("base64,") + 7)),
      name: capitalize(firstName) + "_" + capitalize(lastName) + "_Resume"
    }
  ].concat(
    docs.map((doc, i) => ({
      contentType: doc.substring(5, doc.indexOf(";")),
      data: Utilities.base64Decode(doc.substring(doc.indexOf("base64,") + 7)),
      name: capitalize(firstName) + "_" + capitalize(lastName) + `_Additional_Doc${i + 1}`
    }))
  )

  return filesData.map((fileData) => {
    const blob = Utilities.newBlob(fileData.data, fileData.contentType, fileData.name)
    return attachmentFolder.createFile(blob)
  })
}

function fillSpreadsheetDetails(
  data: FormData,
  resume: GoogleAppsScript.Drive.File,
  docs: GoogleAppsScript.Drive.File[]
): boolean {
  const spreadsheetId = process.env.RESPONSES_SPREADSHEET_ID
  if (spreadsheetId == null) throw new Error("Could not find spreadsheet to fill in responses")

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  const detailsSheet = spreadsheet.getSheetByName("Details") ?? spreadsheet.getSheets()[1]
  const applicationTimestamp = new Date()

  const i = detailsSheet.getLastRow() + 1
  const validation = detailsSheet.getRange("C" + i).getDataValidation()
  if (validation == null || validation.getCriteriaType() !== SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
    // boolean values
    detailsSheet
      .getRangeList([`C${i}:C${i + 50}`, `R${i}:R${i + 50}`, `S${i}:S${i + 50}`, `T${i}:T${i + 50}`])
      .insertCheckboxes("Y", "N")

    // age limit
    const ageLimit = new Date()
    ageLimit.setFullYear(applicationTimestamp.getFullYear() - 30)
    const newRule = SpreadsheetApp.newConditionalFormatRule()
      .whenDateBefore(ageLimit)
      .setFontColor("#FF0000")
      .setRanges([detailsSheet.getRange(`J${i}:J${i + 50}`)])
      .build()
    const rules = detailsSheet.getConditionalFormatRules()
    rules.push(newRule)
    detailsSheet.setConditionalFormatRules(rules)
  }

  detailsSheet.appendRow([
    applicationTimestamp.valueOf(),
    data.hearAbout,
    data.haveWorked ? "Y" : "N",
    data.whereReside,
    capitalize(data.givenName),
    capitalize(data.middleName),
    capitalize(data.familyName),
    data.email.toLocaleLowerCase(),
    data.phoneNumber,
    data.dob,
    data.addressLine1,
    data.addressLine2,
    data.addressCity,
    data.addressState,
    resume.getUrl(),
    docs.map((doc) => doc.getUrl()).reduce((prev, cur) => prev + "\n" + cur, ""),
    data.coverLetter,
    data.conflictingInterests ? "Y" : "N",
    data.employedRelatives ? "Y" : "N",
    data.canRelocate ? "Y" : "N",
    data.highestEducation,
    data.whyGood
  ])

  detailsSheet.autoResizeColumns(1, 22)
  detailsSheet.autoResizeRows(i, 1)

  return true
}

function fillSpreadsheetOverview(data: FormData): boolean {
  const spreadsheetId = process.env.RESPONSES_SPREADSHEET_ID
  if (spreadsheetId == null) throw new Error("Could not find spreadsheet to fill in responses")

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  const overviewSheet = spreadsheet.getSheetByName("Overview") ?? spreadsheet.getSheets()[0]
  const applicationTimestamp = new Date()

  const i = overviewSheet.getLastRow() + 1
  const validation = overviewSheet.getRange("D" + i).getDataValidation()
  if (validation == null || validation.getCriteriaType() !== SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
    // boolean values
    overviewSheet.getRange(`D${i}:D${i + 50}`).insertCheckboxes("Y", "N")

    // age limit
    const newRule = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(30)
      .setFontColor("#FF0000")
      .setRanges([overviewSheet.getRange(`G${i}:G${i + 50}`)])
      .build()
    const rules = overviewSheet.getConditionalFormatRules()
    rules.push(newRule)
    overviewSheet.setConditionalFormatRules(rules)
  }

  const prevSN = overviewSheet.getRange(i - 1, 1).getValue()
  overviewSheet.appendRow([
    isNaN(prevSN) ? 1 : Number(prevSN) + 1,
    capitalize(data.givenName) + " " + capitalize(data.familyName),
    STATES.get(data.whereReside),
    data.canRelocate ? "Y" : "N",
    data.email.toLocaleLowerCase(),
    data.phoneNumber.substring(0, 4) +
      "-" +
      data.phoneNumber.substring(4, 7) +
      "-" +
      data.phoneNumber.slice(7),
    calculateAge(new Date(data.dob)),
    EDUCATION_LEVELS.get(data.highestEducation),
    formatShortDate(applicationTimestamp)
  ])

  overviewSheet.autoResizeColumns(1, 9)
  overviewSheet.autoResizeRows(i, 1)

  return true
}
