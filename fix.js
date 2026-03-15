const fs = require('fs');

const mapping = {
  'Â·': '·',
  'ðŸ“„': '📄',
  'ðŸŽ¨': '🎨',
  'ðŸ–¨ï¸ ': '🖨️',
  'â‚¹': '₹',
  'â€“': '–',       
  'â€œ': '“',       
  'â€\u009d': '”',   
  'ðŸ“¦': '📦',
  'â‚¬': '€',
  'ðŸ”½': '🔽',
  'â€”': '—',       
  'â€™': '’',       
  'â ³': '⏳',
  'âœ“': '✓',
  'â Œ': '❌',
  'ðŸ’¡': '💡'
};

['index.html', 'app.js', 'brochure.html'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  for (const [bad, good] of Object.entries(mapping)) {
    content = content.split(bad).join(good);
  }
  // Special fallbacks for right double quotes if not handled by \u009d correctly
  content = content.replace(/â€\./g, '”.');
  content = content.replace(/â€</g, '”<');
  content = content.replace(/â€ /g, '” ');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
