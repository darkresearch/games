FROM node:18

WORKDIR /app

# Copy the rest of the code
COPY . .

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Install a simple static file server
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Serve the static files
CMD ["serve", "-s", "dist", "-l", "3000"] 