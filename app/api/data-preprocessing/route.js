import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import os from "os";
import path from "path";
import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Parse the JSON body
    const { csvUploadId } = await request.json();
    if (!csvUploadId) {
      return NextResponse.json(
        { error: "Missing csvUploadId" },
        { status: 400 }
      );
    }

    // Initialize the Supabase client using environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Retrieve the CSV upload record from the database using Prisma
    const csvRecord = await prisma.csvUpload.findUnique({
      where: { id: csvUploadId },
    });
    if (!csvRecord) {
      return NextResponse.json(
        { error: "CSV record not found" },
        { status: 404 }
      );
    }

    // Download the CSV file from Supabase Storage
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from("csv-default-uploads")
      .download(csvRecord.csvPath);
    if (downloadError || !downloadData) {
      return NextResponse.json(
        {
          error: `Error downloading CSV: ${
            downloadError?.message || "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }

    // Convert the downloaded Blob to a string (CSV)
    const arrayBuffer = await downloadData.arrayBuffer();
    const csvString = Buffer.from(arrayBuffer).toString("utf-8");

    // Load CSV into a DataFrame using Danfo.js
    let df = await dfd.readCSV(csvString);

    // 1. Rename 'charge_outcome_risk_score' to 'risk_score' if it exists
    if (df.columns.includes("charge_outcome_risk_score")) {
      df = df.rename({
        mapper: { charge_outcome_risk_score: "risk_score" },
        axis: 1,
      });
    }

    // 2. Filter rows where 'charge_captured' is true
    if (!df.columns.includes("charge_captured")) {
      return NextResponse.json(
        { error: "No charge_captured column found in CSV." },
        { status: 400 }
      );
    }
    const capturedFilter = df["charge_captured"].values.map(
      (val) => val === true
    );
    df = df.loc({ rows: capturedFilter });

    // 3. Filter out rows older than 180 days
    const PAST_DAYS = 180;
    const cutoffDate = dayjs().subtract(PAST_DAYS, "day");
    if (!df.columns.includes("created")) {
      return NextResponse.json(
        { error: "No created column found in CSV." },
        { status: 400 }
      );
    }
    const createdValues = df["created"].values;
    const dateMask = createdValues.map((val) => dayjs(val).isAfter(cutoffDate));
    df = df.loc({ rows: dateMask });

    // 4. Split features and labels based on column names
    const allColumns = df.columns;
    const featureCols = allColumns.filter(
      (col) => !isUnimportantCol(col) && !isLabelCol(col)
    );
    const labelCols = allColumns.filter((col) => isLabelCol(col));

    let dfFeatures = df.loc({ columns: featureCols });
    let dfLabels = df.loc({ columns: labelCols });

    // 5. Process both DataFrames (one-hot encoding, numeric conversion, etc.)
    dfFeatures = await processDataFrame(dfFeatures);
    dfLabels = await processDataFrame(dfLabels);

    // 6. Save the processed features as a CSV to a temporary file
    const cleanedFilename = `cleaned_${path.basename(csvRecord.csvPath)}`;
    const cleanedPath = `${csvRecord.userId}/cleaned/${cleanedFilename}`;
    const featuresCSVString = await dfFeatures.toCSV();
    const tmpFilePath = path.join(os.tmpdir(), "features.csv");
    fs.writeFileSync(tmpFilePath, featuresCSVString, "utf-8");

    // 7. Upload the processed CSV to Supabase Storage
    const fileBuffer = fs.readFileSync(tmpFilePath);
    const { error: uploadError } = await supabase.storage
      .from("csv-cleaned-uploads")
      .upload(cleanedPath, fileBuffer, {
        contentType: "text/csv",
        upsert: true,
      });
    if (uploadError) {
      return NextResponse.json(
        { error: `Error uploading cleaned CSV: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 8. Update the CSV record in the database using Prisma
    await prisma.csvUpload.update({
      where: { id: csvUploadId },
      data: {
        cleanedCsvPath: cleanedPath,
        status: "PROCESSED",
      },
    });

    // Return a success response
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

// Helper function to identify unimportant columns
function isUnimportantCol(col) {
  if (col.startsWith("amount_in_") && col !== "amount_in_usd") {
    return true;
  }
  if (["billing_address_postal_code", "card_bin", "created"].includes(col)) {
    return true;
  }
  return false;
}

// Helper function to identify label columns
function isLabelCol(col) {
  if (col.startsWith("risk_level")) {
    return true;
  }
  if (
    [
      "charge_captured",
      "charge_status",
      "dispute_count",
      "dispute_reason",
      "efw_count",
    ].includes(col)
  ) {
    return true;
  }
  return false;
}

// Helper function to process the DataFrame similar to the Python version
async function processDataFrame(df) {
  let dfFinal = df.copy();

  // One-hot encode enumerated columns if they have fewer than 10 unique values
  for (const column of dfFinal.columns) {
    const colData = dfFinal.column(column).values;
    const isStringType = colData.some((val) => typeof val === "string");
    if (isStringType) {
      const uniqueValues = Array.from(new Set(colData));
      if (uniqueValues.length < 10) {
        const dummies = dfd.getDummies(dfFinal, { columns: [column] });
        dfFinal = dummies.drop({ columns: [column], axis: 1 });
      } else {
        dfFinal.drop({ columns: [column], axis: 1, inplace: true });
      }
    }
  }

  // Convert all values to numeric; non-numeric entries become NaN
  dfFinal = dfFinal.applyMap((val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? NaN : parsed;
  });

  // Drop columns that are entirely NaN
  for (const col of dfFinal.columns) {
    const colData = dfFinal.column(col).values;
    const allNaN = colData.every((v) => Number.isNaN(v));
    if (allNaN) {
      dfFinal.drop({ columns: [col], axis: 1, inplace: true });
    }
  }

  // Fill remaining NaN values with 0
  dfFinal = dfFinal.fillNa(0);
  return dfFinal;
}
