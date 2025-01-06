import React from "react";
import { Transaction } from "./TransactionForm";
import { Card } from "@/components/ui/card";
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
    totalBuyValue: buyTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0),
    totalSellWeight: sellTransactions.reduce((acc, t) => acc + t.weight, 0),
    totalSellValue: sellTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0),
    averageBuyRate: buyTransactions.length > 0 
      ? buyTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0) / 
        buyTransactions.reduce((acc, t) => acc + t.weight, 0)
      : 0,
    averageSellRate: sellTransactions.length > 0
      ? sellTransactions.reduce((acc, t) => acc + (t.weight * t.price), 0) /
        sellTransactions.reduce((acc, t) => acc + t.weight, 0)
      : 0,
    profit: sellTransactions.reduce((acc, t) => acc + (t.profit || 0), 0),
    remainingStock: transactions
      .filter(t => t.metal === metal)
      .reduce((acc, t) => acc + (t.type === "buy" ? (t.remainingWeight || 0) : 0), 0),
    stockValue: 0, // Will be calculated below
  };

  // Calculate current stock value based on average buy rate of remaining stock
  const remainingBuyTransactions = transactions
    .filter(t => t.metal === metal && t.type === "buy" && (t.remainingWeight || 0) > 0);
  
  if (remainingBuyTransactions.length > 0) {
    summary.stockValue = remainingBuyTransactions.reduce((acc, t) => 
      acc + ((t.remainingWeight || 0) * t.price), 0);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Stock Summary Card */}
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Current Stock</h3>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span>Quantity:</span>
              <span className="font-mono font-medium">{summary.remainingStock.toFixed(2)}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Value:</span>
              <span className="font-mono font-medium">
                {formatIndianCurrency(summary.stockValue)}
              </span>
            </div>
          </div>
        </Card>

        {/* Weekly Activity Card */}
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Weekly Activity</h3>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span>Bought:</span>
              <span className="font-mono font-medium">{summary.totalBuyWeight.toFixed(2)}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Sold:</span>
              <span className="font-mono font-medium">{summary.totalSellWeight.toFixed(2)}g</span>
            </div>
          </div>
        </Card>

        {/* Profit Summary Card */}
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Weekly Profit/Loss</h3>
          <div className="flex justify-between items-center">
            <span>Total:</span>
            <span className={`font-mono font-medium flex items-center gap-1 
              ${summary.profit > 0 ? 'text-green-600' : summary.profit < 0 ? 'text-red-600' : ''}`}>
              {summary.profit > 0 ? <TrendingUp className="h-4 w-4" /> : 
               summary.profit < 0 ? <TrendingDown className="h-4 w-4" /> : null}
              {formatIndianCurrency(Math.abs(summary.profit))}
            </span>
          </div>
        </Card>
      </div>

      {/* Detailed Transactions */}
      <div className="space-y-4">
        <h3 className="font-semibold">Transaction Details</h3>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TransactionTable 
              transactions={weeklyTransactions}
              metal={metal}
            />
          </TabsContent>

          <TabsContent value="buy">
            <TransactionTable 
              transactions={buyTransactions}
              metal={metal}
            />
          </TabsContent>

          <TabsContent value="sell">
            <TransactionTable 
              transactions={sellTransactions}
              metal={metal}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Rate Analysis */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Rate Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm text-muted-foreground">Buy Rates</h4>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span>Average Rate:</span>
                <span className="font-mono">
                  {metal === "gold" 
                    ? formatIndianCurrency(summary.averageBuyRate * 10)
                    : formatIndianCurrency(summary.averageBuyRate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Value:</span>
                <span className="font-mono">{formatIndianCurrency(summary.totalBuyValue)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm text-muted-foreground">Sell Rates</h4>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span>Average Rate:</span>
                <span className="font-mono">
                  {metal === "gold" 
                    ? formatIndianCurrency(summary.averageSellRate * 10)
                    : formatIndianCurrency(summary.averageSellRate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Value:</span>
                <span className="font-mono">{formatIndianCurrency(summary.totalSellValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
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
              {transaction.weight.toFixed(2)}g
            </TableCell>
            <TableCell className="text-right font-mono">
              {metal === "gold" 
                ? formatIndianCurrency(transaction.price * 10)
                : formatIndianCurrency(transaction.price)}
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatIndianCurrency(transaction.weight * transaction.price)}
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