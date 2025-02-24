import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import _ from "lodash";
import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { csvUploadId } = await request.json();
    if (!csvUploadId) {
      return NextResponse.json({ error: "Missing csvUploadId" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase credentials are not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch CSV record from Prisma
    const csvRecord = await prisma.csvUpload.findUnique({
      where: { id: csvUploadId },
    });
    
    if (!csvRecord) {
      return NextResponse.json({ error: "CSV record not found" }, { status: 404 });
    }

    // Update CSV record in database
    await prisma.csvUpload.update({
      where: { id: csvUploadId },
      data: {
        cleanedCsvPath: cleanedPath,
        status: "PROCESSED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data processed successfully",
      cleanedPath,
    });

  } catch (err) {
    console.error(`Error processing CSV: ${err.message}`);
    return NextResponse.json(
      { error: `Error processing CSV: ${err.message}` },
      { status: 500 }
    );
  }
}

function isUnimportantCol(col) {
  if (col.startsWith("amount_in_") && col !== "amount_in_usd") {
    return true;
  }
  return ["billing_address_postal_code", "card_bin", "created"].includes(col);
}

function isLabelCol(col) {
  if (col.startsWith("risk_level")) {
    return true;
  }
  return [
    "charge_captured",
    "charge_status",
    "dispute_count",
    "dispute_reason",
    "efw_count"
  ].includes(col);
}

function processDataFrame(data) {
  let processed = _.cloneDeep(data);
  const columns = Object.keys(processed[0] || {});

  // One-hot encode categorical columns
  columns.forEach(column => {
    // Skip row_id column
    if (column === "row_id") return;
    const values = processed.map(row => row[column]);
    const uniqueValues = _.uniq(values.filter(v => v != null));

    // Check if column is categorical with < 10 unique values
    if (uniqueValues.length < 10 && uniqueValues.some(v => isNaN(Number(v)))) {
      uniqueValues.forEach(value => {
        const newColumn = `${column}__${value}`;
        processed = processed.map(row => ({
          ...row,
          [newColumn]: row[column] === value ? 1 : 0
        }));
      });
      processed = processed.map(row => _.omit(row, [column]));
    }
  });

  // Convert values to numeric where possible and set NaN to 0
  processed = processed.map(row => {
    const numericRow = {};
    Object.entries(row).forEach(([key, value]) => {
      if (key === "row_id") {
        numericRow[key] = value;
      } else {
        const numValue = Number(value);
        numericRow[key] = isNaN(numValue) ? 0 : numValue;
      }
    });
    return numericRow;
  });

  // Remove columns that are all NaN (after conversion)
  const allColumns = Object.keys(processed[0] || {});
  const columnsToKeep = allColumns.filter(col => {
    const values = processed.map(row => row[col]);
    return !values.every(v => isNaN(v));
  });

  return processed.map(row => _.pick(row, columnsToKeep));
}
