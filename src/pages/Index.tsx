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
import { WeeklyReport } from "@/components/WeeklyReport";
import { EditTransactionForm } from "@/components/EditTransactionForm";
import { TransactionList } from "@/components/TransactionList";

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

  // Add edit transaction mutation
  const editTransactionMutation = useMutation({
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
        .update(transactionWithProfile)
        .eq('id', transaction.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentProfile] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
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

  // Add delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentProfile] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
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

  const calculateFIFO = (sellTransaction: Transaction): Transaction => {
    if (sellTransaction.type !== "sell") return sellTransaction;

    const metalTransactions = transactions.filter(t => t.metal === sellTransaction.metal);
    const availableBuyTransactions = metalTransactions
      .filter(t => t.type === "buy" && (t.remainingWeight || 0) > 0)
      .sort((a, b) => a.price - b.price); // Sort by price ascending (lowest price first)

    let remainingToSell = sellTransaction.weight;
    let totalCost = 0;
    const soldFrom: string[] = [];

    for (const buyTx of availableBuyTransactions) {
      if (remainingToSell <= 0) break;
      if (!buyTx.id) continue;

      const available = buyTx.remainingWeight || 0;
      const used = Math.min(available, remainingToSell);
      
      if (used > 0) {
        totalCost += used * buyTx.price;
        soldFrom.push(buyTx.id);
        remainingToSell -= used;
      }
    }

    const totalRevenue = sellTransaction.weight * sellTransaction.price;
    const profit = totalRevenue - totalCost;

    return {
      ...sellTransaction,
      soldFrom,
      profit,
    };
  };

  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      // For sell transactions, check inventory first
      if (transaction.type === "sell") {
        const metalTransactions = transactions.filter(t => t.metal === transaction.metal);
        const totalBuyWeight = metalTransactions
          .filter(t => t.type === "buy")
          .reduce((acc, curr) => acc + (curr.remainingWeight || 0), 0);

        if (transaction.weight > totalBuyWeight) {
          toast({
            title: "Cannot Add Sale",
            description: `You only have ${totalBuyWeight.toFixed(2)} of ${transaction.metal} in stock. Cannot sell ${transaction.weight.toFixed(2)}.`,
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
          .sort((a, b) => a.price - b.price); // Sort by price ascending (lowest price first)

        for (const buyTx of availableBuyTransactions) {
          if (remainingToSell <= 0) break;
          if (!buyTx.id) continue;

          const available = buyTx.remainingWeight || 0;
          const used = Math.min(available, remainingToSell);
          
          if (used > 0) {
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
      }

      queryClient.invalidateQueries({ queryKey: ['transactions', currentProfile] });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleEditTransaction = async (transaction: Transaction) => {
    try {
      // For sell transactions, check inventory
      if (transaction.type === "sell") {
        const metalTransactions = transactions.filter(t => t.metal === transaction.metal);
        const originalTransaction = transactions.find(t => t.id === transaction.id);
        const totalBuyWeight = metalTransactions
          .filter(t => t.type === "buy")
          .reduce((acc, curr) => {
            // Include all available buy weights except those used in other sales
            const isUsedInOtherSales = transactions
              .filter(sale => sale.type === "sell" && sale.id !== transaction.id)
              .some(sale => sale.soldFrom?.includes(curr.id || ''));
            return acc + (isUsedInOtherSales ? 0 : (curr.remainingWeight || 0));
          }, 0);

        if (transaction.weight > totalBuyWeight) {
          toast({
            title: "Cannot Update Sale",
            description: `You only have ${totalBuyWeight.toFixed(2)}g of ${transaction.metal} in stock. Cannot sell ${transaction.weight.toFixed(2)}g.`,
            variant: "destructive",
          });
          return;
        }
      }

      // For buy transactions being edited
      if (transaction.type === "buy") {
        const originalTransaction = transactions.find(t => t.id === transaction.id);
        if (originalTransaction) {
          // Set the remaining weight based on how much has been sold
          const soldAmount = originalTransaction.weight - (originalTransaction.remainingWeight || 0);
          transaction.remainingWeight = Math.max(0, transaction.weight - soldAmount);
        }
      }

      // Update the transaction in the database
      await editTransactionMutation.mutateAsync(transaction);

      // If it's a sell transaction, update the remaining weights
      if (transaction.type === "sell") {
        // First, restore the original weights from the previous sale
        const originalTransaction = transactions.find(t => t.id === transaction.id);
        if (originalTransaction && originalTransaction.soldFrom) {
          for (const buyId of originalTransaction.soldFrom) {
            const buyTx = transactions.find(t => t.id === buyId);
            if (buyTx) {
              // Restore the weight that was previously sold
              const { error } = await supabase
                .from('transactions')
                .update({ 
                  remaining_weight: (buyTx.remainingWeight || 0) + originalTransaction.weight 
                })
                .eq('id', buyId);

              if (error) throw error;
            }
          }
        }

        // Now apply the new sale
        let remainingToSell = transaction.weight;
        const availableBuyTransactions = [...transactions]
          .filter(
            (t) =>
              t.type === "buy" &&
              t.metal === transaction.metal &&
              (t.remainingWeight || 0) > 0 &&
              t.id
          )
          .sort((a, b) => a.price - b.price);

        const newSoldFrom: string[] = [];
        let totalCost = 0;
        for (const buyTx of availableBuyTransactions) {
          if (remainingToSell <= 0) break;
          if (!buyTx.id) continue;

          const available = buyTx.remainingWeight || 0;
          const used = Math.min(available, remainingToSell);
          
          if (used > 0) {
            const { error } = await supabase
              .from('transactions')
              .update({ remaining_weight: available - used })
              .eq('id', buyTx.id);

            if (error) throw error;
            totalCost += used * buyTx.price;
            remainingToSell -= used;
            newSoldFrom.push(buyTx.id);
          }
        }

        // Calculate profit
        const totalRevenue = transaction.weight * transaction.price;
        const profit = totalRevenue - totalCost;

        // Update the sell transaction with new soldFrom array and profit
        const { error } = await supabase
          .from('transactions')
          .update({ 
            sold_from: newSoldFrom,
            profit: profit
          })
          .eq('id', transaction.id);

        if (error) throw error;
      }

      // Refresh the data
      await queryClient.invalidateQueries({ queryKey: ['transactions', currentProfile] });
    } catch (error) {
      console.error("Failed to edit transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      // For buy transactions, check if they're used in any sales
      if (transaction.type === "buy") {
        const relatedSales = transactions.filter(t => 
          t.type === "sell" && 
          t.metal === transaction.metal && 
          t.soldFrom?.includes(transaction.id || '')
        );

        if (relatedSales.length > 0) {
          toast({
            title: "Cannot Delete Purchase",
            description: "This purchase has been used in sales. Delete the related sales first.",
            variant: "destructive",
          });
          return;
        }
      }

      await deleteTransactionMutation.mutateAsync(transaction);
      queryClient.invalidateQueries({ queryKey: ['transactions', currentProfile] });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    }
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

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="gold">Gold</TabsTrigger>
            <TabsTrigger value="silver">Silver</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TransactionList 
              transactions={transactions} 
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="gold">
            <MetalTransactionView 
              transactions={transactions.filter(t => t.metal === "gold")} 
              metal="gold" 
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="silver">
            <MetalTransactionView 
              transactions={transactions.filter(t => t.metal === "silver")} 
              metal="silver" 
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="weekly">
            <WeeklyReport transactions={transactions} />
          </TabsContent>

          <TabsContent value="monthly">
            <MonthlyReport transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;