import React from "react";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MetalTransactionViewProps {
  metal: "gold" | "silver";
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => void;
}

export const MetalTransactionView: React.FC<MetalTransactionViewProps> = ({
  metal,
  transactions,
  onAddTransaction,
}) => {
  const filteredTransactions = transactions.filter((t) => t.metal === metal);

  return (
    <div className="grid gap-8 md:grid-cols-[2fr,3fr]">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Add {metal.charAt(0).toUpperCase() + metal.slice(1)} Transaction
        </h2>
        <TransactionForm onSubmit={onAddTransaction} defaultMetal={metal} />
      </div>
      <div>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <TransactionList transactions={filteredTransactions} filter="all" />
          </TabsContent>
          <TabsContent value="buy">
            <TransactionList transactions={filteredTransactions} filter="buy" />
          </TabsContent>
          <TabsContent value="sell">
            <TransactionList transactions={filteredTransactions} filter="sell" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};