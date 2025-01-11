import React from "react";
import { Transaction } from "./TransactionForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EditTransactionFormProps {
  transaction: Transaction;
  onSubmit: (transaction: Transaction) => Promise<void>;
  onCancel: () => void;
}

export const EditTransactionForm: React.FC<EditTransactionFormProps> = ({
  transaction,
  onSubmit,
  onCancel,
}) => {
  const { toast } = useToast();
  const [weight, setWeight] = React.useState(transaction.weight.toString());
  const [price, setPrice] = React.useState(transaction.price.toString());
  const [date, setDate] = React.useState<Date>(new Date(transaction.date));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight || !price) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const weightValue = parseFloat(weight);
      const priceValue = parseFloat(price);

      // Store price exactly as entered (per 10g for gold, per kg for silver)
      const updatedTransaction: Transaction = {
        id: transaction.id,
        type: transaction.type,
        metal: transaction.metal,
        weight: weightValue,
        price: priceValue,
        date: date.toISOString(),
        remainingWeight: transaction.type === "buy" ? weightValue : 0,
        soldFrom: transaction.soldFrom || [],
        profit: transaction.profit || 0
      };

      await onSubmit(updatedTransaction);
      onCancel(); // Close the dialog after successful submission
    } catch (error) {
      console.error("Failed to update transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Quantity</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={`Enter quantity (${transaction.metal === "gold" ? "g" : "kg"})`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Rate</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={`Rate per ${transaction.metal === "gold" ? "10g" : "kg"}`}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
}; 