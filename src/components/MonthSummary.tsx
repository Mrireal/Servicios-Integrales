import React from 'react';
import { Calendar, DollarSign, MapPin } from 'lucide-react';

interface ServiceEvent {
  id: string;
  client_name: string;
  description: string;
  amount: number;
  service_date: string;
  location: string;
}

interface MonthSummaryProps {
  events: ServiceEvent[];
  currentDate: Date;
}

export default function MonthSummary({ events, currentDate }: MonthSummaryProps) {
  const monthEvents = events.filter(event => {
    const eventDate = new Date(event.service_date + 'T00:00:00');
    return eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear();
  });

  const totalAmount = monthEvents.reduce((sum, event) => sum + event.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-emerald-900 mb-6">Detalle del Mes</h3>
      
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
        <div className="bg-emerald-50 p-4 rounded-lg text-center">
          <span className="text-emerald-800 font-semibold block mb-1">Total Servicios</span>
          <span className="text-2xl font-bold text-emerald-600">{monthEvents.length}</span>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg text-center">
          <span className="text-emerald-800 font-semibold block mb-1">Monto Total</span>
          <span className="text-2xl font-bold text-emerald-600">${totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-emerald-50">
              <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Fecha</th>
              <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Cliente</th>
              <th className="py-3 px-4 text-left text-emerald-800 font-semibold">Ubicación</th>
              <th className="py-3 px-4 text-right text-emerald-800 font-semibold">Monto</th>
            </tr>
          </thead>
          <tbody>
            {monthEvents.map(event => {
              const eventDate = new Date(event.service_date + 'T00:00:00');
              return (
                <tr key={event.id} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span>{eventDate.toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-emerald-900">{event.client_name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span>{event.location}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">{event.amount.toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}