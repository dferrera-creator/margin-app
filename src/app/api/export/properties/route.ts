import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data";
import { parsePeriodFromParams } from "@/lib/period";
import ExcelJS from "exceljs";

/**
 * GET /api/export/properties?month=2026-03&archived=true
 *
 * Downloads an Excel file with all property financials for the selected period.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || undefined;
  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;
  const includeArchived = searchParams.get("archived") === "true";

  const period = parsePeriodFromParams({ month, start, end });
  const data = await getDashboardData(period, { includeArchived });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Properties");

  // Header row
  sheet.columns = [
    { header: "Property", key: "nickname", width: 25 },
    { header: "Business Model", key: "businessModel", width: 15 },
    { header: "Active", key: "active", width: 10 },
    { header: "Gross Payout", key: "grossPayout", width: 15 },
    { header: "Owner Payout", key: "ownerPayout", width: 15 },
    { header: "Delmar Revenue", key: "delmarRevenue", width: 15 },
    { header: "Operating Expenses", key: "totalOperatingExpenses", width: 18 },
    { header: "Net Margin", key: "netUtilityMargin", width: 15 },
    { header: "Margin %", key: "utilityMarginPercentGross", width: 12 },
    { header: "Nights Booked", key: "nightsBooked", width: 14 },
    { header: "Stays", key: "staysBooked", width: 10 },
    { header: "Reservations", key: "totalReservations", width: 14 },
    // Expense breakdown
    { header: "Housekeeping", key: "housekeeping", width: 14 },
    { header: "Laundry", key: "laundry", width: 12 },
    { header: "Electricity", key: "electricity", width: 12 },
    { header: "Water", key: "water", width: 12 },
    { header: "Gas", key: "gas", width: 12 },
    { header: "Internet", key: "internet", width: 12 },
    { header: "HOA", key: "hoa", width: 12 },
    { header: "PMS Software", key: "pmsSoftware", width: 14 },
    { header: "Autorank", key: "autorank", width: 12 },
    { header: "RMS Software", key: "rmsSoftware", width: 14 },
    { header: "Messaging", key: "messagingSoftware", width: 14 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  // Data rows
  for (const p of data.properties) {
    sheet.addRow({
      nickname: p.propertyNickname,
      businessModel: p.businessModel === "commission" ? "Commission" : "Master Lease",
      active: p.active ? "Yes" : "Archived",
      grossPayout: p.grossPayout,
      ownerPayout: p.ownerPayout,
      delmarRevenue: p.delmarRevenue,
      totalOperatingExpenses: p.totalOperatingExpenses,
      netUtilityMargin: p.netUtilityMargin,
      utilityMarginPercentGross: p.utilityMarginPercentGross !== null ? p.utilityMarginPercentGross / 100 : null,
      nightsBooked: p.nightsBooked,
      staysBooked: p.staysBooked,
      totalReservations: p.totalReservations,
      housekeeping: p.expenses.housekeeping.final,
      laundry: p.expenses.laundry.final,
      electricity: p.expenses.electricity.final,
      water: p.expenses.water.final,
      gas: p.expenses.gas.final,
      internet: p.expenses.internet.final,
      hoa: p.expenses.hoa.final,
      pmsSoftware: p.expenses.pmsSoftware.final,
      autorank: p.expenses.autorank.final,
      rmsSoftware: p.expenses.rmsSoftware.final,
      messagingSoftware: p.expenses.messagingSoftware.final,
    });
  }

  // Format currency columns
  const currencyCols = ["D", "E", "F", "G", "H", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W"];
  for (const col of currencyCols) {
    sheet.getColumn(col).numFmt = '$#,##0.00';
  }
  // Format percent column
  sheet.getColumn("I").numFmt = '0.0%';

  // Summary row
  const summaryRow = sheet.addRow({
    nickname: "TOTAL",
    grossPayout: data.totalGrossPayout,
    delmarRevenue: data.totalDelmarRevenue,
    totalOperatingExpenses: data.totalOperatingExpenses,
    netUtilityMargin: data.totalUtilityMargin,
    utilityMarginPercentGross: data.averageUtilityMarginPercent !== null ? data.averageUtilityMarginPercent / 100 : null,
  });
  summaryRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  const periodLabel = month || `${start}_${end}` || "current";
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="properties_${periodLabel}.xlsx"`,
    },
  });
}
