import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "廢文集散地",
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
