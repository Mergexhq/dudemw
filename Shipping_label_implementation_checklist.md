# Shipping Label Implementation Checklist

## 📦 Project: Shipping Label PDF Generation System
**Date Started:** December 24, 2025  
**Store Name:** Dude Men's Wear  
**Label Format:** A6 (105 × 148 mm) - Print Ready, Black & White

---

## ✅ Implementation Phases

### Phase 1: Setup & Dependencies
- [x] Install `@react-pdf/renderer` package
- [x] Install `qrcode` library for QR code generation
- [x] Install `pdf-lib` library for PDF merging
- [x] Create `/src/pdf/` directory structure
- [x] Verify dependencies installation

**Status:** ✅ Complete  
**Last Updated:** December 24, 2025

---

### Phase 2: PDF Component Development
- [x] Create `/src/pdf/ShippingLabel.tsx`
- [x] Implement store branding section
- [x] Add order details (Order ID, Date)
- [x] Add customer shipping address block
- [x] Add order summary (items count, payment method)
- [x] Implement QR code with Order ID
- [x] Style for A6 print format (black & white)
- [x] Optimize for thermal printer compatibility

**Status:** ✅ Complete  
**Last Updated:** December 24, 2025

---

### Phase 3: API Routes Development
- [x] Create single label API: `/src/app/api/admin/orders/[id]/label/route.ts`
  - [x] Add admin authentication middleware
  - [x] Add role-based authorization (admin/manager only)
  - [x] Fetch order data from database
  - [x] Generate PDF server-side
  - [x] Return downloadable PDF response
  - [x] Error handling & validation

- [x] Create bulk labels API: `/src/app/api/admin/orders/bulk-labels/route.ts`
  - [x] Add admin authentication
  - [x] Accept array of order IDs
  - [x] Generate multiple PDFs
  - [x] Combine into single merged PDF using pdf-lib
  - [x] Return downloadable response

**Status:** ✅ Complete  
**Last Updated:** December 24, 2025

---

### Phase 4: UI Integration - Orders List Page
**File:** `/src/app/admin/orders/page.tsx`

- [x] **Location 1:** Add "Download Bulk Labels" button at top (near Export button)
  - [x] Add button with icon
  - [x] Implement selection logic for bulk download
  - [x] Add `data-testid="bulk-download-labels-btn"`
  - [x] Handle API call to bulk-labels endpoint
  - [x] Show loading state during generation
  - [x] Handle success/error states

- [x] **Location 2:** Add "Download Label" option in actions menu (three dots)
  - [x] Update actions dropdown menu
  - [x] Add menu item with icon
  - [x] Add `data-testid="download-label-menu-item"`
  - [x] Handle single order label download
  - [x] Open PDF in new tab or trigger download

**Status:** ✅ Complete  
**Last Updated:** December 24, 2025

---

### Phase 5: UI Integration - Order Detail Page
**File:** `/src/app/admin/orders/[id]/page.tsx`

- [x] **Location 3:** Add "Download Shipping Label" button (near Cancel Order button)
  - [x] Add button in header actions area
  - [x] Add appropriate icon (FileText)
  - [x] Add `data-testid="download-shipping-label-btn"`
  - [x] Implement click handler
  - [x] Call `/api/admin/orders/[id]/label` endpoint
  - [x] Trigger PDF download
  - [x] Handle loading & error states

**Status:** ✅ Complete  
**Last Updated:** December 24, 2025

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
