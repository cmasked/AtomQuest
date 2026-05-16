export const brandColors = {
  orange: "#FF6B00",
  navy: "#0F1117",
};

export function getStatusConfig(status: string) {
  switch (status.toUpperCase()) {
    case 'DRAFT':
      return { label: "Draft", bg: "bg-slate-100", text: "text-slate-600" };
    case 'SUBMITTED':
      return { label: "Submitted", bg: "bg-amber-100", text: "text-amber-700" };
    case 'APPROVED':
      return { label: "Approved", bg: "bg-green-100", text: "text-green-700" };
    case 'RETURNED':
      return { label: "Returned", bg: "bg-red-100", text: "text-red-700" };
    case 'NOT_STARTED':
      return { label: "Not Started", bg: "bg-slate-100", text: "text-slate-600" };
    case 'ON_TRACK':
      return { label: "On Track", bg: "bg-green-100", text: "text-green-700" };
    case 'AT_RISK':
      return { label: "At Risk", bg: "bg-amber-100", text: "text-amber-700" };
    case 'COMPLETED':
      return { label: "Completed", bg: "bg-blue-100", text: "text-blue-700" };
    default:
      return { label: status, bg: "bg-gray-100", text: "text-gray-600" };
  }
}
