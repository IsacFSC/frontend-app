/** @type {import('next').NextConfig} */
const nextConfig = {
  // Outras configurações...
  typescript: {
    // !! WARN !!
    // Ignorar a verificação de tipo durante o build pode levar a problemas
    // em produção. Use esta opção com cautela.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
