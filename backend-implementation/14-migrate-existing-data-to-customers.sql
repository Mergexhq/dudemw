-- ================================================
-- MIGRATE EXISTING DATA TO CUSTOMER DOMAIN
-- ================================================
-- This script migrates existing orders and addresses
-- to the new customer domain architecture
-- ================================================

-- ================================================
-- SAFETY CHECK: Backup existing data
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '⚠️  MIGRATION START: Please ensure you have backed up your database';
    RAISE NOTICE '📊 Analyzing existing data...';
END $$;

-- ================================================
-- STEP 1: Clean up any admin users from orders
-- ================================================
DO $$
DECLARE
    v_admin_orders_count INTEGER;
BEGIN
    -- Count orders placed by admins
    SELECT COUNT(*) INTO v_admin_orders_count
    FROM orders o
    WHERE o.user_id IN (SELECT user_id FROM admin_profiles);
    
    IF v_admin_orders_count > 0 THEN
        RAISE WARNING '⚠️  Found % orders placed by admin users', v_admin_orders_count;
        RAISE WARNING '   These will NOT be migrated to customers';
        
        -- Log admin orders for review
        RAISE NOTICE '   Admin order IDs:';
        FOR rec IN (
            SELECT o.id, o.user_id
            FROM orders o
            WHERE o.user_id IN (SELECT user_id FROM admin_profiles)
            LIMIT 10
        ) LOOP
            RAISE NOTICE '   - Order: %, Admin User: %', rec.id, rec.user_id;
        END LOOP;
    END IF;
END $$;

-- ================================================
-- STEP 2: Migrate registered user orders to customers
-- ================================================
DO $$
DECLARE
    v_registered_count INTEGER := 0;
    v_order_record RECORD;
    v_customer_id UUID;
    v_user_email TEXT;
    v_user_metadata JSONB;
BEGIN
    RAISE NOTICE '📝 Step 2: Creating customers from registered user orders...';
    
    -- Get all distinct user_ids from orders (excluding admins)
    FOR v_order_record IN (
        SELECT DISTINCT o.user_id
        FROM orders o
        WHERE o.user_id IS NOT NULL
        AND o.user_id NOT IN (SELECT user_id FROM admin_profiles)
        ORDER BY o.user_id
    ) LOOP
        -- Get user email and metadata from auth.users
        BEGIN
            -- Note: This requires service role access
            SELECT 
                email,
                raw_user_meta_data
            INTO 
                v_user_email,
                v_user_metadata
            FROM auth.users
            WHERE id = v_order_record.user_id;
            
            -- Create or get customer
            INSERT INTO customers (
                auth_user_id,
                email,
                phone,
                first_name,
                last_name,
                customer_type,
                metadata
            ) VALUES (
                v_order_record.user_id,
                v_user_email,
                v_user_metadata->>'phone',
                v_user_metadata->>'first_name',
                v_user_metadata->>'last_name',
                'registered',
                v_user_metadata
            )
            ON CONFLICT (auth_user_id) DO NOTHING
            RETURNING id INTO v_customer_id;
            
            IF v_customer_id IS NOT NULL THEN
                v_registered_count := v_registered_count + 1;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '   ⚠️  Could not create customer for user_id: %', v_order_record.user_id;
        END;
    END LOOP;
    
    RAISE NOTICE '   ✅ Created % registered customers', v_registered_count;
END $$;

-- ================================================
-- STEP 3: Migrate guest orders to customers
-- ================================================
DO $$
DECLARE
    v_guest_count INTEGER := 0;
    v_order_record RECORD;
    v_customer_id UUID;
BEGIN
    RAISE NOTICE '📝 Step 3: Creating customers from guest orders...';
    
    -- Get all distinct guest emails from orders
    FOR v_order_record IN (
        SELECT DISTINCT 
            o.guest_email as email,
            MIN(o.created_at) as first_order_date
        FROM orders o
        WHERE o.guest_id IS NOT NULL
        AND o.guest_email IS NOT NULL
        AND o.user_id IS NULL
        GROUP BY o.guest_email
        ORDER BY first_order_date
    ) LOOP
        BEGIN
            -- Create guest customer if doesn't exist
            INSERT INTO customers (
                email,
                customer_type,
                created_at
            ) VALUES (
                v_order_record.email,
                'guest',
                v_order_record.first_order_date
            )
            ON CONFLICT DO NOTHING
            RETURNING id INTO v_customer_id;
            
            IF v_customer_id IS NOT NULL THEN
                v_guest_count := v_guest_count + 1;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '   ⚠️  Could not create guest customer for email: %', v_order_record.email;
        END;
    END LOOP;
    
    RAISE NOTICE '   ✅ Created % guest customers', v_guest_count;
END $$;

-- ================================================
-- STEP 4: Link orders to customers
-- ================================================
DO $$
DECLARE
    v_linked_count INTEGER := 0;
BEGIN
    RAISE NOTICE '📝 Step 4: Linking orders to customers...';
    
    -- Link registered user orders
    UPDATE orders o
    SET customer_id = c.id,
        customer_email_snapshot = c.email,
        customer_phone_snapshot = c.phone,
        customer_name_snapshot = CONCAT_WS(' ', c.first_name, c.last_name)
    FROM customers c
    WHERE o.user_id = c.auth_user_id
    AND o.customer_id IS NULL
    AND c.customer_type = 'registered';
    
    GET DIAGNOSTICS v_linked_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Linked % registered user orders', v_linked_count;
    
    -- Link guest orders
    UPDATE orders o
    SET customer_id = c.id,
        customer_email_snapshot = o.guest_email,
        customer_phone_snapshot = c.phone,
        customer_name_snapshot = CONCAT_WS(' ', c.first_name, c.last_name)
    FROM customers c
    WHERE o.guest_email = c.email
    AND o.customer_id IS NULL
    AND c.customer_type = 'guest'
    AND o.user_id IS NULL;
    
    GET DIAGNOSTICS v_linked_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Linked % guest orders', v_linked_count;
END $$;

-- ================================================
-- STEP 5: Update customer last_order_at
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '📝 Step 5: Updating customer last order dates...';
    
    UPDATE customers c
    SET last_order_at = (
        SELECT MAX(o.created_at)
        FROM orders o
        WHERE o.customer_id = c.id
    )
    WHERE EXISTS (
        SELECT 1 FROM orders o WHERE o.customer_id = c.id
    );
    
    RAISE NOTICE '   ✅ Updated customer order dates';
END $$;

-- ================================================
-- STEP 6: Migrate addresses to customer_addresses
-- ================================================
DO $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_address_record RECORD;
    v_customer_id UUID;
BEGIN
    RAISE NOTICE '📝 Step 6: Migrating addresses to customer_addresses...';
    
    -- Migrate addresses for registered users
    FOR v_address_record IN (
        SELECT a.*, c.id as customer_id
        FROM addresses a
        JOIN customers c ON c.auth_user_id = a.user_id
        WHERE a.user_id IS NOT NULL
    ) LOOP
        INSERT INTO customer_addresses (
            customer_id,
            name,
            phone,
            address_line1,
            city,
            state,
            pincode,
            created_at
        ) VALUES (
            v_address_record.customer_id,
            v_address_record.name,
            v_address_record.phone,
            v_address_record.address_line1,
            v_address_record.city,
            v_address_record.state,
            v_address_record.pincode,
            v_address_record.created_at
        )
        ON CONFLICT DO NOTHING;
        
        v_migrated_count := v_migrated_count + 1;
    END LOOP;
    
    RAISE NOTICE '   ✅ Migrated % addresses', v_migrated_count;
END $$;

-- ================================================
-- STEP 7: Create activity logs for existing customers
-- ================================================
DO $$
DECLARE
    v_customer_record RECORD;
BEGIN
    RAISE NOTICE '📝 Step 7: Creating activity logs...';
    
    FOR v_customer_record IN (
        SELECT id, customer_type, created_at
        FROM customers
    ) LOOP
        INSERT INTO customer_activity_log (
            customer_id,
            activity_type,
            description,
            created_at
        ) VALUES (
            v_customer_record.id,
            CASE 
                WHEN v_customer_record.customer_type = 'registered' THEN 'account_created'
                ELSE 'order_placed'
            END,
            'Migrated from legacy system',
            v_customer_record.created_at
        );
    END LOOP;
    
    RAISE NOTICE '   ✅ Created activity logs';
END $$;

-- ================================================
-- STEP 8: Validation and Summary
-- ================================================
DO $$
DECLARE
    v_total_customers INTEGER;
    v_registered_customers INTEGER;
    v_guest_customers INTEGER;
    v_linked_orders INTEGER;
    v_unlinked_orders INTEGER;
    v_migrated_addresses INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📊 MIGRATION SUMMARY';
    RAISE NOTICE '==========================================';
    
    -- Count customers
    SELECT COUNT(*) INTO v_total_customers FROM customers;
    SELECT COUNT(*) INTO v_registered_customers FROM customers WHERE customer_type = 'registered';
    SELECT COUNT(*) INTO v_guest_customers FROM customers WHERE customer_type = 'guest';
    
    RAISE NOTICE '👥 Customers Created:';
    RAISE NOTICE '   Total: %', v_total_customers;
    RAISE NOTICE '   Registered: %', v_registered_customers;
    RAISE NOTICE '   Guest: %', v_guest_customers;
    
    -- Count orders
    SELECT COUNT(*) INTO v_linked_orders FROM orders WHERE customer_id IS NOT NULL;
    SELECT COUNT(*) INTO v_unlinked_orders FROM orders WHERE customer_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '🛒 Orders Status:';
    RAISE NOTICE '   Linked to customers: %', v_linked_orders;
    IF v_unlinked_orders > 0 THEN
        RAISE WARNING '   ⚠️  Unlinked orders: %', v_unlinked_orders;
        RAISE WARNING '   These may be admin orders or data inconsistencies';
    END IF;
    
    -- Count addresses
    SELECT COUNT(*) INTO v_migrated_addresses FROM customer_addresses;
    RAISE NOTICE '';
    RAISE NOTICE '📍 Addresses Migrated: %', v_migrated_addresses;
    
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NEXT STEPS:';
    RAISE NOTICE '   1. Verify data integrity';
    RAISE NOTICE '   2. Update application code to use customer_id';
    RAISE NOTICE '   3. Consider adding NOT NULL constraint on orders.customer_id after verification';
    RAISE NOTICE '   4. Consider deprecating user_id and guest_id columns after full migration';
END $$;
