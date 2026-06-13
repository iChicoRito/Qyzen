import ExcelJS from 'exceljs'

import type { EducatorScoreExportResult, EducatorScoreExportSummary } from '@/lib/supabase/educator-scores'

// buildFileName - derive safe filename from export summary
export function buildFileName(summary: EducatorScoreExportSummary) {
  const safeValue = `${summary.subjectName}-${summary.sectionName}-${summary.assessmentCode}-${summary.termName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeValue || 'educator-grades'}.xlsx`
}

// sanitizeSheetName - make assessment code safe for use as an Excel sheet name
function sanitizeSheetName(name: string): string {
  return name
    .replace(/[\\/*?[\]:| ]/g, '_')
    .slice(0, 31)
    .replace(/^_+|_+$/g, '') || 'Sheet'
}

// buildGroupedFileName - derive filename for a grouped subject/section/term workbook
export function buildGroupedFileName(summary: EducatorScoreExportSummary): string {
  // "2025 - 2026" → "2026"; "2026" → "2026"
  const yearParts = summary.academicYear.split(/\s*-\s*/)
  const endYear = yearParts[yearParts.length - 1].trim() || summary.academicYear.trim()

  // "1st Semester" → "1"; "2nd Semester" → "2"
  const semNumber = summary.semester.trim().startsWith('2') ? '2' : '1'

  // "PRELIM - 1st Semester" → "PRELIM"
  const termPart = summary.termName.split(' - ')[0].trim()

  const safeValue = `${summary.subjectCode}-${summary.subjectName}-${termPart}-${endYear}-SEM${semNumber}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeValue || 'educator-grades'}.xlsx`
}

// buildMultiSheetWorkbook - create one workbook with one sheet per assessment
export function buildMultiSheetWorkbook(results: EducatorScoreExportResult[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()
  const usedSheetNames = new Set<string>()
  const columns = [
    'Student Name',
    'Student ID',
    'Subject',
    'Section',
    'Assessment Code',
    'Academic Term',
    'Highest Score',
    'Total Questions',
    'Percentage',
    'Status',
    'Remark',
    'Highest Submitted At',
  ]

  for (const result of results) {
    let sheetName = sanitizeSheetName(result.summary.assessmentCode)
    let suffix = 2
    while (usedSheetNames.has(sheetName)) {
      sheetName = `${sanitizeSheetName(result.summary.assessmentCode).slice(0, 28)}_${suffix}`
      suffix++
    }
    usedSheetNames.add(sheetName)

    const worksheet = workbook.addWorksheet(sheetName)

    worksheet.mergeCells('A1:L1')
    worksheet.getCell('A1').value = 'Qyzen Grade Export'
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '171717' },
    }

    worksheet.getCell('A3').value = 'Subject'
    worksheet.getCell('B3').value = result.summary.subjectName
    worksheet.getCell('A4').value = 'Section'
    worksheet.getCell('B4').value = result.summary.sectionName
    worksheet.getCell('A5').value = 'Assessment Code'
    worksheet.getCell('B5').value = result.summary.assessmentCode
    worksheet.getCell('A6').value = 'Academic Term'
    worksheet.getCell('B6').value = result.summary.termName
    worksheet.getCell('D3').value = 'Total Enrolled'
    worksheet.getCell('E3').value = result.summary.totalEnrolled
    worksheet.getCell('D4').value = 'With Submission'
    worksheet.getCell('E4').value = result.summary.studentsWithSubmission
    worksheet.getCell('D5').value = 'No Submission'
    worksheet.getCell('E5').value = result.summary.studentsWithoutSubmission

    ;['A3', 'A4', 'A5', 'A6', 'D3', 'D4', 'D5'].forEach((cellRef) => {
      const cell = worksheet.getCell(cellRef)
      cell.font = { bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F4F4F5' },
      }
    })

    const headerRow = worksheet.getRow(8)
    columns.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0A0A0A' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'D4D4D8' } },
        left: { style: 'thin', color: { argb: 'D4D4D8' } },
        bottom: { style: 'thin', color: { argb: 'D4D4D8' } },
        right: { style: 'thin', color: { argb: 'D4D4D8' } },
      }
    })

    result.rows.forEach((rowData, rowIndex) => {
      const row = worksheet.getRow(rowIndex + 9)
      const cellValues = [
        rowData.studentName,
        rowData.studentUserId,
        rowData.subjectName,
        rowData.sectionName,
        rowData.assessmentCode,
        rowData.termName,
        rowData.highestScore,
        rowData.totalQuestions,
        `${rowData.percentage}%`,
        rowData.statusLabel,
        rowData.remark,
        rowData.highestSubmittedAt || 'Not submitted',
      ]

      cellValues.forEach((value, columnIndex) => {
        const cell = row.getCell(columnIndex + 1)
        cell.value = value
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: row.number % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'E4E4E7' } },
          left: { style: 'thin', color: { argb: 'E4E4E7' } },
          bottom: { style: 'thin', color: { argb: 'E4E4E7' } },
          right: { style: 'thin', color: { argb: 'E4E4E7' } },
        }
      })
    })

    worksheet.columns = [
      { key: 'student_name', width: 28 },
      { key: 'student_id', width: 20 },
      { key: 'subject', width: 28 },
      { key: 'section', width: 20 },
      { key: 'assessment_code', width: 18 },
      { key: 'term_name', width: 24 },
      { key: 'highest_score', width: 14 },
      { key: 'total_questions', width: 16 },
      { key: 'percentage', width: 14 },
      { key: 'status', width: 16 },
      { key: 'remark', width: 24 },
      { key: 'highest_submitted_at', width: 24 },
    ]
    worksheet.views = [{ state: 'frozen', ySplit: 8 }]
  }

  return workbook
}

// buildWorkbook - create the formatted grade export workbook
export function buildWorkbook(result: EducatorScoreExportResult) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Grades')
  const columns = [
    'Student Name',
    'Student ID',
    'Subject',
    'Section',
    'Assessment Code',
    'Academic Term',
    'Highest Score',
    'Total Questions',
    'Percentage',
    'Status',
    'Remark',
    'Highest Submitted At',
  ]

  worksheet.mergeCells('A1:L1')
  worksheet.getCell('A1').value = 'Qyzen Grade Export'
  worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
  worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '171717' },
  }

  worksheet.getCell('A3').value = 'Subject'
  worksheet.getCell('B3').value = result.summary.subjectName
  worksheet.getCell('A4').value = 'Section'
  worksheet.getCell('B4').value = result.summary.sectionName
  worksheet.getCell('A5').value = 'Assessment Code'
  worksheet.getCell('B5').value = result.summary.assessmentCode
  worksheet.getCell('A6').value = 'Academic Term'
  worksheet.getCell('B6').value = result.summary.termName
  worksheet.getCell('D3').value = 'Total Enrolled'
  worksheet.getCell('E3').value = result.summary.totalEnrolled
  worksheet.getCell('D4').value = 'With Submission'
  worksheet.getCell('E4').value = result.summary.studentsWithSubmission
  worksheet.getCell('D5').value = 'No Submission'
  worksheet.getCell('E5').value = result.summary.studentsWithoutSubmission

  ;['A3', 'A4', 'A5', 'A6', 'D3', 'D4', 'D5'].forEach((cellRef) => {
    const cell = worksheet.getCell(cellRef)
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F4F4F5' },
    }
  })

  const headerRow = worksheet.getRow(8)
  columns.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = header
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0A0A0A' },
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'D4D4D8' } },
      left: { style: 'thin', color: { argb: 'D4D4D8' } },
      bottom: { style: 'thin', color: { argb: 'D4D4D8' } },
      right: { style: 'thin', color: { argb: 'D4D4D8' } },
    }
  })

  result.rows.forEach((rowData, rowIndex) => {
    const row = worksheet.getRow(rowIndex + 9)
    const cellValues = [
      rowData.studentName,
      rowData.studentUserId,
      rowData.subjectName,
      rowData.sectionName,
      rowData.assessmentCode,
      rowData.termName,
      rowData.highestScore,
      rowData.totalQuestions,
      `${rowData.percentage}%`,
      rowData.statusLabel,
      rowData.remark,
      rowData.highestSubmittedAt || 'Not submitted',
    ]

    cellValues.forEach((value, columnIndex) => {
      const cell = row.getCell(columnIndex + 1)
      cell.value = value
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: row.number % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'E4E4E7' } },
        left: { style: 'thin', color: { argb: 'E4E4E7' } },
        bottom: { style: 'thin', color: { argb: 'E4E4E7' } },
        right: { style: 'thin', color: { argb: 'E4E4E7' } },
      }
    })
  })

  worksheet.columns = [
    { key: 'student_name', width: 28 },
    { key: 'student_id', width: 20 },
    { key: 'subject', width: 28 },
    { key: 'section', width: 20 },
    { key: 'assessment_code', width: 18 },
    { key: 'term_name', width: 24 },
    { key: 'highest_score', width: 14 },
    { key: 'total_questions', width: 16 },
    { key: 'percentage', width: 14 },
    { key: 'status', width: 16 },
    { key: 'remark', width: 24 },
    { key: 'highest_submitted_at', width: 24 },
  ]
  worksheet.views = [{ state: 'frozen', ySplit: 8 }]

  return workbook
}

// workbookToBuffer - serialize workbook to ArrayBuffer for zipping
export async function workbookToBuffer(workbook: InstanceType<typeof ExcelJS.Workbook>) {
  return workbook.xlsx.writeBuffer()
}

// downloadWorkbook - trigger browser download of generated workbook
export async function downloadWorkbook(workbook: InstanceType<typeof ExcelJS.Workbook>, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
