# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Instal dependencies
RUN npm install

# Salin source code
COPY . .

# Build aplikasi frontend
RUN npm run build

# Stage 2: Setup Nginx
FROM nginx:alpine

# Salin custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin hasil build dari stage 1 ke direktori root nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Ekspos port 80
EXPOSE 80

# Jalankan nginx di foreground
CMD ["nginx", "-g", "daemon off;"]
