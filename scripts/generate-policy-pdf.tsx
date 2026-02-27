import React from 'react';
import ReactPDF, { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import path from 'path';

// Register a standard font
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' }, // Regular
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 700 }, // Bold (fallback)
    ]
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 5,
    },
    section: {
        margin: 10,
        padding: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 15,
        backgroundColor: '#f0f0f0',
        padding: 5,
    },
    subHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 10,
    },
    text: {
        fontSize: 10,
        marginBottom: 5,
        lineHeight: 1.5,
        color: '#333333',
    },
    bulletPoint: {
        fontSize: 10,
        marginLeft: 10,
        marginBottom: 3,
        lineHeight: 1.5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        textAlign: 'center',
        color: '#999999',
        borderTopWidth: 1,
        borderTopColor: '#eeeeee',
        paddingTop: 10,
    }
});

const PolicyDocument = () => (
    <Document>
        {/* Page 1: Shipping Policy */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Shipping Policy</Text>
                <Text style={styles.subtitle}>Draft Template for Dude Men's Wear</Text>
            </View>

            <View>
                <Text style={styles.sectionTitle}>1. Free Shipping</Text>
                <Text style={styles.text}>We are pleased to offer FREE shipping on all orders above ₹499.</Text>
                <Text style={styles.text}>For orders below this amount, a nominal shipping fee will be calculated at checkout.</Text>

                <Text style={styles.sectionTitle}>2. Delivery Timelines</Text>
                <Text style={styles.subHeader}>Within Tamil Nadu</Text>
                <Text style={styles.bulletPoint}>• Estimated Delivery: 2-4 business days</Text>

                <Text style={styles.subHeader}>Rest of India</Text>
                <Text style={styles.bulletPoint}>• Estimated Delivery: 4-7 business days</Text>

                <Text style={styles.sectionTitle}>3. Shipping Partners</Text>
                <Text style={styles.text}>We partner with trusted logistics providers to ensure your order reaches you safely and on time:</Text>
                <Text style={styles.bulletPoint}>• Delhivery</Text>
                <Text style={styles.bulletPoint}>• Bluedart</Text>
                <Text style={styles.bulletPoint}>• DTDC</Text>

                <Text style={styles.sectionTitle}>4. Order Tracking</Text>
                <Text style={styles.text}>Once your order is dispatched, you will receive a tracking link via SMS and Email. You can use this link to track your package in real-time.</Text>

                <Text style={styles.sectionTitle}>5. Important Notes</Text>
                <Text style={styles.bulletPoint}>• Orders placed before 2 PM (IST) on business days are processed the same day.</Text>
                <Text style={styles.bulletPoint}>• Delivery to remote areas may take an additional 2-3 days.</Text>
                <Text style={styles.bulletPoint}>• We currently do not deliver to P.O. Boxes.</Text>
            </View>

            <Text style={styles.footer}>Dude Men's Wear | Salem, Tamil Nadu | support@dudemw.com</Text>
        </Page>

        {/* Page 2: Returns & Refunds Policy */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Returns & Refund Policy</Text>
                <Text style={styles.subtitle}>Draft Template for Dude Men's Wear</Text>
            </View>

            <View>
                <Text style={styles.sectionTitle}>1. Our Promise</Text>
                <Text style={styles.text}>We offer a "7-Day No Questions Asked" return policy. If you are not completely satisfied with your purchase, you can return it within 7 days of delivery.</Text>

                <Text style={styles.sectionTitle}>2. How to Return</Text>
                <Text style={styles.bulletPoint}>1. Contact Us: Message us on WhatsApp or Email within 7 days of receiving your order.</Text>
                <Text style={styles.bulletPoint}>2. Pack the Item: Ensure the item is in its original condition with all tags attached.</Text>
                <Text style={styles.bulletPoint}>3. Schedule Pickup: We will arrange for a courier partner to pick up the item from your doorstep.</Text>
                <Text style={styles.bulletPoint}>4. Refund Process: Once we receive the item, your refund will be processed within 5-7 business days.</Text>

                <Text style={styles.sectionTitle}>3. Exchange Policy</Text>
                <Text style={styles.text}>Want a different size or color? We offer FREE exchanges!</Text>
                <Text style={styles.bulletPoint}>• The process is the same as returns.</Text>
                <Text style={styles.bulletPoint}>• We will ship the new item immediately after we receive the original product.</Text>

                <Text style={styles.sectionTitle}>4. Non-Returnable Items</Text>
                <Text style={styles.bulletPoint}>• Items that have been worn, washed, or altered.</Text>
                <Text style={styles.bulletPoint}>• Items without original tags or packaging.</Text>
                <Text style={styles.bulletPoint}>• Returns initiated after 7 days of delivery.</Text>

                <Text style={styles.sectionTitle}>5. Refund Methods</Text>
                <Text style={styles.bulletPoint}>• Prepaid Orders: Refund to original payment source (Card/UPI) within 5-7 days.</Text>
                <Text style={styles.bulletPoint}>• COD Orders: Bank Transfer (Please share your bank details when initiating the return).</Text>
            </View>

            <Text style={styles.footer}>Dude Men's Wear | Salem, Tamil Nadu | support@dudemw.com</Text>
        </Page>

        {/* Page 3: About Us */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>About Us Policy</Text>
                <Text style={styles.subtitle}>Brand Story & Vision</Text>
            </View>

            <View>
                <Text style={styles.sectionTitle}>Our Story: From Salem to Your Doorstep</Text>
                <Text style={styles.text}>Dude Men's Wear started with a simple yet powerful idea: Premium quality menswear shouldn't cost a fortune.</Text>
                <Text style={styles.text}>Our founder noticed that men in India often face a choice between expensive branded clothing or cheap alternatives that compromise on quality. There had to be a better way.</Text>
                <Text style={styles.text}>What began as a small retail store in Salem, Tamil Nadu, has now grown into a trusted online destination for thousands of customers across India.</Text>

                <Text style={styles.sectionTitle}>The Dude Promise</Text>
                <Text style={styles.subHeader}>Quality First</Text>
                <Text style={styles.text}>We use premium, cotton-rich fabrics engineered for the Indian climate. Our clothes are built to last.</Text>

                <Text style={styles.subHeader}>Honest Pricing</Text>
                <Text style={styles.text}>No fake MRPs. No gimmicks. Just honest, value-for-money pricing all year round.</Text>

                <Text style={styles.subHeader}>Real Support</Text>
                <Text style={styles.text}>We believe in building relationships. You can talk to a real person on our WhatsApp support line anytime you need help.</Text>

                <Text style={styles.sectionTitle}>Visit Our Store</Text>
                <Text style={styles.text}>We are proud of our roots. If you are ever in Salem, stop by and say hello!</Text>
                <Text style={styles.text}>Dude Men's Wear</Text>
                <Text style={styles.text}>Salem, Tamil Nadu, India</Text>

                <Text style={styles.sectionTitle}>Contact Information</Text>
                <Text style={styles.bulletPoint}>• WhatsApp: +91 98765 43210</Text>
                <Text style={styles.bulletPoint}>• Email: support@dudemw.com</Text>
                <Text style={styles.bulletPoint}>• Instagram: @dude_mensclothing</Text>
            </View>

            <Text style={styles.footer}>Dude Men's Wear | Salem, Tamil Nadu | support@dudemw.com</Text>
        </Page>
    </Document>
);

const generatePDF = async () => {
    try {
        const outputPath = path.resolve(process.cwd(), 'DudeMensWear_Policy_Templates.pdf');
        console.log(`Generating PDF to: ${outputPath}`);
        await ReactPDF.renderToFile(<PolicyDocument />, outputPath);
        console.log('✅ PDF generated successfully!');
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
    }
};

generatePDF();
