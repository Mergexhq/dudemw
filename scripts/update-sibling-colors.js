// Update all sibling products with color options
const { updateProductColorOption } = require('./src/lib/actions/update-product-color');

const products = [
    { id: "99f2e5ad-f7c8-491b-b4be-98f98ca7f969", title: "Black Cargo Pants for Men - Multi-Pocket Tactical Design", color: "Black" },
    { id: "35275595-198d-401e-bbab-904b635324be", title: "Dark Gray Cargo Pants for Men - Multi-Pocket Tactical", color: "Dark Gray" },
    { id: "77aba5cf-2ac2-4df0-8984-710657f7d539", title: "Green Cargo Pants for Men - Multi-Pocket Tactical Design", color: "Green" },
    { id: "d4be9765-a50c-4a57-8833-fe2b1b4899f6", title: "Navy Blue Cargo Pants for Men - Multi-Pocket Tactical", color: "Navy Blue" },
    { id: "3c122d52-a7ab-46dc-9fe6-0389bcc8bd81", title: "Silver White Cargo Pants for Men - Multi-Pocket Design", color: "Silver White" },
    { id: "4bbfd3d4-5c5f-4b34-8adb-9434d9e90f14", title: "Black Full-Sleeve Zipper T-Shirt for Men - Premium Athletic", color: "Black" },
    { id: "30ed8b13-b91e-45d5-931b-17dd35da5f23", title: "Dark Gray Full-Sleeve Zipper T-Shirt for Men", color: "Dark Gray" },
    { id: "308229a0-a0b7-4f8f-88c8-afbcc5d3cd0b", title: "Light Gray Full-Sleeve Zipper T-Shirt for Men", color: "Light Gray" },
    { id: "05619487-2b9f-4fd5-985d-2b813c5412da", title: "Premium Black Cotton Half-Sleeve T-Shirt for Men", color: "Black" },
    { id: "4e354d99-027c-4d47-aed0-f7a037c86ea8", title: "Premium Blue Cotton Half-Sleeve T-Shirt for Men", color: "Blue" },
    { id: "1de99c4f-6e0a-4fae-bd89-e5645a08cf21", title: "Premium Gray Cotton Half-Sleeve T-Shirt for Men", color: "Gray" },
    { id: "2a5424b6-0c62-481a-8c1d-9d5c7cf8fa0f", title: "Premium Green Cotton Half-Sleeve T-Shirt for Men", color: "Green" },
    { id: "08475baa-c29c-468b-b4a2-2d4d9034059a", title: "Premium Lavender Pink Cotton Half-Sleeve T-Shirt for Men", color: "Lavender" },
    { id: "3c08e867-4645-4f1d-967c-214c7c834c27", title: "Purple Full-Sleeve Zipper T-Shirt for Men - Premium Cotton", color: "Purple" },
    { id: "55b9dd47-e716-40fd-98ad-3ec8457695fd", title: "Sandal Beige Full-Sleeve Zipper T-Shirt for Men", color: "Beige" },
    { id: "495e32af-4ef6-47b9-8cc2-37005e19a4d9", title: "White Full-Sleeve Zipper T-Shirt for Men - Athletic Fit", color: "White" },
    { id: "046cc250-0289-4512-b1b7-8289d803a998", title: "Black Track Pants for Men - Premium Athletic Joggers", color: "Black" },
    { id: "73ee195d-ea30-48b9-9ceb-bd37e0c62f91", title: "Dark Gray Track Pants for Men - Premium Athletic Joggers", color: "Dark Gray" },
    { id: "0e56aec5-d306-4a5e-a260-d8aa80226eab", title: "Green Track Pants for Men - Athletic Joggers", color: "Green" },
    { id: "762aec51-b72d-4085-9315-3e920ecfe720", title: "Navy Blue Track Pants for Men - Premium Athletic Joggers", color: "Navy Blue" },
    { id: "f0bcdacc-450f-462f-aaea-28c93cc40dae", title: "Silver White Track Pants for Men - Athletic Joggers", color: "Silver White" }
];

async function updateAll() {
    console.log(`Updating ${products.length} products...`);

    for (const product of products) {
        console.log(`\nUpdating: ${product.title}`);
        console.log(`  Color: ${product.color}`);

        const result = await updateProductColorOption(product.id, product.color);

        if (result.success) {
            console.log(`  ✅ Success`);
        } else {
            console.log(`  ❌ Failed: ${result.error}`);
        }
    }

    console.log('\n✅ All products updated!');
}

updateAll().catch(console.error);
