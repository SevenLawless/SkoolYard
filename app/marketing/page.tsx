"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Modal from "@/components/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import toast from "react-hot-toast";

type TimePeriod = "all" | "month" | "custom";

export default function FinancialsPage() {
  const { data, addCustomExpense, deleteCustomExpense } = useData();
  const router = useRouter();
  
  // Time period state
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Expense form
  const expenseSchema = z.object({
    amount: z.number().min(0, "Amount must be positive"),
    category: z.string().min(1, "Category is required"),
    description: z.string().min(1, "Description is required"),
    type: z.enum(["monthly", "one-time"]),
  });

  type ExpenseFormValues = z.infer<typeof expenseSchema>;
  const { register: registerExpense, handleSubmit: handleExpenseSubmit, reset: resetExpense, formState: { errors: expenseErrors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: "",
      description: "",
      type: "one-time",
    },
  });

  const onSubmitExpense = (values: ExpenseFormValues) => {
    addCustomExpense({
      date: new Date().toISOString(),
      amount: values.amount,
      category: values.category,
      description: values.description,
      type: values.type,
    });
    toast.success("Custom expense added!");
    resetExpense();
    setShowAddExpenseModal(false);
  };

  // Filter data by time period
  const filterByDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    if (timePeriod === "all") return true;
    
    if (timePeriod === "month") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return date >= lastMonth;
    }
    
    if (timePeriod === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      return date >= start && date <= end;
    }
    
    return true;
  };

  // Calculate expenses
  const expenses = useMemo(() => {
    const teacherSalaries = data.teachers.reduce((sum, t) => sum + t.salary, 0);
    const staffSalaries = data.staff.reduce((sum, s) => sum + s.salary, 0);
    const customExpenseTotal = data.customExpenses
      .filter(e => filterByDate(e.date))
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      teacherSalaries,
      staffSalaries,
      customExpenses: customExpenseTotal,
      total: teacherSalaries + staffSalaries + customExpenseTotal,
    };
  }, [data.teachers, data.staff, data.customExpenses, timePeriod, customStartDate, customEndDate]);

  // Calculate income (expected from enrolled students, regardless of payment status)
  const income = useMemo(() => {
    // Income from regular classes
    const classIncome = data.classes.reduce((sum, c) => {
      return sum + (c.fees * c.studentIds.length);
    }, 0);

    // Income from marketing classes
    const marketingIncome = data.marketingClasses.reduce((sum, c) => {
      return sum + (c.fees * c.studentIds.length);
    }, 0);

    return {
      classIncome,
      marketingIncome,
      total: classIncome + marketingIncome,
    };
  }, [data.classes, data.marketingClasses]);

  // Calculate profit
  const profit = income.total - expenses.total;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Financials" }]} />
        <h1 className="section-title text-gradient">Financial Overview</h1>
        <p className="muted text-sm">Track all expenses, income, and profit with detailed breakdowns</p>
      </div>

      {/* Time Period Selector */}
      <div className="card-glass p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Time Period
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setTimePeriod("all")}
            className={`p-4 rounded-lg border-2 transition-all ${
              timePeriod === "all" 
                ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold" 
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-center">
              <div className="text-lg font-bold">All Time</div>
              <div className="text-xs text-gray-600">From the beginning</div>
            </div>
          </button>
          
          <button
            onClick={() => setTimePeriod("month")}
            className={`p-4 rounded-lg border-2 transition-all ${
              timePeriod === "month" 
                ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold" 
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-center">
              <div className="text-lg font-bold">Last Month</div>
              <div className="text-xs text-gray-600">Past 30 days</div>
            </div>
          </button>
          
          <button
            onClick={() => setTimePeriod("custom")}
            className={`p-4 rounded-lg border-2 transition-all ${
              timePeriod === "custom" 
                ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold" 
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-center">
              <div className="text-lg font-bold">Custom Period</div>
              <div className="text-xs text-gray-600">Select dates</div>
            </div>
          </button>
        </div>

        {timePeriod === "custom" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="input-field mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-glass p-6 border-l-4 border-l-red-500">
          <div className="text-xs text-gray-600 mb-1">💸 Total Expenses</div>
          <div className="text-3xl font-bold text-red-600">{expenses.total.toFixed(2)} DH</div>
          <div className="text-xs text-gray-500 mt-1">All outgoing costs</div>
        </div>

        <div className="card-glass p-6 border-l-4 border-l-green-500">
          <div className="text-xs text-gray-600 mb-1">💰 Expected Income</div>
          <div className="text-3xl font-bold text-green-600">{income.total.toFixed(2)} DH</div>
          <div className="text-xs text-gray-500 mt-1">From enrolled students</div>
        </div>

        <div className={`card-glass p-6 border-l-4 ${profit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <div className="text-xs text-gray-600 mb-1">📊 Net Profit</div>
          <div className={`text-3xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {profit.toFixed(2)} DH
          </div>
          <div className="text-xs text-gray-500 mt-1">Income - Expenses</div>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expenses Breakdown
          </h2>
          <div className="text-2xl font-bold text-red-600">{expenses.total.toFixed(2)} DH</div>
        </div>

        {/* Professor Salaries */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Professor Salaries ({data.teachers.length})
            <span className="ml-auto font-bold text-purple-600">{expenses.teacherSalaries.toFixed(2)} DH/mo</span>
          </h3>
          <div className="space-y-2">
            {data.teachers.map((teacher) => (
              <div key={teacher.id} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex-1">
                  <div className="font-medium text-purple-900">{teacher.name}</div>
                  <div className="text-xs text-purple-600">{teacher.subjects.join(", ")}</div>
                </div>
                <div className="font-bold text-purple-700">{teacher.salary.toFixed(2)} DH/mo</div>
              </div>
            ))}
            {data.teachers.length === 0 && (
              <p className="text-gray-500 text-sm italic">No teachers added yet</p>
            )}
          </div>
        </div>

        {/* Staff Salaries */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Staff Salaries ({data.staff.length})
            <span className="ml-auto font-bold text-indigo-600">{expenses.staffSalaries.toFixed(2)} DH/mo</span>
          </h3>
          <div className="space-y-2">
            {data.staff.map((staff) => (
              <div key={staff.id} className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex-1">
                  <div className="font-medium text-indigo-900">{staff.name}</div>
                  <div className="text-xs text-indigo-600">{staff.email}</div>
                </div>
                <div className="font-bold text-indigo-700">{staff.salary.toFixed(2)} DH/mo</div>
              </div>
            ))}
            {data.staff.length === 0 && (
              <p className="text-gray-500 text-sm italic">No staff members added yet</p>
            )}
          </div>
        </div>

        {/* Custom Expenses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Custom Expenses ({data.customExpenses.filter(e => filterByDate(e.date)).length})
              <span className="ml-auto font-bold text-orange-600">{expenses.customExpenses.toFixed(2)} DH</span>
            </h3>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="btn-primary btn-sm"
            >
              + Add Expense
            </button>
          </div>
          <div className="space-y-2">
            {data.customExpenses.filter(e => filterByDate(e.date)).map((expense) => (
              <div key={expense.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-orange-900">{expense.category}</div>
                    <span className={`chip text-xs ${expense.type === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {expense.type === 'monthly' ? '🔄 Monthly' : '📌 One-time'}
                    </span>
                  </div>
                  <div className="text-xs text-orange-600">{expense.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(expense.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-bold text-orange-700">
                    {expense.amount.toFixed(2)} DH{expense.type === 'monthly' ? '/mo' : ''}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Delete this expense?")) {
                        deleteCustomExpense(expense.id);
                        toast.success("Expense deleted");
                      }
                    }}
                    className="btn btn-sm btn-ghost text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {data.customExpenses.filter(e => filterByDate(e.date)).length === 0 && (
              <p className="text-gray-500 text-sm italic">No custom expenses for this period</p>
            )}
          </div>
        </div>
      </div>

      {/* Income Section */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expected Income
          </h2>
          <div className="text-2xl font-bold text-green-600">{income.total.toFixed(2)} DH</div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This shows the expected monthly income from all enrolled students, 
            regardless of whether they have paid or not. It represents the total revenue you should expect each month.
          </p>
        </div>

        {/* Regular Classes Income */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Regular Classes ({data.classes.length})
            <span className="ml-auto font-bold text-blue-600">{income.classIncome.toFixed(2)} DH/mo</span>
          </h3>
          <div className="space-y-2">
            {data.classes.map((cls) => {
              const revenue = cls.fees * cls.studentIds.length;
              const teacher = data.teachers.find(t => t.id === cls.teacherId);
              return (
                <div key={cls.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">{cls.subject}</div>
                    <div className="text-xs text-blue-600">
                      {cls.studentIds.length} students × {cls.fees} DH
                      {teacher && <span className="ml-2">• {teacher.name}</span>}
            </div>
            </div>
                  <div className="font-bold text-blue-700">{revenue.toFixed(2)} DH/mo</div>
            </div>
              );
            })}
            {data.classes.length === 0 && (
              <p className="text-gray-500 text-sm italic">No regular classes yet</p>
            )}
          </div>
        </div>

        {/* Marketing Classes Income */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Marketing/Special Classes ({data.marketingClasses.length})
            <span className="ml-auto font-bold text-emerald-600">{income.marketingIncome.toFixed(2)} DH/mo</span>
          </h3>
          <div className="space-y-2">
            {data.marketingClasses.map((cls) => {
              const revenue = cls.fees * cls.studentIds.length;
              return (
                <div key={cls.id} className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex-1">
                    <div className="font-medium text-emerald-900">{cls.name}</div>
                    <div className="text-xs text-emerald-600">
                      {cls.studentIds.length} students × {cls.fees} DH
            </div>
            </div>
                  <div className="font-bold text-emerald-700">{revenue.toFixed(2)} DH/mo</div>
            </div>
              );
            })}
            {data.marketingClasses.length === 0 && (
              <p className="text-gray-500 text-sm italic">No marketing classes yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        open={showAddExpenseModal}
        onClose={() => {
          setShowAddExpenseModal(false);
          resetExpense();
        }}
        title="Add Custom Expense"
      >
        <form onSubmit={handleExpenseSubmit(onSubmitExpense)} className="space-y-4">
          <div>
            <Input
              label="Category *"
              placeholder="e.g., Electricity, Office Supplies, Equipment"
              {...registerExpense("category")}
            />
            {expenseErrors.category && (
              <p className="text-sm text-red-600 mt-1">{expenseErrors.category.message}</p>
            )}
          </div>

          <div>
            <Input
              label="Amount (DH) *"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...registerExpense("amount", { valueAsNumber: true })}
            />
            {expenseErrors.amount && (
              <p className="text-sm text-red-600 mt-1">{expenseErrors.amount.message}</p>
            )}
        </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">Description *</label>
            <textarea
              className="input-field w-full min-h-[100px] mt-1"
              placeholder="Provide details about this expense..."
              {...registerExpense("description")}
            />
            {expenseErrors.description && (
              <p className="text-sm text-red-600 mt-1">{expenseErrors.description.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium block mb-2">Expense Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300">
                <input
                  type="radio"
                  value="monthly"
                  {...registerExpense("type")}
                  className="sr-only peer"
                />
                <div className="flex-1 peer-checked:text-blue-700">
                  <div className="font-medium flex items-center gap-2">
                    <span className="text-lg">🔄</span>
                    Monthly
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Recurring every month</div>
                </div>
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-0 peer-checked:opacity-100 pointer-events-none"></div>
              </label>
              
              <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300">
                <input
                  type="radio"
                  value="one-time"
                  {...registerExpense("type")}
                  className="sr-only peer"
                />
                <div className="flex-1 peer-checked:text-blue-700">
                  <div className="font-medium flex items-center gap-2">
                    <span className="text-lg">📌</span>
                    One-time
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Single purchase</div>
                </div>
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-0 peer-checked:opacity-100 pointer-events-none"></div>
              </label>
            </div>
            {expenseErrors.type && (
              <p className="text-sm text-red-600 mt-1">{expenseErrors.type.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowAddExpenseModal(false);
                resetExpense();
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
