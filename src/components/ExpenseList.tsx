import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, Filter, Receipt, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Expense } from './ExpenseForm';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  className?: string;
}

const categoryColors = {
  food: 'bg-orange-100 text-orange-800 border-orange-200',
  transport: 'bg-blue-100 text-blue-800 border-blue-200',
  shopping: 'bg-purple-100 text-purple-800 border-purple-200',
  bills: 'bg-red-100 text-red-800 border-red-200',
  entertainment: 'bg-pink-100 text-pink-800 border-pink-200',
  healthcare: 'bg-green-100 text-green-800 border-green-200',
  education: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  travel: 'bg-teal-100 text-teal-800 border-teal-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

const categoryIcons = {
  food: '🍽️',
  transport: '🚗',
  shopping: '🛍️',
  bills: '💡',
  entertainment: '🎬',
  healthcare: '🏥',
  education: '📚',
  travel: '✈️',
  other: '📝',
};

export function ExpenseList({ expenses, onDeleteExpense, className }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(categoryColors);

  return (
    <Card className={cn("w-full bg-gradient-card shadow-md border-0", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Receipt className="h-5 w-5 text-primary" />
          Recent Expenses
          <Badge variant="secondary" className="ml-auto">
            {filteredExpenses.length} items
          </Badge>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  <span className="flex items-center gap-2">
                    <span>{categoryIcons[category as keyof typeof categoryIcons]}</span>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No expenses found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Start by adding your first expense above.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors animate-fade-in"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0 text-2xl">
                    {categoryIcons[expense.category as keyof typeof categoryIcons]}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground truncate">
                        {expense.description}
                      </h4>
                      <Badge 
                        className={cn(
                          "text-xs",
                          categoryColors[expense.category as keyof typeof categoryColors]
                        )}
                      >
                        {expense.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(expense.date, 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-semibold text-lg">
                      <DollarSign className="h-4 w-4" />
                      {expense.amount.toFixed(2)}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteExpense(expense.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}