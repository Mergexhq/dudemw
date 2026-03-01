# 📡 API Documentation - Dude Men's Wears

**Version:** 1.0  
**Last Updated:** December 19, 2024  
**Base URL:** `http://localhost:3000` (development) | `https://your-domain.com` (production)  

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Shipping APIs](#shipping-apis)
3. [Tax Calculation APIs](#tax-calculation-apis)
4. [Payment APIs](#payment-apis)
5. [Admin APIs](#admin-apis)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

### Customer Authentication

**Provider:** Supabase Auth  
**Type:** JWT tokens  

**Headers Required:**
```http
Authorization: Bearer <supabase_access_token>
```

### Admin Authentication

**Type:** Custom session-based  
**Cookie:** `admin_session`  

**Admin Roles:**
- `super_admin`: Full access
- `admin`: Most features
- `manager`: Limited features
- `staff`: Inventory only

---

## 🚚 Shipping APIs

### Calculate Shipping Cost

Calculate shipping charges based on PIN code and quantity.

**Endpoint:** `POST /api/shipping/calculate`

**Request Body:**
```json
{
  "postalCode": "600001",
  "state": "Tamil Nadu",  // Optional
  "totalQuantity": 3
}
```

**Response (Success):**
```json
{
  "success": true,
  "amount": 6000,  // in paise (₹60.00)
  "optionName": "ST Courier Standard Delivery",
  "description": "Tamil Nadu Delivery (1-4 items)",
  "isTamilNadu": true,
  "estimatedDelivery": "28 Dec 2025"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid PIN code format"
}
```

**Shipping Rates:**
- **Tamil Nadu:**
  - 1-4 items: ₹60
  - 5+ items: ₹120
- **Outside Tamil Nadu:**
  - 1-4 items: ₹100
  - 5+ items: ₹150

**Tamil Nadu PIN Codes:**
- Range: 600001 to 643253
- Prefixes: 60xxxx, 61xxxx, 62xxxx, 63xxxx, 64xxxx

**Alternative: GET Request**
```http
GET /api/shipping/calculate?postalCode=600001&totalQuantity=3
```

**Status Codes:**
- `200`: Success
- `400`: Invalid request (missing/invalid parameters)
- `500`: Server error

---

## 💰 Tax Calculation APIs

### Calculate GST Tax

Calculate GST (CGST/SGST/IGST) for orders.

**Endpoint:** `POST /api/tax/calculate`

**Request Body:**
```json
{
  "items": [
    {
      "id": "variant-1",
      "productId": "prod-1",
      "price": 500,
      "quantity": 2,
      "gstRate": 12  // Optional, defaults to 12%
    }
  ],
  "customerState": "Tamil Nadu",
  "isPriceInclusive": false  // false = price excludes tax
}
```

**Response (Intra-State - Tamil Nadu):**
```json
{
  "success": true,
  "taxBreakdown": {
    "subtotal": 1000,
    "taxableAmount": 1000,
    "cgst": 60,  // Central GST (6%)
    "sgst": 60,  // State GST (6%)
    "igst": 0,
    "totalTax": 120,
    "grandTotal": 1120,
    "taxType": "intra-state",
    "storeState": "Tamil Nadu",
    "customerState": "Tamil Nadu",
    "isPriceInclusive": false,
    "items": [
      {
        "variantId": "variant-1",
        "productId": "prod-1",
        "taxableAmount": 1000,
        "cgst": 60,
        "sgst": 60,
        "igst": 0,
        "totalTax": 120,
        "gstRate": 12,
        "taxType": "intra-state"
      }
    ]
  }
}
```

**Response (Inter-State - Delhi):**
```json
{
  "success": true,
  "taxBreakdown": {
    "subtotal": 1000,
    "taxableAmount": 1000,
    "cgst": 0,
    "sgst": 0,
    "igst": 120,  // Integrated GST (12%)
    "totalTax": 120,
    "grandTotal": 1120,
    "taxType": "inter-state",
    "storeState": "Tamil Nadu",
    "customerState": "Delhi",
    "isPriceInclusive": false,
    "items": [/* ... */]
  }
}
```

**Tax Logic:**
- **Store Location:** Tamil Nadu
- **Intra-State (Customer in TN):** CGST (6%) + SGST (6%) = 12%
- **Inter-State (Customer outside TN):** IGST (12%)
- **Default GST Rate:** 12% (clothing)

**Status Codes:**
- `200`: Success
- `400`: Invalid request (missing items or state)
- `500`: Server error

---

## 💳 Payment APIs

### Create Razorpay Order

Create a payment order for checkout.

**Endpoint:** `POST /api/payments/create-order`

**Request Body:**
```json
{
  "amount": 1120,  // in rupees
  "currency": "INR",
  "receipt": "order_123",
  "notes": {
    "orderId": "order_123",
    "customerId": "customer_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_MnZ8xZ9...",
    "amount": 112000,  // in paise
    "currency": "INR",
    "receipt": "order_123",
    "status": "created"
  }
}
```

### Verify Payment

Verify Razorpay payment signature.

**Endpoint:** `POST /api/payments/verify`

**Request Body:**
```json
{
  "razorpay_order_id": "order_MnZ8xZ9...",
  "razorpay_payment_id": "pay_MnZ8xZ9...",
  "razorpay_signature": "9c5f8d..."
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "message": "Payment verified successfully"
}
```

### Razorpay Webhook

Receive payment notifications from Razorpay.

**Endpoint:** `POST /api/webhook/razorpay`  
**Headers:**
```http
X-Razorpay-Signature: <webhook_signature>
```

**Webhook Events:**
- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `order.paid`

**Security:**
- Signature verification using `RAZORPAY_WEBHOOK_SECRET`
- Rejects invalid signatures

---

## 🛠️ Admin APIs

### Add Tracking Number

Add ST Courier tracking number to order.

**Endpoint:** `POST /api/admin/orders/[orderId]/tracking`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "trackingNumber": "ST123456789",
  "carrier": "ST Courier"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "trackingUrl": "https://www.stcourier.com/track-consignment?tracking_no=ST123456789",
  "message": "Tracking number added successfully",
  "emailSent": true
}
```

**Side Effects:**
- Order status updated to "shipped"
- Customer receives tracking email
- Tracking URL generated

### CSV Import Preview

Preview product CSV before importing.

**Endpoint:** `POST /api/admin/products/import/preview`  
**Authentication:** Required (Admin)  
**Content-Type:** `multipart/form-data`

**Request:**
```http
POST /api/admin/products/import/preview
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="products.csv"
Content-Type: text/csv

[CSV content]
--boundary--
```

**Response:**
```json
{
  "success": true,
  "preview": {
    "totalRows": 20,
    "validRows": 18,
    "errors": [
      {
        "row": 5,
        "field": "sku",
        "message": "Duplicate SKU"
      }
    ],
    "products": [
      {
        "name": "Premium T-Shirt",
        "sku": "TCT-001",
        "variants": 4
      }
    ]
  }
}
```

### CSV Import Execute

Execute product import after preview.

**Endpoint:** `POST /api/admin/products/import/execute`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "previewId": "preview_123",
  "skipErrors": true  // Skip rows with errors
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "productsCreated": 5,
    "variantsCreated": 20,
    "errors": 2,
    "skipped": 2
  }
}
```

### Download CSV Template

**Endpoint:** `GET /api/admin/products/import/template`  
**Authentication:** Required (Admin)

**Response:**
- Content-Type: `text/csv`
- Downloads template CSV file

---

## ❌ Error Handling

### Error Response Format

All API errors follow this structure:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",  // Optional
  "details": {}  // Optional, for additional info
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_REQUEST` | Missing or invalid parameters |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., duplicate SKU) |
| 422 | `VALIDATION_ERROR` | Validation failed |
| 429 | `RATE_LIMIT` | Too many requests |
| 500 | `SERVER_ERROR` | Internal server error |

### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "postalCode": "Invalid PIN code format",
    "totalQuantity": "Must be greater than 0"
  }
}
```

---

## ⚡ Rate Limiting

**Limits:**
- Public APIs: 100 requests/minute per IP
- Admin APIs: 200 requests/minute per user
- Webhook APIs: 1000 requests/minute

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "retryAfter": 60  // seconds
}
```

---

## 🔧 Development Notes

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Resend
RESEND_API_KEY=re_xxx

# Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### Testing

**Test APIs with cURL:**

```bash
# Shipping calculation
curl -X POST http://localhost:3000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{"postalCode":"600001","totalQuantity":3}'

# Tax calculation
curl -X POST http://localhost:3000/api/tax/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id":"1","productId":"p1","price":500,"quantity":2}],
    "customerState": "Tamil Nadu",
    "isPriceInclusive": false
  }'
```

**Test with Postman:**
- Import collection: `/docs/postman-collection.json`
- Set environment variables
- Run tests

---

## 📚 Additional Resources

- **Admin Guide:** `ADMIN_QUICK_START_GUIDE.md`
- **Database Schema:** `/backend-implementation/README.md`
- **Service Documentation:** `/src/lib/services/README.md`
- **Testing Guide:** `QUICK_TEST_GUIDE.md`

---

## 📞 Support

**Technical Issues:**
- Email: tech@dudemw.com
- Documentation: `/docs`

**API Updates:**
- Check changelog for version updates
- Subscribe to API updates newsletter

---

**Version History:**
- v1.0 (Dec 19, 2024): Initial release

*For the latest API documentation, visit: `/docs/api`*