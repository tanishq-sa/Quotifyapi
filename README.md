# Quote API

A simple REST API that returns quotes based on different categories or random quotes.

## Features

- Get random quotes from any category
- Get quotes by specific type (sad, happy, motivational, love, wisdom)
- JSON responses with quote text, author, and metadata
- CORS enabled for cross-origin requests
- Error handling and validation

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Server

### Development mode (with auto-restart):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### 1. Get Random Quote
- **URL**: `/api`
- **Method**: `GET`
- **Description**: Returns a random quote from any category

**Example:**
```bash
curl http://localhost:3000/api
```

**Response:**
```json
{
  "quote": {
    "text": "The only way to do great work is to love what you do.",
    "author": "Steve Jobs"
  },
  "type": "random",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### 2. Get Quote by Type
- **URL**: `/api?type=<category>`
- **Method**: `GET`
- **Description**: Returns a random quote from the specified category

**Available Types:**
- `sad`
- `happy`
- `motivational`
- `love`
- `wisdom`

**Examples:**
```bash
curl http://localhost:3000/api?type=sad
curl http://localhost:3000/api?type=happy
curl http://localhost:3000/api?type=motivational
```

**Response:**
```json
{
  "quote": {
    "text": "Tears come from the heart and not from the brain.",
    "author": "Leonardo da Vinci"
  },
  "type": "sad",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### 3. Get Available Types
- **URL**: `/api/types`
- **Method**: `GET`
- **Description**: Returns all available quote categories

**Example:**
```bash
curl http://localhost:3000/api/types
```

**Response:**
```json
{
  "availableTypes": ["sad", "happy", "motivational", "love", "wisdom"],
  "total": 5
}
```

### 4. Welcome/Info Page
- **URL**: `/`
- **Method**: `GET`
- **Description**: Returns API information and available endpoints

## Error Handling

The API includes proper error handling:

- **404 Error**: When requesting an invalid quote type
- **500 Error**: For server errors
- **404 Error**: For unknown routes

**Error Response Example:**
```json
{
  "error": "Quote type not found",
  "message": "No quotes found for type: invalid",
  "availableTypes": ["sad", "happy", "motivational", "love", "wisdom"]
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
// Get random quote
fetch('http://localhost:3000/api')
  .then(response => response.json())
  .then(data => console.log(data.quote));

// Get sad quote
fetch('http://localhost:3000/api?type=sad')
  .then(response => response.json())
  .then(data => console.log(data.quote));
```

### Python/Requests
```python
import requests

# Get random quote
response = requests.get('http://localhost:3000/api')
data = response.json()
print(data['quote'])

# Get happy quote
response = requests.get('http://localhost:3000/api?type=happy')
data = response.json()
print(data['quote'])
```

## Configuration

You can change the port by setting the `PORT` environment variable:

```bash
PORT=5000 npm start
```

## License

MIT 