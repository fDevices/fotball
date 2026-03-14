# Athlytics Sport – Ikoner

SVG-filer ligger i `/icons/` i reporoten. Brukes via CSS `mask-image` (tab/match) eller som `<img>` (flagg).

## Tab-bar

**tab-log.svg** – fotball
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
  <circle cx="13" cy="13" r="10" fill="currentColor"/>
  <polygon points="13,4.5 16.5,7.2 15.2,11 10.8,11 9.5,7.2" fill="#1a3a1f" opacity="0.75"/>
  <polygon points="20.5,10.5 22.5,14.5 19.5,17.5 16.2,16 15.8,12" fill="#1a3a1f" opacity="0.75"/>
  <polygon points="5.5,10.5 10.2,12 9.8,16 6.5,17.5 3.5,14.5" fill="#1a3a1f" opacity="0.75"/>
  <polygon points="10,21.5 11.2,17.5 14.8,17.5 16,21.5 13,23" fill="#1a3a1f" opacity="0.75"/>
</svg>
```

**tab-stats.svg** – søylediagram med linje
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
  <rect x="3" y="17" width="5" height="6" rx="1.5" fill="currentColor"/>
  <rect x="10.5" y="12" width="5" height="11" rx="1.5" fill="currentColor"/>
  <rect x="18" y="7" width="5" height="16" rx="1.5" fill="currentColor"/>
  <path d="M5.5 16L11 11L16 14L22 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
```

**tab-profile.svg** – personsilhuett
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
  <circle cx="13" cy="9" r="5" fill="currentColor"/>
  <path d="M4 23c0-5 4-8 9-8s9 3 9 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
```

**tab-settings.svg** – tannhjul
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
  <circle cx="13" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M13 2v3M13 21v3M2 13h3M21 13h3M4.93 4.93l2.12 2.12M18.95 18.95l2.12 2.12M4.93 21.07l2.12-2.12M18.95 7.05l2.12-2.12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
</svg>
```

## Kamptype

**match-home.svg** – hus
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M10 2L2 8v10h5v-6h6v6h5V8L10 2z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/>
</svg>
```

**match-away.svg** – fly
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <ellipse cx="10" cy="11" rx="2.5" ry="6" fill="currentColor"/>
  <path d="M3 10l7 2 7-2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M6.5 16l3.5 1 3.5-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <ellipse cx="10" cy="5.5" rx="1.5" ry="2" fill="currentColor"/>
</svg>
```

## Resultat

**result-win.svg** – pokal
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M6 3h8l-1.5 7a2.5 2.5 0 01-5 0L6 3z" fill="currentColor"/>
  <path d="M6 4.5C4 5 3 7 4 9s2.5 2 2.5 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>
  <path d="M14 4.5C16 5 17 7 16 9s-2.5 2-2.5 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>
  <rect x="8.5" y="11" width="3" height="4" rx="0.5" fill="currentColor"/>
  <rect x="6.5" y="15" width="7" height="2" rx="1" fill="currentColor"/>
</svg>
```

**result-draw.svg** – sirkel med strek
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.8"/>
  <path d="M7 10h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
</svg>
```

**result-loss.svg** – utropstegn
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M10 3v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="10" cy="15.5" r="1.5" fill="currentColor"/>
</svg>
```

## Flagg

**flag-no.svg** – norsk flagg (brukes som `<img>`, ikke mask)
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="16" viewBox="0 0 22 16">
  <rect width="22" height="16" rx="2" fill="#EF2B2D"/>
  <rect x="7" y="0" width="3" height="16" fill="white"/>
  <rect x="0" y="5.5" width="22" height="3" fill="white"/>
  <rect x="8" y="0" width="1.5" height="16" fill="#003087"/>
  <rect x="0" y="6.25" width="22" height="1.5" fill="#003087"/>
</svg>
```

**flag-en.svg** – britisk flagg (brukes som `<img>`, ikke mask)
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="16" viewBox="0 0 22 16">
  <rect width="22" height="16" rx="2" fill="#012169"/>
  <path d="M0 0L22 16M22 0L0 16" stroke="white" stroke-width="3.5"/>
  <path d="M0 0L22 16M22 0L0 16" stroke="#C8102E" stroke-width="2"/>
  <path d="M11 0v16M0 8h22" stroke="white" stroke-width="5"/>
  <path d="M11 0v16M0 8h22" stroke="#C8102E" stroke-width="3"/>
</svg>
```
