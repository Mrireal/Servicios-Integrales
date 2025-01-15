import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, SkipBack, ArrowRight, X, Save, DollarSign, StickyNote } from 'lucide-react';
import MonthSummary from './MonthSummary';

interface ServiceEvent {
  id: string;
  client_name: string;
  description: string;
  amount: number;
  service_date: string;
  location: string;
  notes?: string;
  is_paid: boolean;
}

interface NoteModalProps {
  event: ServiceEvent;
  onClose: () => void;
  onSave: (id: string, notes: string, is_paid: boolean) => Promise<void>;
}

function NoteModal({ event, onClose, onSave }: NoteModalProps) {
  const [notes, setNotes] = useState(event.notes || '');
  const [isPaid, setIsPaid] = useState(event.is_paid);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(event.id, notes, isPaid);
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-emerald-900">
            Detalles del Servicio
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Cliente</p>
          <p className="font-medium">{event.client_name}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Descripción</p>
          <p className="font-medium">{event.description}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Monto</p>
          <p className="font-medium flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            {event.amount.toLocaleString()}
          </p>
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <span className="text-sm text-gray-600">Estado de Pago</span>
            <div 
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPaid ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
              onClick={() => setIsPaid(!isPaid)}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPaid ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
            <span className={`text-sm font-medium ${isPaid ? 'text-emerald-600' : 'text-gray-500'}`}>
              {isPaid ? 'Pagado' : 'Pendiente'}
            </span>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={4}
            placeholder="Agregar notas..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ServiceEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [serviceIndex, setServiceIndex] = useState(0);
  const [allDates, setAllDates] = useState<Date[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ServiceEvent | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          description,
          amount,
          service_date,
          location,
          notes,
          is_paid,
          clients (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('service_date', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      const formattedEvents = data.map(event => ({
        id: event.id,
        client_name: event.clients.name,
        description: event.description,
        amount: event.amount,
        service_date: event.service_date,
        location: event.location,
        notes: event.notes,
        is_paid: event.is_paid || false
      }));

      setEvents(formattedEvents);
      
      const dates = [...new Set(formattedEvents.map(event => 
        new Date(event.service_date + 'T00:00:00').toISOString().split('T')[0]
      ))].map(dateStr => new Date(dateStr + 'T00:00:00'));
      setAllDates(dates);
      
      setLoading(false);
    };

    loadEvents();
  }, [user]);

  const handleSaveNotes = async (serviceId: string, notes: string, is_paid: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('services')
      .update({ notes, is_paid })
      .eq('id', serviceId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    setEvents(events.map(event => 
      event.id === serviceId ? { ...event, notes, is_paid } : event
    ));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const changeMonth = (increment: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  };

  const goToOldestService = () => {
    if (allDates.length > 0) {
      const oldestDate = allDates[0];
      setCurrentDate(oldestDate);
      setServiceIndex(0);
    }
  };

  const goToNextService = () => {
    if (serviceIndex < allDates.length - 1) {
      const nextDate = allDates[serviceIndex + 1];
      setCurrentDate(nextDate);
      setServiceIndex(serviceIndex + 1);
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (loading) return <div>Cargando calendario...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 text-emerald-600 hover:text-emerald-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-emerald-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 text-emerald-600 hover:text-emerald-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={goToOldestService}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
            >
              <SkipBack className="h-4 w-4" />
              <span>Primer Servicio</span>
            </button>
            <button
              onClick={goToNextService}
              disabled={serviceIndex >= allDates.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                serviceIndex >= allDates.length - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              <span>Siguiente Servicio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center font-semibold text-emerald-800 py-2">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-24 bg-gray-50 rounded" />;
            }

            const dayEvents = events.filter(event => {
              const eventDate = new Date(event.service_date + 'T00:00:00');
              return eventDate.toDateString() === day.toDateString();
            });

            return (
              <div
                key={day.toISOString()}
                className={`h-24 border border-emerald-100 rounded p-1 overflow-y-auto ${
                  dayEvents.length > 0 ? 'bg-emerald-50' : ''
                }`}
              >
                <div className="text-right text-sm text-gray-600">
                  {day.getDate()}
                </div>
                {dayEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left text-xs p-1 mb-1 rounded hover:bg-opacity-80 transition-colors relative ${
                      event.is_paid ? 'bg-emerald-200' : 'bg-red-200'
                    }`}
                    title={`${event.client_name} - ${event.description}\nMonto: $${event.amount}\nEstado: ${event.is_paid ? 'Pagado' : 'Pendiente'}${event.notes ? '\nNota: ' + event.notes : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate">{event.client_name}</span>
                      <div className="flex items-center gap-1">
                        {event.notes && (
                          <div className="relative">
                            <StickyNote className="h-3 w-3 text-gray-600" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                          </div>
                        )}
                        <DollarSign className={`h-3 w-3 ${event.is_paid ? 'text-emerald-700' : 'text-red-700'}`} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {selectedEvent && (
        <NoteModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSave={handleSaveNotes}
        />
      )}

      <MonthSummary events={events} currentDate={currentDate} />
    </div>
  );
}