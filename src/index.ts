import { FormData } from "./model"
import { fillSpreadsheetDetails, fillSpreadsheetOverview, saveFiles } from "./persist-form-entry"

export let formHearAbout: string

export function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  // form.html
  formHearAbout = e.parameter.formHearAbout
  return HtmlService.createTemplateFromFile("form")
    .evaluate()
    .setTitle("Job Application for Graduate Management Trainee, Solution Tech Limited")
    .setFaviconUrl(process.env.LOGO_URL ?? "")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
}

export function include(fileName: string): string {
  const template = HtmlService.createTemplateFromFile(fileName)
  if (fileName.startsWith("javascript")) template.formHearAbout = formHearAbout
  return template.evaluate().getContent()
}

export function registerSubmission(data: FormData): boolean {
  try {
    const files = saveFiles(data)

    return fillSpreadsheetDetails(data, files) && fillSpreadsheetOverview(data)
  } catch (error) {
    Logger.log(`Error caused by user ${data.givenName} ${data.familyName}, ${data.email}`)
    Logger.log(error)
    throw new Error((error as Error)?.message ?? "Internal server error")
  }
}

export function getLogoBase64(index: number): string {
  let logoDriveId
  switch (index) {
    case 1:
      logoDriveId = process.env.BRAND_LOGO1_DRIVE_ID
      break
    case 2:
      logoDriveId = process.env.BRAND_LOGO2_DRIVE_ID
      break
    case 3:
      logoDriveId = process.env.BRAND_LOGO3_DRIVE_ID
  }
  if (logoDriveId == null) throw new Error("Could not find company logo in Drive")

  const logo = DriveApp.getFileById(logoDriveId)
  return Utilities.base64Encode(logo.getBlob().getBytes())
}
