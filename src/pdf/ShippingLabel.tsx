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
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 15,
    borderBottom: 2,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  orderText: {
    fontSize: 9,
    color: '#333333',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    color: '#000000',
    borderBottom: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 3,
  },
  addressBlock: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  addressName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressLine: {
    marginBottom: 2,
    color: '#000000',
  },
  phone: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 10,
  },
  summaryLabel: {
    color: '#555555',
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#000000',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTop: 1,
    borderTopColor: '#CCCCCC',
  },
  qrCode: {
    width: 80,
    height: 80,
  },
  qrText: {
    fontSize: 8,
    marginTop: 5,
    color: '#666666',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
    borderTop: 1,
    borderTopColor: '#CCCCCC',
    fontSize: 7,
    color: '#888888',
    textAlign: 'center',
  },
});

interface ShippingLabelProps {
  order: {
    id: string;
    order_number?: string;
    created_at: string;
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

  // Get phone number
  const phoneNumber =
    order.customer_phone_snapshot || order.shipping_address?.phone || 'N/A';

  // Format payment method
  const paymentMethod = order.payment_method
    ? order.payment_method.toUpperCase().replace('_', ' ')
    : 'N/A';

  // Order display number
  const orderNumber = order.order_number || `#${order.id.substring(0, 8).toUpperCase()}`;

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.storeName}>Dude Men's Wear</Text>
          <View style={styles.orderInfo}>
            <Text style={styles.orderText}>Order: {orderNumber}</Text>
            <Text style={styles.orderText}>Date: {orderDate}</Text>
          </View>
        </View>

        {/* Shipping Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ship To</Text>
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
              <Text style={styles.addressLine}>PIN: {order.shipping_address.postalCode}</Text>
            )}
            <Text style={styles.phone}>📞 {phoneNumber}</Text>
          </View>
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items:</Text>
            <Text style={styles.summaryValue}>{totalItems}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment:</Text>
            <Text style={styles.summaryValue}>{paymentMethod}</Text>
          </View>
        </View>

        {/* QR Code Section */}
        {qrCodeDataUrl && (
          <View style={styles.qrCodeContainer}>
            <Image src={qrCodeDataUrl} style={styles.qrCode} />
            <Text style={styles.qrText}>Scan for order details</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for shopping with Dude Men's Wear</Text>
        </View>
      </Page>
    </Document>
  );
};
