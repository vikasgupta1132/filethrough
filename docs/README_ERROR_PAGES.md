# Error Pages for FileThrough Website

## Created Error Pages:
- `404.html` - Page Not Found error page
- `500.html` - Internal Server Error error page

## Features:
- Consistent branding with FileThrough icon and color scheme
- Responsive design matching the main website
- Clear navigation back to homepage
- Helpful messaging and suggestions

## How to Use:

### For Local Development (Python HTTP Server):
The Python `http.server` module doesn't natively support custom error pages, but you can:
1. Access error pages directly: `https://getfilethrough.com/404.html`
2. Test broken links to see browser default 404 behavior
3. For production deployment, configure your web server appropriately

### For Production Deployment:

#### Apache (.htaccess):
```
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html
```

#### Nginx:
```
error_page 404 /404.html;
    location = /404.html {
        root /usr/share/nginx/html;
        internal;
    }

error_page 500 /500.html;
    location = /500.html {
        root /usr/share/nginx/html;
        internal;
    }
```

#### Netlify (_redirects):
```
404    /404.html    404
500    /500.html    500
```

#### Vercel (vercel.json):
```json
{
  "errorPage": "/404.html"
}
```

## Testing:
- Visit `https://getfilethrough.com/404.html` to see the 404 error page
- Visit `https://getfilethrough.com/500.html` to see the 500 error page
- Visit `https://getfilethrough.com/nonexistent-page` to see browser's default 404 (since Python server doesn't handle custom errors)

## Design Notes:
- Uses the same FileThrough icon (snail with gradient) as favicon and illustration
- Maintains consistent color scheme: gradients from #1fb6ff to #4e54c8
- Matches typography and spacing of main website
- Includes clear call-to-action buttons to guide users back to working pages