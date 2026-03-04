import { Customer } from "../types";

// Check if running in Electron
const isElectron = () => {
  return navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
};

export const performAutoBackup = async (customers: Customer[]) => {
  if (!isElectron()) {
    console.log("Auto-backup skipped: Not running in Electron");
    return;
  }

  try {
    // Dynamic require to avoid bundler errors in web mode
    const fs = (window as any).require('fs');
    const path = (window as any).require('path');
    const { app } = (window as any).require('@electron/remote') || (window as any).require('electron');
    
    // Get Documents path. Note: In renderer process, getting app path might require IPC or @electron/remote
    // If @electron/remote is not set up, we might need a fallback or assume a standard path structure if possible, 
    // but standard electron security blocks direct 'app' access in renderer.
    // Simplest approach for this context: try to use a known variable or just save to a local folder relative to execution if app is not available.
    
    // Better approach for Renderer:
    // We construct a path manually if we can't get it, or use a specialized IPC.
    // Assuming standard Electron setup where nodeIntegration is true (as per main.js)
    
    // Let's try to get the user home dir
    // Fix: Cast process to any to avoid TypeScript error about missing platform property
    const homeDir = process.env[(process as any).platform == "win32" ? "USERPROFILE" : "HOME"];
    if (!homeDir) return;

    const documentsPath = path.join(homeDir, 'Documents');
    const backupFolder = path.join(documentsPath, 'GestaoCarteira_Backups');

    if (!fs.existsSync(backupFolder)) {
      fs.mkdirSync(backupFolder, { recursive: true });
    }

    const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0]; // YYYY-MM-DDTHH-mm-ss
    const fileName = `Backup_Automatico_${dateStr}.json`;
    const filePath = path.join(backupFolder, fileName);

    const dataToSave = JSON.stringify(customers, null, 2);
    
    fs.writeFileSync(filePath, dataToSave, 'utf-8');
    console.log(`Backup saved to: ${filePath}`);
    return filePath;

  } catch (error) {
    console.error("Failed to perform auto-backup:", error);
  }
};