import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "My Awesome Project",
  description: "A VitePress Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Kintone',
        collapsed: false,
        items: [
          { text: '透過 Github Actions 部署至 Kintone', link: '/posts/kintone/action.md' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/daniel003051' }
    ]
  }
})
