# Water Refill Station

A premium web application for a Water Refill Station, specializing in clean, purified water delivery and refill services.

## Features
- **Dynamic Product Catalog**: Real-time product management with categories, sizes, and pricing options.
- **Store Status**: Automatic and manual toggle for store opening/closing hours.
- **Order Management**: Checkout integration with Facebook Messenger for seamless ordering.
- **Admin Dashboard**: Full CRUD for products and categories, order history, and store settings.
- **Thermal Printing**: Built-in support for 57mm thermal receipts.
- **Responsive Design**: Fully optimized for mobile and desktop views.

## Tech Stack
- **Frontend**: React (Vite)
- **Database/Backend**: Supabase (Schema provided in `supabase_schema.sql`)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with modern aesthetics

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Locally:**
   ```bash
   npm run dev
   ```

3. **Database Setup:**
   - Create a project in Supabase.
   - Run the contents of `supabase_schema.sql` in the SQL Editor to set up the tables.

4. **Admin Access:**
   - Navigate to `/login` to access the administrative dashboard.
   - Manage store settings, hours, and products directly from the panel.

## Credits
Built with passion for providing clean, safe drinking water.
