export type StarMotion = 'fall' | 'twinkle' | 'orbit' | 'sweep';
export type StarTexture = 'dust' | 'rays' | 'gems' | 'facets';
export type StarMotif = 'smile' | 'burst' | 'medal' | 'crown' | 'orbit';

export interface StarDesign {
  id: string;
  name: string;
  colors: readonly [string, string, string];
  outline: string;
  glitter: string;
  sparkle: string;
  highlight?: string;
  deep?: string;
  glint?: string;
  jewel: string;
  motion: StarMotion;
  texture: StarTexture;
  motif?: StarMotif;
}

export const DEFAULT_SECOND_STAR_DESIGN = 'gold-glitter';
export const DEFAULT_THIRD_STAR_DESIGN = 'royal-gold';

export const secondStarDesigns: readonly StarDesign[] = [
  { id: 'gold-glitter', name: 'Золотые блёстки', colors: ['#E9A820', '#E9A820', '#E9A820'], outline: '#B97C0F', glitter: '#F7D56D', sparkle: '#FFF9D6', highlight: '#FFFBE0', jewel: '#FFFDF1', motion: 'fall', texture: 'dust' },
  { id: 'rose-gold', name: 'Розовое золото', colors: ['#FFD5BA', '#EA997D', '#B96362'], outline: '#A65355', glitter: '#FFE5C7', sparkle: '#FFF7E9', jewel: '#FFF4ED', motion: 'twinkle', texture: 'gems' },
  { id: 'ice-spark', name: 'Ледяные искры', colors: ['#D9F7FF', '#83D4EE', '#3999CB'], outline: '#2C79A9', glitter: '#EDF9FF', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'twinkle', texture: 'dust' },
  { id: 'emerald-rain', name: 'Изумрудный дождь', colors: ['#B8F3C8', '#46C987', '#16865B'], outline: '#126C4C', glitter: '#D7FFE2', sparkle: '#F2FFF6', jewel: '#ECFFF0', motion: 'fall', texture: 'rays' },
  { id: 'amethyst', name: 'Аметистовые огни', colors: ['#E9DAFF', '#A47EE7', '#6446B5'], outline: '#593A98', glitter: '#F1DEFF', sparkle: '#FFFFFF', jewel: '#FFF3FF', motion: 'orbit', texture: 'gems' },
  { id: 'copper-sunset', name: 'Медный закат', colors: ['#FFD5A8', '#F48947', '#C54B30'], outline: '#A84927', glitter: '#FFE2AE', sparkle: '#FFF5D2', jewel: '#FFF2D6', motion: 'sweep', texture: 'rays' },
  { id: 'ocean-drops', name: 'Морские капли', colors: ['#C7F5F3', '#57C8D1', '#187BBA'], outline: '#186E9A', glitter: '#D9FFFF', sparkle: '#FFFFFF', jewel: '#EBFFFF', motion: 'fall', texture: 'dust' },
  { id: 'silver-dust', name: 'Серебряная пыль', colors: ['#F4F7FC', '#BCC9DB', '#8294B3'], outline: '#6B7B9A', glitter: '#FFFFFF', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'twinkle', texture: 'dust' },
  { id: 'rainbow-spark', name: 'Радужная искра', colors: ['#FFE1A2', '#EF95C0', '#8A94E8'], outline: '#9670BA', glitter: '#FFF0C3', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'orbit', texture: 'gems' },
  { id: 'sun-rays', name: 'Солнечные лучи', colors: ['#FFF4A7', '#FFC941', '#ED851E'], outline: '#C97512', glitter: '#FFF6B5', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'sweep', texture: 'rays' },
  // Inspired by the playful fairy, cute, supernova and rainbow stars in the supplied studios.
  { id: 'pixie-rainbow', name: 'Фея и радуга', colors: ['#72F4D5', '#FFD166', '#FF69A8'], outline: '#AF5BC9', glitter: '#FFF1A8', sparkle: '#FFFFFF', jewel: '#FFFDF1', motion: 'orbit', texture: 'gems', motif: 'orbit' },
  { id: 'happy-buddy', name: 'Звёздный дружок', colors: ['#FFE27A', '#FFB52E', '#F27B35'], outline: '#C25C25', glitter: '#FFF2B7', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'twinkle', texture: 'dust', motif: 'smile' },
  { id: 'firework-burst', name: 'Праздничный салют', colors: ['#FFF17A', '#FF7BA8', '#9F63E9'], outline: '#8348C5', glitter: '#FFE1A8', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'fall', texture: 'rays', motif: 'burst' },
  { id: 'violet-galaxy', name: 'Фиолетовая галактика', colors: ['#A8C7FF', '#7557D9', '#36266F'], outline: '#40308B', glitter: '#D9D5FF', sparkle: '#FFFFFF', jewel: '#FFFDF1', motion: 'orbit', texture: 'dust' },
  { id: 'rainbow-prism', name: 'Радужный кристалл', colors: ['#FF8BC7', '#FFC85B', '#64D9E8'], outline: '#8E67CF', glitter: '#FFF2C9', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'sweep', texture: 'facets' },
];

export const thirdStarDesigns: readonly StarDesign[] = [
  { id: 'royal-gold', name: 'Королевское золото', colors: ['#FFF7BD', '#FFD34E', '#B86C09'], outline: '#A66705', glitter: '#FFE278', sparkle: '#FFF9D6', highlight: '#FFFBE0', deep: '#E69B11', glint: '#FFFFFF', jewel: '#FFFDF1', motion: 'sweep', texture: 'dust' },
  { id: 'diamond', name: 'Алмаз', colors: ['#FFFFFF', '#D5EDFF', '#87B6D8'], outline: '#5A8FB5', glitter: '#FFFFFF', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'twinkle', texture: 'gems' },
  { id: 'ruby-crown', name: 'Рубиновая корона', colors: ['#FFD2B7', '#EE506D', '#981D48'], outline: '#85213F', glitter: '#FFD5D1', sparkle: '#FFFFFF', jewel: '#FFF0EB', motion: 'orbit', texture: 'gems' },
  { id: 'sapphire', name: 'Сапфир', colors: ['#BBE2FF', '#438FE5', '#143DAD'], outline: '#173B83', glitter: '#D8EDFF', sparkle: '#FFFFFF', jewel: '#F5FBFF', motion: 'sweep', texture: 'gems' },
  { id: 'emerald-crown', name: 'Изумруд', colors: ['#D4FFE2', '#41CE84', '#08734F'], outline: '#066244', glitter: '#E8FFF0', sparkle: '#FFFFFF', jewel: '#F2FFF6', motion: 'fall', texture: 'gems' },
  { id: 'aurora', name: 'Северное сияние', colors: ['#B8FFF4', '#80BAF6', '#8A68CB'], outline: '#6260A4', glitter: '#D8FFF9', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'sweep', texture: 'rays' },
  { id: 'pink-diamond', name: 'Розовый бриллиант', colors: ['#FFF0F8', '#F5A1C8', '#B952A1'], outline: '#A34087', glitter: '#FFE8F4', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'twinkle', texture: 'gems' },
  { id: 'cosmos', name: 'Космос', colors: ['#A9B4FF', '#625BD4', '#242562'], outline: '#282253', glitter: '#DBCEFF', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'orbit', texture: 'dust' },
  { id: 'phoenix', name: 'Феникс', colors: ['#FFF0A2', '#F9942B', '#C63428'], outline: '#A3291F', glitter: '#FFE4A0', sparkle: '#FFF9DE', jewel: '#FFF7E5', motion: 'sweep', texture: 'rays' },
  { id: 'ocean-pearl', name: 'Океанская жемчужина', colors: ['#F9FFFF', '#9DE8E5', '#3995B9'], outline: '#347B9C', glitter: '#E8FFFF', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'fall', texture: 'dust' },
  // Premium interpretations of the supplied luxury, gem, hologram and award badges.
  { id: 'champion-medal', name: 'Медаль чемпиона', colors: ['#FFF2AA', '#EAB308', '#A85D08'], outline: '#8A4B08', glitter: '#FFF4C2', sparkle: '#FFFFFF', jewel: '#FFFDF1', motion: 'sweep', texture: 'facets', motif: 'medal' },
  { id: 'crown-jewel', name: 'Корона и драгоценность', colors: ['#FFF6BB', '#F6BD36', '#B94E74'], outline: '#9F3D61', glitter: '#FFE8B0', sparkle: '#FFFFFF', jewel: '#FFFDF1', motion: 'orbit', texture: 'gems', motif: 'crown' },
  { id: 'platinum-facet', name: 'Платиновый кристалл', colors: ['#FFFFFF', '#D5E5F5', '#7D94B4'], outline: '#647A9A', glitter: '#FFFFFF', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'twinkle', texture: 'facets' },
  { id: 'opal-hologram', name: 'Опаловая голограмма', colors: ['#FFD5E8', '#B9E9F2', '#BDA9F4'], outline: '#8C77B6', glitter: '#F7F0FF', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'sweep', texture: 'gems' },
  { id: 'solar-crown', name: 'Солнечная корона', colors: ['#FFF8B6', '#FFB928', '#EC6534'], outline: '#B64924', glitter: '#FFF0AC', sparkle: '#FFFFFF', jewel: '#FFFFFF', motion: 'fall', texture: 'rays', motif: 'crown' },
];

export function normalizeStarDesign(value: unknown, level: 2 | 3): string {
  const options = level === 2 ? secondStarDesigns : thirdStarDesigns;
  return options.some((design) => design.id === value) ? value as string : level === 2 ? DEFAULT_SECOND_STAR_DESIGN : DEFAULT_THIRD_STAR_DESIGN;
}

export function getStarDesign(id: string, level: 2 | 3): StarDesign {
  const options = level === 2 ? secondStarDesigns : thirdStarDesigns;
  return options.find((design) => design.id === id) ?? options[0];
}
