# Theming System Documentation

## Overview

The platform now includes a comprehensive theming system with:
- **Dark Mode** support (Light, Dark, System)
- **Multiple Color Schemes** (Blue, Purple, Green, Orange, Red)
- **Persistent Preferences** (saved in localStorage)
- **Smooth Transitions** between themes

## Features

### 1. Dark Mode
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes, reduced eye strain
- **System Mode**: Automatically follows your OS/browser preference

### 2. Color Schemes
Choose from 5 beautiful color schemes:
- **Blue** (Default) - Professional and trustworthy
- **Purple** - Creative and modern
- **Green** - Fresh and natural
- **Orange** - Energetic and warm
- **Red** - Bold and attention-grabbing

### 3. Theme Controls
Located in the header navigation:
- **Theme Toggle**: Switch between Light/Dark/System
- **Color Scheme Selector**: Choose your preferred color palette

## Usage

### Theme Toggle Component
```tsx
import ThemeToggle from '../components/ThemeToggle'

<ThemeToggle />
```

### Theme Selector Component
```tsx
import ThemeSelector from '../components/ThemeSelector'

<ThemeSelector />
```

### Using Theme Context
```tsx
import { useTheme } from '../contexts/ThemeContext'

function MyComponent() {
  const { theme, colorScheme, isDark, setTheme, setColorScheme, toggleTheme } = useTheme()
  
  return (
    <div className={isDark ? 'dark-mode-class' : 'light-mode-class'}>
      Current theme: {theme}
    </div>
  )
}
```

## Implementation Details

### Theme Context
- **Location**: `client/contexts/ThemeContext.tsx`
- **Provider**: Wraps the entire app in `_app.tsx`
- **State Management**: React Context API
- **Persistence**: localStorage

### Components
- **ThemeToggle**: Three-button toggle (Light/Dark/System)
- **ThemeSelector**: Dropdown menu for color schemes
- **ThemeSettings**: Combined component with both controls

### Styling
- **Tailwind Dark Mode**: Class-based (`dark:` prefix)
- **CSS Variables**: Dynamic color scheme support
- **Smooth Transitions**: 200ms transitions for all theme changes

## Dark Mode Classes

All components support dark mode using Tailwind's `dark:` prefix:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

## Color Scheme Implementation

Color schemes are applied via data attributes:
```html
<html data-color-scheme="blue">
```

CSS variables are used for dynamic theming:
```css
[data-color-scheme="blue"] {
  --theme-primary: 14, 165, 233;
}
```

## Customization

### Adding New Color Schemes

1. Update `ThemeContext.tsx`:
```tsx
type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'your-color'
```

2. Add to `ThemeSelector.tsx`:
```tsx
{ name: 'Your Color', value: 'your-color' as const, color: '#hexcode' }
```

3. Add CSS variables in `themes.css`:
```css
[data-color-scheme="your-color"] {
  --theme-primary: r, g, b;
}
```

### Custom Theme Colors

Modify `tailwind.config.js` to add custom colors:
```js
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

## Browser Support

- **Modern Browsers**: Full support
- **localStorage**: Required for persistence
- **CSS Custom Properties**: Used for color schemes
- **prefers-color-scheme**: Used for system theme detection

## Accessibility

- **High Contrast**: Dark mode improves readability
- **Keyboard Navigation**: All theme controls are keyboard accessible
- **Screen Readers**: Proper ARIA labels on all controls
- **Focus Indicators**: Visible focus states

## Performance

- **No Flash**: Theme applied before page render
- **Efficient Updates**: Only affected elements re-render
- **Minimal Bundle**: Lightweight theme system
- **Cached Preferences**: localStorage for instant loading

## Troubleshooting

### Theme Not Persisting
- Check browser localStorage support
- Verify localStorage is not blocked
- Clear cache and try again

### Dark Mode Not Working
- Ensure Tailwind dark mode is enabled in config
- Check for `dark` class on `<html>` element
- Verify CSS is properly loaded

### Color Scheme Not Changing
- Check `data-color-scheme` attribute on `<html>`
- Verify CSS variables are defined
- Clear browser cache

## Future Enhancements

- [ ] More color schemes
- [ ] Custom color picker
- [ ] Theme presets
- [ ] Per-component theme overrides
- [ ] Animation preferences
- [ ] High contrast mode
- [ ] Reduced motion support

