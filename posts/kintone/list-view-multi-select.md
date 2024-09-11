---
title: 客製化範例：在清單畫面選擇多筆記錄
date: 2024-09-11
tag: kintone
outline: deep
---

![](https://i.imgur.com/jt5ZYfI.png)

---

# 客製化範例：在清單畫面選擇多筆記錄

本篇文章介紹在 kintone 應用程式的一覽畫面中，選擇多筆記錄進行批次操作的一種做法。

利用一個 kintone 欄位作為放置核取方塊的位置，在一覽顯示畫面透過 `kintone.app.getFieldElements()` 這支 API 取得欄位元素，再將內容置換成核取方塊。 

這個方式的好處是，不用另外刻一個自訂一覽畫面，只需要將放置核取方塊用的欄位加入到清單中要顯示的欄位即可。當然，如果想要限制客製化套用的範圍，也可以利用一覽頁面 id 寫條件判斷，限定只在特定的一覽頁面才執行客製化的主要內容，不過本次文章就不針對此部分詳述了。

這次的教學只會使用到 JavaScript + CSS，是一個相對簡單範例，提供大家做參考。

## 前置作業：欄位建立

首先，我們要加入一個新的欄位，作為放置核取方塊的容器。

![](https://i.imgur.com/FHjYJ5I.png)

這裡加入了一個單行文字方塊，欄位代碼設定為「list_checkbox」

## 置換欄位元素

有了欄位之後，就可以在 `app.record.index.show` 事件中，透過 `kintone.app.getFieldElements()` 來取得欄位元素，將內容替換成自訂的 checkbox 元素。

```js
;(() => {
  'use strict'

  kintone.events.on('app.record.index.show', handler)

  function handler(event) {
    const { records } = event // 取得畫面上的 records 資料
    const checkboxCol = kintone.app.getFieldElements('list_checkbox') // 取得欄位元素

    // 遍歷每一個欄位元素，將自訂的元素替換進去
    checkboxCol.forEach((el, index) => {
      const checkboxWrapper = createElement('div', { className: 'cus-checkbox-wrapper' })
      const checkbox = createElement('input', {
        type: 'checkbox',
        value: records[index].$id.value,
        className: 'cus-checkbox'
      })
      
      checkboxWrapper.appendChild(checkbox)
      el.firstElementChild.innerHTML = '' // 清除內部元素（原本是 <span> ，用來顯示單行文字方塊的文字）
      el.firstElementChild.appendChild(checkboxWrapper) // 把自訂元素放進去
    })

    return event
  }

  // 用來建立網頁元素的 helper function
  function createElement(element, props) {
    const el = document.createElement(element)
    Object.keys(props).forEach(key => {
      el[key] = props[key]
    })
    return el
  }
})
```
**說明：**

- **重點**：將 checkbox 的 value 設定為對應的記錄 id，這樣之後就能透過記錄 id 來辨識被選擇的記錄。由於從 `event` 中取得的 `records` 陣列中，記錄的排序跟畫面呈現的順序相同，所以可以透過 index 取得對應的 record id。
- 在 checkbox 外層加上了一個 `<div>` ，是為了透過 CSS 讓 checkbox 保持置中。
- `createElement()` 是為了方便建立各種元素的 helper function，不一定要這樣寫。

## 獲取並暫存勾選的記錄 id

剛剛已經在每一個 checkbox 的 value 中設定了對應的記錄 id，接著要建立一個全域變數，用來暫存勾選的這些 id。

```js
let $CUS_SELECTED = [] // 宣告一個全域空陣列 // [!code ++]

;(() => {
  'use strict'

  kintone.events.on('app.record.index.show', handler)

  function handler(event) {
    const { records } = event
    const checkboxCol = kintone.app.getFieldElements('list_checkbox')

    // 產生每一列的 checkbox
    checkboxCol.forEach((el, index) => {
      const checkboxWrapper = createElement('div', { className: 'cus-checkbox-wrapper' })
      const checkbox = createElement('input', {
        type: 'checkbox',
        value: records[index].$id.value,
        className: 'cus-checkbox'
      })
      // 加上事件監聽器 // [!code ++]
      checkbox.addEventListener('change', e => { // [!code ++]
        const isChecked = e.target.checked // [!code ++]
        const value = e.target.value // [!code ++]
        setSelected(value, isChecked) // [!code ++]
      }) // [!code ++]
      checkboxWrapper.appendChild(checkbox)
      el.firstElementChild.innerHTML = ''
      el.firstElementChild.appendChild(checkboxWrapper)
    })

    return event
  }

  // ...(中略)

  // 加上一個 helper function 用來處理勾選與取消勾選的動作 // [!code ++]
  function setSelected(value, isChecked) { // [!code ++]
    if (isChecked && !$CUS_SELECTED.includes(value)) { // [!code ++]
      $CUS_SELECTED.push(value) // [!code ++]
    } else if (!isChecked && $CUS_SELECTED.includes(value)) { // [!code ++]
      const index = $CUS_SELECTED.indexOf(value) // [!code ++]
      $CUS_SELECTED.splice(index, 1) // [!code ++]
    } // [!code ++]
  } // [!code ++]
})
```
**說明：**
- **重點**：宣告一個全域的空陣列，用來儲存勾選值。記得要宣告在 IIFE 外面。由於是全域變數，要留意命名問題，避免衝突。
- 事件監聽器：監聽 checkbox 勾選狀態的變化，把 value 加入到宣告的陣列中，或從陣列中移除。這裡為了讓主程式碼更為易讀，將陣列數值的處理邏輯寫成另一個 helper function 獨立出來。

## 加入全選／取消全選＆動作按鈕

到目前為止，已經可以把勾選到的記錄 id 取出，接下來就是加入操作按鈕。本篇示範會製作一個「全選／取消全選」按鈕以及另一個動作按鈕（顯示目前勾選的值）。

### 建立按鈕元素

```js
// 「全選／取消全選」按鈕
const toggleButton = createElement('button', {
  innerText: 'Toggle All',
  type: 'button',
  id: 'cus-btn-toggle-all',
  className: 'cus-btn-secondary'
})

// 動作按鈕
const checkButton = createElement('button', {
  innerText: 'Check Selected',
  type: 'button',
  id: 'cus-btn-check-selected',
  className: 'cus-btn-primary'
})

// 用一個 div 包裝按鈕群組
const buttonGroup = createElement('div', {
  id: 'cus-btn-group-header',
  className: 'cus-btn-group'
})
```
運用一開始寫好的 helper function `createElement`，快速建立需要的元素。

這邊的動作按鈕到時候只有要簡單 console.log 被勾選的值，大家可依照實際需求去做一個或數個所需的按鈕。

### 將按鈕群組掛載到 kintone 畫面上

![](https://i.imgur.com/1u3x32l.png)

這裡選擇將按鈕群組放在「header space」這個區塊，也可以視需求放在其他地方。

```js
const headerSpace = kintone.app.getHeaderSpaceElement()

const existingButtonGroup = document.getElementById('cus-btn-group-header')
if (existingButtonGroup) {
  // 若 button group 已存在，移除舊的元素避免重複
  headerSpace.removeChild(existingButtonGroup)
}
buttonGroup.append(toggleButton, checkButton)
headerSpace.appendChild(buttonGroup)
```

這邊要留意的是，當我們進行切換一覽的每頁顯示數量、下一頁之類等，能使頁面上呈現的記錄數量、順序改變的動作，會重新觸發 `'app.record.index.show'` 事件，但畫面並不會整個刷新，如果沒有移除舊有的 button group，它就會一直增殖，所以要記得加入條件判斷去處理它。

### 加入事件監聽器：按鈕觸發動作

按鈕建立好後，就可以為各個按鈕加入點擊的事件監聽器，來進行你想要的動作。

```js
// 「全選／取消全選」按鈕動作
toggleButton.addEventListener('click', () => {
  const allCheckboxes = document.querySelectorAll('input.cus-checkbox')
  const allChecked = Array.from(allCheckboxes).every(checkbox => checkbox.checked)
  if (allChecked) {
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = false // 修改 checkbox 狀態
      checkbox.dispatchEvent(new Event('change')) // 手動觸發 change 事件
    })
  } else {
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change'))
    })
  }
})

// 確認目前勾選項目的動作按鈕
checkButton.addEventListener('click', () => {
  console.log('Selected:', $CUS_SELECTED)
})
```
這邊的「全選／取消全選」邏輯是，當畫面上所有記錄都被勾選時，點擊按鈕就會全部取消選取；反之，只要有還沒被勾選的項目，點擊按鈕就會全部選取。

透過修改 checkbox（input） 的 `checked` 屬性來變更勾選的狀態，不過要注意，用程式碼進行的變更並不會觸發 event listener 的監聽事件，所以要加上 `checkbox.dispatchEvent(new Event('change'))` 來主動觸發 change 事件，如此一來便會執行前面寫好的邏輯。

（這不是唯一或最好的寫法，只是提供給大家參考。）

至於動作按鈕，這邊只有簡單做一個能 console.log 選取值的按鈕，大家實際在撰寫時，可以先寫這個當做測試，之後再把內容換成其他想進行的動作。（例如透過 REST API 更新資料、推進流程...等等。）

## 確保選取值的正確性

加入按鈕的部分有提到，`'app.record.index.show'` 事件重新觸發時，畫面不一定會全部更新，也就是說我們用來儲存選取值的全域變數也不會隨之更新，這會導致選取的資料有誤。這邊處理的方式是，透過監聽 records 列表的 DOM 元素變化，若表格列的數目出現變化，就把選取值清空，來避免變數內留存上一個畫面的資料。

```js
const dataListGaia = document.getElementById('view-list-data-gaia') // 記錄表格的區塊元素

if (dataListGaia) {
  // 利用自定義的 checkbox 數量，記錄變動前的列數
  let previousCheckboxCount = document.querySelectorAll('input.cus-checkbox').length

  // 建立 MutationObserver
  const observer = new MutationObserver((mutations) => {
    // 變化時，計算 checkbox 數量
    const allCheckboxes = document.querySelectorAll('input.cus-checkbox')
    const currentCheckboxCount = allCheckboxes.length

    // 數量有變化時，就取消所有 checkbox 勾選狀態，並清空存取的陣列
    if (currentCheckboxCount !== previousCheckboxCount) {
      allCheckboxes.forEach(checkbox => checkbox.checked = false)
      $CUS_SELECTED = []
      previousCheckboxCount = currentCheckboxCount // 記錄變動後的列數（checkbox數）
    }
  })
  observer.observe(dataListGaia, { childList: true, subtree: true })
}
```

不論是切換頁數、切換每頁顯示數量、刪除紀錄、改變欄位資料排序升降順，表格的重新渲染都會伴隨記錄列數的變動，所以可以透過監聽這樣的變化來清空選取值。

到這邊就算大功告成囉！最下方附錄提供完整程式碼範例，以及範例所採用的 CSS 供大家參考。

## 附錄

### JavaScript 完整範例
<details>
  <summary>點擊展開完整範例</summary>

  ```js
  let $CUS_SELECTED = [] // Create a global variable to store selected values

  ;(() => {
    'use strict'

    kintone.events.on('app.record.index.show', handler)

    /* kintone event handler (main function) */
    function handler(event) {
      const { records } = event
      const headerSpace = kintone.app.getHeaderSpaceElement()
      const checkboxCol = kintone.app.getFieldElements('list_checkbox')

      if (!headerSpace || !checkboxCol) {
        console.warn('Failed to get header spcase element or checkbox field')
        return event
      }

      /* MutationObserver for monitoring row changes */
      const dataListGaia = document.getElementById('view-list-data-gaia')
      if (dataListGaia) {
        let previousCheckboxCount = document.querySelectorAll('input.cus-checkbox').length
        const observer = new MutationObserver((mutations) => {
          const allCheckboxes = document.querySelectorAll('input.cus-checkbox')
          const currentCheckboxCount = allCheckboxes.length
          if (currentCheckboxCount !== previousCheckboxCount) {
            allCheckboxes.forEach(checkbox => checkbox.checked = false)
            $CUS_SELECTED = []
            previousCheckboxCount = currentCheckboxCount
          }
        })
        observer.observe(dataListGaia, { childList: true, subtree: true })
      }
      
      /* Create checkbox for each row */
      checkboxCol.forEach((el, index) => {
        const checkboxWrapper = createElement('div', { className: 'cus-checkbox-wrapper' })
        const checkbox = createElement('input', {
          type: 'checkbox',
          value: records[index].$id.value,
          className: 'cus-checkbox'
        })
        checkbox.addEventListener('change', e => {
          const isChecked = e.target.checked
          const value = e.target.value
          setSelected(value, isChecked)
        })
        checkboxWrapper.appendChild(checkbox)
        el.firstElementChild.innerHTML = ''
        el.firstElementChild.appendChild(checkboxWrapper)
      })

      /* Create button group */
      const toggleButton = createElement('button', {
        innerText: 'Toggle All',
        type: 'button',
        id: 'cus-btn-toggle-all',
        className: 'cus-btn-secondary'
      })
      const checkButton = createElement('button', {
        innerText: 'Check Selected',
        type: 'button',
        id: 'cus-btn-check-selected',
        className: 'cus-btn-primary'
      })
      const buttonGroup = createElement('div', {
        id: 'cus-btn-group-header',
        className: 'cus-btn-group'
      })
  
      const existingButtonGroup = document.getElementById('cus-btn-group-header')
      if (existingButtonGroup) {
        // If the button group already exists, remove the old one to prevent duplication
        headerSpace.removeChild(existingButtonGroup)
      }
      buttonGroup.append(toggleButton, checkButton)
      headerSpace.appendChild(buttonGroup)

      /* Button actions */
      toggleButton.addEventListener('click', () => {
        const allCheckboxes = document.querySelectorAll('input.cus-checkbox')
        const allChecked = Array.from(allCheckboxes).every(checkbox => checkbox.checked)
        if (allChecked) {
          allCheckboxes.forEach(checkbox => {
            checkbox.checked = false
            checkbox.dispatchEvent(new Event('change'))
          })
        } else {
          allCheckboxes.forEach(checkbox => {
            checkbox.checked = true
            checkbox.dispatchEvent(new Event('change'))
          })
        }
      })
      checkButton.addEventListener('click', () => {
        console.log('Selected:', $CUS_SELECTED)
      })

      return event
    }

    /* ==================================
              Helper Functions
    ================================== */

    function createElement(element, props) {
      const el = document.createElement(element)
      Object.keys(props).forEach(key => {
        el[key] = props[key]
      })
      return el
    }

    function setSelected(value, isChecked) {
      if (isChecked && !$CUS_SELECTED.includes(value)) {
        $CUS_SELECTED.push(value)
      } else if (!isChecked && $CUS_SELECTED.includes(value)) {
        const index = $CUS_SELECTED.indexOf(value)
        $CUS_SELECTED.splice(index, 1)
      }
    }
  })();
  ```
</details>

### 範例 CSS
<details>
  <summary>點擊展開完整範例</summary>

  ```css
  /* Button Style - Primary */
  button.cus-btn-primary {
    display: inline-block;
    box-sizing: border-box;
    padding: 0 16px;
    min-width: 80px;
    height: 48px;
    outline: none;
    border: 1px solid #e3e7e8;
    background-color: #3498db;
    box-shadow: 1px 1px 1px #8ccbee inset;
    color: #fff;
    text-align: center;
    line-height: 48px;
  }
  button.cus-btn-primary:hover {
    background-color: #1d6fa5;
    cursor: pointer;
  }

  /* Button Style - Secondary */
  button.cus-btn-secondary {
    display: inline-block;
    box-sizing: border-box;
    padding: 0 16px;
    min-width: 80px;
    height: 48px;
    outline: none;
    border: 1px solid #e3e7e8;
    background-color: #f7f9fa;
    box-shadow: 1px 1px 1px #fff inset;
    color: #3498db;
    text-align: center;
    line-height: 48px;
  }
  button.cus-btn-secondary:hover {
    background-color: #c8d6dd;
    box-shadow: none;
    cursor: pointer;
  }

  /* Button Group Wrapper */
  .cus-btn-group {
    margin: 8px;
    display: flex;
    gap: 8px;
  }

  /* Checkbox Style */
  input.cus-checkbox {
    width: 1rem;
    height: 1rem;
  }

  .cus-checkbox-wrapper {
    display: flex;
    justify-content: center;
  }
  ``` 
</details>