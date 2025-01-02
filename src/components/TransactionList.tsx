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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type SortField = "date" | "type" | "metal" | "weight" | "price" | "total" | "remainingWeight" | "profit";
type SortOrder = "asc" | "desc";
type DateFilter = "all" | "7days" | "30days" | "90days";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface TransactionListProps {
  transactions: Transaction[];
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

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions,
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
      <div className="flex flex-col sm:flex-row gap-4 p-4">
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
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortButton field="date" label="Date" /></TableHead>
              <TableHead><SortButton field="type" label="Type" /></TableHead>
              <TableHead><SortButton field="metal" label="Metal" /></TableHead>
              <TableHead><SortButton field="weight" label="Qty" /></TableHead>
              <TableHead><SortButton field="price" label="Rate" /></TableHead>
              <TableHead><SortButton field="total" label="Total" /></TableHead>
              <TableHead><SortButton field="remainingWeight" label="Stock" /></TableHead>
              <TableHead><SortButton field="profit" label="Profit" /></TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{format(parseISO(transaction.date), "dd/MM/yyyy")}</TableCell>
                <TableCell className={transaction.type === "buy" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {transaction.type.toUpperCase()}
                </TableCell>
                <TableCell className={transaction.metal === "gold" ? "text-yellow-600" : "text-gray-600"}>
                  {transaction.metal.toUpperCase()}
                </TableCell>
                <TableCell>{transaction.weight.toFixed(2)}</TableCell>
                <TableCell>
                  {transaction.metal === "gold" 
                    ? formatIndianCurrency(transaction.price * 10)
                    : formatIndianCurrency(transaction.price)}
                </TableCell>
                <TableCell>{formatIndianCurrency(transaction.weight * transaction.price)}</TableCell>
                <TableCell>{transaction.remainingWeight?.toFixed(2) || "-"}</TableCell>
                <TableCell>
                  {transaction.type === "sell" && transaction.profit ? 
                    formatIndianCurrency(transaction.profit) : 
                    "-"}
                </TableCell>
                <TableCell className="text-right space-x-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeletingTransaction(transaction);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedTransactions.length)} of {sortedTransactions.length} entries
            </div>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2">...</span>
                ) : (
                  <Button
                    key={`page-${page}`}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8"
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Make changes to the transaction below.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <EditTransactionForm
              transaction={editingTransaction}
              onSubmit={handleEdit}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction
              and update all related transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTransaction && handleDelete(deletingTransaction)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};