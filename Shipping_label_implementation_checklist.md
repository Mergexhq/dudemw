# Shipping Label Implementation Checklist

## 📦 Project: Shipping Label PDF Generation System
**Date Started:** December 24, 2025  
**Store Name:** Dude Men's Wear  
**Label Format:** A6 (105 × 148 mm) - Print Ready, Black & White

---

## ✅ Implementation Phases

### Phase 1: Setup & Dependencies
- [ ] Install `@react-pdf/renderer` package
- [ ] Install `qrcode` library for QR code generation
- [ ] Create `/src/pdf/` directory structure
- [ ] Verify dependencies installation

**Status:** 🔄 In Progress  
**Last Updated:** -

---

### Phase 2: PDF Component Development
- [ ] Create `/src/pdf/ShippingLabel.tsx`
- [ ] Implement store branding section
- [ ] Add order details (Order ID, Date)
- [ ] Add customer shipping address block
- [ ] Add order summary (items count, payment method)
- [ ] Implement QR code with Order ID
- [ ] Style for A6 print format (black & white)
- [ ] Optimize for thermal printer compatibility

**Status:** ⏳ Not Started  
**Last Updated:** -

---

### Phase 3: API Routes Development
- [ ] Create single label API: `/src/app/api/admin/orders/[id]/label/route.ts`
  - [ ] Add admin authentication middleware
  - [ ] Add role-based authorization (admin/manager only)
  - [ ] Fetch order data from database
  - [ ] Generate PDF server-side
  - [ ] Return downloadable PDF response
  - [ ] Error handling & validation

- [ ] Create bulk labels API: `/src/app/api/admin/orders/bulk-labels/route.ts`
  - [ ] Add admin authentication
  - [ ] Accept array of order IDs
  - [ ] Generate multiple PDFs
  - [ ] Combine into ZIP file or single PDF
  - [ ] Return downloadable response

**Status:** ⏳ Not Started  
**Last Updated:** -

---

### Phase 4: UI Integration - Orders List Page
**File:** `/src/app/admin/orders/page.tsx`

- [ ] **Location 1:** Add "Download Bulk Labels" button at top (near Export button)
  - [ ] Add button with icon
  - [ ] Implement selection logic for bulk download
  - [ ] Add `data-testid="bulk-download-labels-btn"`
  - [ ] Handle API call to bulk-labels endpoint
  - [ ] Show loading state during generation
  - [ ] Handle success/error states

- [ ] **Location 2:** Add "Download Label" option in actions menu (three dots)
  - [ ] Update actions dropdown menu
  - [ ] Add menu item with icon
  - [ ] Add `data-testid="download-label-menu-item"`
  - [ ] Handle single order label download
  - [ ] Open PDF in new tab or trigger download

**Status:** ⏳ Not Started  
**Last Updated:** -

---

### Phase 5: UI Integration - Order Detail Page
**File:** `/src/app/admin/orders/[id]/page.tsx`

- [ ] **Location 3:** Add "Download Shipping Label" button (near Cancel Order button)
  - [ ] Add button in header actions area
  - [ ] Add appropriate icon (FileText or Download)
  - [ ] Add `data-testid="download-shipping-label-btn"`
  - [ ] Implement click handler
  - [ ] Call `/api/admin/orders/[id]/label` endpoint
  - [ ] Open PDF in new tab
  - [ ] Handle loading & error states

**Status:** ⏳ Not Started  
**Last Updated:** -

---

### Phase 6: Testing & Validation
- [ ] Test single label download from order detail page
- [ ] Test single label download from actions menu
- [ ] Test bulk label download with multiple orders
- [ ] Verify admin authentication works
- [ ] Verify role-based access (block non-admin users)
- [ ] Test PDF print quality (A6 format)
- [ ] Verify thermal printer compatibility
- [ ] Test QR code scanning
- [ ] Validate all data appears correctly
- [ ] Test error scenarios (invalid order ID, no permission, etc.)

**Status:** ⏳ Not Started (User will test locally)  
**Last Updated:** -

---

## 🎯 Feature Specifications

### PDF Content Requirements
✅ **Must Include:**
- [x] Store Name: "Dude Men's Wear"
- [x] Order ID (with # prefix)
- [x] Order Date
- [x] Customer Full Name
- [x] Phone Number
- [x] Full Shipping Address (line, city, state, pincode)
- [x] Total Items Quantity
- [x] Payment Method (displayed but no COD amount)
- [x] QR Code containing Order ID

❌ **Exclude:**
- COD Amount display (Razorpay integration coming)

### Design Specifications
- **Format:** A6 (105 × 148 mm)
- **Colors:** Black & White only
- **Font Size:** Large, readable text
- **Spacing:** Proper margins for printing
- **Printer Support:** Thermal printer compatible
- **QR Code:** Positioned prominently for easy scanning

### Security Requirements
- ✅ Server-side PDF generation only
- ✅ Admin/Manager role required
- ✅ No client-side PDF generation
- ✅ Proper authentication on all endpoints
- ✅ Validate order access permissions

---

## 📂 Files Created/Modified

### New Files
- [ ] `/app/Shipping_label_implementation_checklist.md` ✅ (This file)
- [ ] `/src/pdf/ShippingLabel.tsx`
- [ ] `/src/app/api/admin/orders/[id]/label/route.ts`
- [ ] `/src/app/api/admin/orders/bulk-labels/route.ts`

### Modified Files
- [ ] `/app/package.json` (add dependencies)
- [ ] `/src/app/admin/orders/page.tsx` (add bulk download + actions menu item)
- [ ] `/src/app/admin/orders/[id]/page.tsx` (add download button)

---

## 🚀 Deployment Notes
- No backend changes required
- No database migrations needed
- No environment variables added
- PDFs generated dynamically (not stored)
- Works with existing Next.js deployment

---

## 📝 Notes
- User will handle local testing
- No testing phase needed from implementation side
- Razorpay integration planned (future consideration for payment display)
- System designed to be extensible for future PDF types (invoice, packing slip)

---

**Progress:** 0/6 Phases Complete  
**Last Updated:** December 24, 2025
