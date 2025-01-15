import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Trash2, DollarSign, Calendar as CalendarIcon, CheckCircle2, XCircle } from 'lucide-react';

interface Expense {
  id: string;
  type: 'viatico' | 'consumo' | 'maquinaria' | 'reparaciones';
  amount: number;
  details: string;
  expense_date: string;
}

interface Income {
  id: string;
  amount: number;
  service_date: string;
  is_paid: boolean;
  description: string;
  client_name: string;
}

const expenseTypes = [
  { value: 'viatico', label: 'Viático' },
  { value: 'consumo', label: 'Consumo' },
  { value: 'maquinaria', label: 'Maquinaria' },
  { value: 'reparaciones', label: 'Reparaciones' }
];

export default function Finances() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'expenses' | 'incomes'>('expenses');

  const [formData, setFormData] = useState({
    type: 'viatico',
    amount: '',
    details: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      loadFinancialData();
    }
  }, [user, currentMonth]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Load expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .gte('expense_date', startOfMonth.toISOString())
        .lte('expense_date', endOfMonth.toISOString())
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      // Load incomes (services)
      const { data: incomesData, error: incomesError } = await supabase
        .from('services')
        .select(`
          id,
          amount,
          service_date,
          is_paid,
          description,
          clients (
            name
          )
        `)
        .eq('user_id', user?.id)
        .gte('service_date', startOfMonth.toISOString())
        .lte('service_date', endOfMonth.toISOString());

      if (incomesError) throw incomesError;

      setExpenses(expensesData);
      setIncomes(incomesData.map(income => ({
        id: income.id,
        amount: income.amount,
        service_date: income.service_date,
        is_paid: income.is_paid,
        description: income.description,
        client_name: income.clients.name
      })));
    } catch (err) {
      setError('Error al cargar los datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            type: formData.type,
            amount: parseFloat(formData.amount),
            details: formData.details,
            expense_date: formData.expense_date,
            user_id: user.id
          }
        ]);

      if (error) throw error;

      setFormData({
        type: 'viatico',
        amount: '',
        details: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      loadFinancialData();
    } catch (err) {
      setError('Error al registrar el egreso');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este egreso?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      loadFinancialData();
    } catch (err) {
      setError('Error al eliminar el egreso');
    }
  };

  const changeMonth = (increment: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  const totalIncome = incomes.reduce((sum, income) => sum + (income.is_paid ? income.amount : 0), 0);
  const pendingIncome = incomes.reduce((sum, income) => sum + (!income.is_paid ? income.amount : 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const balance = totalIncome - totalExpenses;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (loading) return <div>Cargando datos financieros...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      {/* Resumen Financiero */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-900">
            Resumen Financiero
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 text-emerald-600 hover:text-emerald-800"
            >
              ←
            </button>
            <span className="text-lg font-medium">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 text-emerald-600 hover:text-emerald-800"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-emerald-50 p-4 rounded-lg">
            <span className="text-emerald-800 font-semibold block mb-1">Ingresos Cobrados</span>
            <span className="text-2xl font-bold text-emerald-600">
              ${totalIncome.toLocaleString()}
            </span>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <span className="text-yellow-800 font-semibold block mb-1">Ingresos Pendientes</span>
            <span className="text-2xl font-bold text-yellow-600">
              ${pendingIncome.toLocaleString()}
            </span>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <span className="text-red-800 font-semibold block mb-1">Egresos</span>
            <span className="text-2xl font-bold text-red-600">
              ${totalExpenses.toLocaleString()}
            </span>
          </div>
          <div className={`p-4 rounded-lg ${
            balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'
          }`}>
            <span className={`font-semibold block mb-1 ${
              balance >= 0 ? 'text-emerald-800' : 'text-red-800'
            }`}>Balance</span>
            <span className={`text-2xl font-bold ${
              balance >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              ${balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 border-b-2 font-medium ${
              activeTab === 'expenses'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('expenses')}
          >
            Egresos
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium ${
              activeTab === 'incomes'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('incomes')}
          >
            Ingresos
          </button>
        </div>

        {activeTab === 'incomes' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50">
                  <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Fecha</th>
                  <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Cliente</th>
                  <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Descripción</th>
                  <th className="py-3 px-4 text-right text-emerald-800 font-semibold">Estado</th>
                  <th className="py-3 px-4 text-right text-emerald-800 font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map(income => (
                  <tr key={income.id} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-emerald-600" />
                        <span>{new Date(income.service_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{income.client_name}</td>
                    <td className="py-3 px-4">{income.description}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end items-center gap-2">
                        {income.is_paid ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-emerald-600">Cobrado</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-yellow-600">Pendiente</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className={`h-4 w-4 ${income.is_paid ? 'text-emerald-600' : 'text-yellow-600'}`} />
                        <span className="font-medium">{income.amount.toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-emerald-900">Registro de Egresos</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <PlusCircle className="h-5 w-5" />
                <span>Nuevo Egreso</span>
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="mb-8 bg-emerald-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Egreso
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      {expenseTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detalle
                  </label>
                  <textarea
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Fecha</th>
                    <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Tipo</th>
                    <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Detalle</th>
                    <th className="py-3 px-4 text-right text-emerald-800 font-semibold">Valor</th>
                    <th className="py-3 px-4 text-center text-emerald-800 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-emerald-600" />
                          <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {expenseTypes.find(t => t.value === expense.type)?.label}
                      </td>
                      <td className="py-3 px-4">{expense.details}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <DollarSign className="h-4 w-4 text-red-600" />
                          <span className="font-medium">{expense.amount.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}