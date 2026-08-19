import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    output: 'standalone',
}

export default nextConfig
module.exports = {allowedDevOrigins: ['website.local'],} 


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: 'standalone',
// };

// module.exports = nextConfig;