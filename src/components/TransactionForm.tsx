import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
}

export interface Transaction {
  id: string;
  type: "buy" | "sell";
  metal: "gold" | "silver";
  weight: number;
  price: number;
  date: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit }) => {
  const { toast } = useToast();
  const [type, setType] = React.useState<"buy" | "sell">("buy");
  const [metal, setMetal] = React.useState<"gold" | "silver">("gold");
  const [weight, setWeight] = React.useState("");
  const [price, setPrice] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight || !price) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type,
      metal,
      weight: parseFloat(weight),
      price: parseFloat(price),
      date: new Date().toISOString(),
    };

    onSubmit(transaction);
    setWeight("");
    setPrice("");
    
    toast({
      title: "Success",
      description: "Transaction added successfully",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Transaction Type</Label>
          <Select value={type} onValueChange={(value: "buy" | "sell") => setType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="metal">Metal</Label>
          <Select value={metal} onValueChange={(value: "gold" | "silver") => setMetal(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select metal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (g)</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price per gram</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Add Transaction
      </Button>
    </form>
  );
};