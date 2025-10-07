## Base URL

**Local Development:**

```
http://localhost:3000
```

**Production (After Deployment):**

```
stormhack-backend-production.up.railway.app
```

---

## 📚 Table of Contents

1. [Health Check](#1-health-check)
2. [Get All Diseases](#2-get-all-diseases)
3. [Search Ingredients](#3-search-ingredients)
4. [Get Ingredient Compatibility](#4-get-ingredient-compatibility)
5. [Get Disease Guide](#5-get-disease-guide)
6. [Voice Transcription](#6-voice-transcription)
7. [AI Chat (GPT Integration)](#7-ai-chat-gpt-integration)

---

## 1. Health Check

Check if the API server is running.

### Endpoint

```
GET /api/health
```

### Request Example

```bash
curl http://localhost:3000/api/health
```

### Response Example

```json
{
  "status": "ok",
  "message": "StormHack Backend is running!",
  "timestamp": "2025-10-04T12:34:56.789Z"
}
```

### Status Codes

- `200 OK` - Server is running

---

## 2. Get All Diseases

Retrieve a list of all available diseases in the database.

### Endpoint

```
GET /api/diseases
```

### Request Example

```bash
curl http://localhost:3000/api/diseases
```

### Response Example

```json
{
  "count": 3,
  "diseases": [
    {
      "name": "diabetes",
      "description": "A metabolic disorder characterized by high blood sugar levels"
    },
    {
      "name": "heart disease",
      "description": "Cardiovascular conditions affecting heart function"
    },
    {
      "name": "hypertension",
      "description": "High blood pressure condition"
    }
  ]
}
```

### Response Fields

- `count` (number) - Total number of diseases
- `diseases` (array) - List of disease objects
  - `name` (string) - Disease name (lowercase)
  - `description` (string) - Brief description

### Status Codes

- `200 OK` - Success

---

## 3. Search Ingredients

Search for ingredients by name (autocomplete/suggestions).

### Endpoint

```
GET /api/ingredients/search?q={query}
```

### Query Parameters

| Parameter | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| q         | string | Yes      | Search query (e.g., "mil") |

### Request Example

```bash
curl "http://localhost:3000/api/ingredients/search?q=mil"
```

### Response Example

```json
{
  "query": "mil",
  "results": [
    {
      "name": "milk",
      "category": "dairy"
    }
  ]
}
```

### Response Fields

- `query` (string) - The search query used
- `results` (array) - Matching ingredients (max 10)
  - `name` (string) - Ingredient name
  - `category` (string) - Ingredient category

### Status Codes

- `200 OK` - Success
- `400 Bad Request` - Missing query parameter

### Error Response Example

```json
{
  "error": "Bad request",
  "message": "Query parameter \"q\" is required"
}
```

---

## 4. Get Ingredient Compatibility

Get foods that should be avoided or beneficial when paired with a specific ingredient.

### Endpoint

```
GET /api/ingredients/{name}/compatibility?filter={filter}
```

### URL Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| name      | string | Yes      | Ingredient name (e.g., "milk") |

### Query Parameters

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| filter    | string | No       | Filter results: `all`, `avoid`, `beneficial` |
|           |        |          | Default: `all`                               |

### Request Examples

**Get all compatibility info:**

```bash
curl http://localhost:3000/api/ingredients/milk/compatibility
```

**Get only avoid list:**

```bash
curl "http://localhost:3000/api/ingredients/milk/compatibility?filter=avoid"
```

**Get only beneficial pairings:**

```bash
curl "http://localhost:3000/api/ingredients/milk/compatibility?filter=beneficial"
```

### Response Example (filter=all)

```json
{
  "ingredient": "milk",
  "category": "dairy",
  "avoid": [
    {
      "food": "citrus",
      "reason": "May cause digestion issues and stomach discomfort",
      "severity": 3,
      "sources": [
        {
          "label": "Nutrition Journal, 2020",
          "url": "https://example.com/nutrition-milk-citrus"
        }
      ]
    },
    {
      "food": "spinach",
      "reason": "Iron absorption may be reduced",
      "severity": 2,
      "sources": [
        {
          "label": "American Journal of Clinical Nutrition, 2019",
          "url": "https://example.com/iron-absorption"
        }
      ]
    }
  ],
  "beneficial": [
    {
      "food": "oats",
      "reason": "Balanced protein and carbohydrates for sustained energy",
      "severity": 2,
      "sources": [
        {
          "label": "Food Science Journal, 2021",
          "url": "https://example.com/milk-oats-benefits"
        }
      ]
    }
  ]
}
```

### Response Example (filter=avoid)

```json
{
  "ingredient": "milk",
  "category": "dairy",
  "avoid": [
    {
      "food": "citrus",
      "reason": "May cause digestion issues and stomach discomfort",
      "severity": 3,
      "sources": [...]
    }
  ]
}
```

### Response Fields

- `ingredient` (string) - Queried ingredient name
- `category` (string) - Ingredient category
- `avoid` (array) - Foods to avoid (only if filter is `all` or `avoid`)
  - `food` (string) - Food name
  - `reason` (string) - Why to avoid
  - `severity` (number) - Risk level (1-5, higher = more severe)
  - `sources` (array) - Citations
    - `label` (string) - Source name
    - `url` (string|null) - Link to source (null if no URL)
- `beneficial` (array) - Beneficial pairings (only if filter is `all` or `beneficial`)
  - Same structure as `avoid`

### Status Codes

- `200 OK` - Success
- `404 Not Found` - Ingredient not found

### Error Response Example

```json
{
  "error": "Ingredient not found",
  "message": "Ingredient \"xyz\" does not exist in our database"
}
```

---

## 5. Get Disease Guide

Get dietary recommendations for one or multiple diseases.

### Endpoint

```
POST /api/diseases/guide
```

### Request Headers

```
Content-Type: application/json
```

### Request Body

| Field    | Type     | Required | Description                                 |
| -------- | -------- | -------- | ------------------------------------------- |
| diseases | string[] | Yes      | Array of disease names (e.g., ["diabetes"]) |
| filter   | string   | No       | Filter: `all`, `avoid`, `beneficial`        |
|          |          |          | Default: `all`                              |

### Request Examples

**Single disease:**

```bash
curl -X POST http://localhost:3000/api/diseases/guide \
  -H "Content-Type: application/json" \
  -d '{
    "diseases": ["diabetes"]
  }'
```

**Multiple diseases:**

```bash
curl -X POST http://localhost:3000/api/diseases/guide \
  -H "Content-Type: application/json" \
  -d '{
    "diseases": ["diabetes", "hypertension"]
  }'
```

**With filter (only avoid):**

```bash
curl -X POST http://localhost:3000/api/diseases/guide \
  -H "Content-Type: application/json" \
  -d '{
    "diseases": ["diabetes"],
    "filter": "avoid"
  }'
```

### JavaScript Example (React Native / Expo)

```javascript
const response = await fetch("http://localhost:3000/api/diseases/guide", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    diseases: ["diabetes", "hypertension"],
    filter: "all", // or 'avoid' or 'beneficial'
  }),
});

const data = await response.json();
console.log(data);
```

### Response Example (Single Disease)

```json
{
  "diseases": ["diabetes"],
  "avoid": [
    {
      "food": "white bread",
      "reason": "High glycemic index causes rapid blood sugar spikes",
      "severity": 5,
      "affectedDiseases": ["diabetes"],
      "sources": [
        {
          "label": "American Diabetes Association Guidelines, 2023",
          "url": "https://diabetes.org/guidelines"
        }
      ]
    },
    {
      "food": "bacon",
      "reason": "High in saturated fats and sodium",
      "severity": 4,
      "affectedDiseases": ["diabetes"],
      "sources": [
        {
          "label": "ADA Nutrition Guidelines, 2023",
          "url": null
        }
      ]
    }
  ],
  "beneficial": [
    {
      "food": "whole grains",
      "reason": "Low glycemic index helps maintain stable blood sugar",
      "severity": 3,
      "affectedDiseases": ["diabetes"],
      "sources": [
        {
          "label": "Journal of Nutrition, 2022",
          "url": "https://example.com/whole-grains-diabetes"
        }
      ]
    },
    {
      "food": "leafy greens",
      "reason": "Rich in fiber and nutrients, minimal impact on blood sugar",
      "severity": 2,
      "affectedDiseases": ["diabetes"],
      "sources": [
        {
          "label": "Diabetes Care Journal, 2021",
          "url": null
        }
      ]
    }
  ]
}
```

### Response Example (Multiple Diseases)

```json
{
  "diseases": ["diabetes", "hypertension"],
  "avoid": [
    {
      "food": "bacon",
      "reason": "High in saturated fats and sodium; Very high sodium content increases blood pressure",
      "severity": 5,
      "affectedDiseases": ["diabetes", "hypertension"],
      "sources": [...]
    },
    {
      "food": "white bread",
      "reason": "High glycemic index causes rapid blood sugar spikes",
      "severity": 5,
      "affectedDiseases": ["diabetes"],
      "sources": [...]
    }
  ],
  "beneficial": [
    {
      "food": "whole grains",
      "reason": "Low glycemic index helps maintain stable blood sugar",
      "severity": 3,
      "affectedDiseases": ["diabetes"],
      "sources": [...]
    },
    {
      "food": "unsalted nuts",
      "reason": "Heart-healthy fats help lower blood pressure",
      "severity": 3,
      "affectedDiseases": ["hypertension"],
      "sources": [...]
    },
    {
      "food": "low-fat dairy",
      "reason": "Calcium and potassium support healthy blood pressure",
      "severity": 2,
      "affectedDiseases": ["hypertension"],
      "sources": [...]
    },
    {
      "food": "leafy greens",
      "reason": "Rich in fiber and nutrients, minimal impact on blood sugar",
      "severity": 2,
      "affectedDiseases": ["diabetes"],
      "sources": [...]
    }
  ]
}
```

### Response Fields

- `diseases` (string[]) - List of found diseases
- `avoid` (array) - Foods to avoid (only if filter is `all` or `avoid`)
  - `food` (string) - Food name
  - `reason` (string) - Why to avoid (combined if multiple diseases)
  - `severity` (number) - Risk level (1-5, uses highest if multiple diseases)
  - `affectedDiseases` (string[]) - Which diseases this food affects
  - `sources` (array) - Citations
    - `label` (string) - Source name
    - `url` (string|null) - Link to source
- `beneficial` (array) - Beneficial foods (only if filter is `all` or `beneficial`)
  - Same structure as `avoid`

### Status Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid request body
- `404 Not Found` - None of the diseases found

### Error Response Examples

**Missing diseases parameter:**

```json
{
  "error": "Bad request",
  "message": "Request body must include \"diseases\" array with at least one disease"
}
```

**No diseases found:**

```json
{
  "error": "No diseases found",
  "message": "None of the specified diseases exist in our database",
  "requestedDiseases": ["cancer", "covid"]
}
```

---

## 6. Voice Transcription

Convert audio recording to text (English only).

### Endpoint

```
POST /api/voice/transcribe
```

### Request Headers

```
Content-Type: multipart/form-data
```

### Request Body (Form Data)

| Field | Type | Required | Description                                       |
| ----- | ---- | -------- | ------------------------------------------------- |
| audio | File | Yes      | Audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm) |

### Request Example

```bash
curl -X POST http://localhost:3000/api/voice/transcribe \
  -F "audio=@recording.webm"
```

### Response Example

```json
{
  "text": "milk and diabetes",
  "originalText": "Milk and diabetes"
}
```

### Response Fields

- `text` (string) - Normalized text (lowercase, trimmed)
- `originalText` (string) - Original transcription

### Status Codes

- `200 OK` - Success
- `400 Bad Request` - Missing or invalid audio file
- `413 Payload Too Large` - File exceeds 25MB
- `500 Internal Server Error` - Transcription failed

### Error Response Example

```json
{
  "error": "Bad request",
  "message": "Audio file is required (field name: 'audio')"
}
```

### Notes

- Maximum file size: 25MB
- Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
- Language: English only
- Backend only handles speech-to-text; frontend handles text parsing and API routing

---

## 7. AI Chat (GPT Integration)

Direct access to GPT models using backend API key.

### Endpoint

```
POST /api/ai/chat
```

### Request Headers

```
Content-Type: application/json
```

### Request Body

| Field       | Type   | Required | Description                              |
| ----------- | ------ | -------- | ---------------------------------------- |
| messages    | array  | Yes      | Array of message objects (OpenAI format) |
| model       | string | No       | Model name (default: "gpt-4")            |
| temperature | number | No       | Response randomness 0-2 (default: 0.7)   |
| max_tokens  | number | No       | Maximum response length                  |

### Message Format

Each message in the `messages` array must have:

- `role` (string): "system", "user", or "assistant"
- `content` (string): Message text

### Request Examples

**Simple question:**

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What foods help with diabetes?"}
    ]
  }'
```

With system prompt:

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a nutrition expert."},
      {"role": "user", "content": "Can I eat bananas with diabetes?"}
    ],
    "model": "gpt-4",
    "temperature": 0.7
  }'
```

Conversation history:

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "I have diabetes"},
      {"role": "assistant", "content": "I can help with diabetes nutrition advice."},
      {"role": "user", "content": "What breakfast do you recommend?"}
    ]
  }'
```

JavaScript Example (React Native / Expo)

```javascript
const response = await fetch("http://localhost:3000/api/ai/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [
      { role: "system", content: "You are a helpful nutrition assistant." },
      { role: "user", content: "I have diabetes, what should I eat for breakfast?" }
    ],
    model: "gpt-4",
    temperature: 0.7
  }),
});

const data = await response.json();
console.log(data.message);
Response Example
json{
  "message": "For diabetes, I recommend a balanced breakfast with whole grains like oatmeal, protein from eggs or Greek yogurt, and fiber-rich foods. Avoid sugary cereals and fruit juices.",
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 42,
    "total_tokens": 67
  },
  "model": "gpt-4"
}
```

### Response Fields

message (string) - AI-generated response
usage (object) - Token usage statistics

prompt_tokens (number) - Input tokens
completion_tokens (number) - Output tokens
total_tokens (number) - Total tokens used

model (string) - Model used for generation

### Status Codes

- `200` OK - Success
- `400` Bad Request - Invalid request format
- `402` Payment Required - OpenAI quota exceeded
- `429` Too Many Requests - Rate limit exceeded (100 requests per 15 minutes)
- `500` Internal Server Error - AI generation failed

### Error Response Examples

#### Missing messages:

```json
{
  "error": "Bad request",
  "message": "messages array is required"
}
```

#### Invalid message format:

```json
{
  "error": "Bad request",
  "message": "Each message must have role and content"
}
```

#### Quota exceeded:

```json
{
  "error": "Quota exceeded",
  "message": "OpenAI API quota has been exceeded"
}
```

#### Rate limited:

```json
{
  "error": "Too many requests",
  "message": "Please try again later"
}
```

### Notes

- Uses backend's OpenAI API key (secure)
- Supports all OpenAI chat models (gpt-4, gpt-3.5-turbo, etc.)
- Rate limited to prevent abuse (100 requests per 15 minutes per IP)
- Maximum response controlled by OpenAI's model limits

---

## 🔍 Data Reference

### Severity Levels

| Level | Description      | Example                          |
| ----- | ---------------- | -------------------------------- |
| 5     | Critical concern | High sodium for hypertension     |
| 4     | Strong caution   | Saturated fats for heart disease |
| 3     | Moderate concern | Citrus + milk digestion issues   |
| 2     | Mild concern     | General nutritional advice       |
| 1     | Minor note       | Weak interaction                 |

### Available Diseases

- `diabetes` - Metabolic disorder with high blood sugar
- `hypertension` - High blood pressure condition
- `heart disease` - Cardiovascular conditions

### Sample Ingredients

- Dairy: `milk`, `low-fat dairy`
- Grains: `oats`, `white bread`, `whole grains`
- Vegetables: `spinach`, `leafy greens`
- Fruits: `citrus`
- Protein: `bacon`, `unsalted nuts`

---

## 🚨 Error Handling

All endpoints may return the following error:

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

### Best Practices

- Always check the HTTP status code
- Handle network errors (timeout, no connection)
- Show user-friendly error messages
- Implement retry logic for 500 errors

---

## 📱 Frontend Integration Tips

### 1. Create an API Service

```javascript
// services/api.js
const API_URL = __DEV__
  ? "http://localhost:3000"
  : "https://your-production-url.railway.app";

export const api = {
  // Get all diseases
  async getDiseases() {
    const response = await fetch(`${API_URL}/api/diseases`);
    return response.json();
  },

  // Search ingredients
  async searchIngredients(query) {
    const response = await fetch(
      `${API_URL}/api/ingredients/search?q=${encodeURIComponent(query)}`
    );
    return response.json();
  },

  // Get ingredient compatibility
  async getIngredientCompatibility(name, filter = "all") {
    const response = await fetch(
      `${API_URL}/api/ingredients/${encodeURIComponent(
        name
      )}/compatibility?filter=${filter}`
    );
    return response.json();
  },

  // Get disease guide
  async getDiseaseGuide(diseases, filter = "all") {
    const response = await fetch(`${API_URL}/api/diseases/guide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diseases, filter }),
    });
    return response.json();
  },

  // Voice transcription
  async transcribeAudio(audioFile) {
    const formData = new FormData();
    formData.append("audio", audioFile);

    const response = await fetch(`${API_URL}/api/voice/transcribe`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },
};
```

### 2. Usage Example

```javascript
import { api } from "./services/api";

// In your component
const handleSearch = async () => {
  try {
    const data = await api.getIngredientCompatibility("milk", "all");
    setResults(data);
  } catch (error) {
    console.error("API Error:", error);
    setError("Failed to fetch data");
  }
};
```

### 3. Error Handling

```javascript
const fetchData = async () => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Request failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error.message);
    // Show error to user
  }
};
```

---

## 📝 Notes

- All ingredient and disease names are **case-insensitive** (automatically converted to lowercase)
- Results are **sorted by severity (descending)** then **alphabetically**
- Sources may have `url: null` if only a citation label exists
- Multiple diseases combine results and use **highest severity** for overlapping foods
- Maximum 10 results for ingredient search

---

## 🔄 Version

**API Version:** 1.1.0  
**Last Updated:** October 4, 2025

**Changelog:**

- v1.1.0: Added voice transcription endpoint
- v1.0.0: Initial release

---

## 📞 Support

For issues or questions, contact the backend team or check the GitHub repository.
