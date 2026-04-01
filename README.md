# HABESHA TRADITIONAL CLOTHE

An Ethiopian traditional clothing e-commerce website built with HTML, CSS, and JavaScript.

## Features

- **4 Pages**: Home, Shop, About, Contact
- **User Authentication**: Register/Login system with localStorage
- **Social Login**: Google & Facebook OAuth (requires configuration)
- **Shopping Cart**: Add products, checkout, order history
- **Profile Management**: Edit profile, change password
- **Payment Methods**: Telebirr, CBE Bank, Awash Bank, Cash on Delivery
- **Dark/Light Mode**: Theme toggle with persistence
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Contact Form**: Email sending via EmailJS (requires configuration)

## How to Run

Simply open `index.html` in any web browser.

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Or just double-click index.html
```

## Configuration Required

### 1. Google OAuth (Social Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Add your domain to Authorized JavaScript origins
6. Copy the Client ID

**In HTML files**, replace:
```html
<meta name="google-signin-client_id" content="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com">
```

### 2. Facebook OAuth (Social Login)

1. Go to [Facebook Developer](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Copy your App ID

**In HTML files**, replace:
```html
<meta name="facebook-app-id" content="YOUR_FACEBOOK_APP_ID">
```

### 3. EmailJS (Contact Form)

1. Go to [EmailJS.com](https://www.emailjs.com/) and sign up
2. Connect an email service (Gmail, Outlook, etc.)
3. Create an email template with these variables:
   - `{{from_name}}`
   - `{{from_email}}`
   - `{{phone}}`
   - `{{subject}}`
   - `{{message}}`
4. Copy your Public Key, Service ID, and Template ID

**In script.js**, update:
```javascript
emailjs.init('YOUR_EMAILJS_PUBLIC_KEY');
```

**And in handleContactSubmit function:**
```javascript
emailjs.send('YOUR_EMAILJS_SERVICE_ID', 'YOUR_EMAILJS_TEMPLATE_ID', templateParams)
```

## Data Storage

All data is stored in the browser's **localStorage**:
- `users` - User accounts
- `user` - Current session
- `orders` - Order history
- `theme` - Theme preference

**Note**: Data is stored per-browser and per-device. For persistent database, a backend is needed.

## Project Structure

```
local-business/
├── index.html      # Home page
├── shop.html       # Product listing
├── about.html      # About page
├── contact.html   # Contact page
├── styles.css      # All styles
├── script.js       # All JavaScript
├── PITCH.md        # Business pitch document
└── README.md       # This file
```

## Ethiopian Payment Details

| Method | Details |
|--------|---------|
| Telebirr | +251 91 234 5678 |
| CBE | Account: 1000123456789 |
| Awash Bank | Account: 0134567890123 |
| Cash on Delivery | Available in Addis Ababa |

## Product Categories

- Habesha Kemis (Women's traditional dresses)
- Men's Kemis
- Traditional Shoes (Kuru & Sandals)
- Accessories (Jewelry, Metkeb scarves)
- Shawls & Netelas

## Technologies Used

- HTML5
- CSS3 (Custom CSS, no frameworks)
- JavaScript (Vanilla JS)
- Google Fonts (Inter)
- Google OAuth
- Facebook SDK
- EmailJS

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is for demonstration purposes.

---

For questions or support, contact: info@habeshatraditional.com
