---
layout: page
---
<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers
} from 'vitepress/theme'

const members = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/159210471?v=4',
    name: 'Daniel',
    title: '努力，不一定會成功；\n 但不努力，一定會很輕鬆。',
    links: [
      { icon: 'github', link: 'https://github.com/daniel003051' }
    ]
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/167491656?v=4',
    name: 'Kaya',
    title: '有夢最美，沒夢更好睡',
    links: [
      { icon: 'github', link: 'https://github.com/kaya-chiu' }
    ]
  }
]
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      關於作者
    </template>
    <template #lead>
      丹尼爾大師與他的小夥伴
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers
    :members="members"
  />
</VPTeamPage>

<style>
.about__link {
  color: #42a6ff;
}
</style>