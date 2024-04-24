---
layout: doc
---

<script setup>
import { data as posts } from './posts.data.js'
console.log(posts)
</script>

<h1>所有文章</h1>
<ul>
  <li v-for="post of posts" v-show="post.date">
    <p v-show="post.tag" class="tag">#{{ post.tag }}</p>
    <a :href="post.url">{{ post.title }}</a>  
    <p>（{{ (post.date)?.slice(0,10) }}）</p>
  </li>
</ul>

<style scoped>
li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

li > p {
  padding: 0;
  margin: 0;
}

.tag {
  display: inline-block;
  padding: 4px 8px;
  background-color: #fff9e2;
  color: #ff8000;
  font-size: 16px;
  border-radius: 4px;
  margin-right: 8px;
}

.dark .tag {
  background-color: #5b5b5b;
  color: #fff8f1;
}

</style>