from fastapi import APIRouter
from . import (
    auth,
    auth_log,
    user,
    books,
    cart,
    orders,
    payment,
    reading,
    admin,
    admin_email,
    admin_enhanced,
    analytics,
    dashboard,
    orders_enhanced,
    reviews,
    shopping_enhanced,
    testing
)

# Create main router
api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(books.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(orders_enhanced.router)
api_router.include_router(payment.router)
api_router.include_router(reading.router)
api_router.include_router(admin.router)
api_router.include_router(admin_email.router)
api_router.include_router(admin_enhanced.router)
api_router.include_router(analytics.router)
api_router.include_router(dashboard.router)
api_router.include_router(reviews.router)
api_router.include_router(shopping_enhanced.router)
api_router.include_router(testing.router)