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

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
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
                <h2 className="text-xl font-semibold mb-4">Gold Transactions</h2>
                <TransactionList transactions={filterTransactions("gold")} />
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
                <h2 className="text-xl font-semibold mb-4">Silver Transactions</h2>
                <TransactionList transactions={filterTransactions("silver")} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;