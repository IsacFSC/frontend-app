'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaSignInAlt } from 'react-icons/fa';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, error } = useAuth();
  const searchParams = useSearchParams();
  const redirectMessage = searchParams ? searchParams.get('message') : null;

  const messages: { [key: string]: string } = {
    login_required: 'Por favor, faça login para acessar esta página.',
    // Add other messages here if needed
  };

  useEffect(() => {
    if (error) {
      toast.error(error, { position: 'top-center' });
    }
  }, [error]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    await signIn({ email, password });
    setIsSubmitting(false);
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
              className={`bg-sky-800 hover:bg-sky-900 text-gray-100 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full flex items-center justify-center ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-gray-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  <FaSignInAlt className="mr-2" /> Entrar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}