export function doGet(_e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  // form.html
  return HtmlService.createTemplateFromFile("form").evaluate()
}

export function include(fileName: string): string {
  return HtmlService.createHtmlOutputFromFile(fileName).getContent()
}

export function uploadFileToGoogleDrive(
  base64Data: string,
  fileName: string,
  name: string,
  email: string,
): string {
  try {
    const dropbox = "Graduate Management Trainee (Sep 2024) [Resumes]"
    const folders = DriveApp.getFoldersByName(dropbox)

    let folder
    if (folders.hasNext()) {
      folder = folders.next()
    } else {
      folder = DriveApp.createFolder(dropbox)
    }

    const contentType = base64Data.substring(5, base64Data.indexOf(";"))
    const bytes = Utilities.base64Decode(base64Data.substr(base64Data.indexOf("base64,") + 7))
    const blob = Utilities.newBlob(bytes, contentType, fileName)

    folder.createFolder([name, email].join(" ")).createFile(blob)

    return "OK"
  } catch (f) {
    return f?.toString() ?? ""
  }
}
