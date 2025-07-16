#!/bin/bash

# Web Gallery Deployment Script

echo "🚀 Starting Web Gallery deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not installed)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install dependencies
echo "📦 Installing project dependencies..."
npm install --production

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Install and configure Let's Encrypt
echo "🔒 Setting up SSL certificates..."
sudo apt install -y certbot
sudo certbot certonly --standalone -d webgallery.yourdomain.com

# Set up firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable

# Start application with PM2
echo "🚀 Starting application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at: https://webgallery.yourdomain.com" 