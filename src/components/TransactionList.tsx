import React from "react";
import { Transaction } from "./TransactionForm";
import { EditTransactionForm } from "./EditTransactionForm";
import { format, parseISO, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type SortField = "date" | "type" | "metal" | "weight" | "price" | "total" | "remainingWeight" | "profit";
type SortOrder = "asc" | "desc";
type DateFilter = "all" | "7days" | "30days" | "90days";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface TransactionListProps {
  transactions: Transaction[];
  allTransactions: Transaction[];
  onEdit: (transaction: Transaction) => Promise<void>;
  onDelete: (transaction: Transaction) => Promise<void>;
}

const formatIndianCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
};

const StatusBadge: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  if (transaction.type === "sell") {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Sell
      </Badge>
    );
  }

  const remainingWeight = transaction.remainingWeight || 0;
  if (remainingWeight === 0) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Fully Sold
      </Badge>
    );
  }
  if (remainingWeight < transaction.weight) {
    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        Partially Sold
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
      Buy
    </Badge>
  );
};

const ProfitIndicator: React.FC<{ value: number }> = ({ value }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
      {formatIndianCurrency(Math.abs(value))}
    </span>
  );
};

const SellDetailsCard: React.FC<{ 
  transaction: Transaction;
  allTransactions: Transaction[];
}> = ({ transaction, allTransactions }) => {
  if (transaction.type !== "sell") return null;

  const linkedBuyTransactions = transaction.soldFrom
    ?.map(id => allTransactions.find(t => t.id === id))
    .filter((t): t is Transaction => t !== undefined) ?? [];

  // Calculate the weight distribution for each buy transaction
  let remainingWeight = transaction.weight;
  const buyDetails = linkedBuyTransactions.map(buyTx => {
    const originalAvailable = buyTx.weight;
    const weightFromThisBuy = Math.min(remainingWeight, originalAvailable);
    remainingWeight -= weightFromThisBuy;
    
    return {
      ...buyTx,
      weightUsed: weightFromThisBuy
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Sold From:</span>
        <ProfitIndicator value={transaction.profit || 0} />
      </div>
      <div className="space-y-2">
        {buyDetails.length > 0 ? (
          buyDetails.map((buyTx, index) => (
            <div 
              key={buyTx.id} 
              className="text-sm p-2 rounded-md bg-muted/50 space-y-1"
            >
              <div className="flex justify-between items-center">
                <div className="font-medium">Buy #{index + 1}</div>
                <div className="text-muted-foreground">
                  {format(parseISO(buyTx.date), "dd/MM/yyyy")}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-muted-foreground">Rate:</div>
                <div className="font-mono">
                  {transaction.metal === "gold" 
                    ? formatIndianCurrency(buyTx.price * 10)
                    : formatIndianCurrency(buyTx.price)
                  }
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-muted-foreground">Quantity:</div>
                <div className="font-mono">
                  {buyTx.weightUsed.toFixed(2)}g
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No linked buy transactions found.</div>
        )}
      </div>
    </div>
  );
};

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions,
  allTransactions,
  onEdit,
  onDelete,
}) => {
  const [sortField, setSortField] = React.useState<SortField>("date");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = React.useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredTransactions = React.useMemo(() => {
    let filtered = [...transactions];

    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date();
      const days = {
        "7days": 7,
        "30days": 30,
        "90days": 90,
      }[dateFilter];
      
      if (days) {
        const startDate = startOfDay(subDays(today, days));
        filtered = filtered.filter(t => 
          isWithinInterval(parseISO(t.date), {
            start: startDate,
            end: endOfDay(today)
          })
        );
      }
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.type.toLowerCase().includes(search) ||
        t.metal.toLowerCase().includes(search) ||
        t.weight.toString().includes(search) ||
        t.price.toString().includes(search) ||
        format(parseISO(t.date), "dd/MM/yyyy").includes(search)
      );
    }

    return filtered;
  }, [transactions, dateFilter, searchTerm]);

  const sortedTransactions = React.useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      
      switch (sortField) {
        case "date":
          return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
        case "type":
          return multiplier * a.type.localeCompare(b.type);
        case "metal":
          return multiplier * a.metal.localeCompare(b.metal);
        case "weight":
          return multiplier * (a.weight - b.weight);
        case "price":
          return multiplier * (a.price - b.price);
        case "total":
          return multiplier * ((a.weight * a.price) - (b.weight * b.price));
        case "remainingWeight":
          return multiplier * ((a.remainingWeight || 0) - (b.remainingWeight || 0));
        case "profit":
          return multiplier * ((a.profit || 0) - (b.profit || 0));
        default:
          return 0;
      }
    });
  }, [filteredTransactions, sortField, sortOrder]);

  // Pagination
  const [pageSize, setPageSize] = React.useState(10);
  const totalPages = Math.ceil(sortedTransactions.length / pageSize);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // If current page is near the start
        pages.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // If current page is near the end
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // If current page is in the middle
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  const SortButton: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => handleSort(field)}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  const handleEdit = async (transaction: Transaction) => {
    try {
      await onEdit(transaction);
      setEditingTransaction(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to edit transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    try {
      await onDelete(transaction);
      setDeletingTransaction(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={dateFilter}
          onValueChange={(value: DateFilter) => setDateFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => setPageSize(Number(value))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} rows
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">
                <SortButton field="date" label="Date" />
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  Status
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-2">
                          <div>Buy: New purchase</div>
                          <div>Sell: Sale transaction</div>
                          <div>Fully Sold: All quantity sold</div>
                          <div>Partially Sold: Some quantity remaining</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead>
                <SortButton field="metal" label="Metal" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="weight" label="Quantity" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="price" label="Rate" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="total" label="Total" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="remainingWeight" label="Remaining" />
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="profit" label="Profit/Loss" />
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow 
                key={transaction.id}
                className={`
                  ${transaction.type === "buy" && (transaction.remainingWeight || 0) === 0 ? 'bg-green-50' : ''}
                  ${transaction.type === "buy" && (transaction.remainingWeight || 0) < transaction.weight ? 'bg-orange-50' : ''}
                  hover:bg-muted/50 transition-colors
                `}
              >
                <TableCell className="font-medium">
                  {format(parseISO(transaction.date), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusBadge transaction={transaction} />
                    {transaction.type === "sell" && (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6 hover:bg-muted"
                          >
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent align="start" className="w-80">
                          <SellDetailsCard 
                            transaction={transaction} 
                            allTransactions={allTransactions}
                          />
                        </HoverCardContent>
                      </HoverCard>
                    )}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{transaction.metal}</TableCell>
                <TableCell className="text-right font-mono">
                  {transaction.weight.toFixed(2)}g
                </TableCell>
                <TableCell className="text-right font-mono">
                  {transaction.metal === "gold" 
                    ? formatIndianCurrency(transaction.price * 10)
                    : formatIndianCurrency(transaction.price)
                  }
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatIndianCurrency(transaction.weight * transaction.price)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {transaction.type === "buy" ? `${(transaction.remainingWeight || 0).toFixed(2)}g` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {transaction.type === "sell" ? (
                    <ProfitIndicator value={transaction.profit || 0} />
                  ) : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit transaction</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingTransaction(transaction);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete transaction</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedTransactions.length)} of {sortedTransactions.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {typeof page === 'number' ? (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ) : (
                  <span className="px-2">...</span>
                )}
              </React.Fragment>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Make changes to the transaction details below.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <EditTransactionForm
              transaction={editingTransaction}
              onSubmit={handleEdit}
              onCancel={() => {
                setEditingTransaction(null);
                setIsEditDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeletingTransaction(null);
              setIsDeleteDialogOpen(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingTransaction && handleDelete(deletingTransaction)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};