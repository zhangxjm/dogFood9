/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: [
    'antd',
    '@ant-design/icons',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-input-number',
    'rc-select',
    'rc-tree',
    'rc-table',
    'rc-form',
    'rc-notification',
    'rc-dialog',
    'rc-dropdown',
    'rc-menu',
    'rc-tooltip',
    'rc-tabs',
    'rc-collapse',
    'rc-checkbox',
    'rc-radio',
    'rc-switch',
    'rc-slider',
    'rc-upload',
    'rc-progress',
    'rc-rate',
    'rc-badge',
    'rc-tag',
    'rc-timeline',
    'rc-calendar',
    'rc-cascader',
    'rc-segmented',
    'rc-virtual-list',
    'rc-resize-observer',
    'rc-motion',
    'rc-trigger',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
