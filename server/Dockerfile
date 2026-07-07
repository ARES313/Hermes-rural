FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Create directories for storage and database persistence
RUN mkdir -p storage

EXPOSE 3000

CMD ["node", "src/app.js"]
