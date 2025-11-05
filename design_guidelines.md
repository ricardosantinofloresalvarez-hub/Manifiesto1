# Design Guidelines: Manifiesto PWA

## Design Approach

**Hybrid Approach**: Material Design foundation with inspiration from modern travel apps (Airbnb's visual warmth) and productivity tools (Linear's clean hierarchy, Notion's card organization).

**Rationale**: This is a utility-focused app requiring efficiency and clear data organization, but travel context demands visual appeal and trust-building. Material Design provides mobile-optimized patterns while allowing customization for the travel/security certification context.

---

## Core Design Elements

### A. Typography

**Font Family**: 
- Primary: Inter (via Google Fonts CDN)
- Headings: Inter Semi-Bold (600) / Bold (700)
- Body: Inter Regular (400) / Medium (500)

**Scale**:
- H1 (Page Titles): text-3xl (30px) on mobile, text-4xl (36px) on desktop
- H2 (Section Headers): text-2xl (24px) on mobile, text-3xl (30px) on desktop
- H3 (Card Titles): text-xl (20px)
- Body: text-base (16px)
- Small/Meta: text-sm (14px)
- Tiny/Labels: text-xs (12px)

**Hierarchy Rules**:
- Trip titles: Bold, larger
- Item names in manifest: Medium weight
- Metadata (dates, counts): Regular, smaller, muted
- CTAs: Medium weight, slightly larger (text-base or text-lg)

### B. Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Micro spacing (icon gaps, tight lists): p-2, gap-2
- Standard spacing (between form fields, card padding): p-4, gap-4, mb-6
- Section spacing (between major sections): mb-8, py-12, gap-8
- Page padding: p-4 on mobile, p-6 on tablet, p-8 on desktop

**Grid System**:
- Mobile: Single column (grid-cols-1)
- Tablet: 2 columns for trip cards (md:grid-cols-2)
- Desktop: 3 columns for small cards (lg:grid-cols-3)
- Max container width: max-w-7xl for main content areas

**Responsive Breakpoints**:
- Mobile-first design
- md: 768px (tablets)
- lg: 1024px (desktop)

### C. Component Library

**Navigation**:
- Bottom navigation bar (fixed) for mobile with 4 main sections: Trips, Manifests, Verify, Profile
- Icons from Heroicons (outline style)
- Active state: filled icon variant, emphasized text
- Top app bar: page title, back button (when applicable), action buttons (add, settings)

**Trip Cards**:
- Elevated cards with subtle shadow (shadow-md)
- Large thumbnail image (if available) or gradient placeholder
- Trip title (H3), destination, dates (small text)
- Quick stats: item count, verification status badge
- Tap entire card to navigate

**Manifest Item Cards**:
- Compact horizontal cards (list format)
- Thumbnail image (left, 64x64px square)
- Item name, category badge, quantity
- Expandable for full details (value, serial number)
- Swipe actions: edit, delete (mobile pattern)

**Forms**:
- Floating labels on inputs (Material Design pattern)
- Input fields: rounded-lg, border focus with ring
- Group related fields with subtle background containers (bg-opacity-5)
- Photo upload: large dotted border drop zone with camera icon
- Clear validation states (error text-red-500, success text-green-500)

**PDF Generation & Verification**:
- Prominent "Generate Certificate" button (primary CTA)
- QR code display: centered, large (256x256px), white background
- Verification result page: large checkmark/X icon, status message, manifest details in structured format
- Download PDF button: secondary action

**Data Display**:
- Itinerary items: Timeline pattern (vertical line with dots)
- Each itinerary type (flight, hotel, activity) gets distinctive icon
- Collapsible sections for different itinerary categories

**CTAs & Buttons**:
- Primary: rounded-full, py-3, px-6, font-medium
- Secondary: outlined variant (border-2)
- Icon buttons: rounded-full, p-2 or p-3
- Floating Action Button (FAB): fixed bottom-right, rounded-full, shadow-lg (for "Add Item")

**Badges & Tags**:
- Category badges: rounded-full, px-3, py-1, text-xs
- Status indicators: Small dot + text (e.g., "Verified", "Pending")

**Modals/Sheets**:
- Bottom sheets for mobile (slide up from bottom)
- Center modals for desktop/tablet
- Backdrop: dark overlay with backdrop-blur-sm

### D. Animations

**Minimal, Purposeful Motion**:
- Page transitions: Simple fade/slide (150-200ms)
- Card taps: Quick scale down (scale-95) on press
- Sheet appearance: Slide up from bottom (300ms ease-out)
- Loading states: Simple spinner or skeleton screens
- NO scroll-triggered animations
- NO complex parallax effects

---

## Images

**Hero Image**: 
- Landing/welcome screen: Full-width hero (not full viewport, ~60vh) showing travel scene - suitcase, passport, organized packing cubes
- Overlay with semi-transparent gradient for text readability

**Throughout App**:
- Trip cards: User-uploaded destination photos or stock travel imagery
- Manifest items: User-uploaded photos of belongings (clear product shots)
- Empty states: Friendly illustrations (travel-themed, simple line art)
- Verification success page: Checkmark icon, no photo needed

---

## Page-Specific Layouts

**Dashboard (Home)**:
- Welcome header with user name
- "Create New Trip" CTA (prominent)
- Recent trips grid (2-3 cards visible)
- Quick stats section (total items, verified manifests)

**Trip Detail**:
- Cover image (if uploaded) or gradient header
- Trip info card (destination, dates, notes)
- Tabbed interface: Itinerary | Manifest | Settings
- FAB for adding items/itinerary entries

**Manifest View**:
- Filter/sort toolbar (category chips)
- Scrollable list of item cards
- Summary footer: total items, total value
- "Generate Certificate" sticky bottom bar

**Verification Page (/verify/:hash)**:
- Centered layout, max-w-2xl
- Large status indicator (valid/invalid)
- QR code display (if valid)
- Manifest metadata in card format
- Timestamp and user info (privacy-aware)

**Authentication**:
- Centered forms, max-w-md
- Logo/brand at top
- Clear "Don't have an account?" toggle
- Language switcher in top-right corner

---

**Critical Notes**:
- Dark mode as default aesthetic (implement light mode toggle in settings)
- Spanish as primary language, English toggle easily accessible
- All interactive elements min-height 44px (touch target size)
- Use optimistic UI updates for better perceived performance
- Consistent 16:9 aspect ratio for trip images, 1:1 for item photos