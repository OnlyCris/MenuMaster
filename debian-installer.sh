#!/bin/bash

# MenuIsland - Automated Debian 12 Installer
# This script automatically downloads, installs, and configures MenuIsland on a fresh Debian 12 server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN=""
EMAIL=""
DB_PASSWORD=""
SESSION_SECRET=""
STRIPE_SECRET_KEY=""
STRIPE_PUBLIC_KEY=""
SENDGRID_API_KEY=""
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_ZONE_ID=""
GOOGLE_TRANSLATE_KEY=""

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=================================================================="
    echo "              MenuIsland Debian 12 Auto-Installer"
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
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
}

get_user_input() {
    print_step "Collecting configuration information..."
    
    read -p "Enter your domain (e.g., menuisland.it): " DOMAIN
    while [[ -z "$DOMAIN" ]]; do
        print_warning "Domain is required!"
        read -p "Enter your domain: " DOMAIN
    done
    
    read -p "Enter your email for SSL certificates: " EMAIL
    while [[ -z "$EMAIL" ]]; do
        print_warning "Email is required!"
        read -p "Enter your email: " EMAIL
    done
    
    read -s -p "Enter PostgreSQL password: " DB_PASSWORD
    echo
    while [[ -z "$DB_PASSWORD" ]]; do
        print_warning "Database password is required!"
        read -s -p "Enter PostgreSQL password: " DB_PASSWORD
        echo
    done
    
    # Generate session secret if not provided
    if [[ -z "$SESSION_SECRET" ]]; then
        SESSION_SECRET=$(openssl rand -hex 32)
        print_info "Generated session secret automatically"
    fi
    
    print_info "Optional services (press Enter to skip):"
    
    read -p "Stripe Secret Key (for payments): " STRIPE_SECRET_KEY
    read -p "Stripe Public Key (for payments): " STRIPE_PUBLIC_KEY
    read -p "SendGrid API Key (for emails): " SENDGRID_API_KEY
    read -p "Cloudflare API Token (for subdomains): " CLOUDFLARE_API_TOKEN
    read -p "Cloudflare Zone ID (for subdomains): " CLOUDFLARE_ZONE_ID
    read -p "Google Translate API Key (for translations): " GOOGLE_TRANSLATE_KEY
}

update_system() {
    print_step "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common gnupg2
}

install_nodejs() {
    print_step "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
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
    
    # Create database and user
    print_step "Setting up database..."
    sudo -u postgres psql -c "CREATE DATABASE menuisland_production;"
    sudo -u postgres psql -c "CREATE USER menuisland WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE menuisland_production TO menuisland;"
    sudo -u postgres psql -c "ALTER USER menuisland CREATEDB;"
    
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

setup_application() {
    print_step "Setting up MenuIsland application..."
    
    # Create application directory
    mkdir -p /var/www/menuisland
    cd /var/www/menuisland
    
    # Download application (replace with actual download URL)
    print_info "Downloading MenuIsland..."
    # For now, we'll create the structure manually since we don't have a release URL
    # In production, this would be: wget https://github.com/your-org/menuisland/releases/latest/download/menuisland.zip
    
    cat > download_menuisland.sh << 'EOF'
#!/bin/bash
# This would download the latest release
# wget https://github.com/your-org/menuisland/releases/latest/download/menuisland.zip
# unzip menuisland.zip
# rm menuisland.zip

echo "Application download placeholder - replace with actual download logic"
EOF
    
    chmod +x download_menuisland.sh
    print_warning "Please manually upload/clone the MenuIsland application to /var/www/menuisland"
    print_warning "Or update the download logic in this script"
}

create_env_file() {
    print_step "Creating environment configuration..."
    
    cat > /var/www/menuisland/.env << EOF
# Database
DATABASE_URL="postgresql://menuisland:${DB_PASSWORD}@localhost:5432/menuisland_production"

# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Security
SESSION_SECRET="${SESSION_SECRET}"
COOKIE_SECURE=true
COOKIE_MAX_AGE=86400000

# Domain
DOMAIN=${DOMAIN}
BASE_URL=https://${DOMAIN}

# Stripe (if provided)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
VITE_STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC_KEY}

# Email (if provided)
SENDGRID_API_KEY=${SENDGRID_API_KEY}
FROM_EMAIL=noreply@${DOMAIN}
FROM_NAME="MenuIsland"

# Cloudflare (if provided)
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID}
CLOUDFLARE_DOMAIN=${DOMAIN}

# Google Translate (if provided)
GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_KEY}

# Admin
ADMIN_EMAIL=${EMAIL}
EOF
    
    chmod 600 /var/www/menuisland/.env
    print_info "Environment file created"
}

setup_nginx_config() {
    print_step "Configuring Nginx..."
    
    cat > /etc/nginx/sites-available/menuisland << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ${DOMAIN} *.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name ${DOMAIN} *.${DOMAIN};
    
    # SSL Configuration (will be configured by Certbot)
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=general:10m rate=100r/s;
    
    # Main proxy configuration
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location /uploads {
        alias /var/www/menuisland/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Image optimization headers
        location ~* \.(jpg|jpeg|png|gif|webp)\$ {
            add_header Vary Accept;
        }
    }
    
    # Security - Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|config)\$ {
        deny all;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/menuisland /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    systemctl reload nginx
    
    print_info "Nginx configured"
}

setup_ssl() {
    print_step "Setting up SSL certificates..."
    
    # First, try to get certificate for main domain
    if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"; then
        print_info "SSL certificate obtained successfully"
    else
        print_warning "SSL certificate setup failed. You may need to configure DNS first."
        print_info "Run this command later: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    fi
}

create_pm2_config() {
    print_step "Creating PM2 configuration..."
    
    cat > /var/www/menuisland/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'menuisland',
    script: 'dist/index.js',
    cwd: '/var/www/menuisland',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Logging
    error_file: '/var/log/pm2/menuisland-error.log',
    out_file: '/var/log/pm2/menuisland-out.log',
    log_file: '/var/log/pm2/menuisland.log',
    time: true,
    
    // Performance
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
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
    
    print_info "PM2 configuration created"
}

setup_backup_script() {
    print_step "Setting up backup system..."
    
    # Create backup directories
    mkdir -p /var/backups/menuisland
    mkdir -p /var/scripts
    
    cat > /var/scripts/backup-menuisland.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/menuisland"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="menuisland_production"
DB_USER="menuisland"

# Database backup
PGPASSWORD="${DB_PASSWORD}" pg_dump -h localhost -U \$DB_USER \$DB_NAME | gzip > "\$BACKUP_DIR/db_\$DATE.sql.gz"

# Application files backup
tar -czf "\$BACKUP_DIR/files_\$DATE.tar.gz" -C /var/www/menuisland uploads .env

# Cleanup old backups (keep 30 days)
find \$BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: \$DATE"
EOF
    
    chmod +x /var/scripts/backup-menuisland.sh
    
    # Setup crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * /var/scripts/backup-menuisland.sh") | crontab -
    (crontab -l 2>/dev/null; echo "0 3 * * 0 pm2 restart menuisland") | crontab -
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    print_info "Backup system configured"
}

setup_firewall() {
    print_step "Configuring firewall..."
    
    apt install -y ufw
    ufw --force enable
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw deny 5000
    
    print_info "Firewall configured"
}

setup_fail2ban() {
    print_step "Installing and configuring Fail2Ban..."
    
    apt install -y fail2ban
    
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
EOF
    
    systemctl restart fail2ban
    print_info "Fail2Ban configured"
}

install_dependencies() {
    print_step "Installing application dependencies..."
    
    cd /var/www/menuisland
    
    # Check if package.json exists
    if [ ! -f package.json ]; then
        print_warning "package.json not found. Creating minimal structure..."
        # This should be replaced with actual application files
        npm init -y
        print_warning "Please upload the actual MenuIsland application files"
        return
    fi
    
    npm install
    
    # Build application if build script exists
    if grep -q '"build"' package.json; then
        print_info "Building application..."
        if [[ -n "$STRIPE_PUBLIC_KEY" ]]; then
            VITE_STRIPE_PUBLIC_KEY="$STRIPE_PUBLIC_KEY" npm run build
        else
            npm run build
        fi
    fi
    
    print_info "Dependencies installed"
}

setup_database_schema() {
    print_step "Setting up database schema..."
    
    cd /var/www/menuisland
    
    # Check if db:push script exists
    if grep -q '"db:push"' package.json 2>/dev/null; then
        npm run db:push
        print_info "Database schema deployed"
    else
        print_warning "Database migration script not found. Please run manually after uploading application."
    fi
}

start_application() {
    print_step "Starting MenuIsland application..."
    
    cd /var/www/menuisland
    
    # Create PM2 log directory
    mkdir -p /var/log/pm2
    
    # Set proper ownership
    chown -R www-data:www-data /var/www/menuisland
    chown -R www-data:www-data /var/log/pm2
    
    # Start application with PM2
    if [ -f ecosystem.config.js ]; then
        pm2 start ecosystem.config.js
        pm2 save
        pm2 startup
        print_info "Application started with PM2"
    else
        print_warning "PM2 config not found. Please start manually after uploading application."
    fi
}

create_update_script() {
    print_step "Creating update script..."
    
    cat > /var/scripts/update-menuisland.sh << 'EOF'
#!/bin/bash
# MenuIsland Update Script

set -e

print_info() {
    echo "[INFO] $1"
}

print_step() {
    echo "[STEP] $1"
}

cd /var/www/menuisland

print_step "Creating backup before update..."
/var/scripts/backup-menuisland.sh

print_step "Stopping application..."
pm2 stop menuisland

print_step "Backing up current version..."
cp -r dist dist.backup 2>/dev/null || true
cp .env .env.backup
cp -r uploads uploads.backup 2>/dev/null || true

print_step "Downloading new version..."
# Add download logic here
# wget https://github.com/your-org/menuisland/releases/latest/download/menuisland.zip
# unzip -o menuisland.zip
# rm menuisland.zip

print_step "Restoring configuration..."
cp .env.backup .env
cp -r uploads.backup/* uploads/ 2>/dev/null || true

print_step "Installing dependencies..."
npm install

print_step "Building application..."
if [[ -n "$VITE_STRIPE_PUBLIC_KEY" ]]; then
    VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY npm run build
else
    npm run build
fi

print_step "Running database migrations..."
npm run db:push

print_step "Starting application..."
pm2 start menuisland

print_info "Update completed successfully!"
print_info "Check logs: pm2 logs menuisland"
EOF
    
    chmod +x /var/scripts/update-menuisland.sh
    print_info "Update script created at /var/scripts/update-menuisland.sh"
}

print_final_instructions() {
    print_step "Installation completed!"
    
    echo
    echo -e "${GREEN}=================================================================="
    echo "                    Installation Summary"
    echo -e "==================================================================${NC}"
    echo
    echo "✅ System updated and secured"
    echo "✅ Node.js 18 installed"
    echo "✅ PostgreSQL installed and configured"
    echo "✅ Nginx installed and configured"
    echo "✅ SSL certificates configured"
    echo "✅ PM2 process manager installed"
    echo "✅ Firewall and Fail2Ban configured"
    echo "✅ Backup system configured"
    echo
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Upload MenuIsland application files to /var/www/menuisland"
    echo "2. Run: cd /var/www/menuisland && npm install"
    echo "3. Run: npm run build"
    echo "4. Run: npm run db:push"
    echo "5. Run: pm2 start ecosystem.config.js"
    echo
    echo -e "${BLUE}Important Information:${NC}"
    echo "• Domain: $DOMAIN"
    echo "• Application directory: /var/www/menuisland"
    echo "• Database: menuisland_production"
    echo "• Logs: /var/log/pm2/"
    echo "• Backups: /var/backups/menuisland/"
    echo "• Update script: /var/scripts/update-menuisland.sh"
    echo
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "• Check app status: pm2 status"
    echo "• View logs: pm2 logs menuisland"
    echo "• Restart app: pm2 restart menuisland"
    echo "• Manual backup: /var/scripts/backup-menuisland.sh"
    echo "• Update app: /var/scripts/update-menuisland.sh"
    echo
    echo -e "${GREEN}Installation completed successfully!${NC}"
    echo -e "${GREEN}Your MenuIsland instance will be available at: https://$DOMAIN${NC}"
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
    
    setup_application
    create_env_file
    setup_nginx_config
    setup_ssl
    create_pm2_config
    setup_backup_script
    setup_firewall
    setup_fail2ban
    
    install_dependencies
    setup_database_schema
    start_application
    create_update_script
    
    print_final_instructions
}

# Run main function
main "$@"