import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "kintone台灣第一個家",
  description: "A VitePress Site",
  head: [
    ['link', { rel: "icon", type: "image/png", sizes: "16x16", href: "https://i.imgur.com/dNGjpDy.png"}],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'https://i.imgur.com/ZogyxWx.png',
    nav: [
      { text: '首頁', link: '/' },
      { text: '關於作者', link: '/posts/author/index' },
    ],
    footer: {
      message: '',
      copyright: 'Copyright © 2024 Daniel'
    },
    sidebar: [
      {
        text: 'kintone',
        collapsed: false,
        items: [
          { text: '透過 Github Actions 部署至 kintone', link: '/posts/kintone/action.md' },
          { text: '發送 request 至 kintone 時的身份驗證', link: '/posts/kintone/request.md' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/daniel003051' }
    ],
    search: {
      provider: 'local'
    }
  }
})
