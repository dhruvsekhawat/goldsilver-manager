import React from "react";
import { Transaction } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { TransactionForm } from "./TransactionForm";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronDown } from "lucide-react";

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
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<string>("date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = React.useState<"all" | "buy" | "sell">("all");

  // Keep all transactions of this metal type for linking
  const metalTransactions = transactions.filter((t) => t.metal === metal);
  
  const displayTransactions = React.useMemo(() => {
    let filtered = [...metalTransactions];
    
    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc" 
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "weight") {
        return sortOrder === "desc" 
          ? b.weight - a.weight
          : a.weight - b.weight;
      }
      if (sortBy === "price") {
        return sortOrder === "desc" 
          ? b.price - a.price
          : a.price - b.price;
      }
      return 0;
    });
  }, [metalTransactions, filterType, sortBy, sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select value={filterType} onValueChange={(value: "all" | "buy" | "sell") => setFilterType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy Only</SelectItem>
                <SelectItem value="sell">Sell Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="weight">Quantity</SelectItem>
                <SelectItem value="price">Rate</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            <PlusCircle className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
          <CollapsibleContent>
            <Card className="p-4 mb-4">
              <TransactionForm defaultMetal={metal} onSubmit={(transaction) => {
                onAddTransaction(transaction);
                setIsFormOpen(false);
              }} />
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Card className="overflow-hidden">
        <TransactionList 
          transactions={displayTransactions}
          allTransactions={metalTransactions}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
        />
      </Card>
    </div>
  );
};