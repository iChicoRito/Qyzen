declare module 'xlsx' {
  export const utils: {
    json_to_sheet: (data: unknown[]) => unknown
    book_new: () => unknown
    book_append_sheet: (workbook: unknown, worksheet: unknown, name: string) => void
    sheet_to_json: <T = unknown>(worksheet: unknown, options?: unknown) => T[]
  }

  export function read(data: ArrayBuffer | Uint8Array, options?: unknown): {
    SheetNames: string[]
    Sheets: Record<string, unknown>
  }

  export function writeFile(workbook: unknown, fileName: string): void
}

declare module 'exceljs' {
  interface Cell {
    value?: unknown
    font?: Record<string, unknown>
    fill?: Record<string, unknown>
    border?: Record<string, unknown>
    alignment?: Record<string, unknown>
  }

  interface Row {
    height?: number
    number: number
    getCell: (index: number | string) => Cell
    eachCell: (callback: (cell: Cell, colNumber: number) => void) => void
  }

  export class Workbook {
    addWorksheet(name: string): Worksheet
    xlsx: {
      writeBuffer: () => Promise<ArrayBuffer>
    }
  }

  export interface Worksheet {
    mergeCells: (range: string) => void
    getCell: (reference: string) => Cell
    getRow: (rowNumber: number) => Row
    views?: Array<Record<string, unknown>>
    columns: Array<{
      header?: string
      key?: string
      width?: number
    }>
    addRow: (row: Record<string, unknown>) => void
    eachRow: (
      callback: (
        row: {
          eachCell: (
            cellCallback: (
              cell: {
                font?: Record<string, unknown>
                fill?: Record<string, unknown>
                border?: Record<string, unknown>
                alignment?: Record<string, unknown>
              },
              colNumber: number
            ) => void
          ) => void
        },
        rowNumber: number
      ) => void
    ) => void
  }

  const ExcelJS: {
    Workbook: typeof Workbook
  }

  export default ExcelJS
}
