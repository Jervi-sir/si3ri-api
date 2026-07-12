## the domain names

* [6061] si3ri.com

si3ri.com

---------------------------------------------------

- sudo apt update
- sudo apt install nginx
- sudo apt install certbot python3-certbot-nginx

### Dzpreneurs
---------------------------------------------------
- sudo nano /etc/nginx/sites-available/si3ri.com
```nginx
server {
    listen 80;
    server_name si3ri.com;
    client_body_timeout 300s;
    client_header_timeout 300s;
    send_timeout 300s;
    client_max_body_size 2G;

    # Internal location for X-Accel-Redirect video serving
    # This is NOT accessible directly from outside — only via PHP's X-Accel-Redirect header
    location /protected-hls/ {
        internal;
        alias /home/jervi/projects/course-hoster-laravel/storage/app/private/courses/hls/;
    }

    # Block common WordPress attack paths
    location ~* ^/(wp-login.php|wp-content|wp-includes|wp-json|wp-cron.php|wp-config.php|cgi-bin|xmrlpc.php) {
        return 403;
    }

    # Allow Let's Encrypt SSL renewals but block other access
    location ^~ /.well-known/acme-challenge/ {
        allow all;
    }
    location ~* ^/.well-known/ {
        return 403;
    }

    # Block direct access to PHP files except index.php
    location ~* \.php$ {
        if ($uri !~ "^/index.php$") {
            return 403;
        }
    }

    # Block empty User-Agent requests (common bot behavior)
    if ($http_user_agent = "") {
        return 403;
    }

    # Block bad bots (list can be expanded)
    if ($http_user_agent ~* (crawler|scrapy|spider|nmap|java|masscan|curl|wget|hydra|nikto|flood|sqlmap|acunetix|wpscan|wordpress|wordpressscan) ) {
        return 403;
    }

    location / {
        proxy_pass http://localhost:6061;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;

        proxy_request_buffering off;
        proxy_buffering off;

        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
```
- sudo ln -s /etc/nginx/sites-available/si3ri.com /etc/nginx/sites-enabled/
- sudo nginx -t
- sudo systemctl restart nginx
- sudo certbot --nginx -d si3ri.com
- sudo nano /etc/nginx/sites-available/si3ri.com
