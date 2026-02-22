import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    header: {
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomStyle: 'solid',
        borderBottomColor: '#000000',
    },
    storeName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#000000',
    },
    storeInfo: {
        fontSize: 9,
        color: '#666666',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 15,
        color: '#000000',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#000000',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '40%',
        fontSize: 10,
        color: '#666666',
    },
    value: {
        width: '60%',
        fontSize: 10,
        color: '#000000',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#000000',
        paddingBottom: 5,
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#E0E0E0',
    },
    tableCol1: { width: '50%' },
    tableCol2: { width: '15%', textAlign: 'right' },
    tableCol3: { width: '20%', textAlign: 'right' },
    tableCol4: { width: '15%', textAlign: 'right' },
    tableHeaderText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
    },
    tableText: {
        fontSize: 9,
        color: '#000000',
    },
    totalsSection: {
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopStyle: 'solid',
        borderTopColor: '#000000',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 5,
    },
    totalLabel: {
        width: '30%',
        fontSize: 10,
        color: '#666666',
        textAlign: 'right',
        paddingRight: 10,
    },
    totalValue: {
        width: '15%',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'right',
    },
    grandTotal: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: '#E0E0E0',
        fontSize: 8,
        color: '#666666',
        textAlign: 'center',
    },
});

interface OrderDetailsPDFProps {
    order: {
        id: string;
        order_number?: string | null;
        created_at: string | null;
        customer_name_snapshot: string | null;
        customer_email_snapshot: string | null;
        customer_phone_snapshot: string | null;
        shipping_address: any;
        billing_address: any;
        order_items?: Array<{
            product_name_snapshot: string | null;
            variant_name_snapshot: string | null;
            quantity: number;
            price_snapshot: number;
            total: number;
        }>;
        subtotal: number | null;
        shipping_cost: number | null;
        tax_amount: number | null;
        total_amount: number | null;
        payment_method: string | null;
        payment_status: string | null;
        order_status: string | null;
    };
}

export const OrderDetailsPDF: React.FC<OrderDetailsPDFProps> = ({ order }) => {
    const orderNumber = order.order_number || `#${order.id.substring(0, 8).toUpperCase()}`;
    const orderDate = order.created_at
        ? new Date(order.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
        : 'N/A';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.storeName}>DUDE MEN'S WEAR</Text>
                    <Text style={styles.storeInfo}>Sankari Main Rd, Tharamangalam, Salem, Tamil Nadu 636502</Text>
                    <Text style={styles.storeInfo}>Phone: +91 9488924935 | Email: support@dudemw.com</Text>
                </View>

                <Text style={styles.title}>Order Details - {orderNumber}</Text>

                {/* Order Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Order Number:</Text>
                        <Text style={styles.value}>{orderNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Order Date:</Text>
                        <Text style={styles.value}>{orderDate}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Order Status:</Text>
                        <Text style={styles.value}>{order.order_status || 'N/A'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Payment Status:</Text>
                        <Text style={styles.value}>{order.payment_status || 'N/A'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Payment Method:</Text>
                        <Text style={styles.value}>{order.payment_method || 'N/A'}</Text>
                    </View>
                </View>

                {/* Customer Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name:</Text>
                        <Text style={styles.value}>{order.customer_name_snapshot || 'N/A'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{order.customer_email_snapshot || 'N/A'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phone:</Text>
                        <Text style={styles.value}>{order.customer_phone_snapshot || 'N/A'}</Text>
                    </View>
                </View>

                {/* Shipping Address */}
                {order.shipping_address && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Shipping Address</Text>
                        <Text style={styles.value}>
                            {order.shipping_address.address || ''}{'\n'}
                            {order.shipping_address.city || ''}, {order.shipping_address.state || ''}{'\n'}
                            {order.shipping_address.postalCode || ''}
                        </Text>
                    </View>
                )}

                {/* Order Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableCol1, styles.tableHeaderText]}>Product</Text>
                            <Text style={[styles.tableCol2, styles.tableHeaderText]}>Qty</Text>
                            <Text style={[styles.tableCol3, styles.tableHeaderText]}>Price</Text>
                            <Text style={[styles.tableCol4, styles.tableHeaderText]}>Total</Text>
                        </View>
                        {order.order_items?.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.tableCol1, styles.tableText]}>
                                    {item.product_name_snapshot || 'N/A'}
                                    {item.variant_name_snapshot && ` (${item.variant_name_snapshot})`}
                                </Text>
                                <Text style={[styles.tableCol2, styles.tableText]}>{item.quantity}</Text>
                                <Text style={[styles.tableCol3, styles.tableText]}>Rs. {item.price_snapshot.toFixed(2)}</Text>
                                <Text style={[styles.tableCol4, styles.tableText]}>Rs. {item.total.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={styles.totalValue}>Rs. {order.subtotal?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Shipping:</Text>
                        <Text style={styles.totalValue}>Rs. {order.shipping_cost?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Tax:</Text>
                        <Text style={styles.totalValue}>Rs. {order.tax_amount?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, styles.grandTotal]}>Grand Total:</Text>
                        <Text style={[styles.totalValue, styles.grandTotal]}>Rs. {order.total_amount?.toFixed(2) || '0.00'}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Thank you for shopping with Dude Men's Wear!</Text>
                    <Text>For support, contact us at support@dudemw.com or +91 9488924935</Text>
                </View>
            </Page>
        </Document>
    );
};
