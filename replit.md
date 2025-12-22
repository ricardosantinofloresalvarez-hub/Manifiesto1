# Manifiesto - Travel Luggage Management PWA

## Overview
Manifiesto is a Progressive Web App designed to streamline travel luggage management. It allows users to create trips, meticulously catalog their belongings within manifests, and generate verifiable PDF certificates. These certificates include QR codes and SHA-256 hashes for authenticity, significantly enhancing security and peace of mind for travelers. The project aims to revolutionize how travelers manage and certify their luggage contents, offering a robust solution for inventory, security, and verification.

## User Preferences
⚠️ **IMPORTANT: Do not initiate new phases without explicit user approval.**

## Current Progress - Phase 2C (Complete)
**Status: COMPLETED ✅**

**Objective:** Complete elimination of legacy trip-level item management flow.

**Changes made:**
- Removed all legacy imports (useManifestItems, useCreateManifestItem, useUpdateManifestItem, useDeleteManifestItem, useGenerateCertificate, ManifestItemCard, AlertDialog, ITEM_CATEGORIES, etc.)
- Removed all legacy state variables (showAddItemDialog, showEditItemDialog, showDeleteConfirm, editingItem, deletingItemId, generatedHash, formData, showCustomName)
- Removed all legacy hooks (items query, mutations for add/update/delete items, generateCertificateMutation, totalValue calculation)
- Removed all legacy handlers (handleGenerateCertificate, handleAddItem, handleEditItem, handleUpdateItem, handleDeleteItem, confirmDelete)
- Removed legacy JSX (Add/Edit item dialogs, delete confirmation dialog, trip-level manifest section)
- File reduced from ~1559 → ~620 lines
- 0 LSP errors

**Result:** Tab "Manifiesto" now shows ONLY LuggageTab. Items are created exclusively from individual luggage detail dialogs, enforcing the manifest-per-luggage architecture.

## System Architecture
Manifiesto is a full-stack application built with a React frontend and an Express.js backend. It follows a luggage-centric architecture where each piece of luggage can generate its own individual PDF certificate.

**UI/UX Decisions:**
- **Design System:** Utilizes Shadcn/UI components, following Material Design principles with a warm, travel-inspired aesthetic.
- **Theming:** Supports Dark/Light mode.
- **Responsiveness:** Mobile-first responsive design.
- **Typography:** Uses the Inter variable font for a clean, modern look.
- **Color Scheme:** Primary color is a warm orange (#F97316) to evoke travel and adventure.
- **Layout:** Employs card-based layouts and a bottom navigation for mobile usability.

**Technical Implementations & Feature Specifications:**
- **Core Functionality:**
    - Trip management (CRUD operations).
    - Luggage management (CRUD operations) including brand, size, type, color, nickname, and security features (sealed/locked status).
    - Manifest item management (CRUD operations) with categories, values, serial numbers, and photos.
    - Itinerary management with 5 distinct types: Flights, Hotels, Transport, Restaurants, and Activities.
    - PDF certificate generation for individual luggage pieces, including QR codes and SHA-256 hashing.
    - Web-based verification system for certificates using hashes or QR codes, displaying full manifest details and luggage information.
- **Multi-language Support:** i18next for Spanish/English.
- **State Management:** TanStack Query for data fetching, caching, and synchronization.
- **Component Library:** Shadcn/UI for rich and accessible UI components.
- **Firebase Integration:** Direct client-side access to Firestore via custom hooks for all CRUD operations, simplifying the backend to primarily handle PDF generation.

**System Design Choices:**
- **Monorepo Structure:** Frontend and backend reside in the same repository for simplified development.
- **Shared Types:** TypeScript types and schemas are shared between frontend and backend via a `/shared` directory.
- **Firestore-first Approach:** Leverages Firestore as the primary database, with all core application logic interacting directly through custom React hooks.
- **API Endpoints:**
    - `POST /api/users`
    - `GET /api/users/:email`
    - `GET /api/trips?userId={id}`
    - `GET /api/trips/:id`
    - `POST /api/trips`
    - `PATCH /api/trips/:id`
    - `DELETE /api/trips/:id`
    - `GET /api/trips/:tripId/items`
    - `POST /api/trips/:tripId/items`
    - `PATCH /api/items/:id`
    - `DELETE /api/items/:id`
    - `POST /api/luggage/:luggageId/certificate` (NEW, luggage-level certificate generation)
    - `GET /api/verify/:hash`
    - `POST /api/upload`

## External Dependencies
- **Frontend Framework:** React 18
- **Language:** TypeScript
- **Routing:** Wouter
- **Data Fetching/State Management:** TanStack Query
- **UI Component Library:** Shadcn/UI
- **Styling:** Tailwind CSS
- **Backend Framework:** Express.js
- **PDF Generation:** PDFKit, QRCode
- **Database:** Firebase/Firestore (client-side SDK)
- **Authentication:** Firebase Anonymous Auth
- **Internationalization:** i18next