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
  }
]
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      關於作者
    </template>
    <template #lead>
      Hi，我是 Daniel。<br>
      我的自介到此結束，謝謝大家。
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