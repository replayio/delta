module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
};
