import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ClientSummary {
  id: string;
  name: string;
  phone: string;
  totalServices: number;
  totalAmount: number;
  services: Array<{
    service_date: string;
    description: string;
    amount: number;
    location: string;
  }>;
}

export default function ClientList() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totals, setTotals] = useState({
    totalAmount: 0,
    totalServices: 0
  });

  useEffect(() => {
    loadClients();
  }, [user]);

  useEffect(() => {
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const loadClients = async () => {
    if (!user) return;

    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          amount,
          service_date,
          description,
          location,
          client_id,
          clients (
            id,
            name,
            phone
          )
        `)
        .eq('user_id', user.id);

      if (servicesError) throw servicesError;

      const clientMap = new Map<string, ClientSummary>();
      let totalAmount = 0;
      let totalServices = 0;

      servicesData.forEach(service => {
        const clientId = service.clients.id;
        totalAmount += service.amount;
        totalServices += 1;

        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: clientId,
            name: service.clients.name,
            phone: service.clients.phone || '',
            totalServices: 0,
            totalAmount: 0,
            services: []
          });
        }

        const client = clientMap.get(clientId)!;
        client.totalServices += 1;
        client.totalAmount += service.amount;
        client.services.push({
          service_date: service.service_date,
          description: service.description,
          amount: service.amount,
          location: service.location
        });
      });

      setTotals({
        totalAmount,
        totalServices
      });
      const clientList = Array.from(clientMap.values());
      setClients(clientList);
      setFilteredClients(clientList);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los clientes');
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // First delete all services associated with this client
      const { error: servicesError } = await supabase
        .from('services')
        .delete()
        .eq('client_id', clientId);

      if (servicesError) throw servicesError;

      // Then delete the client
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (clientError) throw clientError;

      setClients(prevClients => prevClients.filter(client => client.id !== clientId));
      setSelectedClient(null);
      loadClients(); // Reload to update totals
    } catch (err) {
      setError('Error al eliminar el cliente');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (selectedClient) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-900">Detalles del Cliente</h2>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              Volver
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
              <div className="space-y-3">
                <p className="flex items-center gap-2">
                  <span className="font-medium">Nombre:</span>
                  {selectedClient.name}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Teléfono:</span>
                  {selectedClient.phone}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resumen</h3>
              <div className="space-y-3">
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Total Servicios:</span>
                  {selectedClient.totalServices}
                </p>
                <p className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Monto Total:</span>
                  ${selectedClient.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Historial de Servicios</h3>
            <div className="space-y-4">
              {selectedClient.services.map((service, index) => (
                <div key={index} className="bg-emerald-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Fecha:</span>
                        {service.service_date}
                      </p>
                      <p className="flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Ubicación:</span>
                        {service.location}
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">Monto:</span>
                        ${service.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3">
                    <span className="font-medium">Descripción:</span>
                    <br />
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-emerald-900 text-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Total Servicios</h3>
            <p className="text-3xl font-bold">{totals.totalServices}</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Monto Total</h3>
            <p className="text-3xl font-bold">${totals.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 p-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Client List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Detalle por Cliente</h2>
        
        <div className="space-y-4">
          {filteredClients.map(client => (
            <div key={client.id} className="border border-emerald-100 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-800">{client.name}</h3>
                  <p className="text-sm text-gray-600">{client.phone}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha del Servicio</p>
                  <p className="text-lg font-medium">
                    {client.services[client.services.length - 1]?.service_date}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monto Total</p>
                  <p className="text-lg font-medium">${client.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}