FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start the Vite development server and expose to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
