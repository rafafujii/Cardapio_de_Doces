export interface SeasonalTheme {
  id: 'classic' | 'easter' | 'mothers_day' | 'christmas' | 'halloween';
  name: string;
  tagline: string;
  badge: string;
  primaryColor: string; // brand-wine replacement
  accentColor: string;  // brand-gold replacement
  lightColor: string;   // brand-gold-light
  creamColor: string;   // brand-cream
  bannerText: string;
  iconEmoji: string;
}

export const SEASONAL_THEMES: Record<string, SeasonalTheme> = {
  classic: {
    id: 'classic',
    name: 'Gourmet Clássico',
    tagline: 'Elegância atemporal em Bordeaux e Ouro Nobre',
    badge: '👑 Padrão Gourmet',
    primaryColor: '#800020',
    accentColor: '#D4AF37',
    lightColor: '#F4E8C1',
    creamColor: '#FDFBF7',
    bannerText: 'Aceitando Encomendas & Pronta Entrega',
    iconEmoji: '✨'
  },
  easter: {
    id: 'easter',
    name: 'Páscoa Encantada',
    tagline: 'Cacau 100% puro, chocolates nobres e ovos gourmet',
    badge: '🐰 Coleção Especial de Páscoa',
    primaryColor: '#4A2810',
    accentColor: '#D99B38',
    lightColor: '#F7E7CD',
    creamColor: '#FCFAF6',
    bannerText: '🐰 Cardápio de Páscoa aberto! Garanta seus ovos gourmet e doces artesanais.',
    iconEmoji: '🍫'
  },
  mothers_day: {
    id: 'mothers_day',
    name: 'Mães & Namorados (Amor Doce)',
    tagline: 'Tons Rosé & Carmim para presentear quem você ama',
    badge: '💐 Edição Especial do Amor',
    primaryColor: '#911C44',
    accentColor: '#E09267',
    lightColor: '#FCD8E2',
    creamColor: '#FFF8FA',
    bannerText: '💖 Presenteie com afeto: Caixas especiais e doces finos com embalagem para presente.',
    iconEmoji: '💖'
  },
  christmas: {
    id: 'christmas',
    name: 'Natal Doce & Fim de Ano',
    tagline: 'Rubi festivo, toques dourados e magia de fim de ano',
    badge: '🎄 Cardápio de Natal & Festas',
    primaryColor: '#850D1E',
    accentColor: '#E2AB24',
    lightColor: '#FFE7A3',
    creamColor: '#FCFAF5',
    bannerText: '🎄 Encomendas de Natal e Ano Novo abertas! Reserve sua data com antecedência.',
    iconEmoji: '✨'
  },
  halloween: {
    id: 'halloween',
    name: 'Halloween & Outubro Mágico',
    tagline: 'Roxo aveludado e caramelo dourado para doces ou travessuras',
    badge: '🎃 Edição Outubro Mágico',
    primaryColor: '#46165B',
    accentColor: '#E87922',
    lightColor: '#FED8AA',
    creamColor: '#FAF7F5',
    bannerText: '🎃 Gostosuras ou travessuras? Sabores especiais e kits temáticos disponíveis.',
    iconEmoji: '🎃'
  }
};

export const SEASONAL_THEME_LIST: SeasonalTheme[] = Object.values(SEASONAL_THEMES);

export function getSeasonalTheme(id?: string): SeasonalTheme {
  if (!id || id === 'default' || !SEASONAL_THEMES[id]) {
    return SEASONAL_THEMES.classic;
  }
  return SEASONAL_THEMES[id];
}

