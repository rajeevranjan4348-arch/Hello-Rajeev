# Messaging Application Design Guidelines

## Design Approach
**Reference-Based**: Drawing from WhatsApp, Telegram, and Signal's proven messaging patterns, adapted for phone-based discovery. Focus on speed, clarity, and thumb-friendly mobile interactions.

## Typography System
- **Primary Font**: Inter (Google Fonts)
- **Hierarchy**:
  - Screen Titles: 24px, semibold
  - Contact Names/Chat Titles: 16px, medium
  - Message Text: 15px, regular
  - Timestamps/Metadata: 13px, regular
  - Button Text: 15px, medium

## Layout & Spacing
**Spacing Units**: Tailwind 2, 4, 6, 8 for consistent rhythm
- Screen padding: p-4
- List item padding: p-4
- Component gaps: gap-4
- Section spacing: space-y-6
- Tight groupings: space-y-2

**Container Strategy**:
- Mobile-first: Full width with safe-area padding
- Max-width: max-w-md centered for larger screens
- Bottom navigation: Fixed positioning with safe-area-bottom

## Core Components

### Navigation Structure
**Bottom Tab Bar** (Fixed, 60px height):
- Four primary tabs: Chats, Contacts, Discover, Settings
- Icon + label vertical stack
- Active state: Icon filled, subtle scale
- Include safe-area-inset-bottom

### Search & Discovery
**Universal Search Bar** (Top of most screens):
- Rounded-full pill shape with icon prefix
- Height: 44px (comfortable tap target)
- Placeholder: "Search by phone number..."
- Sticky positioning on scroll

**Phone Number Input**:
- Segmented design: Country code dropdown + number field
- Format as user types: (123) 456-7890
- Instant validation feedback below input

### Chat List View
**Conversation Cards**:
- Full-width pressable area
- Left: 48px circular avatar
- Middle: Name (16px), last message preview (14px, opacity-70), single line ellipsis
- Right: Timestamp (12px), unread badge (circular, 20px min-width)
- Dividers: Subtle, indent after avatar
- Swipe actions: Archive/Delete reveals

### Contact List
**Grouped Alphabetically**:
- Section headers: Sticky, 32px height, uppercase 12px letter
- Contact rows: 64px height, avatar + name + phone number
- Right accessory: Chevron or action button
- Quick alphabet scroll rail on right edge

### Message Thread
**Header**:
- Back button (left), contact name/avatar (center), call/video icons (right)
- Height: 56px
- Semi-transparent background blur when scrolling

**Message Bubbles**:
- Sent: Right-aligned, rounded-2xl with tail
- Received: Left-aligned, rounded-2xl with tail
- Max-width: 75% of screen
- Padding: px-4 py-3
- Timestamp: 11px, outside bubble bottom
- Status indicators: Read receipts (dual check marks)

**Input Composer** (Bottom, fixed):
- Height: Auto-expanding (min 48px, max 120px)
- Left: Attachment icon
- Center: Textarea with placeholder
- Right: Send button (only when text present)
- Safe-area-inset-bottom padding

### Discovery/Search Results
**User Cards**:
- Horizontal layout: Avatar (56px), name, phone number, "Message" button
- Full-width cards with spacing-4 between
- Empty state: Centered illustration + text when no results

### Settings Screen
**Sectioned List**:
- Section headers: Uppercase, 13px, py-2
- Rows: 52px height, icon (left), label, disclosure (right)
- Profile section (top): Large avatar (80px), name, phone, edit button

## Interaction Patterns
- **Pull-to-refresh**: All list views
- **Haptic feedback**: On send, delete, important actions
- **Loading states**: Skeleton screens for lists, spinner for searches
- **Empty states**: Friendly illustrations + descriptive text + action button
- **Onboarding**: Phone verification flow, 3-step wizard, skip option for contacts import

## Images
**No Hero Image Required** - This is a utility app focused on functionality.

**Image Placement**:
1. **Avatars**: Circular throughout (user-generated or initials fallback)
2. **Empty States**: Centered illustrations (400x300px):
   - No conversations: Messaging illustration
   - No contacts: Address book illustration  
   - Search no results: Magnifying glass illustration
3. **Onboarding Screens**: Full-width illustrations above content (300px height)

## Component Specifications

**Buttons**:
- Primary: Rounded-full, h-12, px-8, centered text
- Secondary: Outlined variant, same sizing
- Icon buttons: 44x44px touch target minimum
- Over images: Backdrop-blur-md background

**Form Inputs**:
- Height: 48px
- Rounded: rounded-xl
- Focus: Border emphasis only (no color specified)
- Error state: Border change + helper text below

**Badges/Indicators**:
- Unread count: Circular, min 20px, centered text
- Online status: 10px dot, absolute positioned on avatar bottom-right
- Typing indicator: Animated ellipsis in message area

**Cards**:
- Elevated cards: rounded-xl with subtle shadow
- Pressable states: Scale transform (0.98) on press
- List items: No shadow, border-bottom dividers

## Accessibility
- Minimum touch targets: 44x44px
- Semantic labels for all interactive elements
- Keyboard navigation support
- Screen reader optimized message announcements
- High contrast text ratios throughout
- Clear focus indicators on all inputs

## Mobile Optimization
- Thumb zone: Primary actions within bottom 50% of screen
- One-handed mode considerations: Most-used features accessible from bottom
- Landscape support: Side-by-side conversation + detail view on tablets
- Offline indicators: Banner notification when connection lost
- Optimistic UI: Show sent messages immediately, mark as sending