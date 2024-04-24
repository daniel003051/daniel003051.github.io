---
title: 透過 Github Actions 部署至 Kintone
date: 2024-04-24
tag: Kintone
outline: deep
---

![](https://i.imgur.com/Z5fEdLw.jpeg)

--- 

# 透過 Github Actions 部署至 Kintone

在軟體開發中使用版本控制及自動部署，除了可以方便團隊協作外、也能減去手動部署的繁瑣步驟和時間。

因此這篇文章會使用 [@kintone/customize-uploader](https://www.npmjs.com/package/@kintone/customize-uploader) 以及 `Github Actions` 來達成 git push 後自動部署至 Kintone 的功能，接下來的範例會以 [Vite](https://vitejs.dev/) 作為示範。

## 建立 Vite 環境

根據官網的教學，在終端機輸入下列指令後建立專案：

::: code-group

```shell [NPM]
$ npm create vite@latest
```

```shell [Yarn]
$ yarn create vite
```

```shell [PNPM]
$ pnpm create vite
```
:::

之後會需要選擇要使用的 Framework、是否需要 TypeScript 等，這部分依照個人需求設定。我選擇的是 Vue + Typescript。

![](https://i.imgur.com/yVDVThK.png)

完成之後用編輯器開啟專案，我這邊使用 [Visual Studio Code](https://code.visualstudio.com/)。

![](https://i.imgur.com/dStsFRt.png)

## 新增 manifest.json

根據 [kintone-customize-uploader 的 Github](https://github.com/kintone/js-sdk/tree/master/packages/customize-uploader) 上說明，我們會需要一個 `manifest.json` 的檔案，裡面記載 app id、上傳的檔案路徑等資訊：

```json
// manifest.json 範例
{
  "app": "1",
  "scope": "ALL",
  "desktop": {
    "js": [
      "https://js.cybozu.com/jquery/3.3.1/jquery.min.js",
      "sample/customize.js"
    ],
    "css": ["sample/51-modern-default.css"]
  },
  "mobile": {
    "js": ["https://js.cybozu.com/jquery/3.3.1/jquery.min.js"]
  }
}
```

接著只要知道 build 出來的檔案在哪裡就可以，所以回到 `vite.config.ts` 這隻檔案內稍微修改下：

```ts
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2021',
    rollupOptions: {
      input: {
        desktop: 'src/main.ts'
      },
      output: {
        format: 'iife',
        entryFileNames: 'app.js'
      }
    }
  }
})
```

之後如果下指令 `npm run build` 就會看到編譯後的 `app.js` 出現在 `dist` 資料夾，到這裡我們就在根目錄建立 `manifest.json`，並且修改一下路徑：

::: code-group
```json [manifest.json]
{
  "app": "42",
  "scope": "ALL",
  "desktop": {
    "js": ["dist/app.js"],  // [!code ++]
    "css": []
  },
  "mobile": {
    "js": [],
    "css": []
  }
}
```
:::

> [!IMPORTANT]
> 記得要修改 app 的 id

## 稍微修改 main.ts

為了讓等等部署完後確認畫面上有沒有順利掛載 Vue，稍微改一下 `main.ts`：

```js
// main.ts

import { createApp } from 'vue'
import App from './App.vue'

kintone.events.on('app.record.index.show', (event: KintoneEvent) => {
  const element = kintone.app.getHeaderMenuSpaceElement()!
  createApp(App).mount(element)
  return event
})
```

順便 npm 安裝 `@kintone/dts-gen` 並在 tsconfig 增加以下，避免報錯：

```json
  },
  "files": ["./node_modules/@kintone/dts-gen/kintone.d.ts"], // [!code ++]
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 設定 Github Actions

接著將專案推到 Github 上後，進去這個 repo 後點選上方的選單的 Settings、點選左邊選單的 Secrets and variables > Actions > 綠色按鈕的 New repository secret。

![](https://i.imgur.com/Pfhuk7b.png)

接著輸入 `KINTONE_BASE_URL`、`KINTONE_USERNAME`、`KINTONE_PASSWORD` 三個變數。

![](https://i.imgur.com/kJBQoOB.png)

完成後點選上方選單的 Actions，點擊 set up a workflow yourself，並貼上下面的程式碼：

> 也可以選擇直接將此檔案寫到開發資料夾的 `.github/workflows/main.yml`

```yml
name: Deploy to Kintone
on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 20

      - name: Install Kintone uploader
        run: npm install -g @kintone/customize-uploader

      - name: Build files
        run: npm install && npm run build
    
      - name: Execute Kintone Deployment
        run: |
          kintone-customize-uploader --base-url ${{ secrets.KINTONE_BASE_URL }} --username ${{ secrets.KINTONE_USERNAME }} --password ${{ secrets.KINTONE_PASSWORD }} manifest.json
```

接著按下右上角的 Commit Changes... 後，回到 Actions 就可以看到部署的狀況了。

![](https://i.imgur.com/Rfw8jGr.png)

成功部署的話會出現綠色勾勾，這時候如果回到 Kintone 裡面看的話，就可以看到剛剛開發的內容了。記得 CSS 要改一下，不然會跑版。

![](https://i.imgur.com/6uHk5qZ.png)

這邊我也提供了範例，是使用 Vite 加上 Vitest 單元測試整合 Github Action：[點此連結](https://github.com/daniel003051/vite-vanilla-kintone/tree/main)

## 注意事項

在 All workflows 可以看到每個 workflow 右邊所花費的時間，如果帳號是 GitHub Free 的話，每月只能使用 2,000 分鐘，不過部署一次不需要花太多時間，沒要幹嘛的話 2,000 分鐘應該綽綽有餘。

