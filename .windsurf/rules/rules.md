---
trigger: always_on
---
# RULES — Farmer Marketplace: Supabase Integration
**For:** Windsurf Agent  
**Enforce these rules on every file touched. No exceptions.**

---

## 1. Scope & Touch Policy

- **Only modify JS files and HTML script blocks.** Do not touch any `.css` files, HTML structure, or class names.
- **Do not refactor working frontend logic.** If a function renders product cards correctly, leave the render logic alone — only replace the data-fetching part.
- **Do not introduce any new libraries or CDN imports** except the Supabase JS SDK (`@supabase/supabase-js@2`) which is already declared in the PRD.
- **Do not convert the project to a framework** (React, Vue, etc.). This stays Vanilla JS multi-page.
- **Do not rename existing functions** that are called across HTML pages. Wrap or extend them; don't break existing call sites.

---

## 2. File Creation Rules

- New files go in the root JS folder alongside existing modules.
- Only create these new files: `supabase.js`, `orders.js`. Everything else is a rewrite of an existing file.
- Every new or rewritten JS file must start with this header comment:
  ```javascript
  // ============================================================
  // [filename].js — Farmer Marketplace
  // Supabase backend integration
  // ============================================================
  ```
- Do not create separate files for individual features (e.g., no `auth-helpers.js`, `cart-utils.js`). Keep the module structure flat as it already is.

---

## 3. Supabase Client Rules

- **One client instance, globally.** `supabase.js` creates the client once via `window.supabase.createClient()`. Every other module uses the global `supabase` variable. Never call `createClient()` again in any other file.
- **Always `await supabase.auth.getSession()`** to get the current session. Never cache the session object in a variable outside a function — sessions can expire.
- **Never use `supabase.auth.getUser()`** for route protection. Use `getSession()` instead — it's synchronous against the local token and faster.
- **Always destructure both `data` and `error`** from every Supabase call:
  ```javascript
  // ✅ CORRECT
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;

  // ❌ WRONG — silently swallows errors
  const { data } = await supabase.from('products').select('*');
  ```
- **Never chain `.then()` on Supabase calls.** Always use `async/await`.
- **Always specify exact columns in `.select()`** — never use `.select('*')` in production queries except for single-row fetches by primary key. This keeps payloads lean.

---

## 4. Security Rules

- **Never hardcode the service role key anywhere in frontend JS.** Only the `anon` key goes in `supabase.js`.
- **Never bypass RLS** by using the service role key client-side. All data access must work through RLS policies.
- **Never trust `role` from the client.** Role checks for UI rendering (show/hide farmer controls) are fine. But actual data write permissions must be enforced by RLS on the server — the frontend role check is cosmetic only.
- **Never store passwords, tokens, or PII in localStorage.** The only localStorage key the codebase may use after this integration is `theme`.
- **Never expose Supabase internal error objects to the user.** Always map to a human-readable message:
  ```javascript
  // ✅ CORRECT
  catch (err) {
    const msg = err.message.includes('unique') ? 'Item already in cart.' : 'Something went wrong.';
    showToast(msg, 'error');
  }
  // ❌ WRONG
  catch (err) { showToast(err.message, 'error'); } // may leak DB internals
  ```
- **Validate stock before adding to cart** — check `stock_qty > 0` on the product before calling `addToCart()`. Do not rely solely on the DB constraint.

---

## 5. Async / Error Handling Rules

- **Every async function that touches Supabase must be wrapped in try/catch** at the call site (not inside the function itself). Functions throw; pages catch.
- **Always show a loading state** before any async call and clear it in a `finally` block. Use the existing `showLoader()` / `hideLoader()` from `utils.js`.
  ```javascript
  showLoader();
  try {
    const products = await fetchProducts();
    renderProducts(products);
  } catch (err) {
    showToast(mapError(err), 'error');
  } finally {
    hideLoader();
  }
  ```
- **Never use `alert()` or `console.error()` as user-facing error handling.** All errors go through `showToast()`.
- **Always `return` after a redirect** to prevent code below from running:
  ```javascript
  // ✅ CORRECT
  if (!session) return window.location.href = '/login.html';

  // ❌ WRONG — code below still runs
  if (!session) window.location.href = '/login.html';
  renderDashboard(); // runs anyway
  ```

---

## 6. Query Rules

- **Always add `.order()` to list queries.** Default to `created_at` descending unless a different order makes semantic sense.
- **Always add `.limit()` to list queries in dashboards.** Use `limit(10)` for recent activity lists, `limit(50)` for full product grids.
- **Use `.single()` only when fetching by primary key** or when the result is guaranteed to be exactly one row. Never use `.single()` on filtered queries that might return zero rows — use `maybeSingle()` instead.
- **Use `.count('exact', { head: true })`** for count-only queries (e.g., cart badge). Never fetch full rows just to count them.
- **For paginated product grids**, use `.range(from, to)`:
  ```javascript
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  ```
- **Never run N+1 queries.** Use Supabase's PostgREST joins (nested select syntax) to fetch related data in one call. Example: `select('*, products(name, price)')` not a loop of individual product fetches.

---

## 7. Auth Flow Rules

- **`protectRoute()` must be the first `await` call** in every page script that requires a logged-in user.
- **Redirect destination after login must be role-aware:**
  - `role === 'farmer'` → `/dashboard.html` (farmer view)
  - `role === 'buyer'` → `/market.html`
- **The signup form must enforce role selection.** Do not default to a role silently — the user must explicitly pick Buyer or Farmer.
- **On auth errors during signup** (e.g., email already exists), surface the specific Supabase error code — `email_already_exists`, `weak_password` — and show appropriate messages. Map error codes to messages in a `const AUTH_ERRORS` object in `auth.js`.
- **`onAuthStateChange` listener** must be registered in `main.js` so it applies globally, not per-page.

---

## 8. Checkout / Order Rules

- **Checkout is an atomic operation.** Order creation, order items insert, stock decrement, and cart clear must all succeed or none of them should be visible to the user. Use sequential awaits and roll back (cancel/delete the order) if any step fails:
  ```javascript
  // If order_items insert fails, delete the order before throwing
  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id);
    throw itemsError;
  }
  ```
- **Never redirect to a confirmation page until all steps succeed.** The loader must stay active until the entire `placeOrder()` resolves.
- **Always re-validate cart items exist and have stock** at the start of `placeOrder()`, not just when adding to cart. Stock could have changed between add-to-cart and checkout.

---

## 9. Farmer Product Management Rules

- **Image upload must happen before the product insert.** Get the public URL from Storage first, then pass it as `image_url` to `createProduct()`. Never create a product row without an image URL if the user uploaded a file.
- **Always validate file type and size client-side** before calling `uploadProductImage()`:
  - Allowed: `image/jpeg`, `image/png`, `image/webp`
  - Max size: 5MB
  - Show a toast and return early if validation fails — do not call the upload function.
- **Soft delete only.** Never hard-delete a product (`DELETE FROM products`). Always set `is_active = false`. This preserves order history integrity.
- **After creating or updating a product**, re-fetch the farmer's product list and re-render — do not optimistically mutate the DOM.

---

## 10. UI / State Rules

- **After every successful mutation** (add to cart, place order, update profile, create product), re-fetch the relevant data and re-render. Do not manually patch DOM state.
- **Cart badge must update** after every `addToCart()`, `removeFromCart()`, `updateCartQty()`, and `placeOrder()` call. Always call `getCartCount()` and update the badge element after these operations.
- **Do not disable the entire page** while loading. Only disable the specific button or input being acted on. Use `button.disabled = true` and re-enable in `finally`.
- **Preserve existing toast types** (`success`, `error`, `warning`, `info`) — do not invent new ones.

---

## 11. Code Style Rules

- **No `var`.** Use `const` by default, `let` only when reassignment is needed.
- **No anonymous arrow function soup.** Name your async functions. Easier to debug stack traces.
- **No nested ternaries.** Use if/else or early returns.
- **No magic strings for categories or statuses.** Define them as constants at the top of the relevant module:
  ```javascript
  const CATEGORIES = ['vegetables', 'fruits', 'dairy', 'grains', 'herbs'];
  const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  ```
- **No inline SQL or raw Supabase filter strings** scattered across page scripts. All DB calls go inside the JS module files (`auth.js`, `products.js`, `cart.js`, `orders.js`, `dashboard.js`). Page scripts call module functions only.
- **Function names must be descriptive and verb-first:** `fetchCart`, `addToCart`, `placeOrder`, `updateProfile`, `uploadProductImage`.

---

## 12. Testing Checklist (Run Before Marking Complete)

Run each scenario manually in the browser before declaring a module done.

### Auth
- [ ] Signup as Buyer → redirects to `/market.html`
- [ ] Signup as Farmer → redirects to `/dashboard.html`
- [ ] Signup with existing email → shows specific error toast
- [ ] Login with wrong password → shows error toast (not a redirect)
- [ ] Logout → session cleared, redirected to `/login.html`
- [ ] Direct URL to `/dashboard.html` while logged out → redirected to `/login.html`
- [ ] Direct URL to `/add-product.html` as Buyer → redirected to `/dashboard.html`

### Products
- [ ] Market page loads and renders products from Supabase
- [ ] Category filter works
- [ ] Search filters results in real-time (debounced, not on every keypress)
- [ ] Product detail page shows correct product from URL param
- [ ] Out-of-stock products do not appear in the market grid

### Cart
- [ ] Add to cart increments count in navbar badge
- [ ] Adding same product twice increments quantity (does not duplicate row)
- [ ] Remove from cart decrements badge
- [ ] Cart persists across page refresh (fetched from Supabase, not localStorage)
- [ ] Empty cart shows empty state UI

### Checkout / Orders
- [ ] Checkout with empty cart shows error toast (cannot proceed)
- [ ] Successful order clears cart and redirects to order confirmation or orders page
- [ ] Order appears in buyer's orders list
- [ ] Stock quantity decremented correctly after order
- [ ] Farmer can see order items for their products in their dashboard

### Farmer
- [ ] Farmer can create a new product with image
- [ ] Invalid file type shows error toast
- [ ] File over 5MB shows error toast
- [ ] Farmer can soft-delete a product (disappears from market, stays in order history)
- [ ] Farmer dashboard shows correct revenue and listing count

### Profile
- [ ] Profile page pre-fills with current user data
- [ ] Saving profile updates the `user_profiles` row in Supabase

---

## 13. What Not To Do (Hard Stops)

- ❌ Do not call `supabase.auth.admin.*` from any frontend file.
- ❌ Do not use `service_role` key anywhere in this project.
- ❌ Do not use `localStorage.setItem('cart', ...)` or `localStorage.setItem('orders', ...)` anywhere after this integration.
- ❌ Do not use `fetch()` or `XMLHttpRequest` to call Supabase — use the SDK only.
- ❌ Do not skip the `if (error) throw error` check after any Supabase call.
- ❌ Do not use `eval()` or `innerHTML` with unsanitized user data.
- ❌ Do not add `console.log()` statements in production paths — use them only inside `// DEBUG:` blocks that are easy to strip.
- ❌ Do not assume a Supabase RPC returns data in a specific shape without checking `data` and `error` first.
- ❌ Do not let a page script contain raw `.from().select()` calls — all DB access goes through module functions.


Follow farmer-marketplace-supabase-integration.md for the integration guide.
Follow all the rules strictly.
