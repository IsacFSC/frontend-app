'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaSignInAlt } from 'react-icons/fa';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, error, clearError } = useAuth();
  const searchParams = useSearchParams();
  const redirectMessage = searchParams.get('message');

  const messages: { [key: string]: string } = {
    login_required: 'Por favor, faça login para acessar esta página.',
    // Add other messages here if needed
  };

  useEffect(() => {
    if (error) {
      toast.error(error, { position: 'top-center' });
    }
  }, [error]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await signIn({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-md w-full bg-blue-950 p-6 md:p-8 rounded-xl shadow-blue-800 shadow-lg transform transition-all scale-105">
        <h2 className="text-3xl md:text-4xl font-bold font-sans text-center text-gray-050 mb-8">Entre com o seu login</h2>
        <form onSubmit={handleSubmit}>
          {redirectMessage && messages[redirectMessage] && (
            <div className="bg-gray-950 border border-gray-950 text-gray-200 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{messages[redirectMessage]}</span>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-100 text-sm font-bold mb-2">
              Endereço de Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-200 text-gray-800 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-100 text-sm font-bold mb-2">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-200 text-gray-800 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-sky-800 hover:bg-sky-900 text-gray-100 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full flex items-center justify-center"
            >
              <FaSignInAlt className="mr-2" /> Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}