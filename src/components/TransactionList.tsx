import React from "react";
import { Transaction } from "./TransactionForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface TransactionListProps {
  transactions: Transaction[];
  filter?: "all" | "buy" | "sell";
}

// Helper function to format currency in Indian format
const formatIndianCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
};

// Helper function to format weight based on metal type
const formatWeight = (weight: number, metal: "gold" | "silver"): string => {
  if (metal === "gold") {
    return `${(weight / 10).toFixed(2)}`;
  } else {
    return `${(weight / 1000).toFixed(2)}`;
  }
};

// Helper function to format remaining weight
const formatRemainingWeight = (weight: number | undefined, metal: "gold" | "silver"): string => {
  if (!weight) return "-";
  return formatWeight(weight, metal);
};

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions,
  filter = "all"
}) => {
  const filteredTransactions = transactions
    .filter(t => filter === "all" || t.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Metal</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Total</TableHead>
            {filter !== "sell" && <TableHead>Stock</TableHead>}
            {filter !== "buy" && <TableHead>Profit</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{format(new Date(transaction.date), "dd/MM/yyyy")}</TableCell>
              <TableCell className={transaction.type === "buy" ? "text-green-600" : "text-red-600"}>
                {transaction.type.toUpperCase()}
              </TableCell>
              <TableCell className={transaction.metal === "gold" ? "text-gold-dark" : "text-silver-dark"}>
                {transaction.metal.toUpperCase()}
              </TableCell>
              <TableCell>{formatWeight(transaction.weight, transaction.metal)}</TableCell>
              <TableCell>{formatIndianCurrency(transaction.price * (transaction.metal === "gold" ? 10 : 1000))}</TableCell>
              <TableCell>{formatIndianCurrency(transaction.weight * transaction.price)}</TableCell>
              {filter !== "sell" && (
                <TableCell>
                  {transaction.type === "buy" ? 
                    formatRemainingWeight(transaction.remainingWeight, transaction.metal) : 
                    "-"}
                </TableCell>
              )}
              {filter !== "buy" && (
                <TableCell>
                  {transaction.type === "sell" && transaction.profit ? 
                    formatIndianCurrency(transaction.profit) : 
                    "-"}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};