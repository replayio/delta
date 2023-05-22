const { patchWebpackConfig } = require("next-global-css");

module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  webpack5: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false };

    // Allow CSS imported from `node_modules`, to work around an error
    // from importing `<Editor>` from `@redux-devtools/ui`
    patchWebpackConfig(config, { isServer });

    return config;
  },
};
