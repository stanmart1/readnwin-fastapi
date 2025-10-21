# ReadnWin React Frontend

Modern React frontend for the ReadnWin FastAPI application with Framer Motion animations.

## Features

- ✅ React 18 with Vite
- ✅ Framer Motion animations
- ✅ Tailwind CSS styling
- ✅ React Router for navigation
- ✅ Axios for API calls
- ✅ Responsive design
- ✅ Smooth animations and transitions

## Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

The app will run on `http://localhost:3000`

3. **Build for production:**
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Navigation header
│   │   ├── HeroSection.jsx     # Hero banner with animations
│   │   ├── FeaturedBooks.jsx   # Book showcase
│   │   └── Footer.jsx          # Site footer
│   ├── pages/
│   │   └── Home.jsx            # Homepage
│   ├── styles/
│   │   └── index.css           # Global styles
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # Entry point
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Components

### Header
- Sticky navigation
- Mobile responsive menu
- Cart icon with badge
- Login/Signup buttons

### HeroSection
- Full-screen gradient background
- Animated headline
- Floating book cards
- CTA buttons
- Decorative elements

### FeaturedBooks
- Category tabs (Featured, Bestsellers, New)
- Book grid with hover effects
- API integration
- Loading states

### Footer
- Brand information
- Social media links
- Legal links
- Animated heart icon

## Animations

All animations use **Framer Motion**:

- Page load animations (fade in, slide up)
- Hover effects (scale, lift)
- Floating book cards
- Pulse decorative elements
- Smooth transitions

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000`

Endpoints used:
- `GET /api/books` - Fetch books

## Styling

- **Tailwind CSS** for utility-first styling
- **Custom gradients** (blue to purple)
- **Responsive breakpoints** (sm, md, lg, xl)
- **Custom animations** (float, pulse)

## Color Scheme

- Primary: Blue (#2563eb) to Purple (#9333ea)
- Background: White (#ffffff)
- Text: Gray-900 (#111827)
- Accent: Blue-600, Purple-600

## Development

The Vite dev server includes:
- Hot Module Replacement (HMR)
- Fast refresh
- Proxy to FastAPI backend
- Optimized builds

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Lazy loading images
- Code splitting
- Optimized animations
- Minimal bundle size
