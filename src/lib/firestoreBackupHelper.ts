import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface BackupMetadata {
  version: string;
  appName: string;
  exportedAt: string;
  exportedBy: string;
  totalCollections: number;
  totalDocuments: number;
  collectionCounts: Record<string, number>;
}

export interface FullFirestoreBackup {
  metadata: BackupMetadata;
  collections: Record<string, any[]>;
}

/**
 * Serializes Firestore document data, converting Timestamps and Dates to ISO strings
 */
function serializeFirestoreData(docData: any): any {
  if (docData === null || docData === undefined) {
    return docData;
  }

  // Handle Firestore Timestamp
  if (docData && typeof docData.toDate === 'function') {
    try {
      return {
        _type: 'FirestoreTimestamp',
        iso: docData.toDate().toISOString(),
        seconds: docData.seconds,
        nanoseconds: docData.nanoseconds
      };
    } catch {
      return String(docData);
    }
  }

  // Handle JavaScript Date
  if (docData instanceof Date) {
    return {
      _type: 'Date',
      iso: docData.toISOString()
    };
  }

  // Handle Arrays
  if (Array.isArray(docData)) {
    return docData.map(item => serializeFirestoreData(item));
  }

  // Handle Objects
  if (typeof docData === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(docData)) {
      res[key] = serializeFirestoreData(docData[key]);
    }
    return res;
  }

  return docData;
}

export const FIRESTORE_COLLECTIONS = [
  { id: 'settings', label: 'Configurações Globais', icon: '⚙️' },
  { id: 'orders', label: 'Histórico de Pedidos', icon: '📦' },
  { id: 'inventory', label: 'Custos & Estoque', icon: '💰' },
  { id: 'ingredients', label: 'Insumos & Ingredientes', icon: '🥛' },
  { id: 'recipes', label: 'Fichas Técnicas / Receitas', icon: '🍳' },
  { id: 'reviews', label: 'Avaliações de Clientes', icon: '⭐' },
  { id: 'coupons', label: 'Cupons de Desconto', icon: '🏷️' },
  { id: 'ready_boxes', label: 'Doces de Hoje / Pronta Entrega', icon: '✨' },
  { id: 'customer_notes', label: 'CRM & Notas de Clientes', icon: '👥' },
  { id: 'audit_logs', label: 'Logs de Auditoria & Segurança', icon: '🛡️' }
];

export interface ExportProgressCallback {
  (currentCollection: string, index: number, total: number, countSoFar: number): void;
}

/**
 * Fetches all collections from Firestore and packages them into a single JSON object.
 */
export async function generateFullFirestoreBackup(
  userEmail: string = 'admin',
  onProgress?: ExportProgressCallback
): Promise<FullFirestoreBackup> {
  const collectionsData: Record<string, any[]> = {};
  const collectionCounts: Record<string, number> = {};
  let totalDocs = 0;

  for (let i = 0; i < FIRESTORE_COLLECTIONS.length; i++) {
    const colInfo = FIRESTORE_COLLECTIONS[i];
    if (onProgress) {
      onProgress(colInfo.label, i + 1, FIRESTORE_COLLECTIONS.length, totalDocs);
    }

    try {
      const colRef = collection(db, colInfo.id);
      const snapshot = await getDocs(colRef);
      const items: any[] = [];

      snapshot.forEach(docSnap => {
        const rawData = docSnap.data();
        const serialized = serializeFirestoreData(rawData);
        items.push({
          _id: docSnap.id,
          ...serialized
        });
      });

      collectionsData[colInfo.id] = items;
      collectionCounts[colInfo.id] = items.length;
      totalDocs += items.length;
    } catch (err) {
      console.warn(`Could not export collection "${colInfo.id}":`, err);
      collectionsData[colInfo.id] = [];
      collectionCounts[colInfo.id] = 0;
    }
  }

  const nowIso = new Date().toISOString();
  const backup: FullFirestoreBackup = {
    metadata: {
      version: '1.0',
      appName: 'S.E Doces Gourmet',
      exportedAt: nowIso,
      exportedBy: userEmail,
      totalCollections: FIRESTORE_COLLECTIONS.length,
      totalDocuments: totalDocs,
      collectionCounts
    },
    collections: collectionsData
  };

  return backup;
}

/**
 * Triggers a browser download of the complete Firestore backup as a formatted JSON file.
 */
export function downloadBackupJsonFile(backup: FullFirestoreBackup) {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 5).replace(':', 'h');
  const filename = `backup-firestore-doces-gourmet-${dateStr}-${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
