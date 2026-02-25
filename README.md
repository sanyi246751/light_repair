<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>Built with AI Studio</h2>

  <p>The fastest path from prompt to production with Gemini.</p>

  <a href="https://aistudio.google.com/apps">Start building</a>

</div>

---

# Light Repair (路燈維修系統)

這是一個基於 React (Vite) 建立的前端專案。

## 🚀 專案建置與執行

請確保您的電腦已安裝 [Node.js](https://nodejs.org/)。

1. **安裝套件**
   首先安裝專案所需的所有相依套件：
   ```bash
   npm install
   ```

2. **啟動本機開發伺服器**
   安裝完成後，使用以下指令啟動可即時更新的開發伺服器：
   ```bash
   npm run dev
   ```

3. **建立上線版本 (生產環境壓縮打包)**
   若要產生可部署的靜態檔案，請執行：
   ```bash
   npm run build
   ```
   產生的檔案會放在 `dist` 資料夾內。

## 📦 GitHub Actions 自動部署

專案已設定 GitHub Actions 工作流程 (`.github/workflows/deploy.yml`) 以支援自動化部署。

只要您將程式碼推播 (push) 至 GitHub 遠端儲存庫的 `main` 或 `master` 分支，GitHub Actions 就會自動觸發並完成編譯、打包與部署，讓最新版本的網站上線至 **GitHub Pages**。

## 🛡️ 版本控制管理

已設定 `.gitignore` 以防止上傳不必要的資料夾與隱私檔案，例如：
* `node_modules` (相依套件庫)
* `dist` (編譯出的靜態檔案)
* 各種環境設定與本地系統的隱私檔 (如 `.env.local` 或 `.DS_Store`)
