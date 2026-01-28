/**
 * Shared utility functions for live stream UI components
 */

export function getStatusColor(
  status: "disconnected" | "connecting" | "connected" | "error",
): string {
  switch (status) {
    case "connected":
      return "text-green-500";
    case "connecting":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export function getStatusText(
  status: "disconnected" | "connecting" | "connected" | "error",
  errorMessage?: string | null,
): string {
  switch (status) {
    case "connected":
      return "Live";
    case "connecting":
      return "Connecting...";
    case "error":
      return errorMessage || "Error";
    default:
      return "Not streaming";
  }
}

export function calculateAverage(totalScore: number, dartsThrown: number): string {
  return dartsThrown > 0 ? (totalScore / dartsThrown).toFixed(2) : "0.00";
}
