const fs = require('fs');

const gitignore = `# Dependencias
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js build
.next/
out/
build/
dist/

# Binarios e instaladores pesados
*.apk
*.exe
*.dmg
*.zip
*.tar.gz
ENTREGABLES_BETA/

# Android build & Gradle
android/.gradle/
android/build/
android/app/build/
android/local.properties
android/.idea/

# Environment Variables
.env*.local
.env
.env.lowmem

# Logs & Temp
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.pem
`;

fs.writeFileSync('D:/PROYECTOS_NEXORA/Nexora_Pay/.gitignore', gitignore, 'utf-8');
console.log('.gitignore created in D:/PROYECTOS_NEXORA/Nexora_Pay');
