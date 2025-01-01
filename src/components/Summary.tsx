import React from "react";
import { Transaction } from "./TransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryProps {
  transactions: Transaction[];
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

// Helper function to format price per unit
const formatPricePerUnit = (price: number, metal: "gold" | "silver"): string => {
  if (metal === "gold") {
    return formatIndianCurrency(price * 10);
  } else {
    return formatIndianCurrency(price * 1000);
  }
};

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
          <p>Current Stock: {formatWeight(goldStats.currentInventory, "gold")}</p>
          <p>Total Buy Value: {formatIndianCurrency(goldStats.totalBuyValue)}</p>
          <p>Total Sell Value: {formatIndianCurrency(goldStats.totalSellValue)}</p>
          <p>Rate: {formatPricePerUnit(goldStats.averageBuyRate, "gold")}</p>
          <p>Total Profit: {formatIndianCurrency(goldStats.totalProfit)}</p>
        </CardContent>
      </Card>

      <Card className="bg-silver-light">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Silver Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Current Stock: {formatWeight(silverStats.currentInventory, "silver")}</p>
          <p>Total Buy Value: {formatIndianCurrency(silverStats.totalBuyValue)}</p>
          <p>Total Sell Value: {formatIndianCurrency(silverStats.totalSellValue)}</p>
          <p>Rate: {formatPricePerUnit(silverStats.averageBuyRate, "silver")}</p>
          <p>Total Profit: {formatIndianCurrency(silverStats.totalProfit)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Total Buy Value: {formatIndianCurrency(goldStats.totalBuyValue + silverStats.totalBuyValue)}</p>
          <p>Total Sell Value: {formatIndianCurrency(goldStats.totalSellValue + silverStats.totalSellValue)}</p>
          <p>Total Profit: {formatIndianCurrency(goldStats.totalProfit + silverStats.totalProfit)}</p>
        </CardContent>
      </Card>
    </div>
  );
};