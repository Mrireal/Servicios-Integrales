import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, User, Calendar, DollarSign, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <nav className="bg-emerald-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold">Servicios Integrales</h1>
            <p className="text-sm text-emerald-200">Sistema Contable</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <Link 
            to="/calendar" 
            className="flex items-center space-x-1 hover:text-emerald-200"
          >
            <Calendar className="h-5 w-5" />
            <span>Calendario</span>
          </Link>
          <Link 
            to="/services" 
            className="flex items-center space-x-1 hover:text-emerald-200"
          >
            <DollarSign className="h-5 w-5" />
            <span>Registro de Servicios</span>
          </Link>
          <Link 
            to="/clients" 
            className="flex items-center space-x-1 hover:text-emerald-200"
          >
            <User className="h-5 w-5" />
            <span>Clientes</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-1 hover:text-emerald-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}