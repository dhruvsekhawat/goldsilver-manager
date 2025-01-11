import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Transaction {
  id?: string;
  type: "buy" | "sell";
  metal: "gold" | "silver";
  weight: number;
  price: number;
  date: string;
  remainingWeight?: number;
  soldFrom?: string[];
  profit?: number;
}

interface TransactionFormProps {
  defaultMetal?: "gold" | "silver";
  onSubmit: (transaction: Transaction) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  defaultMetal = "gold",
  onSubmit,
}) => {
  const { toast } = useToast();
  const [type, setType] = React.useState<"buy" | "sell">("buy");
  const [metal] = React.useState(defaultMetal);
  const [weight, setWeight] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [date, setDate] = React.useState<Date>(new Date());

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

    const weightValue = parseFloat(weight);
    const priceValue = parseFloat(price);

    // Store values exactly as entered:
    // For gold: weight in grams, price per 10g
    // For silver: weight in kg, price per kg
    const transaction: Transaction = {
      type,
      metal,
      weight: weightValue,
      price: priceValue, // Store price exactly as entered (per 10g for gold, per kg for silver)
      date: date.toISOString(),
    };

    onSubmit(transaction);

    // Reset form
    setType("buy");
    setWeight("");
    setPrice("");
    setDate(new Date());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={type} onValueChange={(value: "buy" | "sell") => setType(value)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 w-full justify-start text-left font-normal"
              >
                {format(date, "PP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Quantity</Label>
          <Input
            type="number"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={`Enter quantity (${metal === "gold" ? "g" : "kg"})`}
            className="h-9"
          />
        </div>

        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Rate</Label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={`Rate per ${metal === "gold" ? "10g" : "kg"}`}
            className="h-9"
          />
        </div>

        <Button type="submit" size="sm" className="h-9 px-6">
          Add
        </Button>
      </div>
    </form>
  );
};