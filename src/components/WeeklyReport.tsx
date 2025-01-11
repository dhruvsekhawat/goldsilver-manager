import React from "react";
import { Transaction } from "./TransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WeeklyReportProps {
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

interface MetalSummary {
  totalBuyWeight: number;
  totalBuyValue: number;
  totalSellWeight: number;
  totalSellValue: number;
  averageBuyRate: number;
  averageSellRate: number;
  profit: number;
  remainingStock: number;
  stockValue: number;
}

const formatWeight = (weight: number, metal: "gold" | "silver"): string => {
  if (metal === "gold") {
    return `${weight.toFixed(2)}g`;
  } else {
    return `${weight.toFixed(2)}kg`;
  }
};

const calculateTotal = (t: Transaction, metal: "gold" | "silver"): number => {
  if (metal === "gold") {
    // For gold: price is per 10g, multiply by 10 to get per gram rate
    return t.weight * (t.price / 10);
  } else {
    // For silver: price is per kg, weight is in kg
    return t.weight * t.price;
  }
};

const WeeklyMetalReport: React.FC<{
  transactions: Transaction[];
  metal: "gold" | "silver";
  startDate: Date;
  endDate: Date;
}> = ({ transactions, metal, startDate, endDate }) => {
  // Filter transactions for the selected week and metal
  const weeklyTransactions = transactions.filter(t => 
    t.metal === metal &&
    isWithinInterval(parseISO(t.date), { start: startDate, end: endDate })
  );

  // Calculate summaries
  const buyTransactions = weeklyTransactions.filter(t => t.type === "buy");
  const sellTransactions = weeklyTransactions.filter(t => t.type === "sell");

  const summary: MetalSummary = {
    totalBuyWeight: buyTransactions.reduce((acc, t) => acc + t.weight, 0),
    totalBuyValue: buyTransactions.reduce((acc, t) => acc + calculateTotal(t, metal), 0),
    totalSellWeight: sellTransactions.reduce((acc, t) => acc + t.weight, 0),
    totalSellValue: sellTransactions.reduce((acc, t) => acc + calculateTotal(t, metal), 0),
    averageBuyRate: buyTransactions.length > 0 
      ? buyTransactions.reduce((acc, t) => acc + (t.price), 0) / buyTransactions.length
      : 0,
    averageSellRate: sellTransactions.length > 0
      ? sellTransactions.reduce((acc, t) => acc + (t.price), 0) / sellTransactions.length
      : 0,
    profit: sellTransactions.reduce((acc, t) => acc + (t.profit || 0), 0),
    remainingStock: transactions
      .filter(t => t.metal === metal)
      .reduce((acc, t) => acc + (t.type === "buy" ? (t.remainingWeight || 0) : 0), 0),
    stockValue: 0, // Will be calculated below
  };

  // Calculate current stock
  const currentStock = (() => {
    const metalTransactions = transactions.filter(t => t.metal === metal);
    const buyTransactions = metalTransactions.filter(t => t.type === "buy");
    const sellTransactions = metalTransactions.filter(t => t.type === "sell");

    // First get total sell amount
    const totalSellAmount = sellTransactions.reduce((acc, t) => acc + t.weight, 0);
    
    // Then get total buy amount that's been used to cover sells
    const totalBuyUsed = buyTransactions.reduce((acc, t) => acc + (t.weight - (t.remainingWeight || 0)), 0);
    
    // Then get remaining buy amount
    const remainingBuyAmount = buyTransactions.reduce((acc, t) => acc + (t.remainingWeight || 0), 0);
    
    // Net position is: remaining buys - (total sells - covered sells)
    return remainingBuyAmount - (totalSellAmount - totalBuyUsed);
  })();

  // Calculate current stock value
  const currentStockValue = currentStock > 0 
    ? currentStock * summary.averageBuyRate / (metal === "gold" ? 10 : 1)
    : 0;

  // Calculate weekly activity
  const weeklyBuyTransactions = transactions.filter(t => t.type === "buy");
  const weeklySellTransactions = transactions.filter(t => t.type === "sell");

  const weeklyBought = weeklyBuyTransactions.reduce((acc, t) => acc + t.weight, 0);
  const weeklySold = weeklySellTransactions.reduce((acc, t) => acc + t.weight, 0);

  // Calculate weekly profit/loss
  const weeklyProfit = weeklySellTransactions.reduce((acc, t) => acc + (t.profit || 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Current Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Current Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Quantity:</span>
              <span className="font-mono">
                {formatWeight(currentStock, metal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Value:</span>
              <span className="font-mono">
                {formatIndianCurrency(currentStockValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bought:</span>
              <span className="font-mono">
                {formatWeight(weeklyBought, metal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sold:</span>
              <span className="font-mono">
                {formatWeight(weeklySold, metal)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Profit/Loss */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Weekly Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total:</span>
              <div className="flex items-center gap-2">
                <span className={`font-mono ${weeklyProfit > 0 ? 'text-green-600' : weeklyProfit < 0 ? 'text-red-600' : ''}`}>
                  {formatIndianCurrency(weeklyProfit)}
                </span>
                {weeklyProfit !== 0 && (
                  weeklyProfit > 0 
                    ? <TrendingUp className="h-4 w-4 text-green-600" />
                    : <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details */}
      <div>
        <h3 className="text-lg font-medium mb-4">Transaction Details</h3>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <TransactionTable transactions={transactions} metal={metal} />
          </TabsContent>
          <TabsContent value="buy">
            <TransactionTable transactions={weeklyBuyTransactions} metal={metal} />
          </TabsContent>
          <TabsContent value="sell">
            <TransactionTable transactions={weeklySellTransactions} metal={metal} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const TransactionTable: React.FC<{
  transactions: Transaction[];
  metal: "gold" | "silver";
}> = ({ transactions, metal }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found for this period
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Profit/Loss</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{format(parseISO(transaction.date), "dd/MM/yyyy")}</TableCell>
            <TableCell className="capitalize">{transaction.type}</TableCell>
            <TableCell className="text-right font-mono">
              {formatWeight(transaction.weight, metal)}
            </TableCell>
            <TableCell className="text-right font-mono">
              {metal === "gold" 
                ? formatIndianCurrency(transaction.price)
                : formatIndianCurrency(transaction.price)}
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatIndianCurrency(calculateTotal(transaction, metal))}
            </TableCell>
            <TableCell className="text-right">
              {transaction.type === "sell" && transaction.profit ? (
                <span className={`font-mono ${transaction.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatIndianCurrency(transaction.profit)}
                </span>
              ) : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ transactions }) => {
  const [startDate, setStartDate] = React.useState<Date>(startOfWeek(new Date()));
  const [endDate, setEndDate] = React.useState<Date>(endOfWeek(new Date()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Weekly Report</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From:</span>
            <DatePicker date={startDate} onDateChange={setStartDate} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">To:</span>
            <DatePicker date={endDate} onDateChange={setEndDate} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="gold">
        <TabsList>
          <TabsTrigger value="gold">Gold</TabsTrigger>
          <TabsTrigger value="silver">Silver</TabsTrigger>
        </TabsList>

        <TabsContent value="gold">
          <WeeklyMetalReport
            transactions={transactions}
            metal="gold"
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>

        <TabsContent value="silver">
          <WeeklyMetalReport
            transactions={transactions}
            metal="silver"
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 