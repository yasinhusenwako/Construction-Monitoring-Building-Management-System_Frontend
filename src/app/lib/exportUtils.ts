/**
 * Utility to export an array of objects to a CSV file and trigger a download.
 */
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","), // header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          // Handle values that might contain commas, quotes, or newlines
          const stringVal = val === null || val === undefined ? "" : String(val);
          const escaped = stringVal.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
