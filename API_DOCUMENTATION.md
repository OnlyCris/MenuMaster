# MenuIsland - API Documentation

## Base URL
```
Production: https://yourdomain.com/api
Development: http://localhost:5000/api
```

## Authentication
All API endpoints require session-based authentication except where noted.

### Headers
```
Content-Type: application/json
Cookie: connect.sid=<session_id>
```

---

## Authentication Endpoints

### POST /auth/login
User authentication

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "hasPaid": true,
  "maxRestaurants": 5
}
```

### POST /auth/register
User registration

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

### GET /auth/user
Get current user info

**Response:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "hasPaid": true,
  "maxRestaurants": 5,
  "profileImageUrl": null
}
```

### POST /auth/logout
Logout current user

---

## Restaurant Management

### GET /restaurants
Get user's restaurants

**Response:**
```json
[
  {
    "id": 1,
    "name": "Il Ritrovo",
    "location": "Via Roma 123, Milano",
    "subdomain": "ilritrovo",
    "logoUrl": "/uploads/logos/restaurant1.jpg",
    "templateId": 2,
    "ownerId": "user123",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### POST /restaurants
Create new restaurant

**Request:**
```json
{
  "name": "Nuovo Ristorante",
  "location": "Via Example 456, Roma",
  "subdomain": "nuovoristorante",
  "templateId": 1
}
```

### GET /restaurants/:id
Get specific restaurant

### PUT /restaurants/:id
Update restaurant

**Request:**
```json
{
  "name": "Nome Aggiornato",
  "location": "Nuova Posizione",
  "templateId": 3
}
```

### DELETE /restaurants/:id
Delete restaurant

---

## Template Management

### GET /templates
Get all available templates

**Response:**
```json
[
  {
    "id": 1,
    "name": "Template Moderno",
    "description": "Design pulito e minimale",
    "thumbnailUrl": "/uploads/templates/modern.jpg",
    "cssStyles": "/* CSS styles */",
    "colorScheme": "{\"primary\":\"#2C3E50\",\"secondary\":\"#E8F4FD\"}",
    "isPopular": true,
    "isNew": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### GET /templates/:id
Get specific template

### POST /templates
Create new template (Admin only)

### PUT /templates/:id
Update template (Admin only)

### DELETE /templates/:id
Delete template (Admin only)

---

## Menu Management

### GET /restaurants/:id/categories
Get restaurant categories

**Response:**
```json
[
  {
    "id": 1,
    "name": "Antipasti",
    "description": "Selezione di antipasti della casa",
    "restaurantId": 1,
    "orderIndex": 1,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### POST /categories
Create new category

**Request:**
```json
{
  "name": "Primi Piatti",
  "description": "Pasta fresca fatta in casa",
  "restaurantId": 1,
  "orderIndex": 2
}
```

### GET /categories/:id/menu-items
Get category menu items

**Response:**
```json
[
  {
    "id": 1,
    "name": "Spaghetti Carbonara",
    "description": "Pasta con uova, pecorino e guanciale",
    "price": "€14.00",
    "imageUrl": "/uploads/items/carbonara.jpg",
    "categoryId": 1,
    "orderIndex": 1,
    "isAvailable": true,
    "allergens": [
      {
        "id": 1,
        "name": "Glutine",
        "description": "Contiene glutine"
      }
    ]
  }
]
```

### POST /menu-items
Create new menu item

**Request:**
```json
{
  "name": "Margherita Pizza",
  "description": "Pomodoro, mozzarella, basilico",
  "price": "€12.00",
  "categoryId": 2,
  "orderIndex": 1,
  "isAvailable": true
}
```

### PUT /menu-items/:id
Update menu item

### DELETE /menu-items/:id
Delete menu item

---

## Allergen Management

### GET /allergens
Get all allergens

**Response:**
```json
[
  {
    "id": 1,
    "name": "Glutine",
    "description": "Contiene glutine",
    "iconUrl": "/uploads/allergens/gluten.png"
  }
]
```

### POST /allergens
Create allergen

### POST /menu-items/:id/allergens
Add allergen to menu item

**Request:**
```json
{
  "allergenId": 1
}
```

### DELETE /menu-items/:menuItemId/allergens/:allergenId
Remove allergen from menu item

---

## QR Code Management

### GET /restaurants/:id/qr-codes
Get restaurant QR codes

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tavolo 1",
    "qrData": "data:image/png;base64,...",
    "restaurantId": 1,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### POST /qr-codes
Generate new QR code

**Request:**
```json
{
  "name": "Tavolo 5",
  "restaurantId": 1
}
```

### DELETE /qr-codes/:id
Delete QR code

---

## Analytics

### GET /analytics/dashboard
Get user analytics dashboard

**Response:**
```json
{
  "totalVisits": 1250,
  "totalScans": 340,
  "totalMenuItems": 45,
  "totalCategories": 8,
  "chartData": [
    {
      "date": "15/01",
      "visits": 25,
      "scans": 8
    }
  ]
}
```

### GET /analytics/restaurant/:id
Get restaurant-specific analytics

**Query Parameters:**
- `days` (optional): Number of days (default: 30)

**Response:**
```json
{
  "totalVisits": 340,
  "totalScans": 89,
  "chartData": [
    {
      "date": "15/01",
      "visits": 15,
      "scans": 4
    }
  ],
  "mostViewedItems": [
    {
      "name": "Carbonara",
      "views": 45,
      "category": "Primi Piatti"
    }
  ],
  "languageStats": [
    {
      "language": "it",
      "count": 180,
      "percentage": 53
    }
  ]
}
```

### POST /analytics/visit/:restaurantId
Track restaurant visit

### POST /analytics/qr-scan/:restaurantId
Track QR code scan

### POST /analytics/menu-item-view
Track menu item view

**Request:**
```json
{
  "menuItemId": 1,
  "restaurantId": 1,
  "viewerLanguage": "it",
  "ipAddress": "192.168.1.1"
}
```

---

## Support System

### GET /support/tickets
Get user's support tickets

**Response:**
```json
[
  {
    "id": 1,
    "subject": "Problema con upload immagini",
    "message": "Non riesco a caricare foto dei piatti",
    "priority": "medium",
    "status": "open",
    "category": "technical",
    "userId": "user123",
    "userEmail": "user@example.com",
    "response": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### POST /support/tickets
Create support ticket

**Request:**
```json
{
  "subject": "Richiesta funzionalità",
  "message": "Vorrei poter esportare il menu in PDF",
  "priority": "low",
  "category": "feature"
}
```

---

## Admin Endpoints

### GET /admin/users
Get all users (Admin only)

**Response:**
```json
[
  {
    "id": "user123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false,
    "hasPaid": true,
    "maxRestaurants": 5,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### PUT /admin/users/:id
Update user (Admin only)

### DELETE /admin/users/:id
Delete user (Admin only)

### GET /admin/restaurants
Get all restaurants (Admin only)

### GET /admin/payment-stats
Get payment statistics (Admin only)

**Response:**
```json
{
  "totalUsers": 150,
  "paidUsers": 45,
  "activeUsers": 120
}
```

### GET /admin/system-stats
Get system statistics (Admin only)

**Response:**
```json
{
  "totalRestaurants": 45,
  "totalMenuItems": 1250,
  "totalVisits": 15000,
  "totalQrScans": 3200
}
```

### GET /admin/support/tickets
Get all support tickets (Admin only)

### PUT /admin/support/tickets/:id/status
Update ticket status (Admin only)

**Request:**
```json
{
  "status": "resolved"
}
```

### PUT /admin/support/tickets/:id/response
Send ticket response (Admin only)

**Request:**
```json
{
  "response": "Ciao! Abbiamo risolto il problema. Prova ora."
}
```

---

## File Upload

### POST /upload/logo
Upload restaurant logo

**Request:** `multipart/form-data`
- `file`: Image file (max 2MB)
- `restaurantId`: Restaurant ID

**Response:**
```json
{
  "url": "/uploads/logos/restaurant_1_logo.jpg"
}
```

### POST /upload/menu-item
Upload menu item image

**Request:** `multipart/form-data`
- `file`: Image file (max 5MB)
- `menuItemId`: Menu item ID

---

## Menu Public Access

### GET /menu/:subdomain
Get public menu (No auth required)

**Response:**
```json
{
  "restaurant": {
    "id": 1,
    "name": "Il Ritrovo",
    "location": "Via Roma 123, Milano",
    "logoUrl": "/uploads/logos/restaurant1.jpg",
    "template": {
      "name": "Template Elegante",
      "cssStyles": "/* CSS */",
      "colorScheme": "{\"primary\":\"#2C3E50\"}"
    }
  },
  "categories": [
    {
      "id": 1,
      "name": "Antipasti",
      "description": "Selezione di antipasti",
      "items": [
        {
          "id": 1,
          "name": "Bruschetta",
          "description": "Pane tostato con pomodori",
          "price": "€8.50",
          "imageUrl": "/uploads/items/bruschetta.jpg",
          "allergens": ["Glutine"]
        }
      ]
    }
  ]
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Common Errors
```json
{
  "message": "Validation error",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  }
}
```

```json
{
  "message": "Unauthorized",
  "code": "AUTH_REQUIRED"
}
```

```json
{
  "message": "Restaurant not found",
  "code": "RESOURCE_NOT_FOUND"
}
```

---

## Rate Limiting

### Limits
- General API: 100 requests/minute
- Authentication: 10 requests/minute
- File Upload: 5 requests/minute

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Webhooks

### Stripe Webhook
**POST /stripe/webhook**

Handles Stripe payment events for subscription management.

**Events:**
- `payment_intent.succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## Health Check

### GET /health
System health check (No auth required)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.5.0"
}
```

---

**Complete API documentation for MenuIsland v1.5.0**