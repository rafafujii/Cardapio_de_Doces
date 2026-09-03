import Papa from 'papaparse';
import type { CategoryGroup, Product } from './types';

export const PRODUCT_IMAGES: Record<string, string> = {
  "Brigadeiro Tradicional": "https://images.unsplash.com/photo-1590004953392-5aba2e785943?q=80&w=800&auto=format&fit=crop",
  "Brigadeiro de Ninho com Nutella": "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=800&auto=format&fit=crop",
  "Beijinho": "https://images.unsplash.com/photo-1621255554746-d250873ec488?q=80&w=800&auto=format&fit=crop",
  "Bicho de Pé": "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=800&auto=format&fit=crop",
  "Brigadeiro de Churros": "https://images.unsplash.com/photo-1582294125863-718258356942?q=80&w=800&auto=format&fit=crop",
  "Casaninho": "https://images.unsplash.com/photo-1533038595180-f7ccc8967916?q=80&w=800&auto=format&fit=crop",
  "Brigadeiro de Paçoca": "https://images.unsplash.com/photo-1603532648955-039310d9ed75?q=80&w=800&auto=format&fit=crop",
  "Trufa": "https://images.unsplash.com/photo-1548907040-4baa42d10919?q=80&w=800&auto=format&fit=crop",
  "Cone": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=800&auto=format&fit=crop",
  "Pizza de Brownie": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=800&auto=format&fit=crop",
  "Fatia de Pizza": "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop",
  "Bebida": "https://images.unsplash.com/photo-1536939459926-301728717817?q=80&w=800&auto=format&fit=crop",
  "Coca-Cola": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop"
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=400&auto=format&fit=crop";

export const DEFAULT_CATALOG: CategoryGroup[] = [
  {
    category: "Doces Tradicionais",
    items: [
      {
        id: 1,
        category: "Doces Tradicionais",
        name: "Brigadeiro Tradicional (Granulado)",
        priceCento: 150,
        unitPrice: 1.5,
        imageUrl: PRODUCT_IMAGES["Brigadeiro Tradicional"] || DEFAULT_IMAGE,
        badge: "🔥 Mais Vendido"
      },
      {
        id: 2,
        category: "Doces Tradicionais",
        name: "Brigadeiro Tradicional (Choco Ball)",
        priceCento: 150,
        unitPrice: 1.5,
        imageUrl: PRODUCT_IMAGES["Brigadeiro Tradicional"] || DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 3,
        category: "Doces Tradicionais",
        name: "Brigadeiro tradicional (Coco)",
        priceCento: 150,
        unitPrice: 1.5,
        imageUrl: PRODUCT_IMAGES["Brigadeiro Tradicional"] || DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 4,
        category: "Doces Tradicionais",
        name: "Brigadeiro de Churros",
        priceCento: 160,
        unitPrice: 1.6,
        imageUrl: PRODUCT_IMAGES["Brigadeiro de Churros"] || DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 5,
        category: "Doces Tradicionais",
        name: "Beijinho",
        priceCento: 165,
        unitPrice: 1.65,
        imageUrl: "https://i.postimg.cc/3xqRKXVJ/imagem-2026-05-10-204822103.png",
        badge: "🥥 Favorito"
      }
    ]
  },
  {
    category: "Doces Gourmet",
    items: [
      {
        id: 6,
        category: "Doces Gourmet",
        name: "Brigadeiro Melken",
        priceCento: 250,
        unitPrice: 2.5,
        imageUrl: "https://i.postimg.cc/26Q8FP6N/imagem-2026-05-10-204852967.png",
        badge: "🌟 Mais Vendidos 🌟"
      },
      {
        id: 7,
        category: "Doces Gourmet",
        name: "Brigadeiro Melken com Granulé Mesclado",
        priceCento: 250,
        unitPrice: 2.5,
        imageUrl: PRODUCT_IMAGES["Brigadeiro Tradicional"] || DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 8,
        category: "Doces Gourmet",
        name: "Brigadeiro de Caramelo",
        priceCento: null,
        unitPrice: null,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 9,
        category: "Doces Gourmet",
        name: "Brigadeiro de Creme Brûlée",
        priceCento: 165,
        unitPrice: 1.65,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 10,
        category: "Doces Gourmet",
        name: "Mini rocambole de Ninho",
        priceCento: 270,
        unitPrice: 2.7,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 11,
        category: "Doces Gourmet",
        name: "Surpresa de Uva Crocante",
        priceCento: 300,
        unitPrice: 3.0,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 12,
        category: "Doces Gourmet",
        name: "Surpresa de Uva de Ninho",
        priceCento: 260,
        unitPrice: 2.6,
        imageUrl: DEFAULT_IMAGE,
        badge: "🍇 Mais Pedido"
      },
      {
        id: 13,
        category: "Doces Gourmet",
        name: "Surpresa de Cereja (Branco)",
        priceCento: 450,
        unitPrice: 4.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 14,
        category: "Doces Gourmet",
        name: "Surpresa de Cereja (Preto)",
        priceCento: 450,
        unitPrice: 4.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 15,
        category: "Doces Gourmet",
        name: "Ninho Saborizado (Morango)",
        priceCento: 150,
        unitPrice: 1.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 16,
        category: "Doces Gourmet",
        name: "Ninho Saborizado (Limão)",
        priceCento: 150,
        unitPrice: 1.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      }
    ]
  },
  {
    category: "Bombons",
    items: [
      {
        id: 17,
        category: "Bombons",
        name: "Bombom de Ninho (Branco)",
        priceCento: 230,
        unitPrice: 2.3,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 18,
        category: "Bombons",
        name: "Bombom de Ninho (Preto)",
        priceCento: 230,
        unitPrice: 2.3,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 19,
        category: "Bombons",
        name: "Bombom de Prestigio (Branco)",
        priceCento: 240,
        unitPrice: 2.4,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 20,
        category: "Bombons",
        name: "Bombom de Prestigio (Preto)",
        priceCento: 240,
        unitPrice: 2.4,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 21,
        category: "Bombons",
        name: "Bombom de Amendoim (Branco)",
        priceCento: 200,
        unitPrice: 2.0,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 22,
        category: "Bombons",
        name: "Bombom de Amendoim (Preto)",
        priceCento: 200,
        unitPrice: 2.0,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 23,
        category: "Bombons",
        name: "Bombom de Nozes (Branco)",
        priceCento: 300,
        unitPrice: 3.0,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 24,
        category: "Bombons",
        name: "Bombom de Nozes (Preto)",
        priceCento: 300,
        unitPrice: 3.0,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 25,
        category: "Bombons",
        name: "Bombom de Cereja (Branco)",
        priceCento: 400,
        unitPrice: 4.0,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 26,
        category: "Bombons",
        name: "Bombom de Cereja (Preto)",
        priceCento: 400,
        unitPrice: 4.0,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 27,
        category: "Bombons",
        name: "Bombom de Damasco (Branco)",
        priceCento: 350,
        unitPrice: 3.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 28,
        category: "Bombons",
        name: "Bombom de Damasco (Preto)",
        priceCento: 350,
        unitPrice: 3.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 29,
        category: "Bombons",
        name: "Bombom de Physalis",
        priceCento: 450,
        unitPrice: 4.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 30,
        category: "Bombons",
        name: "Bombom de Morango (Branco)",
        priceCento: 380,
        unitPrice: 3.8,
        imageUrl: DEFAULT_IMAGE,
        badge: "🍓 Mais Vendido"
      },
      {
        id: 31,
        category: "Bombons",
        name: "Bombom de Morango (Preto)",
        priceCento: 380,
        unitPrice: 3.8,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 32,
        category: "Bombons",
        name: "Bombom de Maracuja (Branco)",
        priceCento: 350,
        unitPrice: 3.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 33,
        category: "Bombons",
        name: "Bombom de Maracuja (Preto)",
        priceCento: 350,
        unitPrice: 3.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 34,
        category: "Bombons",
        name: "Bombom de Cafe (Branco)",
        priceCento: 250,
        unitPrice: 2.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 35,
        category: "Bombons",
        name: "Bombom de Cafe (Preto)",
        priceCento: 250,
        unitPrice: 2.5,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      },
      {
        id: 36,
        category: "Bombons",
        name: "Bombom de Nutella",
        priceCento: 400,
        unitPrice: 4.0,
        imageUrl: DEFAULT_IMAGE,
        badge: "🌰 Destaque"
      },
      {
        id: 37,
        category: "Bombons",
        name: "Bombom de Limão Siciliano",
        priceCento: 380,
        unitPrice: 3.8,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      }
    ]
  },
  {
    category: "Copos da Felicidade",
    items: [
      {
        id: 38,
        category: "Copos da Felicidade",
        name: "Copo da Felicidade - Ninho com Morango",
        priceCento: null,
        unitPrice: 18.0,
        imageUrl: DEFAULT_IMAGE,
        badge: "⭐ Sucesso"
      },
      {
        id: 39,
        category: "Copos da Felicidade",
        name: "Copo da Felicidade - Brownie com Nutella",
        priceCento: null,
        unitPrice: 20.0,
        imageUrl: DEFAULT_IMAGE,
        badge: null
      }
    ]
  },
  {
    category: "Sobremesas Especiais",
    items: [
      {
        id: 40,
        category: "Sobremesas Especiais",
        name: "Cone Trufado Artesanal",
        priceCento: null,
        unitPrice: 12.0,
        imageUrl: PRODUCT_IMAGES["Cone"] || DEFAULT_IMAGE,
        badge: "🍫 Top 1 Mais Vendido"
      }
    ]
  }
];

export function parseCsvToCatalog(csvText: string): CategoryGroup[] {
  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true
  });

  const rows = (parsed.data.slice(1) as string[][]) || [];
  const grouped: Record<string, CategoryGroup> = {};
  let idCounter = 1;

  rows.forEach((cols) => {
    const cleanCols = cols.map((col) => col?.replace(/^"|"$/g, '').trim() || '');

    if (cleanCols.length >= 2 && cleanCols[1] !== '') {
      const category = cleanCols[0];
      const name = cleanCols[1];
      const priceCentoRaw = cleanCols[2]?.replace(',', '.');
      const unitPriceRaw = cleanCols[3]?.replace(',', '.');

      const priceCento = priceCentoRaw && priceCentoRaw !== 'À Consultar' ? parseFloat(priceCentoRaw) : null;
      const unitPrice = unitPriceRaw && unitPriceRaw !== 'À Consultar' ? parseFloat(unitPriceRaw) : null;

      let imageUrl = cleanCols[4] || '';
      if (!imageUrl || imageUrl.includes('placeholder.com') || imageUrl.includes('unsplash.com/photo-1551024601-bec78aea704b')) {
        const matchedKey = Object.keys(PRODUCT_IMAGES).find((key) =>
          name.toLowerCase().includes(key.toLowerCase())
        );
        imageUrl = matchedKey ? PRODUCT_IMAGES[matchedKey] : (imageUrl || DEFAULT_IMAGE);
      }

      const badge = cleanCols[5] || null;

      if (!grouped[category]) {
        grouped[category] = { category, items: [] };
      }

      grouped[category].items.push({
        id: idCounter++,
        category,
        name,
        priceCento: isNaN(priceCento as number) ? null : priceCento,
        unitPrice: isNaN(unitPrice as number) ? null : unitPrice,
        imageUrl,
        badge
      });
    }
  });

  const catalogList = Object.values(grouped);
  return catalogList.length > 0 ? catalogList : DEFAULT_CATALOG;
}

export async function fetchCatalogWithFallback(sheetId: string): Promise<CategoryGroup[]> {
  // Check cached catalog first
  try {
    const cached = localStorage.getItem('docesGourmetCatalogCache');
    if (cached) {
      const parsedCached = JSON.parse(cached);
      if (Array.isArray(parsedCached) && parsedCached.length > 0) {
        // Return cached while we try to refresh in background
      }
    }
  } catch (e) {
    console.warn("Error reading catalog cache", e);
  }

  const urls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 20) {
          const catalog = parseCsvToCatalog(text);
          if (catalog.length > 0) {
            try {
              localStorage.setItem('docesGourmetCatalogCache', JSON.stringify(catalog));
            } catch (err) {}
            return catalog;
          }
        }
      }
    } catch (err) {
      console.warn(`Fetch from ${url} failed or timed out:`, err);
    }
  }

  // Fallback to cached catalog or default catalog
  try {
    const cached = localStorage.getItem('docesGourmetCatalogCache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {}

  return DEFAULT_CATALOG;
}
