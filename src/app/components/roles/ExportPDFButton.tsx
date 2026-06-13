"use client";

import { Loader2, Printer } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";

type VehicleRequestRow = {
  id: number;
  requester?: {
    id: number;
    full_name: string;
    department: {
      id: number;
      department_name: string;
      faculty: {
        id: number;
        name: string;
      };
    };
  };
  vehicle?: {
    id: number;
    vehicle_number: string;
    vehicle_type: string;
    availability_status: string;
  } | null;
  driver?: {
    id: number;
    full_name: string;
    availability_status: string;
  } | null;
  distance_type: string;
  approval_status: string;
  travel_date_from: string;
  travel_date_to: string;
};

interface ExportPDFButtonProps {
  rows: VehicleRequestRow[];
  activeFilterSummary: string;
  summary: {
    totalResults: number;
    approved: number;
    rejected: number;
    pending: number;
  };
}

function formatDateTimeForReport(d: Date) {
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateValue(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  switch (status) {
    case "approved_for_allocation": return "Approved For Allocation";
    case "allocated":               return "Approved";
    case "rejected":                return "Rejected";
    default:
      if (status?.startsWith("pending_")) return "Pending";
      return status || "-";
  }
}

function statusColor(status: string): string {
  if (status === "allocated")               return "#16a34a";
  if (status === "approved_for_allocation") return "#d97706";
  if (status === "rejected")                return "#dc2626";
  if (status?.startsWith("pending_"))       return "#6b7280";
  return "#374151";
}

export default function ExportPDFButton({ rows, activeFilterSummary, summary }: ExportPDFButtonProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  function exportToPDF() {
    setIsGeneratingPDF(true);

    try {
      const now = new Date();
      const generatedAt = formatDateTimeForReport(now);

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Vehicle Request Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, sans-serif;
      font-size: 10px;
      color: #1f2937;
      background: #fff;
      padding: 24px 28px;
    }

    /* Header */
    .header {
      text-align: center;
      padding-bottom: 14px;
      margin-bottom: 6px;
      border-bottom: 3px solid #ea580c;
    }
    .uni-name {
      font-size: 17px;
      font-weight: bold;
      color: #1f2937;
      letter-spacing: 0.02em;
    }
    .report-title {
      font-size: 12px;
      font-weight: 600;
      color: #ea580c;
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .report-meta {
      font-size: 8px;
      color: #9ca3af;
      margin-top: 5px;
    }

    /* Filter bar */
    .filter-bar {
      background: #fff7ed;
      border: 1px solid #fdba74;
      border-radius: 4px;
      padding: 5px 10px;
      margin: 10px 0;
      font-size: 8px;
      color: #7c2d12;
    }
    .filter-bar strong { margin-right: 4px; }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
      margin-top: 4px;
    }
    thead tr { background: #ea580c; color: #fff; }
    thead th {
      padding: 7px 6px;
      text-align: left;
      font-weight: 600;
      font-size: 7.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    tbody tr:nth-child(even) { background: #fff7ed; }
    tbody tr:nth-child(odd)  { background: #ffffff; }
    tbody td {
      padding: 6px 6px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }
    tbody tr:last-child td { border-bottom: 2px solid #ea580c; }
    .req-id { font-weight: 700; color: #ea580c; }
    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 9999px;
      font-size: 7px;
      font-weight: 600;
      border: 1px solid currentColor;
    }

    /* Summary totals */
    .summary-row {
      margin-top: 10px;
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      font-size: 8px;
    }
    .summary-item {
      padding: 3px 10px;
      border-radius: 4px;
      font-weight: 600;
      background: #f3f4f6;
      color: #374151;
    }

    /* Footer */
    .footer {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      padding-top: 7px;
    }

    @page { size: A4 landscape; margin: 12mm 10mm; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="uni-name">Wayamba University of Sri Lanka</div>
    <div class="report-title">Vehicle Request Report</div>
    <div class="report-meta">Generated: ${generatedAt} &nbsp;|&nbsp; Confidential — For internal use only</div>
  </div>

  <!-- Filter bar -->
  <div class="filter-bar">
    <strong>Filters Applied:</strong> ${activeFilterSummary}
  </div>

  <!-- Table -->
  <table>
    <thead>
      <tr>
        <th>Request ID</th>
        <th>Requester</th>
        <th>Faculty</th>
        <th>Vehicle</th>
        <th>Driver</th>
        <th>Trip Type</th>
        <th>Status</th>
        <th>Travel Date From</th>
        <th>Travel Date To</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r) => {
        const label = statusLabel(r.approval_status);
        const color = statusColor(r.approval_status);
        return `
        <tr>
          <td><span class="req-id">REQ-${r.id}</span></td>
          <td>${r.requester?.full_name ?? "Unknown"}</td>
          <td>${r.requester?.department?.faculty?.name ?? "-"}</td>
          <td>${r.vehicle ? `${r.vehicle.vehicle_number} (${r.vehicle.vehicle_type})` : "-"}</td>
          <td>${r.driver?.full_name ?? "-"}</td>
          <td style="text-transform:capitalize">${r.distance_type ?? "-"}</td>
          <td><span class="status-badge" style="color:${color};border-color:${color}">${label}</span></td>
          <td>${formatDateValue(r.travel_date_from)}</td>
          <td>${formatDateValue(r.travel_date_to)}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>

  <!-- Summary totals -->
  <div class="summary-row">
    <span class="summary-item">Total: ${summary.totalResults}</span>
    <span class="summary-item" style="color:#16a34a">Approved: ${summary.approved}</span>
    <span class="summary-item" style="color:#dc2626">Rejected: ${summary.rejected}</span>
    <span class="summary-item" style="color:#d97706">Pending: ${summary.pending}</span>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>University Vehicle Management System — Vehicle Request Report</span>
    <span>${generatedAt}</span>
  </div>

  <script>
    window.onload = function () {
      window.print();
      window.onafterprint = function () { window.close(); };
    };
  </script>
</body>
</html>`;

      const printWindow = window.open("", "_blank", "width=1200,height=800");
      if (!printWindow) {
        alert("Please allow popups for this site to generate the PDF.");
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (e) {
      console.error("PDF generation failed", e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  return (
    <Button
      onClick={exportToPDF}
      disabled={rows.length === 0 || isGeneratingPDF}
      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
    >
      {isGeneratingPDF ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Printer className="w-4 h-4 mr-2" />
          Generate PDF Report
        </>
      )}
    </Button>
  );
}