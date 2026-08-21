/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['website.local'],
  // Produit un dossier .next/standalone auto-suffisant (server.js + deps
  // minimales), indispensable pour une image Docker de production légère.
  output: 'standalone',
}

export default nextConfig
