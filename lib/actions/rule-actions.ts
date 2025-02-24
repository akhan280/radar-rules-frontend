"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type FlaggedFraudPayment = {
  email: string | null;
  customer_id: string | null;
  amount_in_usd: number;
  features_used: string[];
  transaction_id: string | null;
  created_timestamp: string;
  parsed_created_dt: string;
};

export type RuleCondition = [string, string, number]; // [feature, operator, threshold]

export type Rule = {
  recall: number;
  precision: number;
  rule_list: RuleCondition[];
  rule_index: number;
  since_date: string;
  total_amount: number;
  test_rule_link: string;
  rule_predicates: string;
  total_good_count: number;
  total_fraud_count: number;
  blocked_good_count: number;
  fraud_amount_saved: number;
  total_fraud_amount: number;
  blocked_fraud_count: number;
  blocked_good_amount: number;
  good_block_percentage: number;
  flagged_fraud_payments: FlaggedFraudPayment[];
  fraud_block_percentage: number;
};

export type RuleSet = {
  f1OptimizedRules: Rule[];
  precisionOptimizedRules: Rule[];
  moneyOptimizedRules: Rule[];
  fraudCount: number;
  projectId: string;
  csvUploadId: string;
};

export async function fetchRules(csvUploadId: string): Promise<RuleSet> {
  const result = await prisma.fraudAnalysisResult.findFirst({
    where: {
      csvUploadId: csvUploadId,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!result) {
    throw new Error("No analysis results found");
  }

  return {
    f1OptimizedRules: result.f1OptimizedRules as Rule[],
    precisionOptimizedRules: result.precisionOptimizedRules as Rule[],
    moneyOptimizedRules: result.moneyOptimizedRules as Rule[],
    fraudCount: result.fraudCount,
    projectId: result.projectId,
    csvUploadId: result.csvUploadId
  };
} 