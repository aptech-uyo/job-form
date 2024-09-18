import { FormData, FormFiles } from "./model"
import { EDUCATION_LEVELS, STATES } from "./utils/constants"
import {
  calculateAge,
  capitalize,
  decodeFile,
  formatShortDate,
  getMimeType,
  lastRowInColumn,
  saveFileToFolder
} from "./utils/utilities"

/**
 * Creates Google Drive files for all the extended data in the form data object
 */
export function saveFiles(data: FormData): FormFiles {
  const attachmentFolderId = process.env.ATTACHMENT_FOLDER_ID
  if (attachmentFolderId == null) throw new Error("Could not find Drive folder to upload files")

  const attachmentFolder = DriveApp.getFolderById(attachmentFolderId)
  const namePrefix = capitalize(data.givenName) + "_" + capitalize(data.familyName)

  return {
    resume: saveFileToFolder(
      { name: `${namePrefix}_Resume`, data: decodeFile(data.resume), contentType: getMimeType(data.resume) },
      attachmentFolder
    ),
    docs: data.additionalDocs.map((doc, i) =>
      saveFileToFolder(
        {
          name: `${namePrefix}_Additional_Doc${i + 1}`,
          data: decodeFile(doc),
          contentType: getMimeType(doc)
        },
        attachmentFolder
      )
    ),
    coverLetter:
      data.coverLetter.trim().length > 0
        ? saveFileToFolder(
            { name: `${namePrefix}_Cover_Letter`, content: data.coverLetter },
            attachmentFolder
          )
        : undefined,
    shortWriting: saveFileToFolder(
      { name: `${namePrefix}_Short_Writing`, content: data.whyGood },
      attachmentFolder
    )
  }
}

export function fillSpreadsheetDetails(data: FormData, files: FormFiles): boolean {
  const spreadsheetId = process.env.RESPONSES_SPREADSHEET_ID
  if (spreadsheetId == null) throw new Error("Could not find spreadsheet to fill in responses")

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  const detailsSheet = spreadsheet.getSheetByName("Details") ?? spreadsheet.getSheets()[1]
  const applicationTimestamp = new Date()

  const i = lastRowInColumn(detailsSheet, "A") + 1
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

  const additionalDocsNames = files.docs.map((doc) => doc.getName())
  const additionalDocsText = additionalDocsNames.join("\n")
  const additionalDocsTextBuilder = SpreadsheetApp.newRichTextValue().setText(additionalDocsText)
  const row = [
    [
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
      data.addressState
    ],
    [
      SpreadsheetApp.newRichTextValue()
        .setText(files.resume.getName())
        .setLinkUrl(files.resume.getUrl())
        .build(),
      files.docs
        .reduce(
          (builder, doc, i) =>
            builder.setLinkUrl(
              additionalDocsText.indexOf(additionalDocsNames[i]),
              additionalDocsText.indexOf(additionalDocsNames[i]) + additionalDocsNames[i].length,
              doc.getUrl()
            ),
          additionalDocsTextBuilder
        )
        .build(),
      files.coverLetter
        ? SpreadsheetApp.newRichTextValue()
            .setText(files.coverLetter.getName())
            .setLinkUrl(files.coverLetter.getUrl())
            .build()
        : SpreadsheetApp.newRichTextValue().setText("").build()
    ],
    [
      data.conflictingInterests ? "Y" : "N",
      data.employedRelatives ? "Y" : "N",
      data.canRelocate ? "Y" : "N",
      data.highestEducation
    ],
    [
      SpreadsheetApp.newRichTextValue()
        .setText(files.shortWriting.getName())
        .setLinkUrl(files.shortWriting.getUrl())
        .build()
    ]
  ]
  detailsSheet.getRange(i, 1, 1, row[0].length).setValues([row[0]])
  detailsSheet
    .getRange(i, row[0].length + 1, 1, row[1].length)
    .setRichTextValues([row[1] as GoogleAppsScript.Spreadsheet.RichTextValue[]])
  detailsSheet.getRange(i, row[0].length + row[1].length + 1, 1, row[2].length).setValues([row[2]])
  detailsSheet
    .getRange(i, row[0].length + row[1].length + row[2].length + 1, 1, row[3].length)
    .setRichTextValues([row[3] as GoogleAppsScript.Spreadsheet.RichTextValue[]])

  detailsSheet.autoResizeColumns(1, row.flat().length)
  detailsSheet.autoResizeRows(i, 1)

  return true
}

export function fillSpreadsheetOverview(data: FormData): boolean {
  const spreadsheetId = process.env.RESPONSES_SPREADSHEET_ID
  if (spreadsheetId == null) throw new Error("Could not find spreadsheet to fill in responses")

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  const overviewSheet = spreadsheet.getSheetByName("Overview") ?? spreadsheet.getSheets()[0]
  const applicationTimestamp = new Date()

  const i = lastRowInColumn(overviewSheet, "A") + 1
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
  const row = [
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
  ]
  overviewSheet.getRange(i, 1, 1, row.length).setValues([row])

  overviewSheet.autoResizeColumns(1, row.length)
  overviewSheet.autoResizeRows(i, 1)

  return true
}
