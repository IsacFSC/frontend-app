import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Isso informa ao Next.js qual é a raiz do seu projeto para o build.
    outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  },
};

export default nextConfig;