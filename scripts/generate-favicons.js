const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'favicons');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function wrapSvg(iconInner, accentColor = '#7DD3FC') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="7" fill="#080B10" stroke="#243447" stroke-width="1.5"/>
  <rect x="3" y="3" width="26" height="26" rx="5" fill="#102A43" stroke="#243447" stroke-width="0.8"/>
  <g transform="translate(4, 4)">
    ${iconInner}
  </g>
</svg>`;
}

const icons = {
  // 1. Homepage: ONE STORE brand icon (geometric ONE badge)
  'home': wrapSvg(`
    <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 7v10" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M9.5 9.5L12 7" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
  `),

  // 2. Product listing: shopping bag
  'products': wrapSvg(`
    <path d="M6 3L3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-4Z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <path d="M3 7h18" stroke="#7DD3FC" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 11a4 4 0 0 1-8 0" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
  `),

  // 3. Product details: single focused product / tag
  'product-detail': wrapSvg(`
    <path d="M12.5 3H6a2 2 0 0 0-2 2v6.5a2 2 0 0 0 .58 1.42l8.5 8.5a2 2 0 0 0 2.83 0l6.5-6.5a2 2 0 0 0 0-2.83l-8.5-8.5A2 2 0 0 0 12.5 3Z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="8" cy="7" r="1.5" fill="#FFFFFF"/>
  `),

  // 4. Search: magnifying glass
  'search': wrapSvg(`
    <circle cx="10.5" cy="10.5" r="7" fill="none" stroke="#7DD3FC" stroke-width="2.2"/>
    <path d="M15.5 15.5L21 21" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
  `),

  // 5. Cart: shopping cart
  'cart': wrapSvg(`
    <circle cx="9" cy="19" r="1.8" fill="#7DD3FC"/>
    <circle cx="18" cy="19" r="1.8" fill="#7DD3FC"/>
    <path d="M2 3h3.5l2.6 11.2a1.8 1.8 0 0 0 1.8 1.4h8.8a1.8 1.8 0 0 0 1.8-1.4L22 6H6.5" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `),

  // 6. Checkout: shield check / security
  'checkout': wrapSvg(`
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <path d="M8.5 12l2.5 2.5 4.5-4.5" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  `),

  // 7. Login / Signup: user
  'auth': wrapSvg(`
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="7" r="4" fill="none" stroke="#FFFFFF" stroke-width="2"/>
  `),

  // 8. Customer Profile: user circle
  'profile': wrapSvg(`
    <circle cx="12" cy="12" r="10" fill="none" stroke="#7DD3FC" stroke-width="2"/>
    <circle cx="12" cy="10" r="3" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>
    <path d="M6.5 18.5a7 7 0 0 1 11 0" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
  `),

  // 9. Orders / Order Details: package box
  'orders': wrapSvg(`
    <path d="M16.5 9.4 7.55 4.24a1.8 1.8 0 0 0-1.8 0L2.5 6.2a1.8 1.8 0 0 0-.9 1.55v8.5a1.8 1.8 0 0 0 .9 1.55l3.25 1.96a1.8 1.8 0 0 0 1.8 0l8.95-5.16" fill="none" stroke="#7DD3FC" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="m21.5 8.2-9.5-5.5-9.5 5.5 9.5 5.5 9.5-5.5Z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 13.7V22" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    <path d="M21.5 8.2v7.6a1.8 1.8 0 0 1-.9 1.55l-8.6 5.05" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
  `),

  // 10. Wishlist: heart
  'wishlist': wrapSvg(`
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 6.5C10.5 5 9.5 4.5 8 4.5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
  `),

  // 11. Support / Contact: message circle
  'support': wrapSvg(`
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="8" cy="11.5" r="1" fill="#FFFFFF"/>
    <circle cx="12" cy="11.5" r="1" fill="#FFFFFF"/>
    <circle cx="16" cy="11.5" r="1" fill="#FFFFFF"/>
  `),

  // 12. Admin Dashboard: layout dashboard / operations
  'admin-dashboard': wrapSvg(`
    <rect x="3" y="3" width="7" height="9" rx="1.5" fill="none" stroke="#7DD3FC" stroke-width="2"/>
    <rect x="14" y="3" width="7" height="5" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5" fill="none" stroke="#7DD3FC" stroke-width="2"/>
    <rect x="3" y="16" width="7" height="5" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
  `),

  // 13. Admin Products: package with plus / box stack
  'admin-products': wrapSvg(`
    <path d="M16.5 9.4 7.55 4.24a1.8 1.8 0 0 0-1.8 0L2.5 6.2a1.8 1.8 0 0 0-.9 1.55v8.5a1.8 1.8 0 0 0 .9 1.55l3.25 1.96a1.8 1.8 0 0 0 1.8 0l8.95-5.16" fill="none" stroke="#7DD3FC" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="m21.5 8.2-9.5-5.5-9.5 5.5 9.5 5.5 9.5-5.5Z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 13.7V22" stroke="#7DD3FC" stroke-width="2" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="4.5" fill="#102A43" stroke="#FFFFFF" stroke-width="1.5"/>
    <path d="M18 16v4M16 18h4" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
  `),

  // 14. Admin Orders: clipboard check
  'admin-orders': wrapSvg(`
    <rect x="4" y="5" width="16" height="17" rx="2" fill="none" stroke="#7DD3FC" stroke-width="2"/>
    <path d="M8 3h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="#102A43" stroke="#FFFFFF" stroke-width="1.8"/>
    <path d="m8.5 14 2.5 2.5 5-5" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  `),

  // 15. Admin Inventory: layers
  'admin-inventory': wrapSvg(`
    <path d="M12 2 2 7l10 5 10-5-10-5Z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <path d="m2 12 10 5 10-5" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="m2 17 10 5 10-5" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  `),

  // 16. Admin Customers: users
  'admin-customers': wrapSvg(`
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none" stroke="#7DD3FC" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="9" cy="7" r="4" fill="none" stroke="#7DD3FC" stroke-width="1.8"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
  `),

  // 17. Admin Settings: settings gear
  'admin-settings': wrapSvg(`
    <circle cx="12" cy="12" r="3" fill="none" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="#7DD3FC" stroke-width="1.8"/>
  `),

  // 18. Error / Not Found: alert triangle
  'error': wrapSvg(`
    <path d="m10.3 3.6-8.6 15A2 2 0 0 0 3.4 21h17.2a2 2 0 0 0 1.7-2.4l-8.6-15a2 2 0 0 0-3.4 0z" fill="none" stroke="#F87171" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 9v4" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="12" cy="17" r="1.2" fill="#FFFFFF"/>
  `),

  // Default fallback: same as home
  'default': wrapSvg(`
    <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="none" stroke="#7DD3FC" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 7v10" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M9.5 9.5L12 7" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
  `),
};

for (const [name, svgContent] of Object.entries(icons)) {
  const filePath = path.join(targetDir, `${name}.svg`);
  fs.writeFileSync(filePath, svgContent.trim() + '\n', 'utf8');
  console.log(`Generated: public/favicons/${name}.svg`);
}

// Also overwrite public/icon.svg with the home/default brand icon
fs.writeFileSync(path.join(__dirname, '..', 'public', 'icon.svg'), icons['default'].trim() + '\n', 'utf8');
console.log('Updated public/icon.svg');
