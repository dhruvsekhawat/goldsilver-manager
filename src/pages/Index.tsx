import React from "react";
import { Transaction } from "@/components/TransactionForm";
import { Summary } from "@/components/Summary";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetalTransactionView } from "@/components/MetalTransactionView";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentProfile, setCurrentProfile] = React.useState<string>("Default");
  const [profiles, setProfiles] = React.useState<string[]>(["Default"]);

  // Authentication state
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      const { error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: user?.id }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

  const calculateFIFO = (newTransaction: Transaction): Transaction => {
    if (newTransaction.type === "buy") {
      return {
        ...newTransaction,
        remainingWeight: newTransaction.weight,
      };
    }

    const availableBuyTransactions = [...transactions]
      .filter(
        (t) =>
          t.type === "buy" &&
          t.metal === newTransaction.metal &&
          (t.remainingWeight || 0) > 0
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingToSell = newTransaction.weight;
    let totalCost = 0;
    const soldFrom: string[] = [];
    const updatedBuyTransactions = [...transactions];

    for (const buyTx of availableBuyTransactions) {
      if (remainingToSell <= 0) break;

      const buyTxIndex = updatedBuyTransactions.findIndex(
        (t) => t.id === buyTx.id
      );
      const available = buyTx.remainingWeight || 0;
      const used = Math.min(available, remainingToSell);

      totalCost += used * buyTx.price;
      remainingToSell -= used;
      soldFrom.push(buyTx.id);

      // Update remaining weight in database
      supabase
        .from('transactions')
        .update({ remainingWeight: available - used })
        .eq('id', buyTx.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating remaining weight:', error);
          }
        });
    }

    if (remainingToSell > 0) {
      toast({
        title: "Error",
        description: "Not enough inventory for this sale",
        variant: "destructive",
      });
      throw new Error("Not enough inventory for this sale");
    }

    const revenue = newTransaction.weight * newTransaction.price;
    const profit = revenue - totalCost;

    return {
      ...newTransaction,
      soldFrom,
      profit,
    };
  };

  const handleAddTransaction = (transaction: Transaction) => {
    try {
      const processedTransaction = calculateFIFO(transaction);
      addTransactionMutation.mutate(processedTransaction);
    } catch (error) {
      // Error toast is already shown in calculateFIFO
      return;
    }
  };

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign in",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Precious Metals Tracker</h1>
          <p className="text-gray-600">Please sign in to access your transactions</p>
          <Button onClick={handleSignIn}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

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
            onProfileChange={setCurrentProfile}
            onAddProfile={(profile) => setProfiles((prev) => [...prev, profile])}
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
      </div>
    </div>
  );
};

export default Index;