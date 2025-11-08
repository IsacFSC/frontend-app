/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdfkit tem uma dependência opcional do 'canvas' que não é necessária no servidor.
    // Esta configuração garante que o webpack o ignore, resolvendo erros de
    // "ENOENT: no such file or directory" para as fontes padrão como Helvetica.
    config.externals.push('canvas');
    config.resolve.alias.canvas = false;
    return config;
  },
  // Enable proper URL handling for Vercel deployment
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;