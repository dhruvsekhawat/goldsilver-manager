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
            <TableHead>Weight (g)</TableHead>
            <TableHead>Price/g</TableHead>
            <TableHead>Total</TableHead>
            {filter !== "sell" && <TableHead>Remaining</TableHead>}
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
              <TableCell>{transaction.weight.toFixed(2)}</TableCell>
              <TableCell>${transaction.price.toFixed(2)}</TableCell>
              <TableCell>${(transaction.weight * transaction.price).toFixed(2)}</TableCell>
              {filter !== "sell" && (
                <TableCell>
                  {transaction.type === "buy" ? 
                    `${transaction.remainingWeight?.toFixed(2)}g` : 
                    "-"}
                </TableCell>
              )}
              {filter !== "buy" && (
                <TableCell>
                  {transaction.type === "sell" && transaction.profit ? 
                    `$${transaction.profit.toFixed(2)}` : 
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