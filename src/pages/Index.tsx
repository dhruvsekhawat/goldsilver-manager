import React from "react";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { Summary } from "@/components/Summary";

const Index = () => {
  const [transactions, setTransactions] = React.useState<Transaction[]>(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Precious Metals Tracker
        </h1>
        
        <Summary transactions={transactions} />
        
        <div className="grid gap-8 md:grid-cols-[2fr,3fr]">
          <div>
            <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
            <TransactionForm onSubmit={handleAddTransaction} />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <TransactionList transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;