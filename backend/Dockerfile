# Step 1: Start with Node.js 20 on Alpine Linux (small, ~50MB)
FROM node:20-alpine

# Step 2: Create app directory inside the container
WORKDIR /app

# Step 3: Copy package files FIRST (for caching)
COPY package*.json ./

# Step 4: Install dependencies
RUN npm ci --only=production

# Step 5: Copy the rest of the source code
COPY src/ ./src/

# Step 6: Create uploads directory
RUN mkdir -p src/uploads

# Step 7: Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Step 8: Set ownership of app files to non-root user
RUN chown -R appuser:appgroup /app

# Step 9: Switch to non-root user (security!)
USER appuser

# Step 10: Expose port 5000
EXPOSE 5000

# Step 11: Start the application
CMD ["node", "src/server.js"]
