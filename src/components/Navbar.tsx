import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, DollarSign, LogOut, PieChart } from 'lucide-react';
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
          <img 
            src="https://lh3.googleusercontent.com/pw/AP1GczMhXzcJpf2OZViNSwr5Ha6gx4e0GsahLMuI5IZq2ag99k0nXqMMU3oAROsSDA9srszqkDAPj8j9Xh4xNDmP4VnTnNLOnDF9fu5QDgULSe9awKaFe4glI7Hr1K1As4fnWDrqWG-O_KKOaZWbtQ3zq7sE=w936-h936-s-no-gm?authuser=0"
            alt="Servicios Integrales"
            className="w-10 h-10 rounded-full"
          />
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
            to="/finances" 
            className="flex items-center space-x-1 hover:text-emerald-200"
          >
            <PieChart className="h-5 w-5" />
            <span>Finanzas</span>
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