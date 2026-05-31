# 💬 Quotify API

[![npm version](https://badge.fury.io/js/quotifyapi.svg)](https://badge.fury.io/js/quotifyapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

A beautiful, fast, and reliable quote API that provides inspirational quotes across multiple categories. Built with Express.js and designed for performance, it's perfect for developers building applications that need motivational content.

## ⚠️ Important Copyright Notice

**Quotify API does not own, create, or claim ownership of any quotes provided through this service.** All quotes are the intellectual property of their respective authors, creators, and copyright holders. This API serves as a collection and distribution platform only.

**Please respect the original authors' rights and ensure proper attribution when using these quotes in your applications.**

## ✨ Features

- 🚀 **Fast & Reliable** - Built with Express.js and optimized for performance
- 🛡️ **Secure** - Rate limiting, security headers, and abuse protection
- 📚 **Rich Content** - Multiple categories: happy, sad, love, motivational, wisdom
- 🌐 **Easy Integration** - Simple REST API with comprehensive documentation
- 📱 **Responsive Design** - Beautiful documentation website included
- 🎯 **CLI Tool** - Command-line interface for quick access
- 📊 **Statistics** - Detailed quote counts and category information

## 🚀 Quick Start

### Install as NPM Package

```bash
npm install quotifyapi
```

### Use in Your Code

The SDK supports both **Offline Mode** (using bundled local quotes) and **Online Mode** (querying the live Quote API server).

#### Offline Mode (No API key required)

```javascript
const { getRandomQuote, getRandomQuoteByType } = require('quotifyapi');

// Get a random quote from any category
const randomQuote = getRandomQuote();
console.log(randomQuote.text); // "Life is what happens when you're busy making other plans."
console.log(randomQuote.author); // "John Lennon"

// Get a motivational quote
const motivationalQuote = getRandomQuoteByType('motivational');
console.log(motivationalQuote.text); // "The only way to do great work is to love what you do."
```

#### Online Mode (Requires API key)

```javascript
const { ApiClient } = require('quotifyapi');

// Initialize the API client
const client = new ApiClient('your_api_key_here');

async function getOnlineQuotes() {
  try {
    // Get a random quote
    const quote = await client.getRandomQuote();
    console.log(`${quote.text} — ${quote.author}`);

    // Get a quote by category
    const wisdomQuote = await client.getRandomQuoteByType('wisdom');
    console.log(`${wisdomQuote.text} — ${wisdomQuote.author}`);
  } catch (error) {
    console.error('Error fetching quotes:', error.message);
  }
}

getOnlineQuotes();
```

### CLI Usage

```bash
# Get a random quote
npx quotifyapi random

# Get a specific category
npx quotifyapi type motivational
npx quotifyapi type love

# Show available categories
npx quotifyapi types

# Show statistics
npx quotifyapi stats

# Get help
npx quotifyapi help
```

> **Note**: The CLI requires authentication. If the `QUOTIFY_API_KEY` environment variable is not configured, the CLI will interactively prompt you to input your API key when running commands in a terminal.

## 🚀 GitHub Actions & CI/CD

This project uses GitHub Actions for automated testing, quality checks, and deployment. The following workflows are configured:

### 🔄 Automated Workflows

- **Test & Quality Check** - Runs on every push and pull request
- **Deploy to Vercel** - Automatically deploys to staging, manual approval for production
- **Release Management** - Creates GitHub releases and publishes to npm on version tags
- **Dependabot** - Automatically checks for dependency updates weekly

### 📋 Required GitHub Secrets

To enable automatic deployment, add these secrets to your repository:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel deployment token | [Vercel Account Settings](https://vercel.com/account/tokens) |
| `ORG_ID` | Vercel team/organization ID | Vercel Dashboard → Settings → General |
| `PROJECT_ID` | Vercel project ID | Vercel Project Dashboard → Settings → General |
| `NPM_TOKEN` | NPM publish token (optional) | [NPM Account Settings](https://www.npmjs.com/settings/tokens) |

### 🏗️ Workflow Details

- **Matrix Testing**: Tests against Node.js 16.x, 18.x, and 20.x
- **Security Audits**: Runs `npm audit` to check for vulnerabilities
- **Quality Gates**: All tests must pass before deployment
- **Automatic Releases**: Push a tag like `v1.2.1` to trigger a release

For detailed setup instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🌐 API Endpoints

### Base URL

```
https://quotify.dazzelr.tech
```

### Get Random Quote

```http
GET /api
```

**Response:**

```json
{
  "quote": {
    "text": "Life is what happens when you're busy making other plans.",
    "author": "John Lennon"
  },
  "type": "random",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### Get Quote by Category

```http
GET /api?type=motivational
```

**Available Categories:**

- `happy` - Uplifting and joyful quotes
- `sad` - Thoughtful and reflective quotes
- `love` - Romantic and affectionate quotes
- `motivational` - Inspirational and encouraging quotes
- `wisdom` - Philosophical and insightful quotes

### Get Available Categories

```http
GET /api/types
```

**Response:**

```json
{
  "availableTypes": ["happy", "sad", "love", "motivational", "wisdom"],
  "total": 5
}
```

### Get Statistics

```http
GET /api/stats
```

**Response:**

```json
{
  "message": "Quote statistics by category",
  "counts": {
    "happy": 25,
    "sad": 20,
    "love": 30,
    "motivational": 35,
    "wisdom": 15,
    "total": 125
  }
}
```

## 🛡️ Security

Quotify API includes multiple layers of security protections:

### XSS Protection

All dynamic content rendered in the documentation site and admin dashboard is sanitized through a global `escapeHTML` function. This prevents cross-site scripting attacks from malicious data in API responses, user names, or error messages.

### Standardized Error Responses

All API endpoints return a consistent error format, making it easy to handle errors programmatically:

```json
{
  "success": false,
  "error": "Validation error",
  "message": "All fields are required"
}
```

In **production mode**, internal server errors (500) are masked to prevent information leakage:

```json
{
  "error": "Error",
  "message": "Something went wrong on the server"
}
```

In **development mode**, full error details including stack traces are returned for debugging.

### Additional Protections

- 🔒 **Helmet** - Security headers (CSP, HSTS, X-Frame-Options, etc.)
- 🔑 **JWT Authentication** - Secure token-based API access
- 🛡️ **Rate Limiting** - Protection against abuse and DDoS
- 🔐 **Payment Signature Verification** - Razorpay HMAC validation
- 🚫 **Input Validation** - All user inputs are validated before processing

## 🛡️ Rate Limits

To ensure fair usage and protect against abuse, the following rate limits are enforced:

- **General Requests**: 1,000 requests per 15 minutes
- **API Endpoints**: 500 requests per 15 minutes
- **Strict Limit**: 50 requests per minute (additional protection)

### Rate Limit Headers

The API includes rate limit information in response headers:

- `RateLimit-Limit` - Maximum requests per window
- `RateLimit-Remaining` - Remaining requests in current window
- `RateLimit-Reset` - Time when the rate limit resets

## 🏗️ Installation & Setup

### Option 1: Use as NPM Package (Recommended)

```bash
npm install quote-api
```

### Option 2: Self-Hosted

```bash
# Clone the repository
git clone https://github.com/tanishq-sa/Quotifyapi
cd quotifyapi

# Install dependencies
npm install

# Start the server
npm start

# For development with auto-reload
npm run dev
```

The API will be available at `https://quotify.dazzelr.tech`

## 📚 Documentation Website

A beautiful, interactive documentation website is included and automatically served at the root URL when you run the server. Features include:

- 📖 Comprehensive API documentation
- 🧪 Interactive API tester
- 💻 Code examples in multiple languages
- 📱 Responsive design
- 🎨 Modern dark theme
- ⌨️ Keyboard shortcuts

Visit `https://quotify.dazzelr.tech` to explore the documentation.

## 🔧 Configuration

### Environment Variables

```bash
PORT=3000                    # Server port (default: 3000)
NODE_ENV=production         # Environment mode
```

### Customization

You can easily add your own quotes by editing the files in the `quotes/` directory:

```javascript
// quotes/custom.js
module.exports = [
  {
    text: "Your custom quote here",
    author: "Your Name"
  }
  // ... more quotes
];
```

Then update `quotes.js` to include your new category.

## 🚀 Deployment

### Vercel (Recommended)

The project includes `vercel.json` for easy deployment to Vercel:

```bash
npm install -g vercel
vercel
```

### Other Platforms

The API works on any Node.js hosting platform:

- Heroku
- Railway
- DigitalOcean App Platform
- AWS Lambda (with serverless framework)

## 📦 Package Structure

```
quotifyapi/
├── server.js          # Express server with global error handler
├── quotes.js          # Quote management functions
├── auth.js            # Authentication & passport config
├── database-adapter.js # Database abstraction layer
├── cli.js             # Command-line interface
├── config/
│   └── plan-limits.js # Rate limit plans
├── routes/            # API route modules
│   ├── admin.js       # Admin management endpoints
│   ├── auth.js        # OAuth & login endpoints
│   ├── contact.js     # Contact form handler
│   ├── payments.js    # Razorpay payment routes
│   ├── quotes.js      # Quote API endpoints
│   └── user.js        # User profile endpoints
├── quotes/            # Quote data files
│   ├── happy.js
│   ├── sad.js
│   ├── love.js
│   ├── motivational.js
│   └── wisdom.js
├── public/            # Documentation website
│   ├── index.html
│   ├── admin.html     # Admin dashboard (XSS-safe)
│   └── script.js      # Frontend with escapeHTML protection
├── package.json
├── README.md
├── DEPLOYMENT.md
├── SECURE_ENV_GUIDE.md
├── RAZORPAY_SETUP.md
├── EMAIL_SETUP.md
└── vercel.json
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Adding Quotes

To add new quotes:

1. Add your quotes to the appropriate category file in `quotes/`
2. Follow the existing format: `{ text: "Quote text", author: "Author name" }`
3. Submit a pull request

### Adding Categories

To add new quote categories:

1. Create a new file in `quotes/` (e.g., `quotes/philosophy.js`)
2. Update `quotes.js` to include your new category
3. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Express.js** - Web framework
- **Inter Font** - Beautiful typography
- **Prism.js** - Syntax highlighting
- **Community** - For inspiration and feedback

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/tanishq-sa/Quotifyapi/issues)
- 📖 **Documentation**: [API Docs](https://quotify.dazzelr.tech)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/tanishq-sa/Quotifyapi/discussions)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tanishq-sa/quotifyapi&type=Timeline)](https://www.star-history.com/#tanishq-sa/quotifyapi&Timeline)
---

Made with ❤️ by [Tanishq Saini](https://github.com/tanishq-sa)

If this project helps you, please give it a ⭐️!
