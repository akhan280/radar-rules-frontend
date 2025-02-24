"use client";

import React, { useState, useEffect, useTransition } from "react";
import { fetchRules } from "../lib/actions/rule-actions";
import type { Rule, RuleSet, FlaggedFraudPayment } from "../lib/actions/rule-actions";
import { format } from "date-fns";

type RuleCategory = 'f1' | 'precision' | 'money';

function FlaggedPaymentsTable({ payments }: { payments: FlaggedFraudPayment[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (payments.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {isExpanded ? "Hide" : "Show"} Flagged Payments ({payments.length})
      </button>
      
      {isExpanded && (
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Features Used
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(payment.parsed_created_dt), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${payment.amount_in_usd.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.features_used.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RuleBlock({ rule }: { rule: Rule }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Rule {rule.rule_index}</h3>
          <code className="text-purple-600 block mb-4">{rule.rule_predicates}</code>
        </div>
        <a
          href={rule.test_rule_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Test in Stripe →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Accuracy</h4>
          <p className="text-sm">
            Precision: {(rule.precision * 100).toFixed(2)}%
            <span className="text-gray-500 text-xs block">
              ({rule.blocked_fraud_count}/{rule.blocked_fraud_count + rule.blocked_good_count} blocked are fraud)
            </span>
          </p>
          <p className="text-sm">
            Good Blocked: {(rule.good_block_percentage * 100).toFixed(4)}%
            <span className="text-gray-500 text-xs block">
              ({rule.blocked_good_count}/{rule.total_good_count} good payments)
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Coverage</h4>
          <p className="text-sm">
            Recall: {(rule.recall * 100).toFixed(2)}%
            <span className="text-gray-500 text-xs block">
              ({rule.blocked_fraud_count}/{rule.total_fraud_count} fraud blocked)
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Impact</h4>
          <p className="text-sm">
            Fraud Saved: ${rule.fraud_amount_saved.toLocaleString()}
            <span className="text-gray-500 text-xs block">
              of ${rule.total_fraud_amount.toLocaleString()} total fraud
            </span>
          </p>
          <p className="text-sm">
            Good Blocked: ${rule.blocked_good_amount.toLocaleString()}
            <span className="text-gray-500 text-xs block">
              of ${rule.total_amount.toLocaleString()} total volume
            </span>
          </p>
        </div>
      </div>

      <FlaggedPaymentsTable payments={rule.flagged_fraud_payments} />
    </div>
  );
}

export default function RulesView({ csvUploadId }: { csvUploadId: string }) {
  const [rulesData, setRulesData] = useState<RuleSet | null>(null);
  const [activeCategory, setActiveCategory] = useState<RuleCategory>('f1');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchRules(csvUploadId);
      setRulesData(data);
    });
  }, [csvUploadId]);

  function getActiveRules(): Rule[] {
    if (!rulesData) return [];
    
    switch (activeCategory) {
      case 'f1':
        return rulesData.f1OptimizedRules;
      case 'precision':
        return rulesData.precisionOptimizedRules;
      case 'money':
        return rulesData.moneyOptimizedRules;
    }
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Fraud Rules</h2>
        {isPending && (
          <p className="text-sm text-muted-foreground">
            Refreshing rules...
          </p>
        )}
      </div>

      {!rulesData && !isPending && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Loading rules...</p>
        </div>
      )}

      {rulesData && (
        <>
          <div className="mb-8">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCategory('f1')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeCategory === 'f1'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                F1-Optimized Rules
              </button>
              <button
                onClick={() => setActiveCategory('precision')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeCategory === 'precision'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Precision-Optimized Rules
              </button>
              <button
                onClick={() => setActiveCategory('money')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeCategory === 'money'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Money-Saving Rules
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {getActiveRules().map((rule) => (
              <RuleBlock key={rule.rule_index} rule={rule} />
            ))}
          </div>
        </>
      )}
    </div>
  );
} 