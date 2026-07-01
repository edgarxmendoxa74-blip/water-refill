-- Supabase Schema for Water Refill Station
-- This script is idempotent (safe to run multiple times)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL DEFAULT 'Water Refill Station',
    address TEXT,
    contact TEXT,
    facebook_messenger_link TEXT,
    logo_url TEXT,
    banner_images JSONB DEFAULT '[]',
    open_time TIME DEFAULT '16:00',
    close_time TIME DEFAULT '01:00',
    manual_status TEXT DEFAULT 'auto',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    promo_price DECIMAL(10, 2),
    image TEXT,
    out_of_stock BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    variations JSONB DEFAULT '[]', -- [{name, price, disabled}]
    flavors JSONB DEFAULT '[]',    -- [{name, disabled}] or [string] (for backward compatibility)
    addons JSONB DEFAULT '[]',      -- [{name, price, disabled}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Order Types Table
CREATE TABLE IF NOT EXISTS order_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Payment Settings Table
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_number TEXT,
    account_name TEXT,
    qr_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Delivery Barangays Table
CREATE TABLE IF NOT EXISTS delivery_barangays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barangay_name TEXT UNIQUE NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL CHECK (delivery_fee >= 0),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    customer_details JSONB NOT NULL, -- {name, phone, tableNumber, address, etc}
    items JSONB NOT NULL,            -- Array of strings or object summaries
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_barangay TEXT,          -- Added for delivery fee management
    delivery_fee DECIMAL(10, 2),     -- Added for delivery fee management
    status TEXT DEFAULT 'Pending'    -- Pending, Preparing, Ready, Completed, Cancelled
);

-- Initial Data (Optional)
-- INSERT INTO store_settings (store_name, contact) VALUES ('Water Refill Station', '09123456789');
