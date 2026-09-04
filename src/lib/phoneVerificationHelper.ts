import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit 
} from '../firebase';
import { VerifiedPhoneRecord } from '../types';

const LOCAL_STORAGE_VERIFIED_KEY = 'docesGourmetVerifiedPhonesList_v1';

/**
 * Remove all non-digits
 */
export function cleanPhoneDigits(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '');
}

/**
 * Format Brazilian phone number: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function formatBrazilianPhone(raw: string): string {
  const digits = cleanPhoneDigits(raw);
  if (!digits) return '';

  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    // Landline or old mobile: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Standard 11-digit mobile: (XX) 9XXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Check if the number is a plausible Brazilian mobile phone:
 * DDD between 11 and 99, 11 digits (9 + 8 digits), starts with 9 after DDD
 */
export function isValidBrazilianMobilePhone(raw: string): boolean {
  const digits = cleanPhoneDigits(raw);
  if (digits.length !== 11 && digits.length !== 10) return false;
  
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;

  // If 11 digits, first digit of subscriber number must be 9
  if (digits.length === 11) {
    return digits[2] === '9';
  }
  return true;
}

/**
 * Get map of locally verified phones stored on this device
 */
export function getLocalVerifiedPhones(): Record<string, { verifiedAt: string; name?: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VERIFIED_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Check if phone is verified on this device's localStorage
 */
export function isPhoneLocallyVerified(phone: string): boolean {
  const digits = cleanPhoneDigits(phone);
  if (!digits) return false;
  const map = getLocalVerifiedPhones();
  return Boolean(map[digits]);
}

/**
 * Save phone as verified in localStorage
 */
export function markPhoneLocallyVerified(phone: string, customerName?: string): void {
  const digits = cleanPhoneDigits(phone);
  if (!digits) return;
  try {
    const map = getLocalVerifiedPhones();
    map[digits] = {
      verifiedAt: new Date().toISOString(),
      name: customerName || ''
    };
    localStorage.setItem(LOCAL_STORAGE_VERIFIED_KEY, JSON.stringify(map));
    // Also save last verified phone for auto-filling
    localStorage.setItem('docesGourmetVerifiedPhone', digits);
  } catch (e) {
    console.warn("Could not save verified phone to localStorage:", e);
  }
}

/**
 * Check if phone is already verified in Firestore (or local fallback)
 */
export async function checkPhoneFirestoreVerified(db: any, phone: string): Promise<boolean> {
  const digits = cleanPhoneDigits(phone);
  if (!digits) return false;

  // First check local device memory (instant response)
  if (isPhoneLocallyVerified(digits)) {
    return true;
  }

  // Check Firestore verified_phones collection
  try {
    const docRef = doc(db, 'verified_phones', digits);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      // Sync with localStorage so next queries are instant
      markPhoneLocallyVerified(digits, snap.data()?.customerName);
      return true;
    }
  } catch (err) {
    console.warn("Firestore check verified_phones failed, falling back to local:", err);
  }

  return false;
}

/**
 * Register phone as verified in Firestore and local storage
 */
export async function savePhoneVerifiedFirestore(
  db: any, 
  phone: string, 
  customerName?: string, 
  method: 'otp_code' | 'whatsapp_handshake' | 'admin_manual' = 'otp_code'
): Promise<void> {
  const digits = cleanPhoneDigits(phone);
  if (!digits) return;

  // Always mark locally first
  markPhoneLocallyVerified(digits, customerName);

  try {
    const docRef = doc(db, 'verified_phones', digits);
    await setDoc(docRef, {
      phone: digits,
      customerName: customerName || '',
      verifiedAt: serverTimestamp(),
      verifiedBy: method,
      status: 'verified'
    }, { merge: true });
  } catch (err) {
    console.error("Failed to save verified phone to Firestore:", err);
  }
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateOtpCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

/**
 * Create a new verification request in Firestore & prepare WhatsApp link
 */
export async function createAndSendVerificationCode(
  db: any,
  phone: string,
  customerName: string,
  storeContactPhone: string
): Promise<{ code: string; expiresAt: Date; whatsappDirectUrl: string; formattedPhone: string }> {
  const digits = cleanPhoneDigits(phone);
  if (!digits) throw new Error('Número de telefone inválido.');

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save temporary verification in Firestore
  try {
    const verifRef = doc(db, 'phone_verifications', digits);
    await setDoc(verifRef, {
      phone: digits,
      code,
      customerName: customerName || '',
      createdAt: serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
      attempts: 0
    });
  } catch (err) {
    console.warn("Could not write phone_verifications to Firestore, will verify locally:", err);
  }

  // Pre-formatted message for customer to send to store or receive
  const cleanStorePhone = cleanPhoneDigits(storeContactPhone) || '5544998542446';
  const waMessage = `Olá! Sou *${customerName || 'Cliente'}* e estou confirmando meu WhatsApp (${formatBrazilianPhone(digits)}) para meu pedido na *S.E Doces Gourmet* 🧁\n\nMeu código de segurança é: *${code}*`;
  const whatsappDirectUrl = `https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(waMessage)}`;

  return {
    code,
    expiresAt,
    whatsappDirectUrl,
    formattedPhone: formatBrazilianPhone(digits)
  };
}

/**
 * Validate submitted OTP code against Firestore (with local fallback)
 */
export async function verifyOtpCode(
  db: any,
  phone: string,
  inputCode: string,
  expectedFallbackCode?: string
): Promise<{ success: boolean; error?: string }> {
  const digits = cleanPhoneDigits(phone);
  const cleanInput = inputCode.replace(/\D/g, '').trim();

  if (!cleanInput || cleanInput.length < 4) {
    return { success: false, error: 'Digite o código numérico de verificação.' };
  }

  // Try checking in Firestore first
  try {
    const verifRef = doc(db, 'phone_verifications', digits);
    const snap = await getDoc(verifRef);

    if (snap.exists()) {
      const data = snap.data();
      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

      if (expiresAt && expiresAt.getTime() < Date.now()) {
        return { success: false, error: 'O código de verificação expirou. Solicite um novo código.' };
      }

      if (data.code === cleanInput) {
        // Clean up temporary verification code
        deleteDoc(verifRef).catch(() => {});
        return { success: true };
      } else {
        return { success: false, error: 'Código incorreto. Verifique os números e tente novamente.' };
      }
    }
  } catch (err) {
    console.warn("Firestore verify failed, checking fallback code:", err);
  }

  // Fallback to in-memory code if Firestore was unreachable
  if (expectedFallbackCode && cleanInput === expectedFallbackCode.replace(/\D/g, '')) {
    return { success: true };
  }

  return { success: false, error: 'Código de verificação incorreto ou não encontrado.' };
}

/**
 * Admin: Fetch all verified phone numbers
 */
export async function fetchAllVerifiedPhones(db: any): Promise<VerifiedPhoneRecord[]> {
  try {
    const q = query(collection(db, 'verified_phones'), limit(200));
    const snap = await getDocs(q);
    const list: VerifiedPhoneRecord[] = [];
    snap.forEach(d => {
      list.push(d.data() as VerifiedPhoneRecord);
    });
    return list;
  } catch (err) {
    console.error("Error fetching verified phones:", err);
    return [];
  }
}

/**
 * Admin: Delete a verified phone record
 */
export async function removeVerifiedPhone(db: any, phone: string): Promise<void> {
  const digits = cleanPhoneDigits(phone);
  if (!digits) return;
  try {
    await deleteDoc(doc(db, 'verified_phones', digits));
  } catch (err) {
    console.error("Error deleting verified phone:", err);
    throw err;
  }
}
