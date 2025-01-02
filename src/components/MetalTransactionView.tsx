import React from "react";
import { Transaction } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { TransactionForm } from "./TransactionForm";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MetalTransactionViewProps {
  metal: "gold" | "silver";
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => void;
  onEditTransaction?: (transaction: Transaction) => Promise<void>;
  onDeleteTransaction?: (transaction: Transaction) => Promise<void>;
}

export const MetalTransactionView: React.FC<MetalTransactionViewProps> = ({
  metal,
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const metalTransactions = transactions.filter((t) => t.metal === metal);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <TransactionForm defaultMetal={metal} onSubmit={onAddTransaction} />
      </Card>

      <Card>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TransactionList 
              transactions={metalTransactions} 
              onEdit={onEditTransaction}
              onDelete={onDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="buy">
            <TransactionList 
              transactions={metalTransactions.filter(t => t.type === "buy")} 
              onEdit={onEditTransaction}
              onDelete={onDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="sell">
            <TransactionList 
              transactions={metalTransactions.filter(t => t.type === "sell")} 
              onEdit={onEditTransaction}
              onDelete={onDeleteTransaction}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};