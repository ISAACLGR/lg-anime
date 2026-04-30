# AnimeFire Client - Architecture Document

## Project Structure

```
animeFireApiCliente/
├── app/                           # Expo Router screens
│   ├── _layout.tsx               # Root layout with providers
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── index.tsx             # Home screen
│   │   ├── explore.tsx           # Explore/Browse screen
│   │   ├── favorites.tsx         # Favorites screen
│   │   └── settings.tsx          # Settings screen
│   ├── anime/                    # Anime detail screen
│   │   └── [slug].tsx            # Dynamic anime detail route
│   └── player/                   # Episode player screen
│       └── [slug].tsx            # Dynamic player route
├── components/
│   ├── screen-container.tsx      # SafeArea wrapper
│   ├── themed-view.tsx           # Themed background view
│   ├── ui/
│   │   ├── icon-symbol.tsx       # Icon mapping
│   │   ├── anime-card.tsx        # Anime card component
│   │   ├── carousel.tsx          # Horizontal carousel
│   │   ├── episode-list.tsx      # Episode list component
│   │   ├── filter-chips.tsx      # Genre/status filter chips
│   │   ├── video-player.tsx      # Custom video player
│   │   └── loading-skeleton.tsx  # Loading placeholder
│   ├── sections/
│   │   ├── hero-banner.tsx       # Hero banner with carousel
│   │   ├── anime-section.tsx     # Reusable anime section
│   │   └── search-bar.tsx        # Search input component
│   └── layout/
│       ├── header.tsx            # App header
│       └── tab-bar.tsx           # Custom tab bar (if needed)
├── lib/
│   ├── api/
│   │   ├── sugoiapi.ts          # SugoiAPI client
│   │   ├── animefire.ts         # AnimeFire scraper (if needed)
│   │   └── types.ts             # API response types
│   ├── storage/
│   │   ├── favorites.ts         # Favorites storage
│   │   ├── history.ts           # Watch history storage
│   │   ├── preferences.ts       # User preferences storage
│   │   └── cache.ts             # Image cache management
│   ├── hooks/
│   │   ├── use-anime-list.ts    # Fetch anime list
│   │   ├── use-episode-links.ts # Fetch episode links
│   │   ├── use-favorites.ts     # Manage favorites
│   │   ├── use-history.ts       # Manage watch history
│   │   └── use-preferences.ts   # Manage preferences
│   ├── context/
│   │   ├── favorites-context.tsx # Favorites state
│   │   ├── history-context.tsx   # History state
│   │   └── preferences-context.tsx # Preferences state
│   ├── utils/
│   │   ├── string.ts            # String utilities
│   │   ├── format.ts            # Formatting utilities
│   │   └── validation.ts        # Validation utilities
│   ├── trpc.ts                  # tRPC client (if using backend)
│   └── utils.ts                 # General utilities (cn, etc.)
├── constants/
│   ├── theme.ts                 # Theme colors
│   ├── genres.ts                # Genre list
│   └── config.ts                # App configuration
├── hooks/
│   ├── use-auth.ts              # Auth hook
│   ├── use-colors.ts            # Theme colors hook
│   ├── use-color-scheme.ts      # Dark/light mode hook
│   └── use-safe-area.ts         # Safe area hook
├── assets/
│   ├── images/
│   │   ├── icon.png             # App icon
│   │   ├── splash-icon.png      # Splash screen
│   │   ├── favicon.png          # Web favicon
│   │   ├── android-icon-*.png   # Android icons
│   │   └── logo.png             # App logo
│   └── fonts/                   # Custom fonts (if any)
├── app.config.ts                # Expo configuration
├── tailwind.config.js           # Tailwind configuration
├── theme.config.js              # Theme tokens
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── design.md                    # Design document
├── API_DOCS.md                  # API documentation
└── ARCHITECTURE.md              # This file
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React Native + Expo 54 | Cross-platform mobile/web |
| **Routing** | Expo Router 6 | File-based routing |
| **Styling** | NativeWind 4 (Tailwind CSS) | Utility-first styling |
| **State** | React Context + AsyncStorage | Local state management |
| **API Client** | Axios | HTTP requests |
| **Video** | expo-video | Video playback |
| **Storage** | AsyncStorage | Local persistence |
| **Type Safety** | TypeScript 5.9 | Type checking |

---

## Data Flow

### 1. Anime Discovery Flow
```
User opens app
  ↓
Home Screen loads
  ↓
Fetch featured animes (cached or from scraper)
  ↓
Display carousel + sections
  ↓
User taps anime
  ↓
Navigate to Anime Detail Screen
```

### 2. Episode Fetching Flow
```
User on Anime Detail Screen
  ↓
Fetch episode list (from cache or scraper)
  ↓
User taps "Assistir Agora" or episode
  ↓
Fetch episode links from SugoiAPI
  ↓
Navigate to Player Screen with video URL
  ↓
Player loads and plays video
```

### 3. Favorites Flow
```
User on Anime Detail Screen
  ↓
User taps "Adicionar aos Favoritos"
  ↓
Save to AsyncStorage + update context
  ↓
Update UI (heart icon filled)
  ↓
User can view in Favorites Screen
```

### 4. Search Flow
```
User taps search icon
  ↓
Navigate to Search Screen
  ↓
User types query
  ↓
Filter cached anime list or fetch from API
  ↓
Display results in grid
  ↓
User taps result
  ↓
Navigate to Anime Detail Screen
```

---

## State Management Strategy

### Local State (React.useState)
- UI state (loading, error, filters)
- Form inputs
- Modal visibility

### Context State (React.Context)
- **FavoritesContext**: List of favorite anime slugs
- **HistoryContext**: Watch history (anime slug, episode, timestamp)
- **PreferencesContext**: User settings (theme, video quality)

### Persistent State (AsyncStorage)
- Favorites list
- Watch history
- User preferences
- Cached anime data

### Server State (if backend is used)
- User account data
- Sync favorites across devices
- Recommendations

---

## API Integration

### SugoiAPI Client (`lib/api/sugoiapi.ts`)

```typescript
interface EpisodeLink {
  provider: string;
  url: string;
  hasAds: boolean;
  isEmbed: boolean;
}

interface EpisodeResponse {
  error: boolean;
  message: string;
  status: number;
  data: Array<{
    name: string;
    slug: string;
    has_ads: boolean;
    is_embed: boolean;
    episodes: Array<{
      error: boolean;
      searched_endpoint: string;
      episode: string;
    }>;
  }>;
}

export async function getEpisodeLinks(
  animeSlug: string,
  season: number,
  episode: number
): Promise<EpisodeLink[]>
```

### AnimeFire Scraper (Optional)

If SugoiAPI doesn't provide anime listing, we'll need to scrape AnimeFire:
- Fetch anime list with metadata (title, cover, rating, genres)
- Extract anime slugs
- Cache results locally

---

## Component Architecture

### Screen Components
Each screen uses `ScreenContainer` for proper SafeArea handling:
```tsx
<ScreenContainer className="p-4">
  {/* Content */}
</ScreenContainer>
```

### Reusable Components
- **AnimeCard**: Displays anime with cover, title, rating
- **Carousel**: Horizontal scrollable list
- **EpisodeList**: Vertical list of episodes with status
- **FilterChips**: Genre/status filter buttons
- **VideoPlayer**: Custom player wrapper around expo-video
- **LoadingSkeleton**: Placeholder while loading

### Layout Components
- **Header**: App logo + search icon
- **TabBar**: Bottom navigation (Home, Explore, Favorites, Settings)

---

## Styling Approach

### Color System
Defined in `theme.config.js` and used via Tailwind classes:
```tsx
<View className="bg-background text-foreground">
  <Text className="text-primary font-bold">Title</Text>
</View>
```

### Responsive Design
- Mobile-first approach
- Tailwind breakpoints for web
- Safe area handling for notches

### Dark Mode
- Automatic via system preference
- Toggle in Settings screen
- CSS variables for theme switching

---

## Performance Optimization

### Image Optimization
- Use `expo-image` with placeholder
- Lazy load images (FlatList)
- Cache images locally

### List Optimization
- Use `FlatList` for long lists (never `ScrollView` + `.map()`)
- Implement pagination/infinite scroll
- Memoize components with `React.memo`

### API Optimization
- Cache responses in AsyncStorage
- Implement request deduplication
- Add retry logic for failed requests

### Bundle Optimization
- Code splitting via Expo Router
- Tree-shaking unused code
- Minimize dependencies

---

## Error Handling

### API Errors
```typescript
try {
  const links = await getEpisodeLinks(slug, season, episode);
} catch (error) {
  // Show error toast/modal
  // Offer retry option
  // Fall back to cached data if available
}
```

### Network Errors
- Detect offline state
- Show offline indicator
- Queue actions for when online

### Player Errors
- Handle video load failures
- Try alternative providers
- Show error message with retry

---

## Testing Strategy

### Unit Tests
- Utility functions
- API client methods
- Storage operations

### Integration Tests
- User flows (search → detail → player)
- State management
- AsyncStorage persistence

### E2E Tests
- Full app flows on device/emulator
- Video playback
- Favorites management

---

## Deployment

### Build Process
```bash
# Web
expo export --platform web

# Android
eas build --platform android

# iOS
eas build --platform ios
```

### Environment Configuration
- API endpoints in `.env`
- Feature flags
- Analytics keys

---

## Future Enhancements

1. **User Accounts**: OAuth login, sync across devices
2. **Recommendations**: ML-based anime suggestions
3. **Social Features**: Share anime, reviews, ratings
4. **Offline Mode**: Download episodes for offline viewing
5. **Advanced Search**: Full-text search with filters
6. **Multiple Languages**: i18n support
7. **Notifications**: New episode alerts
8. **Subtitles**: Multiple subtitle support

