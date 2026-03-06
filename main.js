import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ustaw nazwę aplikacji
app.setName('Gas Meter Estimation')

// Ścieżka do danych użytkownika
const userDataPath = path.join(app.getPath('userData'), 'data')
const dataFilePath = path.join(userDataPath, 'app-data.json')

// Utwórz katalog na dane użytkownika jeśli nie istnieje
if (!existsSync(userDataPath)) {
  mkdirSync(userDataPath, { recursive: true })
}

// Obsługa IPC dla zapisu danych
ipcMain.handle('save-data', async (event, data) => {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2))
    return { success: true }
  } catch (error) {
    console.error('Błąd zapisu:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('load-data', async () => {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8')
    return { success: true, data: JSON.parse(data) }
  } catch (error) {
    // Plik może nie istnieć przy pierwszym uruchomieniu
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-user-data-path', () => {
  return userDataPath
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
    
    show: false,
    
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')  // zmienione z .js na .cjs
    }
  })
  
  // Wczytaj aplikację
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }
  
  win.once('ready-to-show', () => {
    win.show()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
