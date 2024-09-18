import { FormData } from "./model"
import { fillSpreadsheetDetails, fillSpreadsheetOverview, saveFiles } from "./persist-form-entry"

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
    const files = saveFiles(data)

    return fillSpreadsheetDetails(data, files) && fillSpreadsheetOverview(data)
  } catch (error) {
    Logger.log(`Error caused by user ${data.givenName} ${data.familyName}, ${data.email}`)
    Logger.log(error)
    throw new Error((error as Error)?.message ?? "Internal server error")
  }
}
