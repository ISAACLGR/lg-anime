# AnimeFire Client - Project TODO

## Phase 1: Setup & Branding
- [x] Generate custom app logo and update app.config.ts
- [x] Update theme colors in theme.config.js (purple/pink palette)
- [x] Configure app name and slug in app.config.ts

## Phase 2: Navigation & Layout
- [x] Create tab bar layout with 4 tabs (Home, Explore, Favorites, Settings)
- [x] Create ScreenContainer wrapper for all screens
- [x] Implement bottom tab navigation with icons
- [ ] Create header component with logo and search icon

## Phase 3: Home Screen
- [x] Implement hero banner with anime carousel
- [x] Create "Em Exibição" section with horizontal scroll
- [x] Create "Populares" section
- [ ] Create "Adicionados Recentemente" section
- [x] Add navigation to Anime Detail Screen

## Phase 4: Explore Screen
- [x] Create genre filter buttons
- [x] Create status filter (Em Exibição/Finalizado)
- [x] Create sorting options (nota, data, popularidade)
- [x] Implement anime grid with infinite scroll
- [x] Add navigation to Anime Detail Screen

## Phase 5: Search Screen
- [ ] Create search input with auto-complete
- [ ] Implement real-time search results
- [ ] Display search results in grid
- [ ] Add navigation to Anime Detail Screen

## Phase 6: Anime Detail Screen
- [x] Display anime cover image (full-width)
- [x] Show anime info (title, rating, year, episodes)
- [x] Display genre tags
- [x] Show anime synopsis
- [x] List episodes with status
- [x] Add "Assistir Agora" button
- [x] Add "Adicionar aos Favoritos" button
- [ ] Implement favorite toggle with AsyncStorage

## Phase 7: Episode Player Screen
- [x] Integrate expo-video player
- [ ] Create custom player controls (play, pause, progress)
- [ ] Add fullscreen button
- [x] Show episode information
- [x] Add next/previous episode buttons
- [ ] Implement progress tracking (AsyncStorage)
- [ ] Handle video URL fetching from SugoiAPI

## Phase 8: Favorites Screen
- [x] Display list of favorite animes from AsyncStorage
- [x] Show anime cover, title, and rating
- [x] Add remove from favorites functionality
- [x] Add navigation to Anime Detail Screen

## Phase 9: Settings Screen
- [x] Add theme toggle (light/dark)
- [x] Add video quality selector
- [x] Add cache clear button
- [x] Show app version and info
- [x] Add about section

## Phase 10: API Integration (Jikan API - MyAnimeList)
- [x] Create API client for Jikan API
- [x] Implement anime search functionality
- [x] Implement anime list with pagination
- [x] Handle API errors and loading states
- [x] Integrate Jikan API in Home Screen (airing + popular)
- [x] Integrate Jikan API in Explore Screen (grid with filters)
- [x] Integrate Jikan API in Anime Detail Screen (episodes + info)
- [x] Fetch real episode data from Jikan API

## Phase 11: State Management & Storage
- [x] Setup AsyncStorage for favorites
- [x] Setup AsyncStorage for watch history
- [ ] Setup AsyncStorage for video quality preference
- [ ] Setup AsyncStorage for theme preference
- [ ] Create context/hooks for global state

## Phase 12: UI Polish & Animations
- [ ] Add loading skeletons for anime cards
- [ ] Add smooth transitions between screens
- [ ] Add haptic feedback for interactions
- [ ] Implement pull-to-refresh on Home screen
- [ ] Add error states and empty states

## Phase 13: Testing & Optimization
- [ ] Test on Android device/emulator
- [ ] Test on iOS device (if available)
- [ ] Test on web
- [ ] Optimize image loading and caching
- [ ] Optimize list rendering performance
- [ ] Test all user flows end-to-end

## Phase 14: Final Delivery
- [ ] Create checkpoint
- [ ] Prepare project for deployment
- [ ] Document API usage and setup instructions
- [ ] Verify all features working correctly


## Phase 15: Google Ads (AdMob) Integration
- [x] Install expo-ads-admob package
- [x] Create AdMob configuration with publisher ID and client ID
- [x] Create interstitial ad manager hook
- [x] Implement ad display logic (every 3 episodes)
- [x] Add ad loading and error handling
- [ ] Test ads on Android and web
- [x] Add ad frequency tracking with AsyncStorage
- [x] Handle ad skip/close behavior


## Phase 16: AnFireAPI Integration (Video Link Extraction)
- [x] Create AnFireAPI client for video link extraction
- [x] Implement episode video URL fetching with web scraping
- [x] Integrate video extraction in Player Screen
- [x] Handle multiple video sources/quality options
- [x] Add error handling for video not found
- [x] Fallback to demo video if extraction fails
- [x] Cache video links in AsyncStorage
- [x] Create comprehensive documentation
