
> **Objective:**
> Completely **rebuild the eCommerce system from scratch** in a **Next.js** application for a **book platform** that supports both **eBooks** and **physical books**. Eliminate all errors and ensure a **smooth, production-grade checkout and order placement flow**.
>
> ### 🧠 Business Logic:
>
> * There are **two book types**:
>
>   1. **eBooks**:
>
>      * No shipping needed.
>      * Upon successful payment, eBooks are **automatically added to the user's digital library**.
>   2. **Physical Books**:
>
>      * Requires **shipping address**.
>      * Orders go through shipping stages (pending, shipped, delivered).
>
> ### 🧩 Requirements:
>
> 1. **Shopping Cart**:
>
>    * Supports both book types. Cart items does not clear until purchase is successful
>    * Intelligent logic to **skip shipping form** if cart contains only eBooks.
>    * Dynamic cart summary with subtotal, taxes (if any), and estimated delivery for physical books.	
> 2. **Checkout System**:
>
>    * Clean, modular React components (Next.js client/server components).
>    * Support for **** or **Paystack** integration (choose one or mock).
>    * If physical book is present:
>
>      * Require full shipping address and contact info.
>    * If only eBooks:
>
>      * Skip shipping, go straight to payment.
> 3. **Order Placement**:
>
>    * After payment:
>
>      * Create consistent `orders` table record.
>      * Add purchased **eBooks** to `user_library` immediately.
>      * Mark physical book orders for shipping.
> 4. **Admin Dashboard** (optional but ideal):
>
>    * Manage orders, view users’ libraries, inventory, shipping status.
> 5. **User Library Page**:
>
>    * Shows all purchased eBooks.
>    * Allow opening inside the platform using existing e-reader.
> 6. **Database Models**:
>    * Ensure relationships between `User`, `Book`, `Order`, `OrderItem`, `LibraryItem`, `ShippingDetail`, `CartItem`, etc., are **well-structured and in sync**.
>
> ### 🛠️ Tech Stack:
>
> * **Frontend:** Next.js (React 18+)
> * **Backend:** Next.js API routes or Next.js App Router (`app/api`) with server functions.
> * **Database:** PostgreSQL
> * **Authentication:** Auth.js (formerly NextAuth.js) 
> * **Payment Gateway:** Flutterwave  and bank transfer with proof of payment upload
>
> ### 🚫 Constraints:
>
> * Never fall back to local mock data or local DB.
> * All configuration and DB credentials must come from `.env.local`.
> * On network failure during DB access, **pause and retry** — do not switch to local fallback.
> * Eliminate any existing buggy logic or legacy code — start from scratch.
>
> ### ✅ Deliverables:
>
> * New, stable and modular eCommerce system
> * Clean and synced database schema
> * Fully working cart, checkout, and order system
> * API routes and frontend components for checkout flow
> * Server-side logic for payment + library management
> * Seamless experience across all book types

---

