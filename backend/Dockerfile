FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose backend port
EXPOSE 3001

# Start the server (you can use npm start or npm run dev)
CMD ["npm", "run", "dev"]
