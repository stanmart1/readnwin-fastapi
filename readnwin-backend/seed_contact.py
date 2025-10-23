from core.database import SessionLocal
from models.contact_settings import ContactMethod, ContactFAQ, OfficeInfo, ContactSubject

db = SessionLocal()

# Clear existing data
db.query(ContactMethod).delete()
db.query(ContactFAQ).delete()
db.query(OfficeInfo).delete()
db.query(ContactSubject).delete()

# Contact Methods
methods = [
    ContactMethod(id="email", icon="ri-mail-line", title="Email Support", description="Get help via email", contact="support@readnwin.com", action="mailto:support@readnwin.com", is_active=True),
    ContactMethod(id="phone", icon="ri-phone-line", title="Phone Support", description="Call us directly", contact="+1 (555) 123-4567", action="tel:+15551234567", is_active=True),
    ContactMethod(id="address", icon="ri-map-pin-line", title="Visit Us", description="Come to our office", contact="123 Book Street, Reading City", action="#", is_active=True),
]
db.add_all(methods)

# FAQs
faqs = [
    ContactFAQ(question="How do I create an account?", answer="Click the 'Sign Up' button and fill in your details. You'll receive a confirmation email to activate your account.", is_active=True, order_index=1),
    ContactFAQ(question="What payment methods do you accept?", answer="We accept all major credit cards, PayPal, and bank transfers through our secure payment partners.", is_active=True, order_index=2),
    ContactFAQ(question="How do I download my purchased books?", answer="After purchase, go to your library and click the download button next to each book.", is_active=True, order_index=3),
]
db.add_all(faqs)

# Office Info
office = OfficeInfo(
    address="123 Book Street, Reading City, RC 12345",
    hours="Monday - Friday: 9:00 AM - 6:00 PM",
    parking="Free parking available in our building",
    is_active=True
)
db.add(office)

# Contact Subjects
subjects = [
    ContactSubject(name="General Inquiry", is_active=True, order_index=1),
    ContactSubject(name="Technical Support", is_active=True, order_index=2),
    ContactSubject(name="Billing Question", is_active=True, order_index=3),
    ContactSubject(name="Book Request", is_active=True, order_index=4),
]
db.add_all(subjects)

db.commit()
print("Contact data seeded successfully!")
db.close()
