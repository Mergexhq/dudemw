import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

// Note: Standard fonts like Helvetica often fail to render the Rupee symbol properly in many PDF viewers,
// appearing as '1' or boxes. We'll use 'Rs.' for maximum compatibility and a premium look.

const styles = StyleSheet.create({
  page: {
    padding: 12, // Reduced padding for better fit
    fontSize: 8, // Slightly reduced base font size
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  logo: {
    width: 150, // Reduced logo width
  },
  orderIdText: {
    fontSize: 8,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  divider: {
    borderBottomWidth: 0.8, // Further reduced thickness
    borderBottomColor: '#000000',
    marginVertical: 4,
  },
  section: {
    paddingVertical: 5, // Compact vertical padding
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  methodBadge: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontSize: 6.5,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 1,
  },
  addressName: {
    fontSize: 11, // Reduced font size
    fontWeight: 'bold',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  addressText: {
    fontSize: 8.5, // Reduced font size
    lineHeight: 1.4,
    color: '#1F2937',
    maxWidth: '95%',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  phoneText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  fromText: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  fromAddress: {
    fontSize: 6.5,
    color: '#4B5563',
    lineHeight: 1.3,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 15,
  },
  itemTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
    lineHeight: 1.2,
  },
  itemMeta: {
    fontSize: 7,
    color: '#6B7280',
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  itemPrice: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  dashedDivider: {
    borderBottomWidth: 0.4,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'dashed',
    marginVertical: 6,
  },
  summaryValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 8,
    textAlign: 'right',
  },
  totalContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 0.8,
    borderTopColor: '#000000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
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
      address2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      phone?: string;
    } | null;
    order_items?: Array<{
      quantity: number;
      price: number;
      product_variants?: {
        name: string | null;
        product?: {
          title: string;
        } | null;
      } | null;
    }>;
    payment_method: string | null;
    subtotal_amount?: number | null;
    shipping_amount?: number | null;
    discount_amount?: number | null;
    total_amount?: number | null;
  };
  qrCodeDataUrl?: string;
  storeLocation?: {
    name: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state?: string | null;
    pincode: string;
  } | null;
}

export const ShippingLabel: React.FC<ShippingLabelProps> = ({ order, storeLocation }) => {
  const customerName =
    order.customer_name_snapshot ||
    (order.shipping_address?.firstName && order.shipping_address?.lastName
      ? `${order.shipping_address.firstName} ${order.shipping_address.lastName}`
      : 'N/A');

  const rawPhone = order.customer_phone_snapshot || order.shipping_address?.phone || 'N/A';
  const phoneNumber = rawPhone !== 'N/A'
    ? `+91 ${rawPhone.replace(/(\d{5})(\d{5})/, '$1 $2')}`
    : rawPhone;

  const paymentMethod = order.payment_method || 'N/A';
  const isCOD = paymentMethod.toLowerCase().includes('cod');

  const orderNumber = order.order_number || `#DMW-${order.id.substring(0, 8).toUpperCase()}`;

  // Use relative path for public assets
  const logoPath = './public/logo/typography-logo.png';

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        {/* Header Logo & Order ID */}
        <View style={styles.logoContainer}>
          <Image src={logoPath} style={styles.logo} />
        </View>
        <Text style={styles.orderIdText}>Order ID: {orderNumber}</Text>

        <View style={styles.divider} />

        {/* SHIP TO Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SHIP TO:</Text>
            <Text style={styles.methodBadge}>STANDARD</Text>
          </View>
          <Text style={styles.addressName}>{customerName}</Text>
          <Text style={styles.addressText}>{order.shipping_address?.address},</Text>
          {order.shipping_address?.address2 ? (
            <Text style={styles.addressText}>{order.shipping_address.address2},</Text>
          ) : null}
          <Text style={styles.addressText}>
            {[order.shipping_address?.city, order.shipping_address?.state].filter(Boolean).join(', ')} - {order.shipping_address?.postalCode}
          </Text>
          <View style={styles.phoneRow}>
            <Text style={styles.phoneText}>Mob: {phoneNumber}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* FROM Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FROM:</Text>
          <Text style={styles.fromText}>{storeLocation?.name || 'Dude Mens Wear Warehouse'}</Text>
          {storeLocation ? (
            <>
              <Text style={styles.fromAddress}>{storeLocation.address_line1}{storeLocation.address_line2 ? `, ${storeLocation.address_line2}` : ''}</Text>
              <Text style={styles.fromAddress}>{storeLocation.city}{storeLocation.state ? `, ${storeLocation.state}` : ''} - {storeLocation.pincode}</Text>
            </>
          ) : (
            <>
              <Text style={styles.fromAddress}>No. 88, Main Road, Tharamangalam,</Text>
              <Text style={styles.fromAddress}>Salem District, Tamil Nadu - 636502</Text>
            </>
          )}
        </View>

        <View style={styles.divider} />

        {/* ORDER SUMMARY Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>

          <View style={{ marginTop: 5 }}>
            {order.order_items?.map((item, idx) => (
              <View key={idx}>
                <View style={styles.itemRow}>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemTitle}>{item.product_variants?.product?.title || 'Unknown Product'}</Text>
                    <Text style={styles.itemMeta}>Size: {item.product_variants?.name || 'N/A'}  •  Qty: {item.quantity}</Text>
                  </View>
                  <View style={styles.itemPriceContainer}>
                    <Text style={styles.itemPrice}>Rs. {((item.price || 0) * item.quantity).toLocaleString()}</Text>
                  </View>
                </View>
                {idx < (order.order_items?.length || 0) - 1 && <View style={styles.dashedDivider} />}
              </View>
            ))}
          </View>

          <View style={styles.dashedDivider} />

          {/* Pricing Summary */}
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rs. {(order.subtotal_amount || 0).toLocaleString()}</Text>
          </View>
          {(order.discount_amount || 0) > 0 && (
            <View style={styles.summaryValueRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>-Rs. {(order.discount_amount || 0).toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>Rs. {(order.shipping_amount || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs. {(order.total_amount || 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
