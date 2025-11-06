# Manifiesto - Travel Luggage Management PWA

## Project Overview

Manifiesto is a Progressive Web App for managing travel luggage with verifiable certification. Users can create trips, catalog belongings in manifests with photographs, and generate certified PDF documents with QR codes and SHA-256 hashes for authenticity verification.

## Current Status

🔄 **Firebase/Firestore Migration in Progress (Client-Side Architecture)**

### Completed Features:
- Full-stack application with Express backend and React frontend
- **Firebase Authentication** (Anonymous Auth for demo/MVP)
- **Firestore Database** for persistent data storage (test mode enabled)
- Trip management (CRUD operations)
- Manifest item management with categories, values, and luggage metadata
  - Editable quantity and value fields (fixed form input bug)
  - Luggage description: brand, size (Pequeña/Mediana/Grande/Extra Grande)
  - Security features: sealed status (Sellada) and lock status (Con Candado)
- **Itinerary Management** with 5 types:
  - ✈️ Flights (airline, flight number, departure/arrival)
  - 🏨 Hotels (name, address, check-in/out dates)
  - 🚗 Transport (type, company, departure/arrival)
  - 🍽️ Restaurants (name, address, reservation time)
  - 🎯 Activities (name, location, scheduled time)
- PDF certificate generation with QR codes and SHA-256 hashing
  - Includes all luggage metadata in certificate
- Web-based verification system
  - Full manifest item display with luggage details
  - Shows destination, total value, and individual item metadata
- Multi-language support (Spanish/English)
- Dark/Light mode theming
- Mobile-first responsive design

### Tech Stack:
- **Frontend**: React 18, TypeScript, Wouter, TanStack Query, Shadcn/UI, Tailwind CSS
- **Backend**: Express.js, TypeScript, PDFKit, QRCode, Multer (PDF generation only)
- **Database**: Firebase/Firestore (direct client-side access via custom hooks)
- **Authentication**: Firebase Anonymous Auth
- **Languages**: i18next for Spanish/English support

### Firestore Integration:
- **✅ Completed**: Custom hooks for Firestore CRUD operations
  - `useTrips`, `useManifestItems`, `useItineraries`, `useCertificates`
  - All hooks use Firestore SDK directly from frontend
- **✅ Completed**: Backend simplified to only handle PDF generation and uploads
- **🔄 In Progress**: Updating all components to use new Firestore hooks
  - ✅ Dashboard.tsx (completed)
  - ⏳ TripDetail.tsx (pending)
  - ⏳ ItineraryTab.tsx (pending)
  - ⏳ Verify.tsx (pending - needs useCertificateByHash)

## Project Structure

```
/client              - React frontend
  /src
    /components      - Reusable UI components
    /pages          - Main application pages
    /lib            - Utilities (auth, i18n, queryClient)
    /hooks          - Custom React hooks

/server             - Express backend
  routes.ts         - API endpoints
  storage.ts        - Storage interface and implementation
  index.ts          - Server configuration

/shared             - Shared types and schemas
  schema.ts         - Drizzle schemas and types
```

## Key API Endpoints

### Users
- POST /api/users - Create user
- GET /api/users/:email - Get user by email

### Trips
- GET /api/trips?userId={id} - List user's trips
- GET /api/trips/:id - Get trip details
- POST /api/trips - Create trip
- PATCH /api/trips/:id - Update trip
- DELETE /api/trips/:id - Delete trip

### Manifest Items
- GET /api/trips/:tripId/items - List trip items
- POST /api/trips/:tripId/items - Add item
- PATCH /api/items/:id - Update item
- DELETE /api/items/:id - Delete item

### Certificates
- POST /api/trips/:tripId/certificate - Generate PDF certificate
- GET /api/verify/:hash - Verify manifest by hash

### Uploads
- POST /api/upload - Upload images (multipart/form-data)

## Data Models

### User
- id, email, name

### Trip
- id, userId, title, destination, startDate, endDate, notes, imageUrl, createdAt

### ManifestItem
- id, tripId, name, category, quantity, estimatedValue, serialNumber, imageUrl, createdAt
- **Luggage Metadata** (optional):
  - luggageBrand: string (e.g., "Samsonite", "Tumi")
  - luggageSize: string enum (small/medium/large/xlarge)
  - isSealed: boolean (security seal status)
  - isLocked: boolean (lock/padlock status)

### ManifestCertificate
- id, tripId, hash, manifestData, itemCount, totalValue, verified, createdAt

## Design System

### Colors
- Primary: Warm orange (#F97316) for travel/adventure feel
- Background: Dark mode by default
- Following Material Design principles with Airbnb warmth

### Typography
- Font: Inter (variable font)
- Hierarchy: Bold headings, regular body, muted secondary text

### Components
- Using Shadcn/UI components
- Custom travel-themed icons
- Bottom navigation for mobile
- Card-based layouts

## User Flows

### 1. Onboarding
Welcome → Login (email/name) → Dashboard

### 2. Trip Creation
Dashboard → Create Trip Dialog → Enter details → Save → View Trip

### 3. Manifest Management
Trip Detail → Add Items → Enter item details (name, category, quantity, value, serial) → Optional: Add luggage metadata (brand, size, sealed, locked) → Save

Items can be edited to update any field including quantity and luggage information.

### 4. Certificate Generation
Trip Detail → Manifest Tab → Generate Certificate → Download PDF

### 5. Verification
Anyone → Verify Page → Enter hash OR Scan QR → View verification result with:
- Trip details (title, destination, user)
- Complete item list with all metadata
- Luggage details (brand, size, security features)
- Total value and item count

## Known Limitations (Demo/Prototype)

1. **Storage**: Uses Firestore in test mode (30-day unrestricted access)
2. **Authentication**: Firebase Anonymous Auth (no real user accounts)
3. **Authorization**: Firestore test mode allows unrestricted read/write access
4. **Image Storage**: Base64 in Firestore, not suitable for production scale
5. **Validation**: Limited validation on PATCH endpoints
6. **Backend**: Firebase Admin initialized without full credentials (limited functionality)

## Future Enhancements (Phase 2)

### Security & Infrastructure
- [x] Migrate to Firestore database (✅ Completed - test mode)
- [x] Implement Firebase Authentication (✅ Completed - Anonymous Auth)
- [ ] Configure Firebase production security rules
- [ ] Migrate to proper Firebase Auth (email/password, Google sign-in)
- [ ] Set up Firebase Admin with Service Account credentials
- [ ] Store images in Firebase Storage (currently using Base64)
- [ ] Add input validation for all endpoints
- [ ] Implement rate limiting

### PWA Features
- [ ] Add manifest.json for installability
- [ ] Implement Service Worker for offline support
- [ ] Add push notifications
- [ ] Enable Web Share API for sharing certificates

### Advanced Features
- [ ] Barcode/QR scanning for items
- [ ] Stripe integration for premium features
- [ ] PKI infrastructure for digital signatures
- [ ] Expo native app wrapper
- [ ] Advanced offline synchronization
- [ ] Multi-user collaboration on trips

### UX Improvements
- [ ] Bulk item import
- [ ] Templates for common trip types
- [ ] Photo gallery for trip memories
- [ ] Export options (CSV, JSON)
- [ ] Print-friendly manifest views

## Development Notes

### Running the Application
```bash
npm run dev
```
Application runs on port 5000

### Architecture Decisions

1. **Monorepo Structure**: Frontend and backend in same repo for easier development
2. **Firebase/Firestore**: Using Firestore from frontend (client-side SDK) for MVP simplicity
   - Backend uses Firebase Admin SDK (limited mode without service account)
   - Production will need Firebase Admin with full credentials
3. **Shared Types**: TypeScript types shared between frontend/backend via /shared
4. **React Query**: Automatic caching, refetching, and state management for server data
5. **Base64 Images**: Simplifies demo, but should migrate to Firebase Storage for production
6. **Form Input Strategy**: Quantity and value fields use string state internally, converted to numbers for API to fix editability issues in controlled inputs

### Testing Strategy

The application is designed to support future testing:
- `data-testid` attributes on all interactive elements
- Playwright-ready for E2E testing
- Clear separation of concerns for unit testing

## Deployment Considerations

For production deployment:

1. Set up PostgreSQL database
2. Configure environment variables (DATABASE_URL, SESSION_SECRET)
3. Enable HTTPS
4. Set up cloud storage for images
5. Implement proper authentication
6. Add monitoring and logging
7. Set up CDN for static assets
8. Configure CORS policies
9. Add API rate limiting
10. Implement backup strategy

## Contributing

This is a demo/prototype application. For production use, please address the security and infrastructure limitations noted above.
