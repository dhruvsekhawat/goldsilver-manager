import React from "react";
import { Transaction } from "./TransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

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

const formatWeight = (weight: number, metal: "gold" | "silver"): string => {
  if (metal === "gold") {
    return `${weight.toFixed(2)}g`;
  } else {
    return `${weight.toFixed(2)}kg`;
  }
};

const StockValueBadge: React.FC<{ value: number; metal: "gold" | "silver" }> = ({ value, metal }) => {
  return (
    <Badge variant="outline" className={`ml-2 ${value < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
      {formatWeight(value, metal)}
    </Badge>
  );
};

const ProfitBadge: React.FC<{ value: number }> = ({ value }) => {
  if (value === 0) return null;
  return (
    <Badge 
      variant="outline" 
      className={`ml-2 ${value > 0 ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}`}
    >
      {value > 0 ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}
      {formatIndianCurrency(Math.abs(value))}
    </Badge>
  );
};

const calculateTotal = (transaction: Transaction): number => {
  if (transaction.metal === "gold") {
    // For gold: price is per 10g, so adjust for actual weight
    return (transaction.weight / 10) * transaction.price;
  } else {
    // For silver: price is per kg, weight is in kg
    return transaction.weight * transaction.price;
  }
};

export const Summary: React.FC<SummaryProps> = ({ transactions }) => {
  const [isGoldOpen, setIsGoldOpen] = React.useState(true);
  const [isSilverOpen, setIsSilverOpen] = React.useState(true);
  const [isTotalOpen, setIsTotalOpen] = React.useState(true);

  // Calculate gold summary
  const goldTransactions = transactions.filter(t => t.metal === "gold");
  const goldBuyTransactions = goldTransactions.filter(t => t.type === "buy");
  const goldSellTransactions = goldTransactions.filter(t => t.type === "sell");
  
  // Calculate gold rate based on remaining stock
  const goldRemainingBuyTransactions = goldBuyTransactions.filter(t => (t.remainingWeight || 0) > 0);

  // Calculate net position by tracking uncovered sells
  const goldNetPosition = (() => {
    // First get total sell amount
    const totalSellAmount = goldSellTransactions.reduce((acc, t) => acc + t.weight, 0);
    
    // Then get total buy amount that's been used to cover sells
    const totalBuyUsed = goldBuyTransactions.reduce((acc, t) => acc + (t.weight - (t.remainingWeight || 0)), 0);
    
    // Then get remaining buy amount
    const remainingBuyAmount = goldBuyTransactions.reduce((acc, t) => acc + (t.remainingWeight || 0), 0);
    
    // Net position is: remaining buys - (total sells - covered sells)
    return remainingBuyAmount - (totalSellAmount - totalBuyUsed);
  })();
  
  const goldSummary = {
    currentStock: goldNetPosition,
    totalBuyValue: goldBuyTransactions.reduce((acc, t) => acc + calculateTotal(t), 0),
    totalSellValue: goldSellTransactions.reduce((acc, t) => acc + calculateTotal(t), 0),
    averageRate: goldRemainingBuyTransactions.length > 0   
      ? goldRemainingBuyTransactions.reduce((acc, t) => acc + t.price, 0) / goldRemainingBuyTransactions.length
      : 0,
    totalProfit: goldSellTransactions.reduce((acc, t) => acc + (t.profit || 0), 0),
  };

  // Calculate silver summary
  const silverTransactions = transactions.filter(t => t.metal === "silver");
  const silverBuyTransactions = silverTransactions.filter(t => t.type === "buy");
  const silverSellTransactions = silverTransactions.filter(t => t.type === "sell");
  
  // Calculate silver rate based on remaining stock
  const silverRemainingBuyTransactions = silverBuyTransactions.filter(t => (t.remainingWeight || 0) > 0);

  // Calculate net position by tracking uncovered sells
  const silverNetPosition = (() => {
    // First get total sell amount
    const totalSellAmount = silverSellTransactions.reduce((acc, t) => acc + t.weight, 0);
    
    // Then get total buy amount that's been used to cover sells
    const totalBuyUsed = silverBuyTransactions.reduce((acc, t) => acc + (t.weight - (t.remainingWeight || 0)), 0);
    
    // Then get remaining buy amount
    const remainingBuyAmount = silverBuyTransactions.reduce((acc, t) => acc + (t.remainingWeight || 0), 0);
    
    // Net position is: remaining buys - (total sells - covered sells)
    return remainingBuyAmount - (totalSellAmount - totalBuyUsed);
  })();
  
  const silverSummary = {
    currentStock: silverNetPosition,
    totalBuyValue: silverBuyTransactions.reduce((acc, t) => acc + calculateTotal(t), 0),
    totalSellValue: silverSellTransactions.reduce((acc, t) => acc + calculateTotal(t), 0),
    averageRate: silverRemainingBuyTransactions.length > 0 
      ? silverRemainingBuyTransactions.reduce((acc, t) => acc + t.price, 0) / silverRemainingBuyTransactions.length
      : 0,
    totalProfit: silverSellTransactions.reduce((acc, t) => acc + (t.profit || 0), 0),
  };

  // Calculate current stock value only for positive stock
  const goldStockValue = goldSummary.currentStock > 0 
    ? goldSummary.currentStock * goldSummary.averageRate / 10 
    : 0;
  const silverStockValue = silverSummary.currentStock > 0 
    ? silverSummary.currentStock * silverSummary.averageRate 
    : 0;
  const totalStockValue = goldStockValue + silverStockValue;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Gold Summary */}
      <Card className="bg-[#fff7e6] relative group">
        <Collapsible open={isGoldOpen} onOpenChange={setIsGoldOpen}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                Gold Summary
                <StockValueBadge value={goldSummary.currentStock} metal="gold" />
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${isGoldOpen ? 'transform rotate-180' : ''}`} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-2 text-sm pt-0">
              <div className="flex justify-between items-center">
                <span>Current Stock Value:</span>
                <span className="font-medium">{formatIndianCurrency(goldStockValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Buy Value:</span>
                <span>{formatIndianCurrency(goldSummary.totalBuyValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Sell Value:</span>
                <span>{formatIndianCurrency(goldSummary.totalSellValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Rate (per 10g):</span>
                <span className="font-medium">{formatIndianCurrency(goldSummary.averageRate * 10)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Profit:</span>
                <div className="flex items-center">
                  <span>{formatIndianCurrency(goldSummary.totalProfit)}</span>
                  <ProfitBadge value={goldSummary.totalProfit} />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Silver Summary */}
      <Card className="bg-[#f0f7ff] relative group">
        <Collapsible open={isSilverOpen} onOpenChange={setIsSilverOpen}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                Silver Summary
                <StockValueBadge value={silverSummary.currentStock} metal="silver" />
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${isSilverOpen ? 'transform rotate-180' : ''}`} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-2 text-sm pt-0">
              <div className="flex justify-between items-center">
                <span>Current Stock Value:</span>
                <span className="font-medium">{formatIndianCurrency(silverStockValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Buy Value:</span>
                <span>{formatIndianCurrency(silverSummary.totalBuyValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Sell Value:</span>
                <span>{formatIndianCurrency(silverSummary.totalSellValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Rate:</span>
                <span className="font-medium">{formatIndianCurrency(silverSummary.averageRate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Profit:</span>
                <div className="flex items-center">
                  <span>{formatIndianCurrency(silverSummary.totalProfit)}</span>
                  <ProfitBadge value={silverSummary.totalProfit} />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Total Summary */}
      <Card className="relative group">
        <Collapsible open={isTotalOpen} onOpenChange={setIsTotalOpen}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Total Summary</CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${isTotalOpen ? 'transform rotate-180' : ''}`} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-2 text-sm pt-0">
              <div className="flex justify-between items-center">
                <span>Current Stock Value:</span>
                <span className="font-medium">{formatIndianCurrency(totalStockValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Buy Value:</span>
                <span>{formatIndianCurrency(goldSummary.totalBuyValue + silverSummary.totalBuyValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Sell Value:</span>
                <span>{formatIndianCurrency(goldSummary.totalSellValue + silverSummary.totalSellValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Profit:</span>
                <div className="flex items-center">
                  <span>{formatIndianCurrency(goldSummary.totalProfit + silverSummary.totalProfit)}</span>
                  <ProfitBadge value={goldSummary.totalProfit + silverSummary.totalProfit} />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};