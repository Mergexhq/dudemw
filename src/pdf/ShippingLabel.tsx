import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// A6 size: 105mm x 148mm = 297.6pt x 419.5pt
const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontSize: 8,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 6,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#000000',
  },
  storeName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#000000',
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderNumber: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentBadge: {
    fontSize: 6,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  codBadge: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
  },
  prepaidBadge: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000000',
    color: '#000000',
  },
  orderDate: {
    fontSize: 7,
    color: '#666666',
  },
  section: {
    marginTop: 6,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 6,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    color: '#666666',
    letterSpacing: 0.3,
  },
  addressBlock: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  addressName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#000000',
  },
  addressLine: {
    marginBottom: 1,
    color: '#000000',
    fontSize: 8,
  },
  pincodeLine: {
    marginTop: 1,
    marginBottom: 3,
    fontWeight: 'bold',
    fontSize: 9,
    color: '#000000',
  },
  phoneLabel: {
    fontSize: 7,
    color: '#666666',
    marginBottom: 1,
  },
  phoneNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    fontSize: 8,
  },
  summaryLabel: {
    color: '#666666',
    fontSize: 7,
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 8,
  },
  qrSection: {
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  qrCode: {
    width: 50,
    height: 50,
  },
  qrText: {
    fontSize: 5,
    marginTop: 2,
    color: '#999999',
    textAlign: 'center',
  },
  returnAddress: {
    marginTop: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#E0E0E0',
    fontSize: 5,
    color: '#666666',
  },
  returnTitle: {
    fontWeight: 'bold',
    marginBottom: 1,
    fontSize: 5,
    color: '#000000',
  },
  returnLine: {
    marginBottom: 0.5,
    fontSize: 5,
  },
});

interface ShippingLabelProps {
  order: {
    id: string;
    order_number?: string | null;
    created_at: string | null;
    customer_name_snapshot: string | null;
    customer_phone_snapshot: string | null;
    shipping_address: {
      firstName?: string;
      lastName?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      phone?: string;
    } | null;
    order_items?: Array<{
      quantity: number;
    }>;
    payment_method: string | null;
    total_amount?: number | null;
  };
  qrCodeDataUrl?: string;
}

export const ShippingLabel: React.FC<ShippingLabelProps> = ({ order, qrCodeDataUrl }) => {
  // Calculate total items
  const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Format date
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : 'N/A';

  // Get customer name
  const customerName =
    order.customer_name_snapshot ||
    (order.shipping_address?.firstName && order.shipping_address?.lastName
      ? `${order.shipping_address.firstName} ${order.shipping_address.lastName}`
      : 'N/A');

  // Get phone number and format it with spacing
  const rawPhone = order.customer_phone_snapshot || order.shipping_address?.phone || 'N/A';
  const phoneNumber = rawPhone !== 'N/A' && rawPhone.length === 10
    ? `${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`
    : rawPhone;

  // Payment method
  const paymentMethod = order.payment_method || 'N/A';
  const isCOD = paymentMethod.toLowerCase().includes('cod');
  const paymentDisplay = isCOD ? 'COD' : 'PREPAID';

  // Order display number
  const orderNumber = order.order_number || `#${order.id.substring(0, 8).toUpperCase()}`;

  // QR Code data: ORDER_ID|PHONE|PINCODE
  const qrData = `${order.id}|${rawPhone}|${order.shipping_address?.postalCode || ''}`;

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.storeName}>DUDE MEN'S WEAR</Text>
          <View style={styles.orderInfoRow}>
            <View style={styles.orderLeft}>
              <Text style={styles.orderNumber}>Order {orderNumber}</Text>
              <Text style={[styles.paymentBadge, isCOD ? styles.codBadge : styles.prepaidBadge]}>
                {paymentDisplay}
              </Text>
            </View>
            <Text style={styles.orderDate}>{orderDate}</Text>
          </View>
        </View>

        {/* Shipping Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SHIP TO</Text>
          <View style={styles.addressBlock}>
            <Text style={styles.addressName}>{customerName}</Text>
            {order.shipping_address?.address && (
              <Text style={styles.addressLine}>{order.shipping_address.address}</Text>
            )}
            {(order.shipping_address?.city || order.shipping_address?.state) && (
              <Text style={styles.addressLine}>
                {[order.shipping_address.city, order.shipping_address.state]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            )}
            {order.shipping_address?.postalCode && (
              <Text style={styles.pincodeLine}>
                PIN: {order.shipping_address.postalCode}
              </Text>
            )}
            <Text style={styles.phoneLabel}>Phone:</Text>
            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          </View>
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items:</Text>
            <Text style={styles.summaryValue}>{totalItems}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>Rs. {order.total_amount?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment:</Text>
            <Text style={styles.summaryValue}>{paymentDisplay}</Text>
          </View>
        </View>

        {/* QR Code Section */}
        {qrCodeDataUrl && (
          <View style={styles.qrSection}>
            <Image src={qrCodeDataUrl} style={styles.qrCode} />
            <Text style={styles.qrText}>Scan to Download Order Details</Text>
          </View>
        )}

        {/* Return Address */}
        <View style={styles.returnAddress}>
          <Text style={styles.returnTitle}>Return To:</Text>
          <Text style={styles.returnLine}>DUDE MEN'S WEAR</Text>
          <Text style={styles.returnLine}>Sankari Main Rd, Tharamangalam</Text>
          <Text style={styles.returnLine}>Salem, Tamil Nadu 636502</Text>
          <Text style={styles.returnLine}>Phone: +91 9488924935</Text>
          <Text style={styles.returnLine}>Email: support@dudemw.com</Text>
        </View>
      </Page>
    </Document>
  );
};
