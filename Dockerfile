# Используем легковесный образ Node.js
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /opt/app

# Копируем package.json и package-lock.json (если есть) перед установкой зависимостей
COPY package*.json ./

# Устанавливаем только необходимые зависимости
RUN npm install --only=production

# Копируем исходный код проекта (исключая `node_modules` через .dockerignore)
COPY . .

# Сборка TypeScript
RUN npm run build

# Оставляем только продакшн-зависимости
RUN npm prune --production

# Запуск приложения
CMD ["node", "./dist/main.js"]
