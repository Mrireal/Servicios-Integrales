import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, SkipBack, ArrowRight } from 'lucide-react';
import MonthSummary from './MonthSummary';

interface ServiceEvent {
  id: string;
  client_name: string;
  description: string;
  amount: number;
  service_date: string;
  location: string;
}

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ServiceEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [serviceIndex, setServiceIndex] = useState(0);
  const [allDates, setAllDates] = useState<Date[]>([]);

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
        location: event.location
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
        {/* Navigation Controls */}
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
                  <div
                    key={event.id}
                    className="text-xs p-1 mb-1 bg-emerald-100 rounded"
                    title={`${event.client_name} - ${event.description}\nMonto: $${event.amount}`}
                  >
                    {event.client_name}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary Table */}
      <MonthSummary events={events} currentDate={currentDate} />
    </div>
  );
}