# PRD — Farmer Marketplace: Supabase Backend Integration
**Target Agent:** Windsurf  
**Project Type:** Vanilla JS + HTML/CSS (multi-page, no framework)  
**Backend:** Supabase (Auth + PostgreSQL + Storage + RLS)  
**Scope:** Replace all `localStorage` simulation with real Supabase backend; keep existing HTML/CSS structure intact

---

## 1. Project Context

The existing codebase is a fully built frontend simulation for an agri-marketplace. All state lives in `localStorage`. The task is to wire a real Supabase backend into the existing JS modules (`auth.js`, `cart.js`, `products.js`, `dashboard.js`, `utils.js`) without restructuring the HTML or CSS.

**Supabase JS SDK:** Load via CDN in every HTML file (before all other scripts):
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Create a single `supabase.js` config file:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```
Import `supabase.js` before all other scripts on every page.

---

## 2. Database Schema

Run the following SQL in Supabase SQL Editor in this exact order.

### 2.1 `user_profiles` table
```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'farmer')),
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 `products` table
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('vegetables', 'fruits', 'dairy', 'grains', 'herbs')),
  price NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  stock_qty INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 `cart_items` table
```sql
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### 2.4 `orders` table
```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES user_profiles(id),
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 `order_items` table
```sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  farmer_id UUID NOT NULL REFERENCES user_profiles(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
```

### 2.6 `updated_at` trigger (apply to `products` and `orders`)
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 3. Row Level Security (RLS)

Enable RLS on all tables and apply policies.

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- user_profiles: users see/edit only their own row
CREATE POLICY "own profile" ON user_profiles
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- products: public read; farmers manage own products
CREATE POLICY "public read products" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "farmer insert products" ON products FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "farmer update products" ON products FOR UPDATE
  USING (auth.uid() = farmer_id);
CREATE POLICY "farmer delete products" ON products FOR DELETE
  USING (auth.uid() = farmer_id);

-- cart_items: users own their cart
CREATE POLICY "own cart" ON cart_items
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- orders: buyers see own orders; farmers see orders containing their products
CREATE POLICY "buyer own orders" ON orders FOR SELECT
  USING (auth.uid() = buyer_id);
CREATE POLICY "buyer insert orders" ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- order_items: buyers see their order items; farmers see items they fulfilled
CREATE POLICY "buyer order items" ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
  );
CREATE POLICY "farmer order items" ON order_items FOR SELECT
  USING (auth.uid() = farmer_id);
CREATE POLICY "system insert order items" ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
  );
```

---

## 4. Supabase Storage

Create a public bucket `product-images` in Storage:
- Go to Storage → New bucket → Name: `product-images` → Public: ON
- Set max file size to 5MB, allowed MIME: `image/jpeg, image/png, image/webp`

Storage policy (allow farmers to upload to their own folder):
```sql
CREATE POLICY "farmer upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "public read images" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
```

---

## 5. Seed Data

Insert demo farmer account and 12 products via Supabase SQL Editor after creating the accounts via Auth UI or signup flow. Alternatively, use the following seed approach:

```sql
-- After signing up a test farmer, get their UUID from auth.users and seed:
INSERT INTO products (farmer_id, name, description, category, price, unit, stock_qty, image_url) VALUES
  ('<farmer_uuid>', 'Organic Tomatoes', 'Farm-fresh red tomatoes', 'vegetables', 40.00, 'kg', 50, 'https://images.unsplash.com/photo-1546094096-0df4bcabd337?w=400'),
  ('<farmer_uuid>', 'Green Spinach', 'Crisp leafy spinach', 'vegetables', 25.00, 'bundle', 30, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'),
  ('<farmer_uuid>', 'Alphonso Mangoes', 'Premium Ratnagiri Alphonso', 'fruits', 150.00, 'dozen', 20, 'https://images.unsplash.com/photo-1605027990121-cbae9e0642df?w=400'),
  ('<farmer_uuid>', 'Fresh Strawberries', 'Sweet Mahabaleshwar strawberries', 'fruits', 120.00, 'kg', 15, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400'),
  ('<farmer_uuid>', 'Buffalo Milk', 'Pure raw buffalo milk', 'dairy', 60.00, 'litre', 40, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400'),
  ('<farmer_uuid>', 'Desi Ghee', 'Handcrafted A2 cow ghee', 'dairy', 800.00, '500ml', 10, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400'),
  ('<farmer_uuid>', 'Basmati Rice', 'Long grain premium basmati', 'grains', 180.00, 'kg', 100, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'),
  ('<farmer_uuid>', 'Organic Wheat', 'Stone-ground whole wheat', 'grains', 45.00, 'kg', 80, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'),
  ('<farmer_uuid>', 'Fresh Coriander', 'Aromatic desi coriander', 'herbs', 10.00, 'bundle', 60, 'https://images.unsplash.com/photo-1611049663789-57c7f6e79d5c?w=400'),
  ('<farmer_uuid>', 'Mint Leaves', 'Garden-fresh pudina', 'herbs', 8.00, 'bundle', 45, 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400'),
  ('<farmer_uuid>', 'Banana', 'Organic Robusta bananas', 'fruits', 50.00, 'dozen', 35, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'),
  ('<farmer_uuid>', 'Carrot', 'Crunchy Ooty carrots', 'vegetables', 35.00, 'kg', 55, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400');
```

---

## 6. Module Rewrites

### 6.1 `auth.js` — Full Rewrite

**Remove:** All `localStorage` auth logic.  
**Replace with Supabase Auth:**

```javascript
// signup(email, password, fullName, role)
async function signup(email, password, fullName, role) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // Insert profile row
  await supabase.from('user_profiles').insert({
    id: data.user.id,
    full_name: fullName,
    role: role
  });
  return data.user;
}

// login(email, password)
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

// logout()
async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}

// getCurrentUser() — returns { user, profile } or null
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return { user: session.user, profile };
}

// protectRoute(allowedRoles) — call at top of each page
async function protectRoute(allowedRoles = []) {
  const current = await getCurrentUser();
  if (!current) return window.location.href = '/login.html';
  if (allowedRoles.length && !allowedRoles.includes(current.profile.role)) {
    return window.location.href = '/dashboard.html';
  }
  return current;
}
```

**Auth state listener** (add to `main.js`):
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') window.location.href = '/login.html';
});
```

**Session persistence:** Supabase handles this automatically via its own storage. Remove all `auth_user` localStorage reads/writes across the codebase.

---

### 6.2 `products.js` — Full Rewrite

**Remove:** Static seed array and localStorage product reads.

```javascript
// fetchProducts(filters) — filters: { category, search }
async function fetchProducts(filters = {}) {
  let query = supabase
    .from('products')
    .select(`*, user_profiles(full_name, address)`)
    .eq('is_active', true)
    .gt('stock_qty', 0);

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// fetchProductById(id)
async function fetchProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(`*, user_profiles(full_name, phone, address)`)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// fetchFarmerProducts(farmerId) — for farmer dashboard
async function fetchFarmerProducts(farmerId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// createProduct(productData) — farmer only
async function createProduct(productData) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from('products')
    .insert({ ...productData, farmer_id: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// updateProduct(id, updates) — farmer only
async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// deleteProduct(id) — soft delete
async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

// uploadProductImage(file, farmerId) — returns public URL
async function uploadProductImage(file, farmerId) {
  const ext = file.name.split('.').pop();
  const path = `${farmerId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
```

---

### 6.3 `cart.js` — Full Rewrite

**Remove:** `cart` localStorage key and all array manipulation.

```javascript
// fetchCart() — returns cart items with product details
async function fetchCart() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('cart_items')
    .select(`*, products(id, name, price, unit, image_url, stock_qty, farmer_id)`)
    .eq('user_id', session.user.id);
  if (error) throw error;
  return data;
}

// addToCart(productId, quantity)
async function addToCart(productId, quantity = 1) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.href = '/login.html';

  const { error } = await supabase
    .from('cart_items')
    .upsert({
      user_id: session.user.id,
      product_id: productId,
      quantity
    }, { onConflict: 'user_id,product_id', ignoreDuplicates: false });
  // upsert with increment logic — use RPC for atomic increment if needed
  if (error) throw error;
}

// updateCartQty(cartItemId, quantity)
async function updateCartQty(cartItemId, quantity) {
  if (quantity < 1) return removeFromCart(cartItemId);
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId);
  if (error) throw error;
}

// removeFromCart(cartItemId)
async function removeFromCart(cartItemId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);
  if (error) throw error;
}

// clearCart(userId)
async function clearCart(userId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

// getCartCount() — for navbar badge
async function getCartCount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;
  const { count } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id);
  return count || 0;
}
```

**Cart quantity increment RPC** (add in Supabase SQL Editor):
```sql
CREATE OR REPLACE FUNCTION increment_cart_qty(p_user_id UUID, p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO cart_items (user_id, product_id, quantity)
  VALUES (p_user_id, p_product_id, p_qty)
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET quantity = cart_items.quantity + p_qty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Call it in `addToCart`:
```javascript
await supabase.rpc('increment_cart_qty', {
  p_user_id: session.user.id,
  p_product_id: productId,
  p_qty: quantity
});
```

---

### 6.4 Orders — Checkout Flow

**On checkout form submission:**

```javascript
async function placeOrder(shippingAddress, paymentMethod) {
  const { data: { session } } = await supabase.auth.getSession();
  const cartItems = await fetchCart();
  if (!cartItems.length) throw new Error('Cart is empty');

  const totalAmount = cartItems.reduce((sum, item) =>
    sum + (item.quantity * item.products.price), 0);

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: session.user.id,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      payment_method: paymentMethod
    })
    .select()
    .single();
  if (orderError) throw orderError;

  // Create order items
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    farmer_id: item.products.farmer_id,
    quantity: item.quantity,
    unit_price: item.products.price
  }));
  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  // Decrement stock
  for (const item of cartItems) {
    await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_qty: item.quantity
    });
  }

  // Clear cart
  await clearCart(session.user.id);
  return order;
}
```

**Stock decrement RPC:**
```sql
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products SET stock_qty = GREATEST(stock_qty - p_qty, 0)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Fetch orders for buyer:**
```javascript
async function fetchBuyerOrders() {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from('orders')
    .select(`*, order_items(*, products(name, image_url, unit))`)
    .eq('buyer_id', session.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
```

**Fetch orders for farmer (orders containing their products):**
```javascript
async function fetchFarmerOrders(farmerId) {
  const { data, error } = await supabase
    .from('order_items')
    .select(`*, orders(id, status, shipping_address, created_at), products(name, image_url)`)
    .eq('farmer_id', farmerId)
    .order('orders(created_at)', { ascending: false });
  if (error) throw error;
  return data;
}
```

---

### 6.5 `dashboard.js` — Analytics Queries

**Buyer Dashboard:**
```javascript
async function fetchBuyerStats(userId) {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, status, created_at')
    .eq('buyer_id', userId);

  return {
    totalOrders: orders.length,
    totalSpend: orders.reduce((s, o) => s + Number(o.total_amount), 0),
    activeOrders: orders.filter(o => !['delivered','cancelled'].includes(o.status)).length,
    recentOrders: orders.slice(0, 5)
  };
}
```

**Farmer Dashboard:**
```javascript
async function fetchFarmerStats(farmerId) {
  const { data: items } = await supabase
    .from('order_items')
    .select('quantity, unit_price, subtotal, orders(status)')
    .eq('farmer_id', farmerId);

  const { data: products } = await fetchFarmerProducts(farmerId);

  return {
    totalRevenue: items.reduce((s, i) => s + Number(i.subtotal), 0),
    totalSold: items.reduce((s, i) => s + i.quantity, 0),
    activeListings: products.filter(p => p.is_active && p.stock_qty > 0).length,
    totalListings: products.length
  };
}
```

---

### 6.6 Profile Management

```javascript
// updateProfile(updates)
async function updateProfile(updates) {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', session.user.id);
  if (error) throw error;
}
```

---

## 7. Page-Level Integration Checklist

Apply the following changes to each HTML page's inline or linked script:

| Page | Action |
|---|---|
| `login.html` | Call `login()`, redirect based on `profile.role` |
| `signup.html` | Call `signup()` with role selection; redirect to dashboard |
| `market.html` | Call `fetchProducts(filters)` on load + on filter/search change |
| `product-detail.html` | Call `fetchProductById(id)` from URL param |
| `cart.html` | Call `fetchCart()` on load; wire qty + remove buttons |
| `checkout.html` | Call `placeOrder()` on form submit |
| `orders.html` | Call `fetchBuyerOrders()` or `fetchFarmerOrders()` based on role |
| `dashboard.html` | Call `fetchBuyerStats()` or `fetchFarmerStats()` based on role |
| `profile.html` | Call `getCurrentUser()` to populate; call `updateProfile()` on save |
| `add-product.html` | Farmer only; call `createProduct()` + `uploadProductImage()` |

On every protected page, add at the top of the script:
```javascript
const currentUser = await protectRoute(); // or protectRoute(['farmer'])
```

---

## 8. Navbar Cart Badge

In `main.js`, after injecting navbar:
```javascript
const count = await getCartCount();
document.querySelector('.cart-badge').textContent = count > 0 ? count : '';
```

---

## 9. Error Handling Convention

All async calls must be wrapped in try/catch. On error, call the existing `showToast(message, 'error')` utility. Do not use `alert()`.

```javascript
try {
  await addToCart(productId);
  showToast('Added to cart!', 'success');
} catch (err) {
  showToast(err.message || 'Something went wrong', 'error');
}
```

---

## 10. Environment Variables

Create a `.env` file (never commit to git) and a `supabase.js` config:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

Since this is vanilla JS (no bundler), hardcode values in `supabase.js` directly but add it to `.gitignore`. Document in `README.md` that users must replace these values.

---

## 11. Migration: Remove localStorage Dependencies

Search codebase for the following keys and remove all read/write logic:
- `auth_user` → replaced by `supabase.auth.getSession()`
- `cart` → replaced by `cart_items` table
- `orders` → replaced by `orders` table
- `theme` → **KEEP** this one in localStorage (UI preference only, not user data)

---

## 12. Out of Scope

- Real payment gateway (Razorpay) integration
- Email notifications (can use Supabase Edge Functions + Resend in v2)
- Farmer inventory CSV import
- Real-time order status updates (Supabase Realtime — v2 feature)
- Admin panel / moderation

---

## 13. Deliverable Order for Windsurf

Execute in this sequence to avoid dependency issues:

1. Create `supabase.js` config file
2. Run all SQL schema migrations in Supabase SQL Editor
3. Run RLS policies SQL
4. Create `product-images` storage bucket + policies
5. Rewrite `auth.js`
6. Rewrite `products.js`
7. Rewrite `cart.js`
8. Add order functions to a new `orders.js` module
9. Rewrite `dashboard.js`
10. Update `main.js` with auth state listener + cart badge
11. Update each HTML page's script block per the checklist in §7
12. Seed demo data
13. Test full buyer flow: signup → browse → add to cart → checkout → view order
14. Test full farmer flow: signup → add product → view dashboard stats
