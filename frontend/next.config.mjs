/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['frontend-dev.local'],
  // Produit un dossier .next/standalone auto-suffisant (server.js + deps
  // minimales), indispensable pour une image Docker de production légère.
  output: 'standalone',
}

export default nextConfig
