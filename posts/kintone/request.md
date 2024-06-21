---
title: 發送 request 至 kintone 時的身份驗證
date: 2024-06-20
tag: Kintone
outline: deep
---

![](https://i.imgur.com/om78cGW.jpeg)

---

# 發送 request 至 kintone 時的身份驗證

發送請求至 kintone 獲取資料時，會在 header 中帶上 API token、或者是帳號密碼，兩種的帶法會不太一樣，順便提一下如果公司內有使用 Secure Access 服務的話應該如何處理。

## 透過帳號密碼

如果是使用帳號密碼來發送請求，需要將帳號密碼轉成 base64 的格式，並且放在 header 中，做法如下：

1. 將 `帳號:密碼` 轉成 base64。
2. 在 header 中新增 `X-Cybozu-Authorization` 並帶上剛剛轉好的 value。

所以如果帳號密碼分別是: `daniel` 以及 `a123456789` 的話，發送請求時就需要帶上：

```javascript=
{
  "X-Cybozu-Authorization": ZGFuaWVsOmExMjM0NTY3ODk=
}
```

## 透過 API TOKEN

使用應用程式內發行的 token，需要先到應用程式後台中的 `設定 > API 權杖` 中產生。

![](https://i.imgur.com/MOuwUcx.png)

接著將產生出來的值放到 header 中，key 要打上 `X-Cybozu-API-Token`。

```javascript=
{
  "X-Cybozu-API-Token": "BuBNIwbRRaUvr33nWhaFsJxN0xH4NPN92"
}
```

## 關於 Secure Access

因為 [Secure Access](https://jp.cybozu.help/general/zh-tw/admin/list_security/list_access/secureaccess.html) 會需要帶上憑證以及密碼才能發送請求，否則會被擋下來，所以在發請求的時候必須附上 `.pfx` 憑證，憑證可以在 kintone 中的 `帳號設定 > 透過行動用戶端存取` 找到。

有了憑證後我們試著用 [Postman](https://www.postman.com/) 以及在 Node 環境中搭配 axios 發送請求。

### Postman 

安裝好開啟後，點選右上角的 `齒輪 > setting > Certificates` 按下 `Add Certificate...` 後就會出現以下畫面：

![](https://i.imgur.com/dCIECrh.png)

輸入 `Host`、`pfx`、`passphrase` 之後，往後發送請求至這個 domain 的話，都會帶上這個憑證，如此一來就設定完成了。

### Node（axios）

接著在 Node 環境中安裝 aioxs 並發送請求。
使用 `new https.Agent` 帶上 `pfx` 以及 `passphrase` 即可。

```javascript=
const fs = require("fs")
const axios = require("axios")
const https = require("https")

(async function () {
  try {
    const response = await axios.request({
      url: "https://test.s.cybozu.com/k/v1/record.json?app=29064&id=516",
      method: "get",
      headers: {
        "X-Cybozu-Authorization": "xxxxxx",
      },
      httpsAgent: new https.Agent({
        pfx: fs.readFileSync(__dirname + "/xxxxxx.pfx"),
        passphrase: "xxxxxxxx",
      }),
    })
    console.log(response.data)
  } catch (error) {
    console.log(error)
  }
})()
```


以上就是請求時身份驗證的方式，如果你是用 Javscript 串接的話，也可以嘗試使用官方開發的套件 [@kintone/rest-api-client](https://www.npmjs.com/package/@kintone/rest-api-client)，這個套件是基於 axios，官方也整合了帶上帳號密碼或 token 的方式在裡面，也可以選擇攜帶 pfx 。