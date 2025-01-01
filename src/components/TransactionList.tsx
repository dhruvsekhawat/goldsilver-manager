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
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};