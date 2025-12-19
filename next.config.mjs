import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
})

export default withNextra({
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // 添加缓存控制，确保文档更新能及时生效
  async headers() {
    return [
      {
        source: '/docs/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  // 重写 admin 配置文件路径到 API 路由
  async rewrites() {
    return [
      {
        source: '/admin/config.yml',
        destination: '/api/admin/config',
      },
      {
        source: '/admin/config.local.yml',
        destination: '/api/admin/config',
      },
      // 也处理直接请求 /config.yml 的情况
      {
        source: '/config.yml',
        destination: '/api/admin/config',
      },
    ];
  },
})
