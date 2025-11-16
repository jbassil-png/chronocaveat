/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/chronocaveat' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/chronocaveat/' : '',
}

module.exports = nextConfig
