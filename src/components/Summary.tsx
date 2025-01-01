import React from "react";
import { Transaction } from "./TransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryProps {
  transactions: Transaction[];
}

export const Summary: React.FC<SummaryProps> = ({ transactions }) => {
  const calculateInventory = (metal: "gold" | "silver") => {
    return transactions.reduce((acc, curr) => {
      if (curr.metal !== metal) return acc;
      return curr.type === "buy" ? acc + curr.weight : acc - curr.weight;
    }, 0);
  };

  const calculateValue = (metal: "gold" | "silver") => {
    const latestPrice = transactions
      .filter((t) => t.metal === metal)
      .slice(-1)[0]?.price || 0;
    return calculateInventory(metal) * latestPrice;
  };

  const goldInventory = calculateInventory("gold");
  const silverInventory = calculateInventory("silver");
  const totalValue = calculateValue("gold") + calculateValue("silver");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-gold-light">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Gold Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{goldInventory.toFixed(2)}g</p>
        </CardContent>
      </Card>

      <Card className="bg-silver-light">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Silver Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{silverInventory.toFixed(2)}g</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
};