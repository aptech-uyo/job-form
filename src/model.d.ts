export interface FormData {
  hearAbout: string
  haveWorked: boolean
  whereReside: string
  givenName: string
  middleName: string
  familyName: string
  email: string
  phoneNumber: string
  dob: string
  addressLine1: string
  addressLine2: string
  addressCity: string
  addressState: string
  resume: string
  additionalDocs: string[]
  coverLetter: string
  conflictingInterests: boolean
  employedRelatives: boolean
  canRelocate: boolean
  highestEducation: string
  whyGood: string
}

export interface FormFiles {
  resume: GoogleAppsScript.Drive.File
  docs: GoogleAppsScript.Drive.File[]
  coverLetter?: GoogleAppsScript.Drive.File
  shortWriting: GoogleAppsScript.Drive.File
}

export type FileData = FileBlob | FileContent

export interface FileBlob {
  name: string
  data: GoogleAppsScript.Byte[]
  contentType: string
}

export interface FileContent {
  name: string
  content: string
}
