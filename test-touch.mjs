import fs from 'fs';
const path = 'server/index.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  'console.log(`🚀 Server running on port ${PORT}`);',
  'console.log(`🚀 Server running on port ${PORT}`); // prueba de persistencia de sesión'
);
fs.writeFileSync(path, content);
console.log('✅ Cambio trivial aplicado, listo para redeploy.');
