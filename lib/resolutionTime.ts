/**
 * Calculate resolution time for a ticket
 * Returns time from creation to resolution (or current time if still resolved)
 * @param {string|number|Date} created_at - Ticket creation timestamp
 * @param {string|number|Date} resolved_at - Ticket resolution timestamp (optional, uses current time if not provided and status is resolved)
 * @param {string} status - Ticket status
 * @returns {string|null} - Formatted resolution time or null if not resolved
 */
export function calculateResolutionTime(created_at, resolved_at, status) {
  if (!created_at) return null;
  
  // Only calculate if ticket is resolved
  const isResolved = status && String(status).toLowerCase() === "resolved";
  if (!isResolved) return null;

  try {
    // Parse created_at
    let createdMs = null;
    if (created_at instanceof Date) {
      createdMs = created_at.getTime();
    } else if (typeof created_at === "number") {
      // If <= 10 digits, assume seconds, else milliseconds
      createdMs = String(created_at).length <= 10 ? created_at * 1000 : created_at;
    } else if (typeof created_at === "string") {
      createdMs = new Date(created_at).getTime();
    }

    if (!createdMs || isNaN(createdMs)) return null;

    // Parse resolved_at (or use current time if not provided)
    let resolvedMs = null;
    if (resolved_at) {
      if (resolved_at instanceof Date) {
        resolvedMs = resolved_at.getTime();
      } else if (typeof resolved_at === "number") {
        resolvedMs = String(resolved_at).length <= 10 ? resolved_at * 1000 : resolved_at;
      } else if (typeof resolved_at === "string") {
        resolvedMs = new Date(resolved_at).getTime();
      }
    } else {
      // Use current time if resolved_at not provided
      resolvedMs = Date.now();
    }

    if (!resolvedMs || isNaN(resolvedMs)) return null;

    // Calculate difference in milliseconds
    const diffMs = resolvedMs - createdMs;
    if (diffMs < 0) return null; // Invalid (resolved before created)

    return formatDuration(diffMs);
  } catch (error) {
    console.warn("Error calculating resolution time:", error);
    return null;
  }
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
  if (months > 0) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  if (weeks > 0) {
    return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  }
  if (days > 0) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  if (hours > 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
}
