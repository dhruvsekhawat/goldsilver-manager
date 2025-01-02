import React from "react";
import { Transaction } from "@/components/TransactionForm";
import { Summary } from "@/components/Summary";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetalTransactionView } from "@/components/MetalTransactionView";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MonthlyReport } from "@/components/MonthlyReport";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentProfile, setCurrentProfile] = React.useState<string>("Default");
  const [profiles, setProfiles] = React.useState<string[]>([]);

  // Load profiles from localStorage on mount
  React.useEffect(() => {
    const savedProfiles = localStorage.getItem('profiles');
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    } else {
      setProfiles(['Default']);
      localStorage.setItem('profiles', JSON.stringify(['Default']));
    }
  }, []);

  // Save profiles to localStorage when they change
  React.useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem('profiles', JSON.stringify(profiles));
    }
  }, [profiles]);

  // Fetch transactions for current profile
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', currentProfile],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('profile', currentProfile)
        .order('date', { ascending: false });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch transactions: " + error.message,
          variant: "destructive",
        });
        return [];
      }
      // Convert snake_case to camelCase for frontend
      return (data || []).map(t => ({
        ...t,
        remainingWeight: t.remaining_weight,
        soldFrom: t.sold_from,
        // Remove snake_case properties
        remaining_weight: undefined,
        sold_from: undefined
      })) as Transaction[];
    },
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      // Convert camelCase to snake_case for database
      const transactionWithProfile = {
        ...transaction,
        profile: currentProfile,
        remaining_weight: transaction.remainingWeight,
        sold_from: transaction.soldFrom
      };
      
      // Remove camelCase properties
      delete transactionWithProfile.remainingWeight;
      delete transactionWithProfile.soldFrom;
      
      const { error } = await supabase
        .from('transactions')
        .insert([transactionWithProfile]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentProfile] });
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      // For sell transactions, check inventory first
      if (transaction.type === "sell") {
        const metalTransactions = transactions.filter(t => t.metal === transaction.metal);
        const totalBuyWeight = metalTransactions
          .filter(t => t.type === "buy")
          .reduce((acc, curr) => acc + (curr.remainingWeight || 0), 0); // Use remainingWeight instead of weight

        if (transaction.weight > totalBuyWeight) {
          toast({
            title: "Cannot Add Sale",
            description: `You only have ${totalBuyWeight.toFixed(2)}g of ${transaction.metal} in stock. Cannot sell ${transaction.weight.toFixed(2)}g.`,
            variant: "destructive",
          });
          return;
        }
      }

      const processedTransaction = calculateFIFO(transaction);
      
      // For buy transactions, set the initial remaining weight
      if (transaction.type === "buy") {
        processedTransaction.remainingWeight = transaction.weight;
      }

      // Wait for the main transaction to be added
      await addTransactionMutation.mutateAsync(processedTransaction);

      // If it's a sell transaction, update the remaining weights of buy transactions
      if (transaction.type === "sell") {
        let remainingToSell = transaction.weight;
        const availableBuyTransactions = [...transactions]
          .filter(
            (t) =>
              t.type === "buy" &&
              t.metal === transaction.metal &&
              (t.remainingWeight || 0) > 0 &&
              t.id
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (const buyTx of availableBuyTransactions) {
          if (remainingToSell <= 0) break;
          if (!buyTx.id) continue;

          const available = buyTx.remainingWeight || 0;
          const used = Math.min(available, remainingToSell);
          
          // Update remaining weight in database
          const { error } = await supabase
            .from('transactions')
            .update({ remaining_weight: available - used })
            .eq('id', buyTx.id);

          if (error) {
            toast({
              title: "Error Updating Stock",
              description: "Could not update remaining stock. Please refresh and try again.",
              variant: "destructive",
            });
            throw error;
          }

          remainingToSell -= used;
        }
      }

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['transactions', currentProfile] });
      
      toast({
        title: "Success!",
        description: transaction.type === "buy" 
          ? `Added purchase of ${transaction.weight}g ${transaction.metal}`
          : `Added sale of ${transaction.weight}g ${transaction.metal}`,
      });

    } catch (error) {
      toast({
        title: "Failed to Add Transaction",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      console.error("Transaction error:", error);
    }
  };

  const calculateFIFO = (newTransaction: Transaction): Transaction => {
    if (newTransaction.type === "buy") {
      return {
        ...newTransaction,
        remainingWeight: newTransaction.weight,
      };
    }

    // Get all buy transactions for this metal with remaining weight
    const availableBuyTransactions = [...transactions]
      .filter(
        (t) =>
          t.type === "buy" &&
          t.metal === newTransaction.metal &&
          (t.remainingWeight || 0) > 0 &&
          t.id
      )
      // Sort by price ascending (lowest price first)
      .sort((a, b) => a.price - b.price);

    if (availableBuyTransactions.length === 0) {
      toast({
        title: "Cannot Add Sale",
        description: `No ${newTransaction.metal} purchases found to sell from.`,
        variant: "destructive",
      });
      throw new Error("No buy transactions available");
    }

    let remainingToSell = newTransaction.weight;
    let totalCost = 0;
    const soldFrom: string[] = [];
    const usedWeights: { [key: string]: number } = {}; // Track how much we use from each transaction

    // First pass: Calculate which transactions we'll use and how much from each
    for (const buyTx of availableBuyTransactions) {
      if (remainingToSell <= 0) break;
      if (!buyTx.id) continue;

      const available = buyTx.remainingWeight || 0;
      const used = Math.min(available, remainingToSell);

      if (used > 0) {
        totalCost += used * buyTx.price;
        remainingToSell -= used;
        soldFrom.push(buyTx.id);
        usedWeights[buyTx.id] = used;
      }
    }

    if (remainingToSell > 0) {
      toast({
        title: "Cannot Complete Sale",
        description: `Not enough ${newTransaction.metal} in stock. You can only sell ${(newTransaction.weight - remainingToSell).toFixed(2)}g.`,
        variant: "destructive",
      });
      throw new Error("Not enough inventory for sale");
    }

    const revenue = newTransaction.weight * newTransaction.price;
    const profit = revenue - totalCost;

    // Add debug information
    console.log('FIFO Calculation:', {
      soldAmount: newTransaction.weight,
      soldPrice: newTransaction.price,
      revenue,
      usedTransactions: availableBuyTransactions
        .filter(t => t.id && usedWeights[t.id])
        .map(t => ({
          id: t.id,
          buyPrice: t.price,
          amountUsed: t.id ? usedWeights[t.id] : 0,
          cost: t.id ? (usedWeights[t.id] * t.price) : 0
        })),
      totalCost,
      profit
    });

    return {
      ...newTransaction,
      soldFrom,
      profit,
    };
  };

  const handleProfileChange = (profile: string) => {
    setCurrentProfile(profile);
    // Invalidate queries to reload data for new profile
    queryClient.invalidateQueries({ queryKey: ['transactions', profile] });
  };

  const handleAddProfile = (profile: string) => {
    setProfiles((prev) => [...prev, profile]);
    setCurrentProfile(profile);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading your transactions...</p>
        </div>
      </div>
    );
  }

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

          <TabsContent value="gold">
            <MetalTransactionView
              metal="gold"
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
            />
          </TabsContent>

          <TabsContent value="silver">
            <MetalTransactionView
              metal="silver"
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Monthly Reports</h2>
          <MonthlyReport transactions={transactions} />
        </div>
      </div>
    </div>
  );
};

export default Index;