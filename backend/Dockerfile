FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Salin semua file dari folder backend
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Ekspos port yang digunakan oleh backend
EXPOSE 3000
EXPOSE 50051

# Jalankan backend
CMD ["npm", "start"]
