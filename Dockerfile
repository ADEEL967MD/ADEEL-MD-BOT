FROM node:20

# Install required packages
RUN apt-get update && \
    apt-get install -y ffmpeg imagemagick webp && \
    rm -rf /var/lib/apt/lists/*

# Set working directory (fix here 👇)
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install && npm install -g pm2 qrcode-terminal

# Copy rest of the code
COPY . .

# Expose port
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
