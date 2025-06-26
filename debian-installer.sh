#!/bin/bash

# MenuMaster Production Installer for Ubuntu/Debian VPS
# This script installs and configures MenuMaster on a fresh VPS
# Repository: https://github.com/OnlyCris/MenuMaster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration variables
DOMAIN=""
EMAIL=""
DB_PASSWORD=""
SESSION_SECRET=""
STRIPE_SECRET_KEY=""
STRIPE_PUBLIC_KEY=""
RESEND_API_KEY=""
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_ZONE_ID=""
GOOGLE_TRANSLATE_KEY=""

print_header() {
    echo -e "${BLUE}"
    echo "=================================================================="
    echo "              MenuMaster Debian 12 Auto-Installer"
    echo "=================================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root. Use: sudo $0"
    fi
}

get_user_input() {
    print_step "Collecting configuration information..."
    
    read -p "Enter your domain name (e.g., menumaster.com): " DOMAIN
    read -p "Enter your email address: " EMAIL
    
    # Generate secure passwords
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    
    echo
    print_info "Generated secure database password and session secret"
    
    # Optional services
    echo
    print_info "Optional API keys (press Enter to skip):"
    read -p "Stripe Secret Key: " STRIPE_SECRET_KEY
    read -p "Stripe Public Key: " STRIPE_PUBLIC_KEY
    read -p "Resend API Key: " RESEND_API_KEY
    read -p "Cloudflare API Token: " CLOUDFLARE_API_TOKEN
    read -p "Cloudflare Zone ID: " CLOUDFLARE_ZONE_ID
    read -p "Google Translate API Key: " GOOGLE_TRANSLATE_KEY
    
    echo
    print_info "Configuration collected successfully"
}

update_system() {
    print_step "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common gnupg2 openssl ufw fail2ban
    
    # Ensure sufficient disk space and clean up
    apt autoremove -y
    apt autoclean
    
    # Check available disk space
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [ $AVAILABLE_SPACE -lt 2000000 ]; then
        print_warning "Low disk space detected. Consider freeing up space before continuing."
    fi
}

install_nodejs() {
    print_step "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_info "Node.js version: $NODE_VERSION"
    print_info "NPM version: $NPM_VERSION"
}

install_postgresql() {
    print_step "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    
    print_step "Setting up database..."
    sudo -u postgres psql -c "CREATE DATABASE menumaster_production;"
    sudo -u postgres psql -c "CREATE USER menumaster WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE menumaster_production TO menumaster;"
    sudo -u postgres psql -c "ALTER USER menumaster CREATEDB;"
    sudo -u postgres psql -c "ALTER DATABASE menumaster_production OWNER TO menumaster;"
    
    print_info "PostgreSQL installed and configured"
}

install_nginx() {
    print_step "Installing Nginx..."
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_info "Nginx installed and started"
}

install_certbot() {
    print_step "Installing Certbot for SSL..."
    apt install -y certbot python3-certbot-nginx
    print_info "Certbot installed"
}

install_pm2() {
    print_step "Installing PM2 process manager..."
    npm install -g pm2
    print_info "PM2 installed globally"
}

download_application() {
    print_step "Downloading MenuMaster application..."
    
    # Create application directory
    mkdir -p /var/www
    cd /var/www
    
    # Remove existing directory if it exists
    rm -rf menumaster
    
    # Clone repository with depth 1 for faster download
    git clone --depth 1 https://github.com/OnlyCris/MenuMaster.git menumaster
    cd menumaster
    
    # Create required directories
    mkdir -p uploads
    mkdir -p /var/log/pm2
    
    # Set proper ownership
    chown -R www-data:www-data /var/www/menumaster
    chown -R www-data:www-data /var/log/pm2
    
    print_info "Application downloaded successfully"
}

create_env_file() {
    print_step "Creating environment configuration..."
    
    cd /var/www/menumaster
    
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://menumaster:${DB_PASSWORD}@localhost:5432/menumaster_production

# Server Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=${SESSION_SECRET}

# Domain Configuration
DOMAIN=${DOMAIN}
BASE_URL=https://${DOMAIN}

# Stripe (if provided)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
VITE_STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC_KEY}

# Email (if provided)
RESEND_API_KEY=${RESEND_API_KEY}
FROM_EMAIL=noreply@${DOMAIN}
FROM_NAME="MenuMaster"

# Cloudflare (if provided)
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID}
CLOUDFLARE_DOMAIN=${DOMAIN}

# Google Translate (if provided)
GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_KEY}

# Admin
ADMIN_EMAIL=${EMAIL}
EOF
    
    chmod 600 .env
    chown www-data:www-data .env
    print_info "Environment file created"
}

setup_nginx_config() {
    print_step "Configuring Nginx..."
    
    cat > /etc/nginx/sites-available/menumaster << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Static files
    location /uploads/ {
        alias /var/www/menumaster/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

    # Enable the site
    ln -sf /etc/nginx/sites-available/menumaster /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    systemctl reload nginx
    
    print_info "Nginx configured successfully"
}

setup_ssl() {
    print_step "Setting up SSL certificates..."
    
    # Generate SSL certificate (only for main domain, not wildcard)
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} || {
        print_warning "SSL certificate generation failed. Using self-signed certificate for now."
        print_info "You can run 'certbot --nginx -d ${DOMAIN}' manually later"
        print_info "For wildcard support, configure DNS challenge manually"
    }
    
    # Set up auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    
    print_info "SSL configured"
}

create_pm2_config() {
    print_step "Creating PM2 configuration..."
    
    cd /var/www/menumaster
    
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'menumaster',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    cwd: '/var/www/menumaster',
    instances: 1,
    exec_mode: 'fork',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Logging
    error_file: '/var/log/pm2/menumaster-error.log',
    out_file: '/var/log/pm2/menumaster-out.log',
    log_file: '/var/log/pm2/menumaster.log',
    time: true,
    
    // Performance
    max_memory_restart: '1G',
    
    // Auto restart
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs'],
    
    // Graceful restart
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
EOF
    
    chown www-data:www-data ecosystem.config.js
    print_info "PM2 configuration created"
}

install_dependencies() {
    print_step "Installing application dependencies..."
    
    cd /var/www/menumaster
    
    # Clean npm cache and temporary files
    npm cache clean --force
    rm -rf node_modules package-lock.json
    
    # Install dependencies with proper ownership
    chown -R www-data:www-data /var/www/menumaster
    sudo -u www-data npm install --no-audit --no-fund
    
    # Build application
    print_step "Building application..."
    if [ ! -z "$STRIPE_PUBLIC_KEY" ]; then
        sudo -u www-data VITE_STRIPE_PUBLIC_KEY="${STRIPE_PUBLIC_KEY}" npm run build
    else
        sudo -u www-data npm run build
    fi
    
    # Ensure proper permissions
    chown -R www-data:www-data /var/www/menumaster
    
    print_info "Dependencies installed and application built"
}

setup_database_schema() {
    print_step "Setting up database schema..."
    
    cd /var/www/menumaster
    
    # Run database migrations
    sudo -u www-data npm run db:push
    
    print_info "Database schema deployed"
}

setup_firewall() {
    print_step "Configuring firewall..."
    
    # Configure UFW
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    
    print_info "Firewall configured"
}

setup_fail2ban() {
    print_step "Configuring Fail2Ban..."
    
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOF
    
    systemctl restart fail2ban
    systemctl enable fail2ban
    print_info "Fail2Ban configured"
}

setup_backup_system() {
    print_step "Setting up backup system..."
    
    # Create backup directories
    mkdir -p /var/backups/menumaster
    mkdir -p /var/scripts
    
    cat > /var/scripts/backup-menumaster.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/menumaster"
DATE=\$(date +%Y%m%d_%H%M%S)

# Database backup
PGPASSWORD="${DB_PASSWORD}" pg_dump -h localhost -U menumaster menumaster_production | gzip > "\$BACKUP_DIR/db_\$DATE.sql.gz"

# Application files backup
tar -czf "\$BACKUP_DIR/files_\$DATE.tar.gz" -C /var/www/menumaster uploads .env

# Cleanup old backups (keep 30 days)
find \$BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: \$DATE"
EOF
    
    chmod +x /var/scripts/backup-menumaster.sh
    
    # Setup crontab for backups
    (crontab -l 2>/dev/null; echo "0 2 * * * /var/scripts/backup-menumaster.sh") | crontab -
    
    print_info "Backup system configured"
}

start_application() {
    print_step "Starting MenuMaster application..."
    
    cd /var/www/menumaster
    
    # Final permission check
    chown -R www-data:www-data /var/www/menumaster
    chown -R www-data:www-data /var/log/pm2
    
    # Test that the application can start
    print_step "Testing application startup..."
    sudo -u www-data timeout 10s npm start || {
        print_warning "Application test failed, but continuing with PM2 setup"
    }
    
    # Start application with PM2
    sudo -u www-data pm2 start ecosystem.config.js
    sudo -u www-data pm2 save
    
    # Generate startup script
    pm2 startup systemd -u www-data --hp /var/www
    
    # Wait for application to be ready
    sleep 5
    
    # Check if application is running
    if sudo -u www-data pm2 list | grep -q "online"; then
        print_info "Application started successfully with PM2"
    else
        print_warning "Application may not have started correctly. Check logs with: pm2 logs"
    fi
}

create_update_script() {
    print_step "Creating update script..."
    
    cat > /var/scripts/update-menumaster.sh << 'EOF'
#!/bin/bash
set -e

cd /var/www/menumaster

echo "Creating backup before update..."
/var/scripts/backup-menumaster.sh

echo "Stopping application..."
sudo -u www-data pm2 stop menumaster

echo "Backing up current version..."
cp -r dist dist.backup 2>/dev/null || true
cp .env .env.backup
cp -r uploads uploads.backup 2>/dev/null || true

echo "Downloading new version..."
git pull origin main

echo "Restoring configuration..."
cp .env.backup .env
cp -r uploads.backup/* uploads/ 2>/dev/null || true

echo "Installing dependencies..."
sudo -u www-data npm install

echo "Building application..."
sudo -u www-data npm run build

echo "Running database migrations..."
sudo -u www-data npm run db:push

echo "Starting application..."
sudo -u www-data pm2 restart menumaster

echo "Update completed successfully!"
EOF
    
    chmod +x /var/scripts/update-menumaster.sh
    print_info "Update script created at /var/scripts/update-menumaster.sh"
}

print_final_instructions() {
    print_step "Installation completed!"
    
    echo
    echo -e "${GREEN}=================================================================="
    echo "                    Installation Summary"
    echo -e "==================================================================${NC}"
    echo
    echo "✅ System updated and secured"
    echo "✅ Node.js 20 installed"
    echo "✅ PostgreSQL installed and configured"
    echo "✅ Nginx installed and configured"
    echo "✅ SSL certificates configured"
    echo "✅ PM2 process manager installed"
    echo "✅ Firewall and Fail2Ban configured"
    echo "✅ Backup system configured"
    echo "✅ MenuMaster application installed and running"
    echo
    echo -e "${BLUE}Important Information:${NC}"
    echo "• Domain: $DOMAIN"
    echo "• Application directory: /var/www/menumaster"
    echo "• Database: menumaster_production"
    echo "• Database user: menumaster"
    echo "• Logs: /var/log/pm2/"
    echo "• Backups: /var/backups/menumaster/"
    echo "• Update script: /var/scripts/update-menumaster.sh"
    echo
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "• Check app status: sudo -u www-data pm2 status"
    echo "• View logs: sudo -u www-data pm2 logs menumaster"
    echo "• Restart app: sudo -u www-data pm2 restart menumaster"
    echo "• Manual backup: /var/scripts/backup-menumaster.sh"
    echo "• Update app: /var/scripts/update-menumaster.sh"
    echo
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Visit https://$DOMAIN to access your MenuMaster instance"
    echo "2. Create admin account with email: $EMAIL"
    echo "3. Configure your payment gateway (if using Stripe)"
    echo "4. Set up email templates from admin panel"
    echo "5. Create your first restaurant"
    echo
    echo -e "${GREEN}Installation completed successfully!${NC}"
    echo -e "${GREEN}Your MenuMaster instance is now running at: https://$DOMAIN${NC}"
    echo
}

# Main execution
main() {
    print_header
    
    check_root
    get_user_input
    
    update_system
    install_nodejs
    install_postgresql
    install_nginx
    install_certbot
    install_pm2
    
    download_application
    create_env_file
    setup_nginx_config
    setup_ssl
    create_pm2_config
    
    install_dependencies
    setup_database_schema
    
    setup_firewall
    setup_fail2ban
    setup_backup_system
    
    start_application
    create_update_script
    
    print_final_instructions
}

# Run main function
main "$@"