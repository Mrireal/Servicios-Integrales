import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  phone: string;
}

export default function ServiceForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    location: '',
    amount: '',
    serviceDate: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingClients, setExistingClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isNewClient, setIsNewClient] = useState(true);

  useEffect(() => {
    if (user) {
      loadExistingClients();
    }
  }, [user]);

  const loadExistingClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone')
        .eq('user_id', user?.id);

      if (error) throw error;
      setExistingClients(data || []);
    } catch (err) {
      setError('Error al cargar los clientes existentes');
    }
  };

  const handleClientSelect = (clientId: string) => {
    const selectedClient = existingClients.find(client => client.id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientName: selectedClient.name,
        phone: selectedClient.phone || ''
      }));
      setSelectedClientId(clientId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let clientId = selectedClientId;

      if (isNewClient) {
        // Create new client
        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert([
            { 
              name: formData.clientName, 
              phone: formData.phone,
              user_id: user.id 
            }
          ])
          .select('id')
          .single();

        if (createError) throw createError;
        clientId = newClient.id;
      }

      // Create the service
      const { error: serviceError } = await supabase
        .from('services')
        .insert([
          {
            client_id: clientId,
            amount: parseFloat(formData.amount),
            service_date: formData.serviceDate,
            description: formData.description,
            location: formData.location,
            user_id: user.id
          }
        ]);

      if (serviceError) throw serviceError;

      setSuccess('Servicio registrado exitosamente');
      setFormData({
        clientName: '',
        phone: '',
        location: '',
        amount: '',
        serviceDate: '',
        description: ''
      });
      setSelectedClientId('');
      setError('');
      loadExistingClients(); // Reload clients list
    } catch (err) {
      setError('Error al registrar el servicio');
      setSuccess('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-emerald-900 mb-6">Registro de Servicio</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Cliente
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setIsNewClient(true)}
            className={`px-4 py-2 rounded ${
              isNewClient
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Nuevo Cliente
          </button>
          <button
            type="button"
            onClick={() => setIsNewClient(false)}
            className={`px-4 py-2 rounded ${
              !isNewClient
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Cliente Existente
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isNewClient ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Cliente
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Cliente
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Seleccione un cliente</option>
              {existingClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.phone}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lugar del Servicio
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor del Servicio
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Realización
          </label>
          <input
            type="date"
            value={formData.serviceDate}
            onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
            className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={3}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-800 text-white py-2 rounded hover:bg-emerald-900 transition-colors"
        >
          Registrar Servicio
        </button>
      </form>
    </div>
  );
}