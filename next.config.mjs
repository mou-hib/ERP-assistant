/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Le pilote natif libsql (adaptateur Turso) ne doit pas être empaqueté
    // par webpack : il est chargé via require() natif à l'exécution.
    serverComponentsExternalPackages: [
      "@prisma/adapter-libsql",
      "@libsql/client",
      "libsql",
    ],
  },
};

export default nextConfig;
