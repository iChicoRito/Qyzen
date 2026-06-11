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
    worksheets: Worksheet[]
    addWorksheet(name: string): Worksheet
    xlsx: {
      load: (data: ArrayBuffer) => Promise<Workbook>
      writeBuffer: () => Promise<ArrayBuffer>
    }
  }

  export interface Worksheet {
    rowCount: number
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
