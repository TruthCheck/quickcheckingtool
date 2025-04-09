# TruthCheck Backend API

A fact-checking platform for verifying news authenticity in Nigeria

## Table of Contents

- Overview

- Features

- Technology Stack

- API Documentation

- Installation

- Configuration

- Running the Application

- Testing

- Deployment

- Project Structure

- Contributing

---

## Overview

TruthCheck is a backend API for a fact-checking platform that allows users to verify the authenticity of news, images, and claims related to health, security, and politics in Nigeria. The system is optimized for entry-level smartphones and supports multiple Nigerian languages (English, Yoruba, Igbo, and Hausa).

---

## Features

1. User Authentication: Secure JWT-based authentication system but was not implemented

2. Claim Submission: Users can submit claims for verification

3. Multi-language Support: Content available in English, Yoruba, Igbo, and Hausa

4. Image Verification: Reverse image search and perceptual hashing

5. Official Database Integration: Verification against trusted sources

6. Offline Functionality: Downloadable content for offline verification

7. Admin Dashboard: Tools for content moderation and analytics

8. Caching: Redis-based caching for improved performance

---

## Technology Stack

### Core Technologies

- Node.js (v18+)

- Express.js (v4.x)

- MongoDB (v6.x) with Mongoose ODM

- Redis (for caching)

---

### Key Libraries

- Google Cloud Vision API (image verification)

- Google Translate API (language translation)

- JWT (authentication)

- Swagger (API documentation)

- Pino (logging)

- Jest (testing)

---

## API Documentation

Comprehensive API documentation is available via Swagger UI when the application is running:

(http://localhost:5000/api-docs)

The documentation includes:

- All available endpoints

- Request/response examples

- Authentication requirements

- Error codes

---

## Installation

### Prerequisites

- Node.js (v18 or higher)

- MongoDB (v6 or higher)

- Redis

- Google Cloud account (for Vision and Translate APIs)

- NCDC API credentials (for health claims verification)

---

## Steps

### Clone the repository:

```
git clone https://github.com/TruthCheck/quickcheckingtool.git
cd truthcheck

```

---

### Install dependencies:

```
npm install

```

Set up environment variables (see Configuration)

Configuration: Create a .env file in the root directory with the following variables:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/truthcheck
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
REDIS_URL=redis://localhost:6379
GOOGLE_APPLICATION_CREDENTIALS=./config/google-service-account.json
NCDC_API_KEY=your_ncdc_api_key
TRANSLATION_API_KEY=your_translation_api_key
FILE_UPLOAD_PATH=./public/uploads
MAX_FILE_UPLOAD=5

```

---

## Running the Application

### Development Mode

```
npm run dev

```

### Production Mode

```
npm start

```

The API will be available at http://localhost:5000

---

## Testing

To run the test suite:

```
npm test

```

Test coverage includes:

- Authentication

- Claim submission and retrieval

- Verification workflows

- Error handling

---

## Project Structure

```
truthcheck-backend/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── models/           # MongoDB models
├── routes/           # Express routes
├── services/         # Business logic
├── utils/            # Helper functions
├── middleware/       # Express middleware
├── jobs/             # Scheduled tasks
├── clients/          # External API clients
├── locales/          # Language files
├── tests/            # Test cases
└── app.js            # Main application file


```

---

## Contributing

Please follow these steps:

Fork the repository

- Create your feature branch (git checkout -b feature/AmazingFeature)

- Commit your changes (git commit -m 'Add some AmazingFeature')

- Push to the branch (git push origin feature/AmazingFeature)

- Open a Pull Request

Please ensure your code follows the style guidelines and includes appropriate tests.
