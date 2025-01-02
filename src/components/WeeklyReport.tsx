import React, { useState } from "react";
import { Transaction } from "./TransactionForm";
import {
  startOfWeek,
  endOfWeek,
  parseISO,
  format,
  isWithinInterval,
} from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const WeeklySummaryCard: React.FC<{
  title: string;
  stats: {
    buyQty: number;
    sellQty: number;
    buyValue: number;
    sellValue: number;
    profit: number;
  };
  metal: "gold" | "silver";
  currentStock: number;
}> = ({ title, stats, metal, currentStock }) => (
  <Card className={metal === "gold" ? "bg-[#fff7e6]" : "bg-[#f0f7ff]"}>
    <CardHeader className="pb-2">
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className={`text-sm ${metal === "gold" ? "text-green-800" : "text-blue-800"}`}>
          <span className="font-medium">Current Stock:</span> {currentStock.toFixed(2)}
        </div>
      </div>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <p className="font-medium">Buy:</p>
        <p>Qty: {stats.buyQty.toFixed(2)}</p>
        <p>Value: {formatIndianCurrency(stats.buyValue)}</p>
      </div>
      <div>
        <p className="font-medium">Sell:</p>
        <p>Qty: {stats.sellQty.toFixed(2)}</p>
        <p>Value: {formatIndianCurrency(stats.sellValue)}</p>
      </div>
      <div className="col-span-2 mt-2 pt-2 border-t">
        <p className="font-medium">Profit: {formatIndianCurrency(stats.profit)}</p>
      </div>
    </CardContent>
  </Card>
);

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ transactions }) => {
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));

  // Filter transactions for selected date range
  const weeklyTransactions = transactions.filter(t => {
    const transactionDate = parseISO(t.date);
    return isWithinInterval(transactionDate, { start: startDate, end: endDate });
  });

  // Calculate current stock (all transactions)
  const currentStock = {
    gold: transactions
      .filter(t => t.metal === "gold")
      .reduce((acc, t) => acc + (t.type === "buy" ? (t.remainingWeight || 0) : 0), 0),
    silver: transactions
      .filter(t => t.metal === "silver")
      .reduce((acc, t) => acc + (t.type === "buy" ? (t.remainingWeight || 0) : 0), 0),
  };

  // Separate gold and silver transactions
  const goldTransactions = weeklyTransactions.filter(t => t.metal === "gold");
  const silverTransactions = weeklyTransactions.filter(t => t.metal === "silver");

  // Calculate summaries for gold
  const goldSummary = {
    buyQty: goldTransactions.filter(t => t.type === "buy").reduce((acc, t) => acc + t.weight, 0),
    sellQty: goldTransactions.filter(t => t.type === "sell").reduce((acc, t) => acc + t.weight, 0),
    buyValue: goldTransactions.filter(t => t.type === "buy").reduce((acc, t) => acc + (t.weight * t.price), 0),
    sellValue: goldTransactions.filter(t => t.type === "sell").reduce((acc, t) => acc + (t.weight * t.price), 0),
    profit: goldTransactions.filter(t => t.type === "sell").reduce((acc, t) => acc + (t.profit || 0), 0),
  };

  // Calculate summaries for silver
  const silverSummary = {
    buyQty: silverTransactions.filter(t => t.type === "buy").reduce((acc, t) => acc + t.weight, 0),
    sellQty: silverTransactions.filter(t => t.type === "sell").reduce((acc, t) => acc + t.weight, 0),
    buyValue: silverTransactions.filter(t => t.type === "buy").reduce((acc, t) => acc + (t.weight * t.price), 0),
    sellValue: silverTransactions.filter(t => t.type === "sell").reduce((acc, t) => acc + (t.weight * t.price), 0),
    profit: silverTransactions.filter(t => t.type === "sell").reduce((acc, t) => acc + (t.profit || 0), 0),
  };

  const totalProfit = goldSummary.profit + silverSummary.profit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Custom Date Range</h2>
          <div className="flex items-center gap-2">
            <DatePicker
              date={startDate}
              setDate={setStartDate}
              placeholder="Start Date"
            />
            <span>to</span>
            <DatePicker
              date={endDate}
              setDate={setEndDate}
              placeholder="End Date"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm px-3 py-1 rounded-md bg-[#fff7e6]">
            Gold: {formatIndianCurrency(goldSummary.profit)}
          </span>
          <span className="text-sm px-3 py-1 rounded-md bg-[#f0f7ff]">
            Silver: {formatIndianCurrency(silverSummary.profit)}
          </span>
          <span className="text-sm">
            Total: {formatIndianCurrency(totalProfit)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <WeeklySummaryCard 
          title="Gold Summary" 
          stats={goldSummary}
          metal="gold"
          currentStock={currentStock.gold}
        />
        <WeeklySummaryCard 
          title="Silver Summary" 
          stats={silverSummary}
          metal="silver"
          currentStock={currentStock.silver}
        />
      </div>

      <Card>
        <Tabs defaultValue="gold" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="gold">Gold Transactions</TabsTrigger>
            <TabsTrigger value="silver">Silver Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="gold">
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goldTransactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      className={transaction.type === "buy" ? "bg-green-50" : "bg-red-50"}
                    >
                      <TableCell>{format(parseISO(transaction.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className={transaction.type === "buy" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {transaction.type.toUpperCase()}
                      </TableCell>
                      <TableCell>{transaction.weight.toFixed(2)}</TableCell>
                      <TableCell>
                        {transaction.metal === "gold" 
                          ? formatIndianCurrency(transaction.price * 10)
                          : formatIndianCurrency(transaction.price)}
                      </TableCell>
                      <TableCell>{formatIndianCurrency(transaction.weight * transaction.price)}</TableCell>
                      <TableCell>
                        {transaction.type === "sell" && transaction.profit ? 
                          formatIndianCurrency(transaction.profit) : 
                          "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="silver">
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {silverTransactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      className={transaction.type === "buy" ? "bg-green-50" : "bg-red-50"}
                    >
                      <TableCell>{format(parseISO(transaction.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className={transaction.type === "buy" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {transaction.type.toUpperCase()}
                      </TableCell>
                      <TableCell>{transaction.weight.toFixed(2)}</TableCell>
                      <TableCell>{formatIndianCurrency(transaction.price)}</TableCell>
                      <TableCell>{formatIndianCurrency(transaction.weight * transaction.price)}</TableCell>
                      <TableCell>
                        {transaction.type === "sell" && transaction.profit ? 
                          formatIndianCurrency(transaction.profit) : 
                          "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}; 