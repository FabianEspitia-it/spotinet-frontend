/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Reverse proxy hacia la API (misma ruta relativa en el backend).
   * Las llamadas autenticadas deben ir preferiblemente por el BFF: `/api/upstream/...`
   * (añade `Authorization: Bearer` desde la cookie httpOnly del access token).
   */
  async rewrites() {
    const backend = process.env.BACKEND_API_URL;
    if (!backend) return [];
    const base = backend.replace(/\/$/, "");
    return [
      {
        source: "/reverse/:path*",
        destination: `${base}/:path*`,
      },
    ];
  },
};

export default nextConfig;
