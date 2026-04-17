# Farmer Marketplace – Full-Stack Digital Agriculture Platform

## Overview

**Farmer Marketplace** is a **full-stack e-commerce platform** connecting local farmers directly with consumers. Built using **HTML, CSS, Vanilla JavaScript** with **Supabase** as the backend, it provides a complete marketplace experience for organic produce.

This project is developed in **two phases (Rounds)**:
- **Round 1:** Core E-commerce Platform – Authentication, product catalog, cart, orders, and basic dashboards
- **Round 2:** Enhanced Features – Payment integration, advanced analytics, quick view, and enhanced dashboards

---

## Round 1 – Core E-Commerce Platform

### Features

* **Real Authentication** with Email/Password and Google OAuth
* **Live Product Catalog** stored in PostgreSQL with RLS security
* **Persistent Shopping Cart** synced across devices
* **Complete Order Lifecycle** with status tracking
* **Role-Based Dashboards** with real analytics
* **Product Image Uploads** via Supabase Storage
* **Profile Management** with avatar support

### Demonstrates

* Full-stack multi-role architecture with Row Level Security
* Modern UI/UX with dark/light theme support
* Real-time data persistence via Supabase
* Secure authentication flow with protected routes

---

## Round 2 – Enhanced Features & Payment Integration

### New Features Added

#### Quick View Modal
* **Instant Product Preview** – View product details without leaving the marketplace page
* **Quick Add to Cart** – Add items directly from the modal with quantity selector
* **Product Highlights** – Shows price, stock status, farmer info, and description
* **Seamless UX** – Press ESC or click outside to close; keyboard accessible

#### Razorpay Payment Gateway Integration
* **Secure Online Payments** – Full Razorpay integration for credit/debit cards, UPI, and wallets
* **Multiple Payment Methods:**
  - Credit/Debit Cards (Visa, Mastercard, RuPay)
  - UPI (Google Pay, PhonePe, Paytm)
  - Net Banking
  - Wallets
* **Order Confirmation Flow** – Automatic order creation after successful payment verification
* **Webhook Verification** – Server-side payment verification for security
* **Failed Payment Handling** – Graceful error handling with retry option
* **COD Still Available** – Cash on Delivery option retained for offline payments

#### Enhanced Analytics Dashboard
* **Revenue Timeline Chart** – 7-day revenue visualization with Chart.js
* **Real-time Statistics:**
  - Total revenue and items sold
  - Active vs total listings
  - Pending orders count
  - Cart item count
* **Top Performing Products** – Identifies best-selling items by revenue
* **Order Status Distribution** – Visual breakdown of order statuses
* **Buyer Spending Analytics** – Track total spent and active orders

#### Enhanced Seller (Farmer) Dashboard
* **Comprehensive Stats Cards:**
  - Total revenue with rupee formatting
  - Total products sold count
  - Active/inactive listings breakdown
  - Pending orders awaiting action
* **Recent Orders Widget** – Quick view of latest orders with status
* **Inventory Overview** – Low stock alerts and quick product management
* **Quick Actions** – Shortcuts to add products, view orders, manage inventory
* **Performance Metrics** – Track sales trends over time

#### Enhanced Buyer Dashboard
* **Personalized Overview:**
  - Total orders placed
  - Total amount spent
  - Active orders in progress
  - Cart summary with item count
* **Recent Activity Feed** – Latest orders with status and date
* **Quick Navigation** – Direct links to marketplace, cart, and orders
* **Account Health** – Profile completion indicator

#### Additional Round 2 Improvements
* **Stock Validation** – Real-time stock checks before add-to-cart and checkout
* **Order Status Workflow** – Complete lifecycle from placed → confirmed → shipped → delivered
* **Soft Delete for Products** – Products marked inactive to preserve order history
* **Enhanced Error Handling** – User-friendly error messages throughout
* **Loading States** – Better UX with loaders on all async operations

---

## Team Information

**Team Name:** bg 137

**Team Members:**
- Prathamesh Yewale
- Satyam Kumar Singh

---

## Key Features

### Authentication & User Management
* **Email/Password Authentication** with role-based registration (Buyer/Farmer)
* **Google OAuth Integration** for quick sign-in
* **Protected Routes** with automatic redirects based on auth state
* **Profile Management** with avatar URLs and personal details

### Product Marketplace
* **Real Product Catalog** fetched from Supabase PostgreSQL
* **Category Filtering** (Vegetables, Fruits, Dairy, Grains, Herbs)
* **Live Search** with debounced filtering
* **Quick View Modal** for product preview
* **Product Detail Pages** with farmer information

### Shopping Experience
* **Persistent Cart** stored in database, synced across devices
* **Quantity Controls** with stock validation
* **Order Placement** with address capture
* **Order History** for buyers and order management for farmers
* **Cart Badge** in navbar showing item count

### Farmer Capabilities
* **Product Management** – Create, update, soft-delete listings via `add-product.html` and `my-products.html`
* **Image Uploads** to Supabase Storage with preview (JPEG, PNG, WebP, max 5MB)
* **Inventory Dashboard** (`my-products.html`) with:
  - Product table with stock level visual indicators
  - Stats cards (Total, Active, Low Stock, Out of Stock)
  - Status filters (All, Active, Inactive, Low Stock)
  - Edit and soft-delete actions
* **Order Fulfillment** (`farmer-orders.html`) with:
  - Order status management (Confirm → Ship → Deliver)
  - Customer details display (name, phone, address)
  - Revenue statistics and order counts by status
  - Filter orders by status (New, Confirmed, Shipped, Delivered)
* **Revenue Analytics** with total sales and order tracking

### Buyer Capabilities
* **Browse Marketplace** with filters and search
* **Add to Cart** with real-time stock checks
* **Checkout Flow** with COD payment option
* **Order Tracking** with status updates (placed → confirmed → shipped → delivered)

---

## System Architecture

### Frontend Stack
* **HTML5** – Semantic multi-page structure
* **Vanilla CSS3** – Custom design system with CSS variables
* **Vanilla JavaScript** – Modular ES6+ code with async/await
* **FontAwesome 6.4** – Icon system
* **Google Fonts** – Playfair Display, Inter, Cormorant Garamond

### Backend Stack
* **Supabase** – Backend-as-a-Service platform
* **PostgreSQL** – Primary database with Row Level Security (RLS)
* **Supabase Auth** – JWT-based authentication
* **Supabase Storage** – Public bucket for product images
* **Database Functions** – RPC for atomic operations (cart increment, stock decrement)

### Security Features
* **Row Level Security (RLS)** policies on all tables
* **Users can only access** their own data
* **Farmers can only modify** their own products
* **Soft delete** for products to preserve order history
* **Input validation** on client and server

---

## Project Structure

```
Farmer Marketplace/
├── index.html              # Landing page with splash screen
├── login.html              # Email/password + Google login
├── signup.html             # Role-based registration
├── products.html           # Product marketplace with filters
├── product-details.html    # Individual product view
├── cart.html               # Shopping cart management
├── checkout.html           # Order placement
├── orders.html             # Order history (buyer view)
├── farmer-orders.html      # Order fulfillment (farmer view)
├── dashboard.html          # Role-based analytics dashboard
├── profile.html            # User profile management
├── add-product.html        # Create new product (farmer only)
├── my-products.html        # Manage products (farmer only)
├── about.html              # About page
├── contact.html            # Contact form with EmailJS
├── components/
│   ├── navbar.html         # Shared navigation component
│   └── footer.html         # Shared footer component
├── css/
│   ├── style.css           # Global styles + theme variables
│   ├── navbar.css          # Navigation styles
│   ├── footer.css          # Footer styles
│   ├── auth.css            # Login/signup styles
│   ├── products.css        # Product grid + filters
│   ├── dashboard.css       # Dashboard layout
│   ├── checkout.css        # Checkout flow
│   ├── orders.css          # Order cards
│   ├── product-details.css # PDP styles
│   └── profile.css         # Profile page styles
├── js/
│   ├── config.js           # Centralized configuration (Supabase + EmailJS)
│   ├── supabase.js         # Supabase client initialization
│   ├── auth.js             # Authentication functions
│   ├── products.js         # Product CRUD + marketplace
│   ├── cart.js             # Cart management
│   ├── orders.js           # Order placement + fetching
│   ├── dashboard.js        # Analytics queries
│   ├── profile.js          # Profile updates
│   ├── utils.js            # Helper utilities (toast, loader, formatting)
│   └── main.js             # Component injection + global handlers
├── supabase-schema.sql     # Database schema + RLS policies
└── README.md               # Project documentation
```

---

## Database Schema

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_profiles` | Extended user data | id, full_name, role, phone, address, avatar_url |
| `products` | Product catalog | id, farmer_id, name, category, price, stock_qty, image_url, is_active |
| `cart_items` | Shopping cart | id, user_id, product_id, quantity |
| `orders` | Order headers | id, buyer_id, total_amount, status, shipping_address, payment_method |
| `order_items` | Order line items | id, order_id, product_id, farmer_id, quantity, unit_price, subtotal |

### Database Functions

| Function | Purpose |
|----------|---------|
| `increment_cart_qty()` | Atomic upsert for cart items (adds quantity on conflict) |
| `decrement_stock()` | Atomic stock reduction after order placement |
| `handle_new_user()` | Auto-creates user profile on signup |

### Row Level Security Policies

- **user_profiles**: Users can only see/edit their own profile
- **products**: Public read access to active products; farmers can only modify their own
- **cart_items**: Users own their cart items only
- **orders**: Buyers see their orders; farmers see order items for their products
- **order_items**: Similar to orders with cross-table relationships

---

## JavaScript Modules Reference

### `supabase.js`
Creates and exports the Supabase client instance using CDN-loaded SDK.

### `auth.js`
| Function | Purpose |
|----------|---------|
| `signup(email, password, fullName, role)` | Register new user with profile |
| `login(email, password)` | Authenticate user |
| `logout()` | Sign out and redirect |
| `signInWithGoogle()` | OAuth via Google |
| `getCurrentUser()` | Get {user, profile} for current session |
| `protectRoute(allowedRoles)` | Guard pages requiring authentication |

### `products.js`
| Function | Purpose |
|----------|---------|
| `fetchProducts(filters)` | Get active products with optional category/search filters |
| `fetchProductById(id)` | Get single product with farmer details |
| `fetchFarmerProducts(farmerId)` | Get all products for a farmer |
| `createProduct(productData)` | Add new product (farmer only) |
| `updateProduct(id, updates)` | Modify existing product |
| `deleteProduct(id)` | Soft delete (set is_active = false) |
| `uploadProductImage(file, farmerId)` | Upload to Supabase Storage |
| `validateStock(productId, quantity)` | Check availability before adding to cart |

### `cart.js`
| Function | Purpose |
|----------|---------|
| `fetchCart()` | Get cart items with product details for current user |
| `addToCart(productId, quantity)` | Add item using RPC for atomic increment |
| `updateCartQty(cartItemId, quantity)` | Change quantity or remove if < 1 |
| `removeFromCart(cartItemId)` | Delete cart item |
| `clearCart(userId)` | Empty cart (used after checkout) |
| `getCartCount()` | Get total items for navbar badge |
| `getCartTotal()` | Calculate cart subtotal |

### `orders.js`
| Function | Purpose |
|----------|---------|
| `placeOrder(shippingAddress, paymentMethod)` | Complete checkout with stock decrement |
| `fetchBuyerOrders()` | Get orders with items for current buyer |
| `fetchFarmerOrders(farmerId)` | Get order items for farmer's products |
| `updateOrderStatus(orderId, status)` | Change order status |

### `dashboard.js`
| Function | Purpose |
|----------|---------|
| `fetchBuyerStats(userId)` | Get total spent, orders count, active orders |
| `fetchFarmerStats(farmerId)` | Get revenue, items sold, active listings |

### `profile.js`
| Function | Purpose |
|----------|---------|
| `updateProfile(updates)` | Update user profile fields |

### `utils.js`
| Function | Purpose |
|----------|---------|
| `formatCurrency(val)` | Format as INR (Indian Rupees) |
| `showToast(message, type)` | Display notification |
| `showLoader()` / `hideLoader()` | Global loading overlay |
| `injectComponent(path, targetId)` | Fetch and inject HTML components |
| `getStorage(key)` / `setStorage(key, value)` | localStorage wrappers |
| `logAction(action, meta)` | Analytics logging |

---

## UI/UX Features

### Design System
* **Color Palette**: Organic greens (#2D6A4F, #1B4332) with cream backgrounds
* **Typography**: Playfair Display for headings, Inter for body text
* **Components**: Card-based layouts with soft shadows
* **Animations**: Smooth transitions, hover states, splash screen on first visit

### Theme Support
* Dark/Light mode toggle (stored in `theme` localStorage key)
* CSS variables update dynamically via `data-theme` attribute

### Responsive Breakpoints
* **Desktop**: 1200px+ (4-column product grid)
* **Tablet**: 768px-1199px (2-column grid)
* **Mobile**: <768px (stacked layout with hamburger menu)

---

## Setup Instructions

### Prerequisites
* Supabase account (free tier works)
* Web server (Live Server, npx serve, or similar) – required for component injection

### 1. Configuration

All credentials are centralized in `js/config.js`. Update this file with your actual keys:

```javascript
const CONFIG = {
    // Supabase Configuration (from https://app.supabase.com/project/_/settings/api)
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key',
    
    // EmailJS Configuration (from https://dashboard.emailjs.com/admin) - Optional
    EMAILJS_PUBLIC_KEY: 'your-emailjs-public-key',
    EMAILJS_SERVICE_ID: 'your-service-id',
    EMAILJS_TEMPLATE_ID: 'your-template-id',
    EMAILJS_CONFIRMATION_TEMPLATE_ID: 'your-confirmation-template-id'
};
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run `supabase-schema.sql` in the SQL Editor to create:
   - All database tables
   - Row Level Security policies
   - Database functions (cart increment, stock decrement, user profile creation)
3. Create a public Storage bucket named `product-images`
4. Set Storage policies to allow farmers to upload to their own folder

### 3. EmailJS Setup (Optional - for contact form)

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create an email service and email templates
3. Update `js/config.js` with your EmailJS credentials
4. Contact form will send emails to admin and confirmation to user

### 4. Run Locally

```bash
# Using npx serve
npx serve .

# Or with Live Server VS Code extension
# Right-click index.html → "Open with Live Server"
```

---

## Environment & Security

### Security Implemented
* **Row Level Security (RLS)** policies on all database tables
* **Parameterized queries** via Supabase JS SDK
* **JWT tokens** managed by Supabase Auth
* **Input validation** on file uploads (type, size)
* **Soft delete** pattern preserves data integrity
* **Transaction rollback** on failed order placement

### What Remains Client-Side Only
* `theme` preference (Dark/Light mode) stored in localStorage
* Cart is server-persisted but UI state is ephemeral

---

## Page Flow

### Buyer Journey
1. **Landing** (`index.html`) → Browse features
2. **Browse** (`products.html`) → Filter/search products
3. **Product Detail** (`product-details.html`) → View details, add to cart
4. **Cart** (`cart.html`) → Review items, adjust quantities
5. **Checkout** (`checkout.html`) → Enter shipping, place order
6. **Orders** (`orders.html`) → Track order status
7. **Profile** (`profile.html`) → Manage account

### Farmer Journey
1. **Register** as farmer (`signup.html`)
2. **Dashboard** (`dashboard.html`) → View revenue and stats
3. **My Products** (`my-products.html`) → Manage inventory
4. **Orders** (`orders.html`) → View orders for your products

---

## Testing Checklist

### Authentication
- [ ] Signup as buyer → redirects to products
- [ ] Signup as farmer → redirects to dashboard
- [ ] Login with wrong password → shows error toast
- [ ] Direct URL to protected page while logged out → redirects to login
- [ ] Google OAuth flow works

### Products
- [ ] Products load from Supabase on marketplace
- [ ] Category filter works
- [ ] Search filters in real-time
- [ ] Product detail page shows correct data
- [ ] Out-of-stock products don't appear in grid

### Cart
- [ ] Add to cart increments navbar badge
- [ ] Adding same product twice increments quantity
- [ ] Remove from cart decrements badge
- [ ] Cart persists across page refresh
- [ ] Empty cart shows appropriate UI

### Orders
- [ ] Checkout creates order with correct total
- [ ] Order appears in buyer's order list
- [ ] Stock decrements after order
- [ ] Farmer sees order items for their products

### Farmer Features
- [ ] Can create product with image upload
- [ ] Invalid file type shows error
- [ ] Soft delete works (product disappears from market)
- [ ] Dashboard shows revenue stats

---

## Future Enhancements

* **Real-time Updates** via Supabase Realtime for live notifications
* **Email Notifications** via Supabase Edge Functions for order updates
* **Messaging System** between buyers and farmers
* **Order Status Push Notifications**
* **Admin Dashboard** for platform moderation
* **Product Reviews & Ratings** system
* **Inventory CSV Import** for bulk farmer uploads
* **Multi-language Support** (Hindi, Marathi, etc.)

---

## License

Open for educational and development use.

---

*Grow together. Shop local. Forge the future of farming.*