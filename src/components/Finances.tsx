import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, Calendar, DollarSign } from 'lucide-react';

interface ServiceSummary {
  totalPaid: number;
  totalPending: number;
  totalExpenses: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status?: 'paid' | 'pending';
  client_name?: string;
}

export default function Finances() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [summary, setSummary] = useState<ServiceSummary>({
    totalPaid: 0,
    totalPending: 0,
    totalExpenses: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    loadMonthData();
  }, [currentMonth, user]);

  const loadMonthData = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    try {
      // Fetch services for the month
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          amount,
          is_paid,
          service_date,
          description,
          clients (
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('service_date', startOfMonth.toISOString().split('T')[0])
        .lte('service_date', endOfMonth.toISOString().split('T')[0]);

      if (servicesError) throw servicesError;

      // Fetch expenses for the month
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id, amount, expense_date, type, details')
        .eq('user_id', user.id)
        .gte('expense_date', startOfMonth.toISOString().split('T')[0])
        .lte('expense_date', endOfMonth.toISOString().split('T')[0]);

      if (expensesError) throw expensesError;

      // Transform services into transactions
      const serviceTransactions: Transaction[] = services?.map(service => ({
        id: service.id,
        date: service.service_date,
        description: service.description,
        amount: service.amount,
        type: 'income',
        status: service.is_paid ? 'paid' : 'pending',
        client_name: service.clients?.name
      })) || [];

      // Transform expenses into transactions
      const expenseTransactions: Transaction[] = expenses?.map(expense => ({
        id: expense.id,
        date: expense.expense_date,
        description: `${expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}: ${expense.details}`,
        amount: expense.amount,
        type: 'expense',
        status: 'paid'
      })) || [];

      // Combine and sort all transactions by date
      const allTransactions = [...serviceTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);

      // Calculate totals
      const totalPaid = serviceTransactions.reduce((sum, transaction) => 
        transaction.status === 'paid' ? sum + transaction.amount : sum, 0);
      
      const totalPending = serviceTransactions.reduce((sum, transaction) => 
        transaction.status === 'pending' ? sum + transaction.amount : sum, 0);

      const totalExpenses = expenseTransactions.reduce((sum, transaction) => 
        sum + transaction.amount, 0);

      setSummary({
        totalPaid,
        totalPending,
        totalExpenses
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading financial data:', error);
      setLoading(false);
    }
  };

  const changeMonth = (increment: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  const jumpToMonth = () => {
    const year = parseInt(prompt('Ingrese el año (YYYY):', currentMonth.getFullYear().toString()) || currentMonth.getFullYear().toString());
    const month = parseInt(prompt('Ingrese el mes (1-12):', (currentMonth.getMonth() + 1).toString()) || (currentMonth.getMonth() + 1).toString());
    
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };

  if (loading) {
    return <div>Cargando datos financieros...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-900">Resumen Financiero</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 text-emerald-600 hover:text-emerald-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={jumpToMonth}
              className="text-lg font-medium hover:text-emerald-600 transition-colors flex items-center gap-2"
            >
              <Calendar className="h-5 w-5" />
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 text-emerald-600 hover:text-emerald-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-emerald-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">
              Ingresos Cobrados
            </h3>
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-emerald-600 mr-2" />
              <span className="text-2xl font-bold text-emerald-600">
                ${summary.totalPaid.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Ingresos Pendientes
            </h3>
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-yellow-600 mr-2" />
              <span className="text-2xl font-bold text-yellow-600">
                ${summary.totalPending.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Egresos
            </h3>
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-red-600 mr-2" />
              <span className="text-2xl font-bold text-red-600">
                ${summary.totalExpenses.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Balance
            </h3>
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-blue-600">
                ${(summary.totalPaid - summary.totalExpenses).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-emerald-900 mb-4">
          Detalle de Movimientos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-emerald-50">
                <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Fecha</th>
                <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Descripción</th>
                <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Cliente</th>
                <th className="py-3 px-4 text-right text-emerald-800 font-semibold">Estado</th>
                <th className="py-3 px-4 text-right text-emerald-800 font-semibold">Monto</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                  <td className="py-3 px-4">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {transaction.description}
                  </td>
                  <td className="py-3 px-4">
                    {transaction.client_name || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {transaction.type === 'expense' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Egreso
                      </span>
                    ) : transaction.status === 'paid' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Pagado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${
                    transaction.type === 'expense' 
                      ? 'text-red-600' 
                      : transaction.status === 'paid'
                        ? 'text-emerald-600'
                        : 'text-yellow-600'
                  }`}>
                    ${transaction.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}