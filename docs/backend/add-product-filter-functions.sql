-- ================================================
-- ADD PRODUCT FILTERING RPC FUNCTIONS
-- ================================================
-- This script creates the missing filter_products and get_filter_options functions
-- that are required for the product listing page (PLP)
-- ================================================

-- ================================================
-- FILTER PRODUCTS FUNCTION
-- ================================================
-- Returns filtered products based on category, collection, price, size, color, and sorting
CREATE OR REPLACE FUNCTION filter_products(
    p_category_slug TEXT DEFAULT NULL,
    p_collection_slug TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_size TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_in_stock BOOLEAN DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'newest',
    p_limit INTEGER DEFAULT 24,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    products JSONB,
    total INTEGER
) AS $$
DECLARE
    v_category_id UUID;
    v_collection_id UUID;
    v_query TEXT;
    v_total INTEGER;
BEGIN
    -- Get category ID if slug provided
    IF p_category_slug IS NOT NULL THEN
        SELECT id INTO v_category_id
        FROM categories
        WHERE slug = p_category_slug
        LIMIT 1;
    END IF;

    -- Get collection ID if slug provided
    IF p_collection_slug IS NOT NULL THEN
        SELECT id INTO v_collection_id
        FROM collections
        WHERE slug = p_collection_slug
        LIMIT 1;
    END IF;

    -- Build the main query
    WITH filtered_variants AS (
        SELECT DISTINCT
            pv.id as variant_id,
            p.id,
            p.title,
            p.slug,
            p.description,
            pv.price,
            COALESCE(pv.mrp, pv.price) as mrp,
            COALESCE(pv.stock, 0) as stock,
            pv.options,
            pv.image_url as variant_image,
            p.is_bestseller,
            p.is_new_drop,
            p.is_featured,
            p.created_at
        FROM products p
        INNER JOIN product_variants pv ON pv.product_id = p.id
        LEFT JOIN product_categories pc ON pc.product_id = p.id
        LEFT JOIN product_collections pcol ON pcol.product_id = p.id
        WHERE 
            p.status = 'published'
            AND pv.active = true
            -- Category filter
            AND (p_category_slug IS NULL OR pc.category_id = v_category_id)
            -- Collection filter
            AND (p_collection_slug IS NULL OR pcol.collection_id = v_collection_id)
            -- Price filter
            AND (p_min_price IS NULL OR pv.price >= p_min_price)
            AND (p_max_price IS NULL OR pv.price <= p_max_price)
            -- Size filter (check variant options JSONB)
            AND (p_size IS NULL OR LOWER(pv.options->>'size') = LOWER(p_size))
            -- Color filter (check variant options JSONB)
            AND (p_color IS NULL OR LOWER(pv.options->>'color') LIKE '%' || LOWER(p_color) || '%')
            -- Stock filter
            AND (p_in_stock IS NULL OR (p_in_stock = true AND pv.stock > 0) OR (p_in_stock = false))
    ),
    sorted_variants AS (
        SELECT *
        FROM filtered_variants
        ORDER BY
            CASE WHEN p_sort_by = 'price_asc' THEN price END ASC,
            CASE WHEN p_sort_by = 'price_desc' THEN price END DESC,
            CASE WHEN p_sort_by = 'bestseller' THEN 
                CASE WHEN is_bestseller THEN 0 ELSE 1 END 
            END ASC,
            CASE WHEN p_sort_by = 'newest' THEN created_at END DESC,
            created_at DESC
    ),
    paginated_variants AS (
        SELECT *
        FROM sorted_variants
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'variant_id', variant_id,
                    'title', title,
                    'slug', slug,
                    'description', description,
                    'price', price,
                    'mrp', mrp,
                    'stock', stock,
                    'options', options,
                    'variant_image', variant_image,
                    'is_bestseller', is_bestseller,
                    'is_new_drop', is_new_drop,
                    'is_featured', is_featured
                )
            ),
            '[]'::jsonb
        ) as products,
        (SELECT COUNT(DISTINCT id) FROM filtered_variants)::INTEGER as total
    INTO products, total
    FROM paginated_variants;

    RETURN QUERY SELECT products, total;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION filter_products IS 
'Filters and returns products based on category, collection, price range, size, color, stock status, and sorting options. Used by the product listing page.';

-- ================================================
-- GET FILTER OPTIONS FUNCTION
-- ================================================
-- Returns available filter options (sizes, colors, price range) for a given category/collection
CREATE OR REPLACE FUNCTION get_filter_options(
    p_category_slug TEXT DEFAULT NULL,
    p_collection_slug TEXT DEFAULT NULL
)
RETURNS TABLE(
    sizes JSONB,
    colors JSONB,
    min_price NUMERIC,
    max_price NUMERIC
) AS $$
DECLARE
    v_category_id UUID;
    v_collection_id UUID;
BEGIN
    -- Get category ID if slug provided
    IF p_category_slug IS NOT NULL THEN
        SELECT id INTO v_category_id
        FROM categories
        WHERE slug = p_category_slug
        LIMIT 1;
    END IF;

    -- Get collection ID if slug provided
    IF p_collection_slug IS NOT NULL THEN
        SELECT id INTO v_collection_id
        FROM collections
        WHERE slug = p_collection_slug
        LIMIT 1;
    END IF;

    -- Get available sizes, colors, and price range
    RETURN QUERY
    WITH product_variants_filtered AS (
        SELECT DISTINCT
            pv.options,
            pv.price
        FROM products p
        INNER JOIN product_variants pv ON pv.product_id = p.id
        LEFT JOIN product_categories pc ON pc.product_id = p.id
        LEFT JOIN product_collections pcol ON pcol.product_id = p.id
        WHERE 
            p.status = 'published'
            AND pv.active = true
            AND (p_category_slug IS NULL OR pc.category_id = v_category_id)
            AND (p_collection_slug IS NULL OR pcol.collection_id = v_collection_id)
    )
    SELECT
        -- Available sizes
        COALESCE(
            jsonb_agg(DISTINCT pv.options->>'size') FILTER (WHERE pv.options->>'size' IS NOT NULL),
            '[]'::jsonb
        ) as sizes,
        -- Available colors
        COALESCE(
            jsonb_agg(DISTINCT pv.options->>'color') FILTER (WHERE pv.options->>'color' IS NOT NULL),
            '[]'::jsonb
        ) as colors,
        -- Min price
        COALESCE(MIN(pv.price), 0) as min_price,
        -- Max price
        COALESCE(MAX(pv.price), 0) as max_price
    FROM product_variants_filtered pv;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_filter_options IS 
'Returns available filter options (sizes, colors, price range) for products in a given category or collection. Used to populate filter UI.';

-- ================================================
-- VERIFICATION
-- ================================================
DO $$ 
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'PRODUCT FILTER FUNCTIONS CREATED SUCCESSFULLY!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '1. filter_products - Filters products by category, collection, price, size, color';
    RAISE NOTICE '2. get_filter_options - Returns available filter options';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now test these functions:';
    RAISE NOTICE '- SELECT * FROM filter_products();';
    RAISE NOTICE '- SELECT * FROM get_filter_options();';
    RAISE NOTICE '================================================';
END $$;
