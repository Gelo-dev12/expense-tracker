import React, { useState, useEffect } from 'react';
import { ExpenseForm, type Expense } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { ExpenseStats } from '@/components/ExpenseStats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Download, Settings, X, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup, DropdownMenuShortcut, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { useTheme } from "next-themes";
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

// Helper to load jsPDF from CDN if not available
async function loadJsPDF() {
  try {
  if (!(window as any).jspdf) {
      console.log('Loading jsPDF from CDN...');
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
      console.log('jsPDF loaded successfully');
  }
  return (window as any).jspdf.jsPDF;
  } catch (error) {
    console.error('Error loading jsPDF:', error);
    throw new Error('Failed to load PDF generator. Please try again.');
  }
}

const currencyOptions = [
  { label: 'Philippine Peso (₱)', value: 'PHP', symbol: '₱' },
  { label: 'US Dollar ($)', value: 'USD', symbol: '$' },
  { label: 'Euro (€)', value: 'EUR', symbol: '€' },
  { label: 'Japanese Yen (¥)', value: 'JPY', symbol: '¥' },
  { label: 'British Pound (£)', value: 'GBP', symbol: '£' },
];

function getCurrencySymbol(code) {
  const found = currencyOptions.find(c => c.value === code);
  return found ? found.symbol : '₱';
}

const Index = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [currency, setCurrency] = useState(() => localStorage.getItem('expenseTracker_currency') || 'PHP');
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [tempCurrency, setTempCurrency] = useState(currency);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenseTracker_expenses');
    const savedBudget = localStorage.getItem('expenseTracker_budget');

    if (savedExpenses) {
      try {
        const parsedExpenses = JSON.parse(savedExpenses).map((expense: any) => ({
          ...expense,
          date: new Date(expense.date),
          createdAt: new Date(expense.createdAt),
        }));
        setExpenses(parsedExpenses);
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    }

    if (savedBudget) {
      try {
        setMonthlyBudget(JSON.parse(savedBudget));
      } catch (error) {
        console.error('Error loading budget:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('expenseTracker_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('expenseTracker_budget', JSON.stringify(monthlyBudget));
  }, [monthlyBudget]);

  // Force PHP as default currency unless already set
  useEffect(() => {
    if (!localStorage.getItem('expenseTracker_currency')) {
      localStorage.setItem('expenseTracker_currency', 'PHP');
      setCurrency('PHP');
    }
  }, []);

  // Save currency to localStorage
  useEffect(() => {
    localStorage.setItem('expenseTracker_currency', currency);
  }, [currency]);

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    toast({
      title: "Expense Deleted",
      description: "The expense has been removed from your records.",
    });
  };

  const handleBudgetChange = (budget: number) => {
    setMonthlyBudget(budget);
    toast({
      title: "Budget Updated",
      description: `Monthly budget set to ₱${budget.toLocaleString()}`,
    });
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount).replace('PHP', getCurrencySymbol(currency));
  };

  const categoryLabels = {
    Food: 'Food',
    Transport: 'Transport',
    Housing: 'Housing',
    Utilities: 'Utilities',
    Entertainment: 'Entertainment',
    Shopping: 'Shopping',
    Health: 'Health',
    Education: 'Education',
    Other: 'Other',
  };

  const handleExportData = async (type: 'json' | 'csv' | 'txt' | 'pdf' = 'json') => {
    let fileName = `expense-tracker-export-${new Date().toISOString().split('T')[0]}`;
    let dataStr = '';
    let mimeType = '';
    let extension = '';

    try {
    if (type === 'json') {
      dataStr = JSON.stringify({ expenses, monthlyBudget }, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else if (type === 'csv') {
      const header = 'Date,Category,Description,Amount\n';
      const rows = expenses.map(e => `${e.date.toISOString().split('T')[0]},${e.category},${e.description},${e.amount}`).join('\n');
      dataStr = header + rows;
      mimeType = 'text/csv';
      extension = 'csv';
    } else if (type === 'txt') {
      dataStr = expenses.map(e => `Date: ${e.date.toISOString().split('T')[0]} | Category: ${e.category} | Description: ${e.description} | Amount: ${e.amount}`).join('\n');
      mimeType = 'text/plain';
      extension = 'txt';
    } else if (type === 'pdf') {
        console.log('Starting PDF generation...');
      const jsPDF = await loadJsPDF();
        console.log('Creating new PDF document...');
      const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let y = margin;

        // Helper function for word wrap
        const splitTextToSize = (text: string, maxWidth: number) => {
          return doc.splitTextToSize(text, maxWidth);
        };

        // Helper function to add a new page if needed
        const checkNewPage = (height: number) => {
          if (y + height > pageHeight - margin) {
            doc.addPage();
            y = margin;
            return true;
          }
          return false;
        };

        try {
          // --- HEADER ---
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(26);
          doc.setTextColor(41, 98, 255); // Primary blue color
          doc.text('ExpenseTracker Pro', margin, y);
          y += 12;
          doc.setFontSize(13);
          doc.setTextColor(128, 128, 128);
          doc.text('Financial Report', margin, y);
          y += 8;
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`, margin, y);
          y += 8;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(margin, y, pageWidth - margin, y);
          y += 10;

          // --- SUMMARY ---
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text('Summary', margin, y);
          y += 8;
      doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          // Calculate daily average
          const today = new Date();
          const daysSoFar = today.getDate();
          const dailyAverage = daysSoFar > 0 ? totalExpenses / daysSoFar : 0;
          // Left column
          doc.text(`Monthly Budget: ${formatCurrency(monthlyBudget || 0)}`, margin, y);
          doc.text(`Number of Transactions: ${expenses.length}`, margin, y + 7);
          doc.text(`Budget Used: ${monthlyBudget ? ((totalExpenses / monthlyBudget) * 100).toFixed(1) : 0}%`, margin, y + 14);
          // Right column
          doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, pageWidth / 2 + margin / 2, y);
          doc.text(`Average per Transaction: ${formatCurrency(totalExpenses / (expenses.length || 1))}`, pageWidth / 2 + margin / 2, y + 7);
          doc.text(`Daily Average: ${formatCurrency(dailyAverage)}`, pageWidth / 2 + margin / 2, y + 14);
          doc.text(`Remaining Budget: ${formatCurrency((monthlyBudget || 0) - totalExpenses)}`, pageWidth / 2 + margin / 2, y + 21);
          y += 28;
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(margin, y, pageWidth - margin, y);
          y += 8;

          // --- CATEGORY BREAKDOWN ---
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text('Category Breakdown', margin, y);
          y += 7;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(245, 247, 250);
          doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
          const catHeaders = ['Category', 'Amount', '% of Total'];
          const catColWidths = [60, 50, 40];
          let x = margin;
          catHeaders.forEach((header, i) => {
            doc.text(header, x, y);
            x += catColWidths[i];
          });
          y += 7;
          doc.setFont('helvetica', 'normal');
          const categoryTotals = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
          }, {} as Record<string, number>);
          const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
          sortedCategories.forEach(([category, amount]) => {
            const percent = ((amount / totalExpenses) * 100).toFixed(1);
            x = margin;
            doc.text(categoryLabels[category as keyof typeof categoryLabels] || category, x, y);
            doc.text(formatCurrency(amount), x + catColWidths[0], y);
            doc.text(`${percent}%`, x + catColWidths[0] + catColWidths[1], y);
            y += 7;
          });
      y += 8;
          doc.setDrawColor(230, 230, 230);
          doc.line(margin, y, pageWidth - margin, y);
        y += 8;

          // --- TRANSACTION DETAILS ---
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text('Transaction Details', margin, y);
          y += 7;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(245, 247, 250);
          doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
          const headers = ['Date', 'Category', 'Description', 'Amount'];
          const colWidths = [30, 40, 70, 40];
          x = margin;
          headers.forEach((header, i) => {
            doc.text(header, x, y);
            x += colWidths[i];
          });
          y += 7;
          doc.setFont('helvetica', 'normal');
          expenses.forEach((expense) => {
            checkNewPage(10);
            x = margin;
            const date = format(expense.date, 'MM/dd/yyyy');
            const category = categoryLabels[expense.category as keyof typeof categoryLabels] || expense.category;
            const description = splitTextToSize(expense.description, colWidths[2] - 5);
            const lineHeight = description.length > 1 ? 7 * description.length : 7;
            if (checkNewPage(lineHeight)) {
              doc.setFont('helvetica', 'bold');
              headers.forEach((header, i) => {
                doc.text(header, margin + (i * colWidths[i]), y);
              });
              y += 7;
              doc.setFont('helvetica', 'normal');
            }
            doc.text(date, x, y);
            doc.text(category, x + colWidths[0], y);
            doc.text(description, x + colWidths[0] + colWidths[1], y);
            doc.text(formatCurrency(expense.amount), x + colWidths[0] + colWidths[1] + colWidths[2], y);
            y += lineHeight;
          });
          y += 8;
          doc.setDrawColor(230, 230, 230);
          doc.line(margin, y, pageWidth - margin, y);
          // --- FOOTER ---
          const totalPages = doc.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - margin);
          }
          // --- SAVE AS DIALOG ---
          const pdfBlob = doc.output('blob');
          if (window.showSaveFilePicker) {
            // Modern browsers: show Save As dialog
            const opts = {
              suggestedName: `${fileName}.pdf`,
              types: [
                {
                  description: 'PDF Document',
                  accept: { 'application/pdf': ['.pdf'] },
                },
              ],
            };
            try {
              const handle = await window.showSaveFilePicker(opts);
              const writable = await handle.createWritable();
              await writable.write(pdfBlob);
              await writable.close();
              toast({ title: 'Data Exported', description: 'Your expense data has been saved as PDF.' });
              return;
            } catch (err) {
              toast({ title: 'Export Cancelled', description: 'PDF export was cancelled.' });
              return;
            }
          } else {
            // Fallback: auto-download
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
      toast({ title: 'Data Exported', description: 'Your expense data has been downloaded as PDF.' });
      return;
          }
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast({ title: 'Export Failed', description: 'Failed to generate PDF. Please try again.', variant: 'destructive' });
          return;
        }
    }

    const dataBlob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);

      toast({
        title: 'Data Exported',
        description: `Your expense data has been downloaded as ${extension.toUpperCase()}.`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-background/90 backdrop-blur-sm border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">BudgetWise</h1>
                <p className="text-xs text-muted-foreground">Master your money, your way.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="hidden sm:flex">
                Total: {formatCurrency(totalExpenses)}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportData('json')}>Export as JSON</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportData('csv')}>Export as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportData('txt')}>Export as TXT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportData('pdf')}>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Dialog open={currencyDialogOpen} onOpenChange={setCurrencyDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={e => e.preventDefault()}>Change Currency</DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Select Currency</DialogTitle>
                      </DialogHeader>
                      <RadioGroup value={tempCurrency} onValueChange={setTempCurrency}>
                        {currencyOptions.map(opt => (
                          <div key={opt.value} className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value={opt.value} id={opt.value} />
                            <Label htmlFor={opt.value}>{opt.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <DialogFooter>
                        <button className="mt-2 px-4 py-2 rounded bg-muted text-foreground mr-2" onClick={() => { setTempCurrency(currency); setCurrencyDialogOpen(false); }}>Cancel</button>
                        <button className="mt-2 px-4 py-2 rounded bg-primary text-primary-foreground" onClick={() => { setCurrency(tempCurrency); setCurrencyDialogOpen(false); }}>Save</button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={e => e.preventDefault()}>Reset All Data</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset All Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reset all data? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          // Only remove app data, not theme
                          localStorage.removeItem('expenseTracker_expenses');
                          localStorage.removeItem('expenseTracker_budget');
                          localStorage.removeItem('expenseTracker_currency');
                          setResetDialogOpen(false);
                          toast({ title: 'All data has been reset.' });
                          window.location.reload();
                        }}>Reset</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <DropdownMenuItem asChild>
                    <div className="flex items-center justify-between w-full">
                      <span>Dark Mode</span>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      />
                    </div>
                  </DropdownMenuItem>
                  <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={e => { e.preventDefault(); setAboutDialogOpen(true); }}>
                        <Info className="h-4 w-4 mr-2" /> About
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>About ExpenseTracker Pro</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <p><b>Version:</b> 1.0.0</p>
                        <p><b>Author:</b> Your Name</p>
                        <p><b>Tech Stack:</b> React, Vite, TypeScript, shadcn/ui, Tailwind CSS</p>
                        <p>This app helps you track expenses, manage your monthly budget, and gain insights into your spending habits. Export your data anytime in multiple formats. Built for speed, privacy, and ease of use.</p>
                      </div>
                      <DialogFooter>
                        <button className="mt-2 px-4 py-2 rounded bg-primary text-primary-foreground" onClick={() => setAboutDialogOpen(false)}>Close</button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form and Stats */}
          <div className="lg:col-span-1 space-y-6">
            <ExpenseForm onAddExpense={handleAddExpense} currency={currency} />
            <ExpenseStats
              expenses={expenses}
              monthlyBudget={monthlyBudget}
              onBudgetChange={handleBudgetChange}
              currency={currency}
            />
          </div>

          {/* Right Column - Expense List */}
          <div className="lg:col-span-2">
            <ExpenseList
              expenses={expenses}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        </div>
      </main>

      {/* Welcome Message for New Users */}
      {expenses.length === 0 && showWelcome && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-scale-in shadow-lg relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcome(false)}
              className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <div className="h-16 w-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Welcome to ExpenseTracker Pro!
              </h2>
              <p className="text-muted-foreground mb-6">
                Start managing your finances like a pro. Add your first expense to get started.
              </p>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground text-left mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Track expenses by category
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  Monitor your monthly budget
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full"></span>
                  Get insights with visual analytics
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Export your data anytime
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => setShowWelcome(false)}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
