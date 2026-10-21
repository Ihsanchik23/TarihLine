export type CsvRow = Record<string, string>;

function detectDelimiter(header: string) {
  const candidates = [",", ";", "\t"];
  return candidates.reduce((best, candidate) => {
    const count = header.split(candidate).length;
    return count > best.count ? { value: candidate, count } : best;
  }, { value: ",", count: 1 }).value;
}

export function parseCsv(text: string) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const delimiter = detectDelimiter(normalized.split("\n", 1)[0] ?? "");
  const table: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];

    if (character === '"') {
      if (quoted && normalized[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(value.trim());
      value = "";
    } else if (character === "\n" && !quoted) {
      row.push(value.trim());
      if (row.some(Boolean)) table.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error("В CSV не закрыта кавычка");
  row.push(value.trim());
  if (row.some(Boolean)) table.push(row);
  if (table.length < 2) throw new Error("В CSV нет строк с данными");

  const headers = table[0].map((header) => header.trim().toLowerCase());
  if (headers.some((header) => !header)) throw new Error("В CSV есть столбец без названия");
  if (new Set(headers).size !== headers.length) throw new Error("В CSV повторяются названия столбцов");

  const rows = table.slice(1).map((cells) => Object.fromEntries(
    headers.map((header, index) => [header, cells[index]?.trim() ?? ""]),
  ));

  return { headers, rows };
}
