import React from "react";
import { Transaction } from "./TransactionForm";
import { format, parseISO } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MonthlyReportProps {
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

// Helper function to format weight
const formatWeight = (weight: number, metal: "gold" | "silver"): string => {
  if (metal === "gold") {
    return `${(weight / 10).toFixed(2)}`;
  } else {
    return `${(weight / 1000).toFixed(2)}`;
  }
};

const calculateMonthlyStats = (monthTransactions: Transaction[]) => {
  const goldTransactions = monthTransactions.filter(t => t.metal === "gold");
  const silverTransactions = monthTransactions.filter(t => t.metal === "silver");

  const calculateMetalStats = (transactions: Transaction[]) => {
    const buyTransactions = transactions.filter(t => t.type === "buy");
    const sellTransactions = transactions.filter(t => t.type === "sell");

    return {
      totalBuyWeight: buyTransactions.reduce((acc, curr) => acc + curr.weight, 0),
      totalBuyValue: buyTransactions.reduce((acc, curr) => acc + (curr.weight * curr.price), 0),
      totalSellWeight: sellTransactions.reduce((acc, curr) => acc + curr.weight, 0),
      totalSellValue: sellTransactions.reduce((acc, curr) => acc + (curr.weight * curr.price), 0),
      totalProfit: sellTransactions.reduce((acc, curr) => acc + (curr.profit || 0), 0),
    };
  };

  return {
    gold: calculateMetalStats(goldTransactions),
    silver: calculateMetalStats(silverTransactions),
  };
};

const TransactionTable: React.FC<{
  transactions: Transaction[];
  metal: "gold" | "silver";
}> = ({ transactions, metal }) => {
  const filteredTransactions = transactions
    .filter(t => t.metal === metal)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No {metal} transactions this month
      </div>
    );
  }

  return (
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
        {filteredTransactions.map((transaction) => (
          <TableRow 
            key={transaction.id}
            className={transaction.type === "buy" ? "bg-green-50" : "bg-red-50"}
          >
            <TableCell>{format(parseISO(transaction.date), "dd/MM/yyyy")}</TableCell>
            <TableCell className={transaction.type === "buy" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {transaction.type.toUpperCase()}
            </TableCell>
            <TableCell>{formatWeight(transaction.weight, transaction.metal)}</TableCell>
            <TableCell>{formatIndianCurrency(transaction.price * (transaction.metal === "gold" ? 10 : 1000))}</TableCell>
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
  );
};

const MonthlySummaryCard: React.FC<{
  title: string;
  stats: {
    totalBuyWeight: number;
    totalBuyValue: number;
    totalSellWeight: number;
    totalSellValue: number;
    totalProfit: number;
  };
  metal: "gold" | "silver";
}> = ({ title, stats, metal }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <p className="font-medium">Buy:</p>
        <p>Qty: {formatWeight(stats.totalBuyWeight, metal)}</p>
        <p>Value: {formatIndianCurrency(stats.totalBuyValue)}</p>
      </div>
      <div>
        <p className="font-medium">Sell:</p>
        <p>Qty: {formatWeight(stats.totalSellWeight, metal)}</p>
        <p>Value: {formatIndianCurrency(stats.totalSellValue)}</p>
      </div>
      <div className="col-span-2 mt-2 pt-2 border-t">
        <p className="font-medium">Profit: {formatIndianCurrency(stats.totalProfit)}</p>
      </div>
    </CardContent>
  </Card>
);

export const MonthlyReport: React.FC<MonthlyReportProps> = ({ transactions }) => {
  const monthlyTransactions = React.useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      const monthKey = format(parseISO(transaction.date), "yyyy-MM");
      const existing = grouped.get(monthKey) || [];
      grouped.set(monthKey, [...existing, transaction]);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  return (
    <Accordion type="single" collapsible className="space-y-4">
      {monthlyTransactions.map(([month, monthTransactions]) => {
        const stats = calculateMonthlyStats(monthTransactions);
        const monthDisplay = format(parseISO(`${month}-01`), "MMMM yyyy");
        const totalProfit = stats.gold.totalProfit + stats.silver.totalProfit;

        return (
          <AccordionItem key={month} value={month} className="bg-white rounded-lg border">
            <AccordionTrigger className="px-4">
              <div className="flex justify-between items-center w-full">
                <span className="text-lg font-semibold">{monthDisplay}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800">
                    Gold: {formatIndianCurrency(stats.gold.totalProfit)}
                  </span>
                  <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                    Silver: {formatIndianCurrency(stats.silver.totalProfit)}
                  </span>
                  <span className="text-sm font-medium">
                    Total: {formatIndianCurrency(totalProfit)}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {/* Monthly Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                  <MonthlySummaryCard 
                    title="Gold Summary" 
                    stats={stats.gold}
                    metal="gold"
                  />
                  <MonthlySummaryCard 
                    title="Silver Summary" 
                    stats={stats.silver}
                    metal="silver"
                  />
                </div>

                {/* Transaction Tables */}
                <Tabs defaultValue="gold" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="gold">Gold Transactions</TabsTrigger>
                    <TabsTrigger value="silver">Silver Transactions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="gold">
                    <div className="rounded-lg border">
                      <TransactionTable 
                        transactions={monthTransactions}
                        metal="gold"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="silver">
                    <div className="rounded-lg border">
                      <TransactionTable 
                        transactions={monthTransactions}
                        metal="silver"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}; 