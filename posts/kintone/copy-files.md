---
title: 在 kintone 應用程式間複製附件檔案
date: 2024-08-25
tag: kintone
outline: deep
---

![](https://i.imgur.com/mKxGl7n.png)

---

# 在 kintone 應用程式間複製附件檔案

在 kintone 中，如果想要把欄位資訊從一個應用程式帶入到另一個應用程式，可以利用原生功能的 LOOKUP 、動作按鈕，或是透過 REST API 的 GET 與 PUT/POST 來實現資料的連動。

但是『附件』要怎麼帶入呢？

## 無法直接複製的 value

如果之前有用過 REST API 來更新資料，你的下一句話會是：
> 「欸？把附件欄位的 value 直接更新到另一個附件欄位的 value 不行嗎？」

很遺憾，附件欄位會回答你：「但是我拒絕！」

...呃不是，你會得到類似以下的 error message，告訴你 fileKey 參數格式錯誤

```json
{
    "code": "GAIA_IF02",
    "id": "n7UwdnOBEbOzNg5fMV9E",
    "message": "fileKey參數（202408060523149C332CA6E63C490F86674811665FD294077）格式錯誤。"
}
```

如果你在這之前看到這篇文章，恭喜你不用踩這個雷了！<br>
接下來就會告訴大家要怎麼樣才能正確透過 API 複製附件欄位的檔案。

## 正確做法：下載再上傳

我們需要用到 [下載檔案](https://cybozu.dev/zh-tw/kintone/docs/rest-api/files/download-file/) 與 [上傳檔案](https://cybozu.dev/zh-tw/kintone/docs/rest-api/files/upload-file/) 這兩支 API，再搭配更新／新增記錄的 API（看你的用途選擇）。

這邊我們使用 [@kintone/rest-api-client](https://www.npmjs.com/package/@kintone/rest-api-client) 這個官方套件來操作 REST API，所以會用到的是 `client.file.downloadFile()` 與 `client.file.uploadFile()`，KintoneRestAPIClient 的基本操作跟細節請參考 [KintoneRestAPIClient 的官方文件](https://github.com/kintone/js-sdk/blob/main/packages/rest-api-client/docs/file.md)。

## 範例情境

![](https://i.imgur.com/QNa4m6W.gif)

* 客製化執行的應用程式：『合約書管理』
* 資料來源應用程式：『提案管理』
* 觸發條件：新增合約書管理記錄時並保存成功時
* 動作：根據「提案書編號」從『提案管理』將對應的提案資料附件複製到『合約書管理』的附件欄位

## 程式碼實作

為方便初學者理解，本次示範內容先不使用打包工具，所以透過 [CDN](https://cybozu.dev/ja/kintone/sdk/library/cybozu-cdn/#kintone-rest-api-client) 來引入 KintoneRestAPIClient。完成時，後台的 JavaScript 設定如下圖：

![](https://i.imgur.com/UEvSwVE.png)

記得 KintoneRestAPIClient 要引入在客製化程式碼之前。

你也可以使用 Vite、Rsbuild、Webpack 等打包工具，在 Node 環境下 import KintoneRestAPIClient。

### 起手式

首先，建立一個客製化 JS 檔 `customize.js`（名稱自可訂）

```js
function main() {
  'use strict'

  kintone.events.on('app.record.create.submit.success', async (event) => {
    try {
      // 這邊會執行一些非同步處理
  
      return event
    } catch (err) {
      console.error(err)
    }
  })
}

main()
```
1. 先用一個 function `main` 把執行內容包起來，並且最後執行這個程式。
2. 觸發的時機是 **新增記錄時並保存成功時** ，所以這邊用的 kintone event 是 `app.record.create.submit.success`。
3. 由於使用 API 存儲資料需要非同步處理，event handler 要加上 async。

### 初始化 Kintone Rest API 客戶端

在程式碼最上方，透過 `KintoneRestAPIClient` 來初始化一個新的客戶端物件，並配置 API Token：

```js
const req = new KintoneRestAPIClient({ // [!code ++]
  auth: { // [!code ++]
    apiToken: [ // [!code ++]
      '合約書管理 API TOKEN', // [!code ++]
      '提案管理 API TOKEN' // [!code ++]
    ] // [!code ++]
  } // [!code ++]
}) // [!code ++]

function main() {
  // (中略)
}

main()
```
由於需要從『提案管理』下載附件，並且在『合約書管理』更新資料，所以需要兩者的 API TOKEN。（也可以選擇使用擁有權限的帳號密碼驗證）

### 定義 `copyFiles` 非同步函式

`copyFiles` 函式是這段程式的核心，我們會在這個非同步函式中呼叫 REST API，它將從提案記錄中複製附件到合約記錄。

首先，先建立非同步函式 `copyFiles`。這裡分別會透過提案記錄和合約記錄的記錄號碼來（record id）來取得、更新資料，所以需要傳入 `contractId` 與 `proposalId` 這兩個參數。

```js
async function copyFiles(contractId, proposalId) {
  try {
    // 1. 先從來源記錄（提案管理）取得附件欄位值
    const proposalResp = await req.record.getRecord({
      app: '提案管理 APP Id',
      id: proposalId // 提案記錄號碼
    })
    const orginalFiles = proposalResp.record.提案資料.value // 附件欄位值（Array）

    // 2. 下載附件欄位中所有檔案，並上傳以取得新的 fileKeys
    const newFileKeys = await Promise.all(orginalFiles.map(async (file) => {
      // 2-1. 透過 download API 取得檔案二進制資料
      const binaryData = await req.file.downloadFile({ fileKey: file.fileKey })

      // 2-2. 將取得的檔案格式化
      const formatFile = {
        name: file.name,
        data: binaryData
      }

      // 2-3. 透過 upload API 重新上傳並取得新的 fileKey
      const uploadResp = await req.file.uploadFile({ file: formatFile })
      return uploadResp.fileKey
    }))

    // 3. 將新的 fileKeys 存入目標記錄（合約書管理）的附件欄位
    await req.record.updateRecord({
      app: '合約書管理 APP Id',
      id: contractId, // 合約書記錄號碼
      record: {
        提案資料: {
          value: newFileKeys.map(fileKey => ({ fileKey }))
        }
      }
    })

    window.alert('提案資料匯入成功！')

  } catch (err) {
    console.error('copyFiles:', err)
  }
}
```
1. 透過取得記錄的 API `KintoneRestAPIClient.record.getRecord()` 取得來源記錄（提案管理），並從記錄取得附件欄位的值。
2. 附件欄位值為一陣列，若有多個附件檔案時，則陣列內會有多個物件，故使用 Promise.All 處理。透過下載檔案的 API `KintoneRestAPIClient.file.downloadFile()` 取得檔案的二進制資料，並且將其格式化格式化，再透過上傳檔案的 API `KintoneRestAPIClient.file.uploadFile()` 重新上傳，取得一個新的 fileKey。
3. 使用更新記錄的 API `KintoneRestAPIClient.record.updateRecord()` ，將新的 filekeys 更新到目標記錄（合約書管理）的附件欄位中。

### 將功能寫入 kintone 事件處理

最後，將寫好的 `copyFiles` 函式放入 kintone event handler 內執行。
```js
const req = new KintoneRestAPIClient({
  auth: {
    apiToken: [
      '合約管理 API TOKEN',
      '提案管理 API TOKEN'
    ]
  }
})

async function copyFiles(contractId, proposalId) {
  // (中略)
}

function main() {
  'use strict'

  kintone.events.on('app.record.create.submit.success', async (event) => {
    try {
      const { record } = event // [!code ++]
      const contractId = record.合約記錄號碼.value // [!code ++]
      const proposalId = record.提案書編號.value // [!code ++]
      await copyFiles(contractId, proposalId) // [!code ++]
  
      return event

    } catch (err) {
      console.error(err)
    }
  })
}

main()
```
這樣就大功告成囉！以下是完整程式碼：

```js
const req = new KintoneRestAPIClient({
  auth: {
    apiToken: [
      '合約管理 API TOKEN',
      '提案管理 API TOKEN'
    ]
  }
})

async function copyFiles(contractId, proposalId) {
  try {
    // 1. 先從來源記錄（提案管理）取得附件欄位值
    const proposalResp = await req.record.getRecord({
      app: '提案管理 APP Id',
      id: proposalId
    })
    const orginalFiles = proposalResp.record.提案資料.value // 附件欄位值（Array）

    // 2. 下載附件欄位中所有檔案，並上傳以取得新的 fileKeys
    const newFileKeys = await Promise.all(orginalFiles.map(async (file) => {
      // 2-1. 透過 download API 取得檔案二進制資料
      const binaryData = await req.file.downloadFile({ fileKey: file.fileKey })

      // 2-2. 將取得的檔案格式化
      const formatFile = {
        name: file.name,
        data: binaryData
      }

      // 2-3. 透過 upload API 重新上傳並取得新的 fileKey
      const uploadResp = await req.file.uploadFile({ file: formatFile })
      return uploadResp.fileKey
    }))

    // 3. 將新的 fileKeys 存入目標記錄（合約管理）的附件欄位
    await req.record.updateRecord({
      app: '合約書管理 APP Id',
      id: contractId,
      record: {
        提案資料: {
          value: newFileKeys.map(fileKey => ({ fileKey }))
        }
      }
    })

    window.alert('提案資料匯入成功！')

  } catch (err) {
    console.error('copyFiles:', err)
  }
}

function main() {
  'use strict'

  kintone.events.on('app.record.create.submit.success', async (event) => {
    try {
      const { record } = event
      const contractId = record.合約記錄號碼.value
      const proposalId = record.提案書編號.value
  
      await copyFiles(contractId, proposalId)
  
      return event
  
    } catch (err) {
      console.error(err)
    }
  })
}

main()
```
