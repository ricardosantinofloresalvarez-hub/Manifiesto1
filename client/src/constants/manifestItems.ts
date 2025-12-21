export const LUGGAGE_BRANDS = [
  'Samsonite',
  'Rimowa',
  'Tumi',
  'Away',
  'Briggs & Riley',
  'American Tourister',
  'Delsey',
  'Travelpro',
  'SwissGear',
  'Kenneth Cole',
  'AmazonBasics',
  'Rockland',
  'Coolife',
  'Sin marca',
  'Otra',
] as const;

export const ELECTRONICS_BRANDS = [
  'Apple',
  'Samsung',
  'Sony',
  'Canon',
  'Nikon',
  'HP',
  'Dell',
  'Lenovo',
  'Bose',
  'JBL',
  'Anker',
  'Sin marca',
  'Otra',
] as const;

export const CLOTHING_BRANDS = [
  'Nike',
  'Adidas',
  'Puma',
  'Zara',
  'H&M',
  'Gap',
  "Levi's",
  'Tommy Hilfiger',
  'Polo Ralph Lauren',
  'Calvin Klein',
  'Gucci',
  'Louis Vuitton',
  'Sin marca',
  'Otra',
] as const;

export const BEAUTY_BRANDS = [
  'MAC',
  'Maybelline',
  "L'Oréal",
  'Clinique',
  'Estée Lauder',
  'Chanel',
  'Dior',
  'Lancôme',
  'Neutrogena',
  'Dove',
  'Pantene',
  'Gillette',
  'Sin marca',
  'Otra',
] as const;

// Tipos de maletas donde van los artículos
export const LUGGAGE_TYPES = [
  'Maleta de mano',
  'Maleta mediana',
  'Maleta grande',
  'Maleta extra grande',
  'Mochila de viaje',
  'Bolso de mano',
  'Neceser',
] as const;

export const ITEM_CATEGORIES = {
  electronics: {
    label: 'Electrónicos',
    icon: '📱',
    suggestions: [
      'Laptop',
      'Cámara',
      'Celular',
      'Cargadores',
      'Audífonos',
      'Tablet',
      'Power Bank',
      'Reloj inteligente',
      'Kindle/E-reader',
    ],
    brands: ELECTRONICS_BRANDS,
  },
  clothing: {
    label: 'Ropa',
    icon: '👕',
    suggestions: [
      'Camisas',
      'Camisetas',
      'Pantalones',
      'Jeans',
      'Shorts',
      'Vestidos',
      'Faldas',
      'Ropa interior',
      'Calcetines',
      'Traje de baño',
      'Pijama',
      'Sudadera',
      'Chaqueta/Abrigo',
    ],
    brands: CLOTHING_BRANDS,
  },
  footwear: {
    label: 'Calzado',
    icon: '👟',
    suggestions: [
      'Zapatos formales',
      'Zapatos deportivos',
      'Tenis',
      'Sandalias',
      'Chanclas',
      'Botas',
    ],
    brands: CLOTHING_BRANDS,
  },
  beauty: {
    label: 'Belleza e Higiene',
    icon: '💄',
    suggestions: [
      'Maquillaje',
      'Base',
      'Labial',
      'Rímel',
      'Sombras',
      'Perfume/Colonia',
      'Cepillo de dientes',
      'Pasta dental',
      'Shampoo',
      'Acondicionador',
      'Jabón',
      'Desodorante',
      'Crema facial',
      'Protector solar',
      'Cepillo/Peine',
      'Secadora de pelo',
      'Plancha de pelo',
      'Toallas sanitarias',
    ],
    brands: BEAUTY_BRANDS,
  },
  documents: {
    label: 'Documentos',
    icon: '📄',
    suggestions: [
      'Pasaporte',
      'Visa',
      'Boletos de avión',
      'Reservas de hotel',
      'Seguro de viaje',
      'Licencia de conducir',
      'Tarjetas de crédito',
      'Efectivo',
    ],
    brands: [] as readonly string[],
  },
  accessories: {
    label: 'Accesorios',
    icon: '💼',
    suggestions: [
      'Reloj',
      'Gafas de sol',
      'Gafas graduadas',
      'Billetera',
      'Cinturón',
      'Bolso/Cartera',
      'Mochila',
      'Joyería',
      'Llaves',
      'Paraguas',
    ],
    brands: CLOTHING_BRANDS,
  },
  medicine: {
    label: 'Medicamentos',
    icon: '💊',
    suggestions: [
      'Vitaminas',
      'Analgésicos',
      'Antihistamínicos',
      'Medicamentos recetados',
      'Botiquín primeros auxilios',
    ],
    brands: [] as readonly string[],
  },
  other: {
    label: 'Otros',
    icon: '🎒',
    suggestions: [
      'Libros',
      'Juguetes',
      'Equipaje vacío',
      'Souvenirs',
    ],
    brands: [] as readonly string[],
  },
} as const;

export type ItemCategory = keyof typeof ITEM_CATEGORIES;

export const LUGGAGE_COLORS = [
  'Negro',
  'Azul',
  'Rojo',
  'Gris',
  'Verde',
  'Rosa',
  'Morado',
  'Naranja',
  'Blanco',
  'Café/Marrón',
  'Dorado',
  'Plateado',
  'Multicolor',
  'Otro',
] as const;

export const LUGGAGE_SIZES = [
  { value: 'small', label: 'Pequeña (cabina)' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
  { value: 'xlarge', label: 'Extra Grande' },
] as const;

export const LUGGAGE_TYPE_OPTIONS = [
  { value: 'cabin', label: 'Equipaje de mano' },
  { value: 'checked', label: 'Equipaje documentado' },
  { value: 'backpack', label: 'Mochila' },
  { value: 'handbag', label: 'Bolso/Cartera' },
] as const;

export type LuggageColor = typeof LUGGAGE_COLORS[number];
export type LuggageSize = typeof LUGGAGE_SIZES[number]['value'];
export type LuggageType = typeof LUGGAGE_TYPE_OPTIONS[number]['value'];