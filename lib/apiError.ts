// The message to show for a failed API call. The backend answers with
// {"error": "..."} for its own checks and with {field: ["..."]} when a field
// fails validation; some older responses use message or detail.
export function apiErrorMessage(err: any, fallback: string): string {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim() && !data.trim().startsWith("<")) return data;
  if (data && typeof data === "object") {
    for (const key of ["error", "message", "detail"]) {
      if (typeof data[key] === "string" && data[key].trim()) return data[key];
    }
    for (const [field, value] of Object.entries(data)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === "string" && first.trim()) {
        return field === "non_field_errors" ? first : `${field.replace(/_/g, " ")}: ${first}`;
      }
    }
  }
  return fallback;
}
