# 🎯 Admin Quick Start Guide - Dude Men's Wears

**Last Updated:** December 19, 2024  
**For:** Store Administrators  

---

## 📋 Table of Contents

1. [Initial Setup](#initial-setup)
2. [Adding Products](#adding-products)
3. [Managing Orders](#managing-orders)
4. [Adding Tracking Numbers](#adding-tracking-numbers)
5. [Managing Inventory](#managing-inventory)
6. [Managing Banners](#managing-banners)
7. [CSV Import/Export](#csv-import-export)
8. [Quick Tips](#quick-tips)

---

## 🚀 Initial Setup

### First-Time Login

1. **Access Admin Panel:**
   - URL: `https://your-domain.com/admin/login`
   - Or: `http://localhost:3000/admin/login` (for development)

2. **Super Admin Setup** (First Time Only):
   - If no admin exists, visit: `/admin/setup`
   - Enter setup key: `dude-menswear-super-admin-setup-2025`
   - Create your super admin account
   - **IMPORTANT:** Save your recovery key securely!

3. **Regular Login:**
   - Email: Your admin email
   - Password: Your password
   - Click "Sign In to Dashboard"

### Admin Roles

- **Super Admin:** Full access to everything
- **Admin:** Limited access (most features)
- **Manager:** Specific features only
- **Staff:** Inventory management only

---

## 📦 Adding Products

### Method 1: Manual Product Creation

1. **Navigate to Products:**
   - Go to `/admin/products`
   - Click "Create Product" button

2. **Fill Product Details:**
   ```
   - Product Name: "Premium Cotton T-Shirt"
   - SKU: "TCT-001"
   - Description: Detailed product description
   - Category: Select from dropdown
   - Collection: Select collection (optional)
   - Price: Base price in ₹
   - Status: Active/Draft/Archived
   ```

3. **Add Product Images:**
   - Click "Upload Images"
   - Select multiple images (max 7MB each)
   - First image becomes primary
   - Drag to reorder

4. **Create Variants:**
   - Click "Add Variants"
   - For each size (S, M, L, XL):
     - For each color (5 colors):
       - Set variant price
       - Set stock quantity
       - Generate/set SKU
       - Add variant-specific image (optional)

5. **SEO Settings:**
   - Meta title
   - Meta description
   - URL slug (auto-generated)

6. **Save Product:**
   - Click "Save as Draft" or "Publish"

### Method 2: CSV Import (Bulk Upload)

See [CSV Import/Export](#csv-import-export) section below.

---

## 📋 Managing Orders

### Viewing Orders

1. **Access Orders:**
   - Go to `/admin/orders`
   - View all orders in table format

2. **Order Filters:**
   - By status: Pending, Processing, Shipped, Delivered
   - By date range
   - By payment status
   - By customer

3. **Order Details:**
   - Click on any order to view full details
   - View:
     - Customer information
     - Shipping address
     - Order items with variants
     - Payment status
     - Tax breakdown (CGST/SGST/IGST)
     - Shipping charges
     - Total amount

### Processing Orders

**Standard Workflow:**

1. **New Order Received:**
   - Status: `pending`
   - Payment status: `paid` (Razorpay confirmation)

2. **Start Processing:**
   - Change status to `processing`
   - Verify inventory
   - Prepare items for packing
   - **Processing Time:** 1-2 business days

3. **Pack Order:**
   - Pack items securely
   - Verify all items included
   - Attach invoice/packing slip

4. **Arrange ST Courier Pickup:**
   - Contact ST Courier for pickup
   - Handover package
   - Receive AWB tracking number

5. **Add Tracking Number:**
   - See [Adding Tracking Numbers](#adding-tracking-numbers)

6. **Delivered:**
   - Once delivered, update status to `delivered`

### Order Cancellations

1. **Before Shipping:**
   - Can cancel easily
   - Process refund via Razorpay
   - Inventory returns automatically

2. **After Shipping:**
   - Contact customer
   - Arrange return if needed
   - Process refund after return received

---

## 🚚 Adding Tracking Numbers

### Step-by-Step Process

1. **Access Order:**
   - Go to `/admin/orders/[order-id]`
   - Or click on order from orders list

2. **Enter Tracking Details:**
   - Find "Tracking Information" section
   - Enter AWB number from ST Courier
   - Example: `ST123456789`

3. **Save Tracking:**
   - Click "Save Tracking Number"
   - System automatically:
     - Updates order status to "shipped"
     - Generates ST Courier tracking URL
     - Sends email to customer with tracking link

4. **Customer Tracking:**
   - Customer receives email with:
     - Order details
     - Tracking number
     - Link: `https://www.stcourier.com/track-consignment?tracking_no={AWB}`
   - Customer can also track via your website: `/track-order`

### ST Courier Tracking URL Format
```
https://www.stcourier.com/track-consignment?tracking_no=ST123456789
```

---

## 📊 Managing Inventory

### Viewing Inventory

1. **Access Inventory:**
   - Go to `/admin/inventory`
   - View all product variants

2. **Inventory Table Shows:**
   - Product name
   - Variant (size/color)
   - SKU
   - Available quantity
   - Reserved quantity (in pending orders)
   - Total quantity
   - Status (In Stock, Low Stock, Out of Stock)

### Updating Stock Levels

1. **Click on Product Variant**
2. **Adjust Quantity:**
   - Add stock: Enter positive number
   - Remove stock: Enter negative number
   - Reason: Select from dropdown
     - Received from supplier
     - Damaged
     - Return from customer
     - Manual adjustment
3. **Save Changes**

### Low Stock Alerts

- **Automatic Alerts:**
  - Email notifications when stock < 5 units
  - Dashboard badge shows low stock count

- **Reorder Suggestions:**
  - System tracks sales velocity
  - Suggests reorder quantities

---

## 🎨 Managing Banners

### Adding Homepage Banners

1. **Access Banners:**
   - Go to `/admin/settings/banners`

2. **Create New Banner:**
   - Click "Add Banner"
   - Upload image (recommended: 1920x600px)
   - Add banner details:
     - Title (for SEO)
     - Link URL (where banner clicks go)
     - Display order
     - Status (Active/Inactive)

3. **Banner Best Practices:**
   - **Image Format:** JPG or WebP
   - **Size:** < 500KB for fast loading
   - **Dimensions:** 1920x600px (desktop), 800x400px (mobile)
   - **Content:** Clear, readable text
   - **CTA:** Strong call-to-action

### Managing Banners

- **Reorder:** Drag and drop to change order
- **Toggle:** Click switch to activate/deactivate
- **Edit:** Click banner to edit details
- **Delete:** Remove unused banners

---

## 📄 CSV Import/Export

### Product CSV Import

#### Step 1: Download Template

1. Go to `/admin/products/import`
2. Click "Download CSV Template"
3. Template includes:
   - Product fields
   - Variant fields
   - Example rows

#### Step 2: Fill CSV

**CSV Format:**
```csv
product_name,sku,description,category_id,price,size,color,stock,status
"Premium T-Shirt","TCT-001","High quality cotton","cat-1",599,S,Red,50,active
"Premium T-Shirt","TCT-002","High quality cotton","cat-1",599,M,Red,50,active
"Premium T-Shirt","TCT-003","High quality cotton","cat-1",599,L,Red,50,active
```

**Important Rules:**
- First row MUST be headers
- Required fields: product_name, sku, price, size, color, stock
- Prices in ₹ (rupees)
- Status: active, draft, or archived
- Same product_name = variants of same product
- Each row = one variant

#### Step 3: Preview Import

1. Upload CSV file
2. Click "Preview Import"
3. System validates:
   - Format correctness
   - Required fields
   - Duplicate SKUs
   - Valid categories
4. Review preview table
5. Fix any errors shown

#### Step 4: Execute Import

1. Click "Import Products"
2. Wait for completion
3. Review import summary:
   - Products created
   - Variants created
   - Errors (if any)

### Order CSV Export

1. Go to `/admin/orders`
2. Apply filters (date range, status, etc.)
3. Click "Export to CSV"
4. CSV includes:
   - Order ID
   - Date
   - Customer details
   - Items ordered
   - Payment info
   - Shipping info
   - Status

---

## 💡 Quick Tips

### Daily Operations

**Morning Routine:**
1. Check new orders
2. Review low stock alerts
3. Process pending shipments
4. Respond to customer inquiries

**Evening Routine:**
1. Update tracking for shipped orders
2. Review day's sales
3. Plan next day's work

### Best Practices

✅ **DO:**
- Process orders within 24 hours
- Add tracking numbers immediately after shipping
- Keep inventory updated
- Respond to customers promptly
- Use CSV import for bulk products
- Backup data regularly

❌ **DON'T:**
- Don't ship without updating status
- Don't forget to add tracking numbers
- Don't let stock go to zero
- Don't delete orders (archive instead)
- Don't modify SKUs of published products

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New product
- `Ctrl/Cmd + S`: Save
- `Esc`: Close modal/dialog

### Common Issues

**Problem: Can't upload images**
- Solution: Check file size (< 7MB), format (JPG/PNG)

**Problem: CSV import fails**
- Solution: Check CSV format, required fields, duplicate SKUs

**Problem: Order status won't change**
- Solution: Check payment status first

**Problem: Low stock alert not working**
- Solution: Check email settings, Redis connection

---

## 📞 Support

### Technical Support
- **Email:** tech@dudemw.com
- **Phone:** +91 98765 43210
- **Hours:** Mon-Sat, 9 AM - 6 PM IST

### Emergency Contact
- **Owner:** Vignesh CK
- **Location:** Tharamanagalam, Tamil Nadu
- **Instagram:** @dude_mensclothing

---

## 📚 Additional Resources

- **Full Documentation:** `/docs`
- **API Documentation:** See `API_DOCUMENTATION.md`
- **Video Tutorials:** Coming soon
- **FAQ:** `/admin/help`

---

**Happy Selling! 🎉**

*For the latest version of this guide, visit: `/docs/admin-quick-start`*