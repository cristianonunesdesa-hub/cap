import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração correta de caminhos para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Gestão de Carteira Atacado",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // Desabilitar segurança web apenas se necessário para carregar recursos locais
      webSecurity: true 
    },
    // Tenta carregar o ícone, mas não quebra se não achar
    icon: path.join(__dirname, '../public/vite.svg')
  });

  // Remove o menu padrão (Arquivo, Editar, etc) para ficar com cara de App nativo
  win.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // Modo Desenvolvimento
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools(); // Descomente se quiser ver o console no app
  } else {
    // Modo Produção (Instalado)
    // O electron-builder copia a pasta 'dist' para dentro dos recursos do app
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});