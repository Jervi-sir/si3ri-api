php artisan serve --host=0.0.0.0 --port=6061
php artisan storage:link
php artisan schedule:work

### pm2
sudo npm install -g pm2
pm2 start ecosystem.config.cjs