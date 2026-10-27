// "Built with" (#49, Figma tiles "Tool logo/*" on Components, used on W9 212:5835 and W10). Logos sit in
// assets/logos; a "-dark" file is the version for dark surfaces (one-color logos turned white).
// Same groups as the mobile About screen and the README.
const logos = import.meta.glob('../assets/logos/*.{svg,png}', { eager: true, import: 'default' });
const file = (name) => logos[`../assets/logos/${name}`];

function tool(name, key, ext = 'svg', hasDark = false) {
  return { name, src: file(`${key}.${ext}`), darkSrc: hasDark ? file(`${key}-dark.${ext}`) : null };
}

export const BUILT_WITH = [
  { group: 'Design', tools: [tool('Figma', 'figma')] },
  {
    group: 'Website',
    tools: [
      tool('React', 'react'),
      tool('Vite', 'vite'),
      tool('Tailwind CSS', 'tailwind'),
      tool('GSAP', 'gsap'),
      tool('Recharts', 'recharts', 'png', true),
      tool('Leaflet', 'leaflet'),
    ],
  },
  { group: 'Android app', tools: [tool('Flutter', 'flutter'), tool('Dart', 'dart'), tool('flutter_map', 'flutter_map', 'png')] },
  {
    group: 'API',
    tools: [
      tool('Node.js', 'node'),
      tool('Express', 'express', 'svg', true),
      tool('Sequelize', 'sequelize'),
      tool('Zod', 'zod'),
      tool('JWT', 'jwt', 'svg', true),
      tool('PDFKit', 'pdfkit', 'png', true),
      tool('CSV export', 'csv', 'svg', true),
    ],
  },
  {
    group: 'Data and services',
    tools: [
      tool('MySQL', 'mysql'),
      tool('Aiven', 'aiven', 'svg', true),
      tool('Cloudinary', 'cloudinary'),
      tool('Brevo', 'brevo'),
      tool('OpenStreetMap', 'osm'),
      tool('Nominatim', 'nominatim', 'png'),
    ],
  },
  {
    group: 'Hosting and delivery',
    tools: [
      tool('Vercel', 'vercel', 'svg', true),
      tool('Render', 'render', 'svg', true),
      tool('GitHub', 'github', 'svg', true),
      tool('GitHub Actions', 'githubactions'),
      tool('Git', 'git'),
      tool('Namecheap', 'namecheap'),
    ],
  },
];
