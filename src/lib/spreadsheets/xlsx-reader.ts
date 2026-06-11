import ExcelJS from 'exceljs'

type SpreadsheetCellObject = {
  text?: string
  result?: unknown
  richText?: Array<{
    text?: string
  }>
}

export type SpreadsheetCellValue = string | number | boolean | Date

// normalizeCellValue - convert ExcelJS cell values into upload-safe primitives
export function normalizeCellValue(value: unknown): SpreadsheetCellValue {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'object') {
    const cellValue = value as SpreadsheetCellObject

    if (typeof cellValue.text === 'string') {
      return cellValue.text
    }

    if (cellValue.result !== undefined) {
      return normalizeCellValue(cellValue.result)
    }

    if (Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((segment) => segment.text || '').join('')
    }
  }

  return String(value)
}

// readFirstWorksheetRows - read a template-style xlsx file with row 2 headers
export async function readFirstWorksheetRows<THeader extends string>(
  file: File,
  headers: readonly THeader[],
  headerRowNumber = 2
) {
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const worksheet = workbook.worksheets[0]

  if (!worksheet) {
    return [] as Array<Record<THeader, SpreadsheetCellValue>>
  }

  const rows: Array<Record<THeader, SpreadsheetCellValue>> = []

  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const record = {} as Record<THeader, SpreadsheetCellValue>

    headers.forEach((header, columnIndex) => {
      record[header] = normalizeCellValue(row.getCell(columnIndex + 1).value)
    })

    rows.push(record)
  }

  return rows
}
