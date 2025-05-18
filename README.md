# Notification Service API

A robust notification service that supports email, SMS, and in-app notifications with queueing and retry mechanisms.

## Features

- Multiple notification channels:
  - Email (via Nodemailer)
  - SMS (via Twilio)
  - In-app notifications (via Firebase Cloud Messaging)
- Message queueing with RabbitMQ
- Automatic retry mechanism for failed notifications
- JWT-based authentication
- User notification preferences
- Scalable architecture

## Prerequisites

- Node.js >= 14
- MongoDB
- RabbitMQ Server
- Firebase project (for in-app notifications)
- Twilio account (for SMS)
- SMTP server access (for email)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the variables
4. Start the server:
   ```bash
   npm start
   ```

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /auth/register

Request body:
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phoneNumber": "string" (optional)
}

Response: {
  "_id": "string",
  "name": "string",
  "email": "string",
  "phoneNumber": "string",
  "notificationPreferences": {
    "email": boolean,
    "sms": boolean,
    "inApp": boolean
  },
  "token": "string"
}
```

#### Login
```
POST /auth/login

Request body:
{
  "email": "string",
  "password": "string"
}

Response: Same as register
```

#### Update Notification Preferences
```
PUT /auth/preferences
Authorization: Bearer <token>

Request body:
{
  "email": boolean,
  "sms": boolean,
  "inApp": boolean
}

Response: {
  "_id": "string",
  "notificationPreferences": {
    "email": boolean,
    "sms": boolean,
    "inApp": boolean
  }
}
```

### Notification Endpoints

#### Send Notification
```
POST /notifications
Authorization: Bearer <token>

Request body:
{
  "userId": "string",
  "type": "email" | "sms" | "in-app",
  "title": "string",
  "content": "string",
  "metadata": {
    // Optional additional data
    "html": "string" (for email),
    "priority": "string",
    "action": "string",
    // ... any other custom fields
  }
}

Response: {
  "_id": "string",
  "userId": "string",
  "type": "string",
  "title": "string",
  "content": "string",
  "status": "pending",
  "metadata": object
}
```

#### Get User Notifications
```
GET /notifications/users/:id/notifications
Authorization: Bearer <token>

Query Parameters:
- page (default: 1)
- limit (default: 10)
- status (optional: 'pending' | 'sent' | 'failed')
- type (optional: 'email' | 'sms' | 'in-app')

Response: {
  "notifications": [
    {
      "_id": "string",
      "type": "string",
      "title": "string",
      "content": "string",
      "status": "string",
      "createdAt": "date",
      "metadata": object
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

Error response format:
```json
{
  "error": "Error message"
}
```

## Environment Variables

See `.env.example` for all required environment variables and their descriptions.

## Testing

Run tests with:
```bash
npm test
```

## Queue Processing

The service uses RabbitMQ for reliable message delivery:
- Messages are queued immediately
- Failed notifications are retried up to 3 times
- Exponential backoff between retries
- Dead letter queue for failed messages

## Security

- All routes requiring authentication are protected with JWT
- Passwords are hashed using bcrypt
- Environment variables are used for sensitive data
- Input validation on all endpoints
- Rate limiting on authentication endpoints
- Secure headers implementation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [RabbitMQ](https://www.rabbitmq.com/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Twilio](https://www.twilio.com/)
- [Nodemailer](https://nodemailer.com/)