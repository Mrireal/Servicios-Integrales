import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-900">
      <div className="flex flex-col items-center mb-8">
        <img 
          src="https://lh3.googleusercontent.com/pw/AP1GczMhXzcJpf2OZViNSwr5Ha6gx4e0GsahLMuI5IZq2ag99k0nXqMMU3oAROsSDA9srszqkDAPj8j9Xh4xNDmP4VnTnNLOnDF9fu5QDgULSe9awKaFe4glI7Hr1K1As4fnWDrqWG-O_KKOaZWbtQ3zq7sE=w936-h936-s-no-gm?authuser=0"
          alt="Servicios Integrales"
          className="w-24 h-24 mb-4 rounded-full"
        />
        <h1 className="text-3xl font-bold text-white mb-2">Servicios Integrales</h1>
        <div className="h-1 w-32 bg-emerald-500 rounded"></div>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold text-center text-emerald-900 mb-6">
          Inicio de Sesión
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-emerald-600" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Correo electrónico"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-emerald-600" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 w-full p-2 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Contraseña"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-800 text-white py-2 rounded hover:bg-emerald-900 transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}