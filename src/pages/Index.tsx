import React from "react";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { Summary } from "@/components/Summary";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [currentProfile, setCurrentProfile] = React.useState<string>(() => {
    const savedProfile = localStorage.getItem("currentProfile");
    return savedProfile || "Default";
  });

  const [profiles, setProfiles] = React.useState<string[]>(() => {
    const savedProfiles = localStorage.getItem("profiles");
    return savedProfiles ? JSON.parse(savedProfiles) : ["Default"];
  });

  const [transactions, setTransactions] = React.useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`transactions_${currentProfile}`);
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    localStorage.setItem("currentProfile", currentProfile);
    localStorage.setItem("profiles", JSON.stringify(profiles));
    localStorage.setItem(`transactions_${currentProfile}`, JSON.stringify(transactions));
  }, [currentProfile, profiles, transactions]);

  const handleProfileChange = (profile: string) => {
    setCurrentProfile(profile);
    const savedTransactions = localStorage.getItem(`transactions_${profile}`);
    setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []);
  };

  const handleAddProfile = (profile: string) => {
    setProfiles((prev) => [...prev, profile]);
    setCurrentProfile(profile);
    setTransactions([]);
  };

  const calculateFIFO = (newTransaction: Transaction): Transaction => {
    if (newTransaction.type === "buy") {
      return {
        ...newTransaction,
        remainingWeight: newTransaction.weight,
      };
    }

    // For sell transactions, implement FIFO logic
    const availableBuyTransactions = [...transactions]
      .filter(t => t.type === "buy" && t.metal === newTransaction.metal && (t.remainingWeight || 0) > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingToSell = newTransaction.weight;
    let totalCost = 0;
    const soldFrom: string[] = [];
    const updatedBuyTransactions = [...transactions];

    for (const buyTx of availableBuyTransactions) {
      if (remainingToSell <= 0) break;

      const buyTxIndex = updatedBuyTransactions.findIndex(t => t.id === buyTx.id);
      const available = buyTx.remainingWeight || 0;
      const used = Math.min(available, remainingToSell);
      
      totalCost += used * buyTx.price;
      remainingToSell -= used;
      soldFrom.push(buyTx.id);
      
      updatedBuyTransactions[buyTxIndex] = {
        ...buyTx,
        remainingWeight: available - used,
      };
    }

    if (remainingToSell > 0) {
      throw new Error("Not enough inventory for this sale");
    }

    const revenue = newTransaction.weight * newTransaction.price;
    const profit = revenue - totalCost;

    setTransactions(updatedBuyTransactions);

    return {
      ...newTransaction,
      soldFrom,
      profit,
    };
  };

  const handleAddTransaction = (transaction: Transaction) => {
    const processedTransaction = calculateFIFO(transaction);
    setTransactions(prev => [...prev, processedTransaction]);
  };

  const filterTransactions = (metal: "gold" | "silver") => {
    return transactions.filter((t) => t.metal === metal);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Precious Metals Tracker</h1>
          <ProfileSelector
            currentProfile={currentProfile}
            profiles={profiles}
            onProfileChange={handleProfileChange}
            onAddProfile={handleAddProfile}
          />
        </div>

        <Summary transactions={transactions} />

        <Tabs defaultValue="gold" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gold">Gold</TabsTrigger>
            <TabsTrigger value="silver">Silver</TabsTrigger>
          </TabsList>

          <TabsContent value="gold" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-[2fr,3fr]">
              <div>
                <h2 className="text-xl font-semibold mb-4">Add Gold Transaction</h2>
                <TransactionForm
                  onSubmit={handleAddTransaction}
                  defaultMetal="gold"
                />
              </div>
              <div>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="buy">Buy</TabsTrigger>
                    <TabsTrigger value="sell">Sell</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    <TransactionList transactions={filterTransactions("gold")} filter="all" />
                  </TabsContent>
                  <TabsContent value="buy">
                    <TransactionList transactions={filterTransactions("gold")} filter="buy" />
                  </TabsContent>
                  <TabsContent value="sell">
                    <TransactionList transactions={filterTransactions("gold")} filter="sell" />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="silver" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-[2fr,3fr]">
              <div>
                <h2 className="text-xl font-semibold mb-4">Add Silver Transaction</h2>
                <TransactionForm
                  onSubmit={handleAddTransaction}
                  defaultMetal="silver"
                />
              </div>
              <div>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="buy">Buy</TabsTrigger>
                    <TabsTrigger value="sell">Sell</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    <TransactionList transactions={filterTransactions("silver")} filter="all" />
                  </TabsContent>
                  <TabsContent value="buy">
                    <TransactionList transactions={filterTransactions("silver")} filter="buy" />
                  </TabsContent>
                  <TabsContent value="sell">
                    <TransactionList transactions={filterTransactions("silver")} filter="sell" />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;