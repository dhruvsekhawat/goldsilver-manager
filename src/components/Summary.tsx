import React from "react";
import { Transaction } from "./TransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryProps {
  transactions: Transaction[];
}

export const Summary: React.FC<SummaryProps> = ({ transactions }) => {
  const calculateMetalStats = (metal: "gold" | "silver") => {
    const metalTransactions = transactions.filter((t) => t.metal === metal);
    const buyTransactions = metalTransactions.filter((t) => t.type === "buy");
    const sellTransactions = metalTransactions.filter((t) => t.type === "sell");

    const totalBuyWeight = buyTransactions.reduce((acc, curr) => acc + curr.weight, 0);
    const totalBuyValue = buyTransactions.reduce((acc, curr) => acc + (curr.weight * curr.price), 0);
    const totalSellWeight = sellTransactions.reduce((acc, curr) => acc + curr.weight, 0);
    const totalSellValue = sellTransactions.reduce((acc, curr) => acc + (curr.weight * curr.price), 0);
    
    const averageBuyRate = totalBuyWeight > 0 ? totalBuyValue / totalBuyWeight : 0;
    const totalProfit = sellTransactions.reduce((acc, curr) => acc + (curr.profit || 0), 0);
    const currentInventory = totalBuyWeight - totalSellWeight;

    return {
      totalBuyValue,
      totalSellValue,
      currentInventory,
      averageBuyRate,
      totalProfit,
    };
  };

  const goldStats = calculateMetalStats("gold");
  const silverStats = calculateMetalStats("silver");

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-gold-light">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Gold Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Current Inventory: {goldStats.currentInventory.toFixed(2)}g</p>
          <p>Total Buy Value: ${goldStats.totalBuyValue.toFixed(2)}</p>
          <p>Total Sell Value: ${goldStats.totalSellValue.toFixed(2)}</p>
          <p>Avg. Buy Rate: ${goldStats.averageBuyRate.toFixed(2)}/g</p>
          <p>Total Profit: ${goldStats.totalProfit.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className="bg-silver-light">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Silver Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Current Inventory: {silverStats.currentInventory.toFixed(2)}g</p>
          <p>Total Buy Value: ${silverStats.totalBuyValue.toFixed(2)}</p>
          <p>Total Sell Value: ${silverStats.totalSellValue.toFixed(2)}</p>
          <p>Avg. Buy Rate: ${silverStats.averageBuyRate.toFixed(2)}/g</p>
          <p>Total Profit: ${silverStats.totalProfit.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Total Buy Value: ${(goldStats.totalBuyValue + silverStats.totalBuyValue).toFixed(2)}</p>
          <p>Total Sell Value: ${(goldStats.totalSellValue + silverStats.totalSellValue).toFixed(2)}</p>
          <p>Total Profit: ${(goldStats.totalProfit + silverStats.totalProfit).toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
};