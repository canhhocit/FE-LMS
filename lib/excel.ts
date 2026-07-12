import * as XLSX from "xlsx"

export function exportRowsToExcel(
  rows: Record<string, string | number>[],
  fileName: string,
  sheetName = "Sheet1",
) {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, fileName)
}

export async function parseExcelFile(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" })
}
