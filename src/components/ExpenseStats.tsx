import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, PieChart, Settings } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Expense } from './ExpenseForm';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ExpenseStatsProps {
  expenses: Expense[];
  monthlyBudget: number | null;
  onBudgetChange: (budget: number) => void;
  className?: string;
  currency?: string;
}

const categoryColors = {
  food: 'bg-orange-500',
  transport: 'bg-blue-500',
  shopping: 'bg-purple-500',
  bills: 'bg-red-500',
  entertainment: 'bg-pink-500',
  healthcare: 'bg-green-500',
  education: 'bg-indigo-500',
  travel: 'bg-teal-500',
  other: 'bg-gray-500',
};

const categoryLabels = {
  food: 'Food & Dining',
  transport: 'Transportation',
  shopping: 'Shopping',
  bills: 'Bills & Utilities',
  entertainment: 'Entertainment',
  healthcare: 'Healthcare',
  education: 'Education',
  travel: 'Travel',
  other: 'Other',
};

const currencyOptions = [
  { label: 'Philippine Peso (₱)', value: 'PHP', symbol: '₱' },
  { label: 'US Dollar ($)', value: 'USD', symbol: '$' },
  { label: 'Euro (€)', value: 'EUR', symbol: '€' },
  { label: 'Japanese Yen (¥)', value: 'JPY', symbol: '¥' },
  { label: 'British Pound (£)', value: 'GBP', symbol: '£' },
];

function getCurrencySymbol(code: string) {
  const found = currencyOptions.find(c => c.value === code);
  return found ? found.symbol : '₱';
}

export function ExpenseStats({ expenses, monthlyBudget, onBudgetChange, className, currency = 'PHP' }: ExpenseStatsProps) {
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const [open, setOpen] = React.useState(false);
  const [newBudget, setNewBudget] = React.useState(monthlyBudget ? monthlyBudget.toString() : "");

  const currentMonthExpenses = expenses.filter(expense =>
    isWithinInterval(expense.date, { start: monthStart, end: monthEnd })
  );

  const totalThisMonth = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalAllTime = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averagePerDay = currentMonthExpenses.length > 0 ? totalThisMonth / new Date().getDate() : 0;

  // Category breakdown for current month
  const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const budgetUsed = monthlyBudget ? (totalThisMonth / monthlyBudget) * 100 : 0;

  // Find the biggest single expense this month
  const biggestExpense = currentMonthExpenses.reduce((max, expense) => expense.amount > max.amount ? expense : max, { amount: 0, category: '', description: '' });
  const maxExpenseAmount = biggestExpense.amount || 0;
  const maxExpenseCategory = biggestExpense.category ? (categoryLabels[biggestExpense.category] || biggestExpense.category) : '';
  const maxExpenseDescription = biggestExpense.description || '';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount).replace('PHP', getCurrencySymbol(currency));
  };

  // Replace allocation state and modal logic with dynamic groups
  // --- Allocation Customization State ---
  const allCategories = Object.keys(categoryLabels);
  const defaultGroups = [
    { name: 'Needs', percent: 50, categories: ['food', 'bills', 'transport', 'healthcare', 'education'] },
    { name: 'Savings', percent: 25, categories: [] },
    { name: 'Investment', percent: 25, categories: [] },
  ];
  const [groups, setGroups] = React.useState(() => {
    try {
      const saved = localStorage.getItem('expenseTracker_groups');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultGroups;
  });
  const [allocDialogOpen, setAllocDialogOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleGroupNameChange(idx: number, name: string) {
    setGroups(prev => prev.map((g, i) => i === idx ? { ...g, name } : g));
  }
  function handleGroupPercentChange(idx: number, percent: number) {
    setGroups(prev => prev.map((g, i) => i === idx ? { ...g, percent } : g));
  }
  function handleGroupCategoryChange(groupIdx: number, cat: string, checked: boolean) {
    setGroups(prev => {
      // Remove cat from all groups
      const newGroups = prev.map(g => ({ ...g, categories: g.categories.filter(c => c !== cat) }));
      // Add to selected group if checked
      if (checked) newGroups[groupIdx].categories.push(cat);
      return newGroups;
    });
  }
  function handleAddGroup() {
    setGroups(prev => [...prev, { name: 'New Group', percent: 0, categories: [] }]);
  }
  function handleRemoveGroup(idx: number) {
    setGroups(prev => prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev);
  }
  function handleSaveGroups() {
    const total = groups.reduce((sum, g) => sum + Number(g.percent), 0);
    if (total !== 100) {
      setError('Total allocation must be 100%.');
      return;
    }
    setError(null);
    localStorage.setItem('expenseTracker_groups', JSON.stringify(groups));
    setAllocDialogOpen(false);
  }
  // --- Use groups for allocation computation ---
  function getGroupSpent(group: typeof groups[number]) {
    return currentMonthExpenses.filter(e => group.categories.includes(e.category)).reduce((sum, e) => sum + e.amount, 0);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className={cn("space-y-6", className)}>
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="min-w-[160px] min-h-[140px] bg-gradient-card shadow-md border-0 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 mb-3 rounded-lg flex items-center justify-center bg-muted dark:bg-white/30 dark:ring-2 dark:ring-primary/30">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">This Month</p>
                <p
                  className="font-bold mb-2 text-foreground w-full text-center"
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 1.5rem)',
                    lineHeight: 1.1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  title={formatCurrency(totalThisMonth)}
                >
                  {formatCurrency(totalThisMonth)}
                </p>
                <p className="text-xs text-muted-foreground">{format(currentMonth, 'MMMM yyyy')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-[160px] min-h-[140px] bg-gradient-card shadow-md border-0 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 mb-3 rounded-lg flex items-center justify-center bg-muted dark:bg-white/30 dark:ring-2 dark:ring-primary/30">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Daily Average</p>
                <p
                  className="font-bold mb-2 text-foreground w-full text-center"
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 1.5rem)',
                    lineHeight: 1.1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  title={formatCurrency(averagePerDay)}
                >
                  {formatCurrency(averagePerDay)}
                </p>
                <p className="text-xs text-muted-foreground">Based on {new Date().getDate()} days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-[160px] min-h-[140px] bg-gradient-card shadow-md border-0 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 mb-3 rounded-lg flex items-center justify-center bg-muted dark:bg-white/30 dark:ring-2 dark:ring-primary/30">
                  <DollarSign className="h-4 w-4 text-warning" />
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Expenses</p>
                <p
                  className="font-bold mb-2 text-foreground w-full text-center"
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 1.5rem)',
                    lineHeight: 1.1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  title={formatCurrency(totalAllTime)}
                >
                  {formatCurrency(totalAllTime)}
                </p>
                <p className="text-xs text-muted-foreground">{expenses.length} transactions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-[160px] min-h-[140px] bg-gradient-card shadow-md border-0 animate-scale-in">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 mb-3 rounded-lg flex items-center justify-center bg-muted dark:bg-white/30 dark:ring-2 dark:ring-primary/30">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Biggest Expense</p>
                <p
                  className="font-bold mb-2 text-foreground w-full text-center"
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 1.5rem)',
                    lineHeight: 1.1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  title={formatCurrency(maxExpenseAmount)}
                >
                  {formatCurrency(maxExpenseAmount)}
                </p>
                <p className="text-xs text-muted-foreground">{maxExpenseCategory}{maxExpenseDescription ? `: ${maxExpenseDescription}` : ''}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="w-full mt-6 bg-gradient-card shadow-md border-0 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg font-semibold">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Monthly Budget
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Monthly Budget</DialogTitle>
                  </DialogHeader>
                  <Input
                    type="number"
                    value={newBudget}
                    onChange={e => setNewBudget(e.target.value)}
                    placeholder="Enter monthly budget (PHP)"
                  />
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        if (!isNaN(Number(newBudget)) && newBudget !== "") {
                          onBudgetChange(Number(newBudget));
                          setOpen(false);
                        }
                      }}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {monthlyBudget === null ? (
              <div className="flex flex-col items-center justify-center py-6">
                <span className="text-muted-foreground mb-2">No budget set.</span>
                <Button onClick={() => setOpen(true)} variant="outline">Set Monthly Budget</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Used this month</span>
                  <span className="font-medium">
                    {formatCurrency(totalThisMonth)} / {formatCurrency(monthlyBudget)}
                  </span>
                </div>
                <Progress
                  value={Math.min(budgetUsed, 100)}
                  className="h-3"
                />
                <div className="flex items-center justify-between">
                  <Badge
                    variant={budgetUsed > 90 ? "destructive" : budgetUsed > 75 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {budgetUsed.toFixed(1)}% used
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(monthlyBudget - totalThisMonth)} remaining
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Allocation Card */}
        {monthlyBudget !== null && (
          <Card className="w-full bg-gradient-card shadow-md border-0 animate-fade-in">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <PieChart className="h-5 w-5 text-primary" />
                Budget Allocation
              </CardTitle>
              {/* Settings button for allocation customization */}
              <Dialog open={allocDialogOpen} onOpenChange={setAllocDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Customize Allocation</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <div className="font-semibold">Edit groups, percentages, and assign categories:</div>
                    {error && <div className="text-red-500 text-xs font-semibold">{error}</div>}
                    <div className="flex flex-col gap-4">
                      {groups.map((group, idx) => (
                        <div key={idx} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                          <div className="flex flex-col gap-1 min-w-[120px]">
                            <input
                              className="border rounded px-2 py-1 text-sm font-semibold bg-background"
                              value={group.name}
                              onChange={e => handleGroupNameChange(idx, e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-xs">%:</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                className="border rounded px-1 py-0.5 w-14 text-xs bg-background"
                                value={group.percent}
                                onChange={e => handleGroupPercentChange(idx, Number(e.target.value))}
                              />
                            </div>
                            {groups.length > 2 && (
                              <Button variant="outline" size="xs" className="mt-1" onClick={() => handleRemoveGroup(idx)}>
                                Remove
                              </Button>
                            )}
                          </div>
                          <div className="flex-1 flex flex-wrap gap-2">
                            {allCategories.map(cat => (
                              <label key={cat} className="flex items-center gap-1 text-xs cursor-pointer">
                                <Checkbox
                                  checked={group.categories.includes(cat)}
                                  onCheckedChange={checked => handleGroupCategoryChange(idx, cat, !!checked)}
                                  disabled={groups.some((g, gidx) => gidx !== idx && g.categories.includes(cat))}
                                />
                                {categoryLabels[cat] || cat}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleAddGroup}>+ Add Group</Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveGroups}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-6 space-y-4 min-h-[220px]">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 h-full">
                {groups.map((group, idx) => {
                  const recommended = monthlyBudget * (group.percent / 100);
                  const spent = getGroupSpent(group);
                  const percentUsed = recommended > 0 ? (spent / recommended) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-center px-2 min-w-0">
                      <span className="font-semibold text-xs mb-1">{group.name} ({group.percent}%)</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`font-bold ${idx === 0 ? 'text-primary' : idx === 1 ? 'text-green-600' : 'text-blue-600'} truncate w-full text-center`}
                              style={{ fontSize: 'clamp(1rem, 2.5vw, 2rem)', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                              title={formatCurrency(recommended)}
                            >
                              {formatCurrency(recommended)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatCurrency(recommended)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-xs text-muted-foreground">Recommended</span>
                      <span className="mt-1 text-xs truncate w-full text-center">{group.name === 'Needs' ? 'Spent:' : 'Goal:'} <b>{formatCurrency(group.name === 'Needs' ? spent : recommended)}</b>{group.name === 'Needs' && <span className='text-xs text-muted-foreground'> ({percentUsed.toFixed(1)}%)</span>}</span>
                      {group.name === 'Needs' && (
                        <div className="flex w-full justify-center">
                          <Progress value={Math.min(percentUsed, 100)} className="h-1.5 mt-1 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg" />
                        </div>
                      )}
                      {group.name !== 'Needs' && <Badge variant="outline" className="mt-1 text-[10px] text-muted-foreground px-2 py-0.5">{group.name === 'Savings' ? 'Save for your future!' : group.name === 'Investment' ? 'Grow your wealth!' : 'Stay on track!'}</Badge>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Categories */}
        {sortedCategories.length > 0 && (
          <Card className="bg-gradient-card shadow-md border-0 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <PieChart className="h-5 w-5 text-primary" />
                Top Categories This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedCategories.map(([category, amount]) => {
                  const percentage = totalThisMonth > 0 ? (amount / totalThisMonth) * 100 : 0;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              categoryColors[category as keyof typeof categoryColors]
                            )}
                          />
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </span>
                        <span className="font-semibold">{formatCurrency(amount)}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
