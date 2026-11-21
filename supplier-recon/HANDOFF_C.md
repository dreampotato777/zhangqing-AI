# HANDOFF_C · 账清AI「页面与报告」模块交接说明

> 面向集成发布同学。本文所有路径、签名和降级行为均已按当前代码核对。
> 项目根目录：`c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon`

---

## 1. 需要合并的文件清单

### 必须带上（缺一不可）

| 文件 | 作用 |
|---|---|
| `src/ui/mountReport.js` | 模块入口，导出 `mountReport` / `updateReport`，内部引入 `report.css` |
| `src/ui/dashboard.js` | 统计看板与类型分布条 |
| `src/ui/summaryCard.js` | 规则摘要卡 |
| `src/ui/filterBar.js` | 类型芯片、供应商、关键词、排序 |
| `src/ui/exceptionList.js` | 异常列表与空结果状态 |
| `src/ui/detailComparison.js` | 左右两侧原始记录对比、差异高亮 |
| `src/ui/stateView.js` | 无异常 / 无结果 / 数据错误状态页 |
| `src/ui/format.js` | 金额、百分比、转义、类型标签等展示工具 |
| `src/ui/constants.js` | 异常类型顺序、颜色令牌引用、内联 SVG 图标 |
| `src/styles/report.css` | 全部样式与 `:root` 设计令牌 |
| `src/report/adapter.js` | B 输出 → 页面数据结构的唯一转换层 |
| `src/report/summary.js` | `buildSummary` 规则摘要 + 差异说明兜底 |
| `src/report/exportCsv.js` | `buildDiffCsv` / `downloadCsv` |

完整绝对路径：

```text
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\ui\mountReport.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\ui\dashboard.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\ui\summaryCard.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\ui\filterBar.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\ui\exceptionList.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\ui\detailComparison.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\ui\stateView.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\ui\format.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\ui\constants.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\styles\report.css
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\report\adapter.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\report\summary.js
c:\Users\ASUS\Desktop\zhangqing-AI\supplier-recon\src\report\exportCsv.js
```

### 按需带上

| 文件 | 说明 |
|---|---|
| `src/mock/mockResult.js` | 纯模拟数据，供预览页和演示使用。接真实数据后可删除；删除前确认没有引用。 |
| `report-preview.html` | 独立预览页，**集成时可不要**。它只负责加载 mock 并调用 `mountReport`。 |
| `vite.config.js` | 本次新增的多页面构建配置。若保留 `report-preview.html` 必须带上；若不保留，可去掉其中的 `report-preview` 入口，但**不要覆盖**你们已有的 Vite 配置，只合并 `build.rollupOptions.input`。 |

### 明确未改动

以下文件本次没有修改，不要覆盖他人版本：

- `index.html`
- `package.json`
- `src/csv.js`
- `src/reconcile.js`
- `src/data/*`
- `assets/*`
- `tests/*`

---

## 2. 对外接口

从 **`src/ui/mountReport.js`** 导入：

```js
import { mountReport, updateReport } from "./ui/mountReport.js";
```

### 2.1 `mountReport(rootEl, { result, source } = {})`

首次挂载。会清空 `rootEl` 内容并渲染完整报告页。

| 参数 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `rootEl` | `Element` | 是 | 挂载根节点。必须是真实 DOM 元素（`nodeType === 1`），否则抛错。 |
| `result` | `object` | 是 | 页面数据结构，或 B 的 `reconcile` 完整输出；内部由 `adaptResult` 自动识别。 |
| `source` | `object` | 否 | 顶栏数据来源信息，见 2.3。省略时视为模拟数据。 |

- 返回值：`undefined`。
- 重复调用会中止上一轮事件监听并整体重渲染。
- 模块内是单例会话：**一个页面只支持一个报告实例**。

### 2.2 `updateReport({ result, source } = {})`

载入新数据后整体刷新。必须先成功调用过 `mountReport`，否则抛错：
`请先调用 mountReport 完成首次渲染`。

| 参数 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `result` | `object` | 是 | 新的对账结果，规则同 `mountReport`。 |
| `source` | `object` | 否 | 不传则沿用上次的 `source`。 |

行为：重置全部筛选条件、重新排序、自动选中第一条异常，并刷新看板、分布条、摘要、列表、详情和导出按钮计数。

### 2.3 `source` 结构

```js
{
  label: "模拟数据" | "本地文件",
  files: ["purchase_ledger.csv", "supplier_delivery.csv"]
}
```

| 字段 | 说明 |
|---|---|
| `label` | 只有严格等于字符串 `"本地文件"` 时才显示“本地文件：文件名”；其他值一律按模拟数据显示。 |
| `files` | 文件名数组。`label` 为 `"本地文件"` 时以 ` + ` 连接显示在徽章里；模拟数据下仅用于内部记录。 |

规范化规则：`label` 不是 `"本地文件"` 时统一为 `"模拟数据"`；`files` 不是数组时按空数组处理，元素会转成字符串。

### 2.4 `adapter` 的转换函数

从 **`src/report/adapter.js`** 导入：

```js
import { adaptResult } from "./report/adapter.js";
```

```js
adaptResult(input) => {
  totals: { leftCount: number, rightCount: number, matchedKeys: number },
  items: Array<Item>
}
```

- `input`：B 的 `reconcile(...)` 返回值，或已经是页面数据结构。
- 识别顺序：
  1. 有 `items` 数组且存在 `totals` → 按页面数据结构校验后原样返回；
  2. 有 `exceptions` 数组、`summary` 对象、`lines` 数组 → 按 B 输出转换；
  3. 都不满足 → 抛出 `对账结果格式不正确：...`。
- 抛错信息可以直接展示给用户；`mountReport` / `updateReport` 会捕获并显示友好错误页，不会白屏。

---

## 3. 可直接粘贴的集成示例

以下示例假设你们已有 `src/main.js` 和两个文件选择框。首次导入调用 `mountReport`，后续重新导入调用 `updateReport`。

```html
<!-- 页面里只需要一个挂载根节点，id 可自定义 -->
<div id="report-root"></div>

<input id="purchase-file" type="file" accept=".csv">
<input id="delivery-file" type="file" accept=".csv">
<button id="import-button" type="button">导入并核对</button>
<p id="import-error" role="alert"></p>

<script type="module" src="/src/main.js"></script>
```

```js
// src/main.js

// A：CSV 解析（他人模块，不改）
import { readCsvFile } from "./csv.js";

// B：对账规则（他人模块，不改）
import { reconcile } from "./reconcile.js";

// C：本模块
import { adaptResult } from "./report/adapter.js";
import { mountReport, updateReport } from "./ui/mountReport.js";

const rootEl = document.querySelector("#report-root");
const purchaseInput = document.querySelector("#purchase-file");
const deliveryInput = document.querySelector("#delivery-file");
const importButton = document.querySelector("#import-button");
const errorEl = document.querySelector("#import-error");

let hasMounted = false;

async function importAndRender() {
  const purchaseFile = purchaseInput.files[0];
  const deliveryFile = deliveryInput.files[0];

  if (!purchaseFile || !deliveryFile) {
    errorEl.textContent = "请先选择采购台账和供应商送货记录两个 CSV 文件。";
    return;
  }

  importButton.disabled = true;
  errorEl.textContent = "";

  try {
    // 1. 解析两个 CSV，fileName 会写入每条记录，用于“文件名 · 第 N 行”
    const [purchaseParsed, deliveryParsed] = await Promise.all([
      readCsvFile(purchaseFile),
      readCsvFile(deliveryFile),
    ]);

    const parseErrors = [
      ...(purchaseParsed.ok ? [] : purchaseParsed.errors),
      ...(deliveryParsed.ok ? [] : deliveryParsed.errors),
    ];

    if (parseErrors.length > 0) {
      throw new Error(
        parseErrors
          .map((error) => {
            const row = error.recordNumber == null ? "" : `，第 ${error.recordNumber} 行`;
            return `${error.fileName}${row}：${error.message}`;
          })
          .join("\n"),
      );
    }

    // 2. B 的真实输出：{ lines, exceptions, summary }
    const reconcileOutput = reconcile(
      purchaseParsed.rows,
      deliveryParsed.rows,
    );

    // 3. 转换为页面数据结构（失败会抛出可展示的格式错误）
    const result = adaptResult(reconcileOutput);

    // 4. 顶栏数据来源
    const source = {
      label: "本地文件",
      files: [purchaseFile.name, deliveryFile.name],
    };

    // 5. 首次挂载 / 后续刷新
    if (!hasMounted) {
      mountReport(rootEl, { result, source });
      hasMounted = true;
    } else {
      updateReport({ result, source });
    }
  } catch (error) {
    // 失败时保留上一份已成功展示的结果
    errorEl.textContent = error instanceof Error
      ? error.message
      : "文件导入或核对失败，请检查文件后重试。";
  } finally {
    importButton.disabled = false;
  }
}

importButton.addEventListener("click", importAndRender);
```

调用链：

```text
CSV 文件
→ readCsvFile(file)                // 返回 { ok: true, rows } 或 { ok: false, errors }
→ reconcile(purchaseRows, deliveryRows)  // 返回 { lines, exceptions, summary }
→ adaptResult(reconcileOutput)     // 返回 { totals, items }
→ mountReport(rootEl, { result, source })   // 首次
→ updateReport({ result, source })          // 重新导入
```

---

## 4. 挂载点与样式

### 4.1 根节点

页面中放任意一个元素即可，推荐：

```html
<div id="report-root"></div>
```

- 不需要预设 class，模块会自动加上 `report-app` 并接管内部 DOM。
- 根节点不能为空或 null，否则 `mountReport` 直接抛错。
- 不要给根节点设置固定宽高或 `overflow: hidden`，模块内部自行处理滚动区域。

### 4.2 样式引入

**不需要手动写 `<link>`。** `src/ui/mountReport.js` 第 1 行已引入：

```js
import "../styles/report.css";
```

Vite / 支持 CSS import 的打包器会自动打包。若你们的构建链不支持 JS 引入 CSS，则改为在页面 `<head>` 中引入构建后的 CSS，并删除 `mountReport.js` 第 1 行的 import，二选一，不要同时保留。

### 4.3 依赖情况

- 无外部字体、无 CDN、无图标库；图标全部为内联 SVG。
- 无第三方 JS 依赖，只依赖浏览器原生 API。
- 样式作用域限定在 `.report-app` 内；唯一全局规则是：
  `body:has(> .report-app) { margin: 0; }`
- 不使用 CSS `@import`，不与项目其他全局样式冲突。
- 设计令牌全部定义在 `src/styles/report.css` 的 `:root`，组件内没有硬编码色值。

---

## 5. 当前已知问题（集成同学必须处理）

### 5.1 `index.html` 的缺失资源

当前 `index.html` 引用：

```html
<link rel="stylesheet" href="assets/style.css">
...
<script src="assets/data.js"></script>
<script src="assets/engine.js"></script>
<script src="assets/app.js"></script>
```

实际核对结果：

| 引用 | 实际状态 |
|---|---|
| `assets/style.css` | **文件不存在** |
| `assets/app.js` | **文件不存在** |
| `assets/data.js` | 存在 |
| `assets/engine.js` | 存在 |

因此：

1. 直接打开现有 `index.html` 会没有样式，且 `app.js` 缺失会导致页面逻辑不完整。
2. 构建时 Vite 会报警告：三个脚本都没有 `type="module"`，无法被 Vite 打包，其中包含不存在的 `assets/app.js`。
3. `dist/index.html` 仍会原样引用这些路径，生产预览下首页不可用。

**需要集成同学处理（本模块不代改）：**

- 方案 A（推荐）：由集成同学把 `index.html` 的主内容区替换为本模块挂载点，并删除上述缺失引用，使用自己的 `src/main.js`。
- 方案 B：补齐 `assets/style.css` 与 `assets/app.js`，并把 `data.js`、`engine.js`、`app.js` 改为 `type="module"` 或迁入 Vite 入口。
- 未处理前，请用 `report-preview.html` 验证本模块，不要用 `index.html` 验收。

### 5.2 重复副本文件

仓库中存在 `assets/data (1).js`、`assets/engine (1).js`、`src/csv (1).js` 等带 `(1)` 的副本。本模块没有引用它们，集成时不要误引入。

### 5.3 依赖安装

`package.json` 未改动，仍只有开发依赖 `vite ^7.0.0`。拉取代码后需先执行：

```bash
npm install
```

### 5.4 单实例限制

模块使用模块级单例会话。同一页面不要挂载两个报告实例；如需多实例，必须先改造 `mountReport.js` 中的 `session`。

---

## 6. 与上游模块的数据约定

`adaptResult` 期望 B 的 `reconcile` 返回：

```js
{
  lines: Array<object>,       // 转换层只用于判断“这是 B 的输出”，不读取内部字段
  exceptions: Array<object>,  // 异常清单，必需
  summary: {
    purchaseRowCount: number, // → totals.leftCount
    deliveryRowCount: number, // → totals.rightCount
    matchedKeyCount: number   // → totals.matchedKeys
  }
}
```

### 6.1 每条 `exception` 会读取的字段

| 字段 | 必填 | 用途 / 缺失时行为 |
|---|---|---|
| `id` | 否 | 列表选中标识；缺失时用 `exception-序号` 兜底 |
| `type` | 是 | 支持中文值：`数量不符`、`单价差异`、`重复计账`、`缺单漏单`。无法识别 → 抛格式错误并显示错误页 |
| `documentNo` | 建议 | 匹配键、单据号展示；缺失时取首条原记录的 `documentNo` |
| `supplierCode` | 建议 | 供应商筛选与匹配键；缺失时取原记录 |
| `sku` | 建议 | 物料编码匹配键；缺失时取原记录 |
| `supplierName` | 否 | 缺失时取原记录，再缺则用供应商编码，最后显示“未命名供应商” |
| `materialName` | 否 | 缺失时取原记录，再缺则用物料编码，最后显示“未命名物料” |
| `message` | 否 | 作为“差异说明”；缺失时由 `summary.js` 按类型生成 |
| `missingSide` | 缺单类必填 | `"purchase"` → 台账缺单；其他值 → 送货缺单 |
| `purchaseRows` | **是** | 左侧“采购台账（我方）”全部原记录 |
| `deliveryRows` | **是** | 右侧“供应商送货记录”全部原记录 |
| `quantityDiff` | 否 | 无 `amountImpact` 时用于计算数量差异金额 |
| `priceDiffCents` | 否 | 无 `amountImpact` 时用于计算单价差异金额 |
| `duplicateRows` | 否 | 无 `amountImpact` 时按这些行汇总重复金额 |
| `missingRows` | 否 | 无 `amountImpact` 时按这些行汇总缺单金额 |
| `amountImpact` | 否 | 有则直接取绝对值；没有则按类型自动计算 |

### 6.2 每条原始记录必需字段

来自 A 的 `parseCsv(...).rows`：

| 字段 | 必填 | 用途 / 缺失时行为 |
|---|---|---|
| `fileName` | 建议 | 显示“文件名 · 第 N 行”；缺失时显示“未命名文件”，不影响渲染 |
| `recordNumber` | 是 | 显示行号；缺失时回退读 `rowIndex`。两者都缺失 → 校验失败，整页显示错误态 |
| `documentNo` | 建议 | 单据号；缺失时回退异常上的 `documentNo`，两者都缺 → 校验失败 |
| `supplierCode` | 建议 | 供应商编码；缺失时回退异常字段，两者都缺 → 校验失败 |
| `sku` | 建议 | 物料编码；缺失时回退异常字段，两者都缺 → 校验失败 |
| `quantity` | 是 | 数量；缺失会导致该条异常校验失败，整页进入错误态 |
| `unitPriceCents` | 建议 | 单价（分）；转换时除以 100。缺失时按 0 处理，页面可能显示 ¥0.00，不会报错 |
| `materialName` | 否 | 缺失时用物料编码 |
| `supplierName` | 否 | 缺失时为空，页面改用异常上的供应商名或编码 |
| `date` / `businessDate` | 否 | 缺失显示“未提供日期” |
| `unitPrice` | 否 | 若直接提供元为单位则优先使用 |
| `rowIndex` | 否 | 仅在 `recordNumber` 缺失时作为行号兜底 |

### 6.3 关键降级规则汇总

- `fileName` 与行号是“原始行可追溯”的硬依赖：`recordNumber` 和 `rowIndex` 至少有一个存在。
- 缺单记录以 `purchaseRows` / `deliveryRows` 的实际内容决定左右两侧；某一侧为空数组时显示虚线占位框。
- 重复记录直接展示 `purchaseRows` / `deliveryRows` 的全部记录，不会去重；第二条起标“重复”。
- `diffFields` 由转换层按类型生成：数量不符 → `["qty"]`，单价差异 → `["unitPrice"]`，其他类型为空。
- 页面数据结构的整体校验失败会进入错误页，不会抛到控制台导致白屏。

---

## 7. 集成后自测（5 步）

在项目根目录执行 `npm run dev`。以下步骤同时覆盖页面、摘要、筛选和 CSV。

### 第 1 步：首屏

打开挂载了报告的页面，确认：

- 顶栏显示“账清AI”、数据来源徽章、导出按钮；
- 看板 5 张卡、摘要卡、左侧异常列表、右侧详情全部有内容；
- 默认自动选中第一条，右侧不是空白；
- 记录能显示“文件名 · 第 N 行”。

### 第 2 步：摘要与数据刷新

- 点击“复制摘要”，粘贴到记事本，应包含 headline 和 3～4 条要点，且标注“规则自动生成 · 非大模型”；
- 重新导入一份不同的 CSV（或开发环境调用 `updateReport` 传入删减后的结果），确认看板数字、分布条、摘要文字同步变化，筛选被重置且重新选中第一条。

### 第 3 步：组合筛选

- 同时选择 1 个异常类型芯片、1 个供应商，并输入单据号关键词；
- 列表条数、列表首行、“导出差异 CSV（N 条）”中的 N 必须一致；
- 切换排序为“按单据号”，顺序立即变化；
- 用键盘 ↑ ↓ 切换选中项，右侧详情跟随变化；
- 点“清除筛选”，恢复全部异常。

### 第 4 步：详情与 CSV 导出

- 点一条“重复记录”，右侧应显示两侧全部原记录，第二条起带“重复”标记和各自行号；
- 点一条缺单记录，缺失一侧应显示“该侧无对应记录”虚线框；
- 点数量或单价差异，差异字段应有底色高亮和差值标签；
- 在当前筛选下点击导出，用 Excel 打开 CSV：中文不乱码、行数 = 当前列表条数、表头 16 列完整。

### 第 5 步：状态页与控制台

- 传入无异常结果：显示“本次核对未发现异常 ✓”，导出按钮禁用；
- 搜索一个不存在的关键词：显示“没有符合条件的异常”并可一键清除；
- 传入 `{ bad: true }` 之类错误结构：显示“暂时无法展示对账结果”，不白屏；
- 打开浏览器控制台，确认无报错、无外部网络请求。

最后执行：

```bash
npm run build
npm test
```

预期：构建成功（`index.html` 的既有资源警告除外），`tests` 全部通过。

---

## 附：预览地址（仅供联调）

```bash
npm run dev
```

- 独立报告预览：`http://localhost:5173/report-preview.html`
- 生产预览：

```bash
npm run build
npm run preview
```

- 生产预览地址：`http://localhost:4173/report-preview.html`
