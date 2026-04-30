# AnimeFire Client - Design Document

## Overview

Aplicativo mobile de streaming de anime que consome a SugoiAPI para exibir conteúdo do AnimeFire. Interface moderna inspirada no AnimeFlow (anime-stream-now.base44.app), otimizada para mobile portrait (9:16) e uso com uma mão.

---

## Screen List

1. **Home Screen** - Tela inicial com destaques e categorias
2. **Explore Screen** - Explorar animes por gênero, status e ordenação
3. **Anime Detail Screen** - Detalhes do anime, episódios e player
4. **Episode Player Screen** - Player de vídeo com controles
5. **Favorites Screen** - Lista de animes favoritos
6. **Search Screen** - Busca de animes
7. **Settings Screen** - Configurações da aplicação

---

## Primary Content and Functionality

### 1. Home Screen
**Conteúdo:**
- Header com logo "AnimeFire" e ícone de busca
- Banner rotativo com destaque de animes em exibição
- Seção "Em Exibição" - carousel horizontal de animes
- Seção "Populares" - lista de animes mais assistidos
- Seção "Adicionados Recentemente" - últimos animes adicionados

**Funcionalidade:**
- Navegação por abas (Home, Explore, Favoritos, Configurações)
- Toque em anime → vai para Anime Detail Screen
- Toque em busca → vai para Search Screen

### 2. Explore Screen
**Conteúdo:**
- Filtros: Gênero, Status (Em Exibição/Finalizado), Ordenação
- Grid de animes com capa, título, nota e status
- Infinite scroll para carregar mais animes

**Funcionalidade:**
- Aplicar filtros por gênero (Ação, Aventura, Sobrenatural, etc.)
- Filtrar por status (Em Exibição, Finalizado)
- Ordenar por nota, data de lançamento, popularidade
- Toque em anime → vai para Anime Detail Screen

### 3. Anime Detail Screen
**Conteúdo:**
- Capa do anime (full-width)
- Título, nota (rating), ano, número de episódios
- Gêneros como tags
- Sinopse/descrição
- Lista de episódios com status de assistência
- Botão "Assistir Agora" (primeiro episódio)
- Botão "Adicionar aos Favoritos"

**Funcionalidade:**
- Exibir informações do anime via API
- Listar episódios disponíveis
- Marcar episódios como assistidos (AsyncStorage)
- Toque em episódio → vai para Episode Player Screen
- Toque em "Assistir Agora" → vai para Episode Player Screen (ep 1)

### 4. Episode Player Screen
**Conteúdo:**
- Player de vídeo (expo-video)
- Controles de reprodução (play, pause, progresso)
- Botão de fullscreen
- Informações do episódio (anime, número, título)
- Botão para próximo episódio
- Botão para episódio anterior

**Funcionalidade:**
- Reproduzir vídeo via link da SugoiAPI
- Controlar volume e brilho
- Fullscreen em landscape
- Salvar progresso de assistência (AsyncStorage)
- Navegação entre episódios

### 5. Favorites Screen
**Conteúdo:**
- Lista de animes marcados como favoritos
- Cada item mostra capa, título, última nota
- Opção de remover dos favoritos

**Funcionalidade:**
- Exibir animes salvos em AsyncStorage
- Toque em anime → vai para Anime Detail Screen
- Remover dos favoritos com swipe ou botão

### 6. Search Screen
**Conteúdo:**
- Campo de busca com auto-complete
- Resultados em tempo real
- Grid de animes encontrados

**Funcionalidade:**
- Buscar animes por nome
- Mostrar resultados enquanto digita
- Toque em anime → vai para Anime Detail Screen

### 7. Settings Screen
**Conteúdo:**
- Tema (claro/escuro)
- Qualidade de vídeo padrão
- Limpeza de cache
- Sobre o app
- Versão

**Funcionalidade:**
- Alternar tema claro/escuro
- Selecionar qualidade de vídeo padrão
- Limpar cache de imagens
- Mostrar informações do app

---

## Key User Flows

### Flow 1: Descobrir e Assistir Anime
1. Usuário abre o app → Home Screen
2. Vê carousel de animes em destaque
3. Toca em um anime → Anime Detail Screen
4. Vê sinopse e episódios disponíveis
5. Toca em "Assistir Agora" ou em um episódio → Episode Player Screen
6. Assiste ao episódio com controles de player

### Flow 2: Explorar por Gênero
1. Usuário toca em "Explorar" → Explore Screen
2. Seleciona gênero (ex: Ação)
3. Vê grid de animes do gênero
4. Toca em um anime → Anime Detail Screen
5. Assiste aos episódios

### Flow 3: Gerenciar Favoritos
1. Usuário está em Anime Detail Screen
2. Toca em "Adicionar aos Favoritos" (ícone de coração)
3. Anime é salvo em AsyncStorage
4. Usuário toca em "Favoritos" na aba → Favorites Screen
5. Vê lista de animes salvos
6. Pode remover dos favoritos

### Flow 4: Buscar Anime Específico
1. Usuário toca em ícone de busca → Search Screen
2. Digita nome do anime
3. Vê resultados em tempo real
4. Toca em um resultado → Anime Detail Screen

---

## Color Choices

**Brand Colors (Inspirado em AnimeFlow):**
- **Primary**: `#7C3AED` (Purple/Violet) - Botões, destaques, ícones ativos
- **Secondary**: `#EC4899` (Pink) - Acentos, hover states
- **Background**: `#0F172A` (Dark Navy) - Fundo principal
- **Surface**: `#1E293B` (Slate Dark) - Cards, superfícies elevadas
- **Foreground**: `#F1F5F9` (Slate Light) - Texto principal
- **Muted**: `#94A3B8` (Slate Gray) - Texto secundário
- **Success**: `#10B981` (Emerald) - Status positivo
- **Warning**: `#F59E0B` (Amber) - Avisos
- **Error**: `#EF4444` (Red) - Erros

**Gradientes:**
- Hero gradient: Purple → Pink (para banners)
- Background gradient: Dark Navy → Slate (para profundidade)

---

## Design Principles

1. **Mobile-First**: Otimizado para portrait (9:16), uso com uma mão
2. **Apple HIG Compliance**: Seguir padrões iOS (spacing, typography, interactions)
3. **Dark Theme**: Tema escuro como padrão (melhor para streaming de vídeo)
4. **Minimal & Clean**: Interface limpa, sem poluição visual
5. **Fast & Responsive**: Transições suaves, feedback imediato
6. **Accessibility**: Contraste adequado, toques generosos (min 44pt)

---

## Typography

- **Heading 1**: 32px, Bold (titles principais)
- **Heading 2**: 24px, Semibold (seções)
- **Heading 3**: 18px, Semibold (subtítulos)
- **Body**: 16px, Regular (texto principal)
- **Caption**: 14px, Regular (texto secundário)
- **Tiny**: 12px, Regular (labels, badges)

---

## Spacing & Layout

- **Padding**: 16px (padrão), 8px (compacto), 24px (generoso)
- **Gap entre elementos**: 12px (padrão)
- **Border Radius**: 12px (cards), 8px (botões), 4px (inputs)
- **Safe Area**: Respeitado em todas as telas

---

## Components

- **Buttons**: Primary (purple), Secondary (outlined), Tertiary (text-only)
- **Cards**: Capa + overlay com título/nota
- **Chips/Tags**: Gêneros, status
- **Carousel**: Horizontal scroll para destaques
- **Grid**: 2-3 colunas para animes (responsivo)
- **Tab Bar**: 4 abas (Home, Explore, Favoritos, Configurações)
- **Player**: Controles customizados (play, pause, progresso, fullscreen)

---

## API Integration Points

- **GET /episode/:anime-slug/:temporada/:numero-episodio** - Buscar links de episódios
- **GET /animes** (esperado) - Listar animes
- **GET /anime/:slug** (esperado) - Detalhes do anime
- **GET /search?q=:query** (esperado) - Buscar animes

---

## Performance Considerations

- Lazy load imagens (expo-image com placeholder)
- Cache de imagens (AsyncStorage ou expo-cache)
- Infinite scroll com pagination
- Memoização de componentes (React.memo)
- FlatList para listas longas (nunca ScrollView + map)

---

## Accessibility

- Contraste WCAG AA (4.5:1 para texto)
- Toques mínimos de 44x44pt
- Labels descritivos para ícones
- Suporte a leitura de tela (accessibilityLabel)
- Modo escuro nativo

