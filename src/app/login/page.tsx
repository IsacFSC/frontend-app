'use client';

import { signIn } from 'next-auth/react';
import { FaGithub } from 'react-icons/fa';

export default function LoginPage() {

  const handleSignIn = async () => {
    await signIn('github', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-md w-full bg-blue-950 p-6 md:p-8 rounded-xl shadow-blue-800 shadow-lg transform transition-all scale-105">
        <h2 className="text-3xl md:text-4xl font-bold font-sans text-center text-gray-50 mb-8">Acesse a plataforma</h2>
        <div className="flex items-center justify-between">
          <button
            onClick={handleSignIn}
            className={`bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full flex items-center justify-center`}
          >
            <FaGithub className="mr-3 h-6 w-6" /> Entrar com o GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
