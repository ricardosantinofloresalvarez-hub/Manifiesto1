# Manifiesto - Travel Luggage Management PWA

**Manifiesto** es una Progressive Web App (PWA) para gestionar el equipaje de viaje con certificación verificable. Permite a los usuarios crear viajes, gestionar manifiestos de pertenencias con fotografías, y generar certificados PDF con códigos QR y hashes SHA-256 para verificación de autenticidad.

## Características Principales

### ✈️ Gestión de Viajes
- Crear y organizar viajes con destinos, fechas y notas
- Vista de dashboard con todos los viajes activos
- Imágenes de destino para cada viaje

### 📦 Manifiesto de Equipaje
- Catalogar artículos con nombre, categoría, cantidad y valor estimado
- Soporte para números de serie
- Fotografías de artículos (almacenamiento base64)
- Categorías: Electrónica, Ropa, Documentos, Accesorios, Otros

### 🔐 Certificación Verificable
- Generación de PDF certificado con lista completa de artículos
- Hash SHA-256 del manifiesto para verificación de integridad
- Código QR para verificación rápida desde cualquier dispositivo
- Endpoint web público para verificar autenticidad

### 🌍 Multilenguaje
- Español (idioma principal)
- Inglés
- Sistema i18n extensible

### 🌙 Modo Oscuro
- Modo oscuro por defecto
- Alternancia entre modo claro/oscuro
- Persistencia de preferencia

## Tecnologías

### Frontend
- React 18 con TypeScript
- Wouter para routing
- TanStack Query (React Query) para gestión de estado del servidor
- Shadcn/UI + Tailwind CSS para componentes
- i18next para internacionalización
- Framer Motion para animaciones

### Backend
- Express.js con TypeScript
- Almacenamiento en memoria (MemStorage)
- PDFKit para generación de PDFs
- QRCode para generación de códigos QR
- Multer para subida de imágenes
- Crypto (SHA-256) para hashing

## Instalación y Configuración

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5000
```

## Estructura del Proyecto

```
manifiesto/
├── client/
│   └── src/
│       ├── components/      # Componentes reutilizables
│       ├── pages/          # Páginas de la aplicación
│       ├── lib/            # Utilidades y configuración
│       └── hooks/          # Custom hooks
├── server/
│   ├── routes.ts           # Endpoints API
│   ├── storage.ts          # Interfaz de almacenamiento
│   └── index.ts            # Servidor Express
└── shared/
    └── schema.ts           # Esquemas Drizzle y tipos compartidos
```

## API Endpoints

### Usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/:email` - Obtener usuario por email

### Viajes
- `GET /api/trips?userId={id}` - Listar viajes de un usuario
- `GET /api/trips/:id` - Obtener detalles de un viaje
- `POST /api/trips` - Crear nuevo viaje
- `PATCH /api/trips/:id` - Actualizar viaje
- `DELETE /api/trips/:id` - Eliminar viaje

### Artículos de Manifiesto
- `GET /api/trips/:tripId/items` - Listar artículos de un viaje
- `POST /api/trips/:tripId/items` - Añadir artículo al manifiesto
- `PATCH /api/items/:id` - Actualizar artículo
- `DELETE /api/items/:id` - Eliminar artículo

### Certificados
- `POST /api/trips/:tripId/certificate` - Generar certificado PDF
  - Retorna: `{ certificate, pdfUrl, qrCode }`
- `GET /api/verify/:hash` - Verificar manifiesto por hash
  - Retorna: `{ valid, manifestId, userName, tripTitle, itemCount, timestamp, hash }`

### Subida de Imágenes
- `POST /api/upload` - Subir imagen (multipart/form-data)
  - Retorna: `{ imageUrl }` (base64)

## Ejemplos de Uso

### Crear un Usuario

```javascript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    name: 'Juan Pérez'
  })
});
const user = await response.json();
```

### Crear un Viaje

```javascript
const response = await fetch('/api/trips', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    title: 'Vacaciones en Cancún',
    destination: 'Cancún, México',
    startDate: '2025-06-15',
    endDate: '2025-06-22',
    notes: 'Viaje familiar de verano'
  })
});
const trip = await response.json();
```

### Añadir Artículo al Manifiesto

```javascript
const response = await fetch(`/api/trips/${tripId}/items`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Cámara Sony A7 III',
    category: 'electronics',
    quantity: 1,
    estimatedValue: 2000,
    serialNumber: 'SN123456789'
  })
});
const item = await response.json();
```

### Generar Certificado

```javascript
const response = await fetch(`/api/trips/${tripId}/certificate`, {
  method: 'POST'
});
const { certificate, pdfUrl, qrCode } = await response.json();

// Descargar PDF
const link = document.createElement('a');
link.href = pdfUrl;
link.download = `manifiesto-${tripId}.pdf`;
link.click();
```

### Verificar Manifiesto

```javascript
const response = await fetch(`/api/verify/${hash}`);
const result = await response.json();

if (result.valid) {
  console.log('Manifiesto válido:', result);
} else {
  console.log('Manifiesto no encontrado o inválido');
}
```

## Esquema de Datos

### User
```typescript
{
  id: string;
  email: string;
  name: string;
}
```

### Trip
```typescript
{
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string;
  imageUrl?: string;
  createdAt: Date;
}
```

### ManifestItem
```typescript
{
  id: string;
  tripId: string;
  name: string;
  category: string;
  quantity: number;
  estimatedValue?: number;
  serialNumber?: string;
  imageUrl?: string;
  createdAt: Date;
}
```

### ManifestCertificate
```typescript
{
  id: string;
  tripId: string;
  hash: string;
  manifestData: string;
  itemCount: number;
  totalValue?: number;
  verified: boolean;
  createdAt: Date;
}
```

## Flujo de Autenticación

1. Usuario ingresa email y nombre en `/login`
2. Sistema busca usuario existente o crea uno nuevo
3. Información del usuario se almacena en localStorage
4. Usuario es redirigido a `/dashboard`
5. Páginas protegidas verifican autenticación antes de renderizar

## Generación de Certificados

El proceso de certificación incluye:

1. Recopilación de datos del viaje y todos los artículos
2. Creación de objeto JSON con datos completos
3. Generación de hash SHA-256 del JSON
4. Almacenamiento del certificado en base de datos
5. Generación de código QR con URL de verificación
6. Creación de PDF con:
   - Información del viaje
   - Lista completa de artículos
   - Resumen (cantidad total, valor total)
   - Hash SHA-256
   - Código QR para verificación

## Verificación Web

Los usuarios pueden verificar la autenticidad de un manifiesto:

1. Escanear código QR del PDF → redirige a `/verify?hash={hash}`
2. O ingresar hash manualmente en `/verify`
3. Sistema busca certificado por hash
4. Muestra información verificada si existe

## Consideraciones de Seguridad

⚠️ **Nota**: Esta es una versión de demostración/prototipo.

Para producción se recomienda:
- Implementar autenticación real (JWT, OAuth, etc.)
- Añadir autorización a nivel de API
- Migrar a base de datos persistente (PostgreSQL)
- Validar permisos de usuario para cada operación
- Implementar rate limiting
- Añadir HTTPS obligatorio
- Almacenamiento seguro de imágenes (S3, CloudStorage)

## Roadmap Futuro

### Fase 2
- [ ] Autenticación Firebase completa
- [ ] Sincronización offline (Service Workers)
- [ ] Escaneo de códigos de barras
- [ ] Integración con Stripe para pagos
- [ ] Infraestructura PKI para certificados firmados digitalmente
- [ ] App nativa con Expo

### PWA Features
- [ ] Manifest.json para instalación
- [ ] Service Worker para funcionamiento offline
- [ ] Push notifications
- [ ] Compartir certificados via Web Share API

## Licencia

MIT

## Contacto

Para preguntas o sugerencias, por favor abre un issue en el repositorio.

---

**Manifiesto** - Viaja con confianza, verifica con certeza.
