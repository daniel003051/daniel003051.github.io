import { createContentLoader } from 'vitepress'

// export default createContentLoader('docs/posts/*.md', /* options */)

export default createContentLoader('posts/**/*.md', {
  transform: (rawData) => {
      return rawData.sort((a, b) => {
          return +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date)
      }).map(post => {
          return {
              title: post.frontmatter.title,
              url: post.url,
              date: post.frontmatter.date,
              tag: post.frontmatter.tag
          }
      })
  }
})