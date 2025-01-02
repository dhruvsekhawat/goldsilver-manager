import React from "react";
import { Transaction } from "./TransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryProps {
  transactions: Transaction[];
}

const formatIndianCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
};

export const Summary: React.FC<SummaryProps> = ({ transactions }) => {
  // Calculate gold summary
  const goldTransactions = transactions.filter(t => t.metal === "gold");
  const goldBuyTransactions = goldTransactions.filter(t => t.type === "buy");
  const goldSellTransactions = goldTransactions.filter(t => t.type === "sell");
  
  const goldSummary = {
    currentStock: goldTransactions.reduce((acc, t) => acc + (t.type === "buy" ? (t.remainingWeight || 0) : 0), 0),
    totalBuyValue: goldBuyTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0),
    totalSellValue: goldSellTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0),
    averageRate: goldBuyTransactions.length > 0 
      ? goldBuyTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0) / 
        goldBuyTransactions.reduce((acc, t) => acc + t.weight, 0)
      : 0,
    totalProfit: goldSellTransactions.reduce((acc, t) => acc + (t.profit || 0), 0),
  };

  // Calculate silver summary
  const silverTransactions = transactions.filter(t => t.metal === "silver");
  const silverBuyTransactions = silverTransactions.filter(t => t.type === "buy");
  const silverSellTransactions = silverTransactions.filter(t => t.type === "sell");
  
  const silverSummary = {
    currentStock: silverTransactions.reduce((acc, t) => acc + (t.type === "buy" ? (t.remainingWeight || 0) : 0), 0),
    totalBuyValue: silverBuyTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0),
    totalSellValue: silverSellTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0),
    averageRate: silverBuyTransactions.length > 0 
      ? silverBuyTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0) / 
        silverBuyTransactions.reduce((acc, t) => acc + t.weight, 0)
      : 0,
    totalProfit: silverSellTransactions.reduce((acc, t) => acc + (t.profit || 0), 0),
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Gold Summary */}
      <Card className="bg-[#fff7e6]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Gold Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Current Stock: {goldSummary.currentStock.toFixed(2)}</div>
          <div>Total Buy Value: {formatIndianCurrency(goldSummary.totalBuyValue)}</div>
          <div>Total Sell Value: {formatIndianCurrency(goldSummary.totalSellValue)}</div>
          <div>Rate: {formatIndianCurrency(goldSummary.averageRate)}</div>
          <div>Total Profit: {formatIndianCurrency(goldSummary.totalProfit)}</div>
        </CardContent>
      </Card>

      {/* Silver Summary */}
      <Card className="bg-[#f0f7ff]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Silver Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Current Stock: {silverSummary.currentStock.toFixed(2)}</div>
          <div>Total Buy Value: {formatIndianCurrency(silverSummary.totalBuyValue)}</div>
          <div>Total Sell Value: {formatIndianCurrency(silverSummary.totalSellValue)}</div>
          <div>Rate: {formatIndianCurrency(silverSummary.averageRate)}</div>
          <div>Total Profit: {formatIndianCurrency(silverSummary.totalProfit)}</div>
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Total Buy Value: {formatIndianCurrency(goldSummary.totalBuyValue + silverSummary.totalBuyValue)}</div>
          <div>Total Sell Value: {formatIndianCurrency(goldSummary.totalSellValue + silverSummary.totalSellValue)}</div>
          <div>Total Profit: {formatIndianCurrency(goldSummary.totalProfit + silverSummary.totalProfit)}</div>
        </CardContent>
      </Card>
    </div>
  );
};