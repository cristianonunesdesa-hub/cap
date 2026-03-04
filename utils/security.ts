import CryptoJS from 'crypto-js';
import { Customer } from '../types';

const STORAGE_KEY = 'wholesale_crm_customers';
const AUTH_CHECK_KEY = 'wholesale_crm_auth_check'; // Used to verify if password is correct (contains encrypted "OK")
const RECOVERY_KEY = 'wholesale_crm_recovery'; // Stores the recovery data

// Generate a random recovery code like ABCD-1234-EFGH-5678
export const generateRecoveryCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, O, 0 to avoid confusion
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const setupSecurity = (password: string): string => {
  // 1. Generate a recovery code
  const recoveryCode = generateRecoveryCode();

  // 2. Create an Auth Check (encrypt "VALID" with the password)
  const authCheck = CryptoJS.AES.encrypt("VALID", password).toString();
  
  // 3. Create a Recovery Token (encrypt the Password with the Recovery Code)
  // In a real heavy security app, we would wrap a Master Key, but for this scope:
  // We allow recovering the password (or resetting) by proving ownership of the recovery code.
  // Here we simply store a hash of the recovery code to verify it later.
  const recoveryHash = CryptoJS.SHA256(recoveryCode).toString();

  localStorage.setItem(AUTH_CHECK_KEY, authCheck);
  localStorage.setItem(RECOVERY_KEY, recoveryHash);

  // If there was unencrypted data, we need to encrypt it now
  const existingData = localStorage.getItem(STORAGE_KEY);
  if (existingData && !existingData.startsWith('U2FsdGVk')) {
     // It's plain text JSON, encrypt it
     const encrypted = CryptoJS.AES.encrypt(existingData, password).toString();
     localStorage.setItem(STORAGE_KEY, encrypted);
  }

  return recoveryCode;
};

export const verifyPassword = (password: string): boolean => {
  const authCheck = localStorage.getItem(AUTH_CHECK_KEY);
  if (!authCheck) return false;

  try {
    const bytes = CryptoJS.AES.decrypt(authCheck, password);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText === "VALID";
  } catch (e) {
    return false;
  }
};

export const verifyRecoveryCode = (code: string): boolean => {
  const storedHash = localStorage.getItem(RECOVERY_KEY);
  if (!storedHash) return false;
  
  const inputHash = CryptoJS.SHA256(code.trim().toUpperCase()).toString();
  return inputHash === storedHash;
};

export const resetPassword = (recoveryCode: string, newPassword: string, currentData: Customer[]) => {
    if (!verifyRecoveryCode(recoveryCode)) {
        throw new Error("Código de recuperação inválido");
    }
    
    // Re-setup security with new password (generates NEW recovery code technically, 
    // but for this flow we might want to keep the old one or return a new one. 
    // Let's return a NEW one for security rotation).
    const newRecoveryCode = setupSecurity(newPassword);
    
    // Re-encrypt data with new password
    saveEncryptedData(currentData, newPassword);

    return newRecoveryCode;
};

export const saveEncryptedData = (data: Customer[], password: string) => {
  const json = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(json, password).toString();
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const loadDecryptedData = (password: string): Customer[] | null => {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;

  // Migration check: if it looks like JSON (starts with [), it's not encrypted yet
  if (encrypted.trim().startsWith('[')) {
      try {
          return JSON.parse(encrypted);
      } catch(e) { return []; }
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, password);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (e) {
    console.error("Failed to decrypt", e);
    return null;
  }
};

export const hasSecuritySetup = (): boolean => {
  return !!localStorage.getItem(AUTH_CHECK_KEY);
};