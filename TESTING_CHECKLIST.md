# Security Fix Testing Checklist

Use this checklist after each phase to ensure nothing breaks.

---

## 🧪 **PHASE-BY-PHASE TESTING**

### After Phase 1 (Critical Fixes)

#### Template Manager Fix
- [ ] Send test email (welcome email)
- [ ] Send password reset email
- [ ] Send order confirmation email
- [ ] Verify email formatting is correct
- [ ] Check no eval/exec errors in logs

#### Credentials Rotation
- [ ] Application starts successfully
- [ ] Database connection works
- [ ] Redis connection works
- [ ] Email sending works (Resend)
- [ ] User login works
- [ ] JWT tokens are valid
- [ ] CSRF protection works

#### Hardcoded Credentials Fix
- [ ] Admin login works
- [ ] Admin functions accessible
- [ ] System settings can be updated

---

### After Phase 2 (SQL Injection Fixes)

Test each fixed endpoint:

#### Authentication
- [ ] User registration
- [ ] User login
- [ ] Password reset
- [ ] Token refresh

#### Books
- [ ] List books
- [ ] Search books
- [ ] Get book details
- [ ] Filter by category
- [ ] Filter by author

#### Cart & Orders
- [ ] Add to cart
- [ ] Update cart quantity
- [ ] Remove from cart
- [ ] Checkout process
- [ ] View orders
- [ ] Order details

#### Admin Functions
- [ ] User management
- [ ] Book management
- [ ] Order management
- [ ] Email templates
- [ ] System settings
- [ ] Analytics/reports

#### Reading Features
- [ ] Start reading session
- [ ] Save reading progress
- [ ] View reading history
- [ ] Reading analytics

---

### After Phase 3 (File Upload Security)

#### Image Uploads
- [ ] Upload valid JPG image
- [ ] Upload valid PNG image
- [ ] Upload valid WEBP image
- [ ] Try upload PHP file (should fail)
- [ ] Try upload with .jpg.php extension (should fail)
- [ ] Try upload oversized file (should fail)
- [ ] Verify uploaded images display correctly

#### eBook Uploads
- [ ] Upload valid EPUB file
- [ ] Upload valid PDF file
- [ ] Try upload EXE file (should fail)
- [ ] Try upload with fake extension (should fail)
- [ ] Verify uploaded books are readable

#### Cover Images
- [ ] Upload book cover
- [ ] Update book cover
- [ ] Delete book cover
- [ ] Verify covers display on book list

---

### After Phase 4 (Path Traversal Fixes)

#### File Access
- [ ] Access valid book file
- [ ] Access valid image
- [ ] Try access ../../../etc/passwd (should fail)
- [ ] Try access with encoded path (should fail)
- [ ] Try access with double encoding (should fail)

#### Template Access
- [ ] Email templates load correctly
- [ ] Try access system files via template (should fail)

#### eReader
- [ ] Open eBook in reader
- [ ] Navigate chapters
- [ ] Try access files outside book directory (should fail)

---

### After Phase 5 (XSS Protection)

#### Input Fields
Test with: `<script>alert('XSS')</script>`

- [ ] Book title input
- [ ] Book description input
- [ ] Review text input
- [ ] Comment input
- [ ] User profile fields
- [ ] Search queries
- [ ] Contact form

Verify:
- [ ] Script tags are escaped/removed
- [ ] Content displays safely
- [ ] No JavaScript execution
- [ ] HTML entities are encoded

---

### After Phase 6 (Secure Hashing)

- [ ] File uploads still work
- [ ] File integrity checks work
- [ ] Duplicate detection works
- [ ] No performance degradation

---

### After Phase 7 (XXE Protection)

#### EPUB Processing
- [ ] Upload normal EPUB
- [ ] EPUB content displays correctly
- [ ] Try EPUB with XXE payload (should fail)
- [ ] Try EPUB with external entities (should fail)

---

### After Phase 8 (HTTPS Enforcement)

- [ ] HTTP requests redirect to HTTPS
- [ ] HTTPS requests work normally
- [ ] API calls use HTTPS
- [ ] Images load over HTTPS
- [ ] No mixed content warnings
- [ ] Localhost still works (for development)

---

### After Phase 9 (CSRF Protection)

#### State-Changing Operations
- [ ] Login works
- [ ] Logout works
- [ ] Add to cart works
- [ ] Update profile works
- [ ] Delete items works
- [ ] Admin actions work
- [ ] Try CSRF attack (should fail)

---

### After Phase 10 (Rate Limiting)

- [ ] Normal requests work
- [ ] Rapid requests get rate limited
- [ ] Rate limit resets after time
- [ ] Error message is clear
- [ ] Legitimate users not affected

Test:
```bash
# Make 100 rapid requests
for i in {1..100}; do
  curl https://api.readnwin.com/api/books &
done
```

---

### After Phase 11 (Security Headers)

Check headers with browser DevTools:
- [ ] Strict-Transport-Security present
- [ ] Content-Security-Policy present
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy present

---

### After Phase 12 (Timezone Fixes)

- [ ] Timestamps display correctly
- [ ] Order dates are accurate
- [ ] Reading session times correct
- [ ] Email timestamps correct
- [ ] Analytics dates correct

---

### After Phase 13 (Resource Leak Fixes)

Monitor under load:
- [ ] File descriptors don't increase indefinitely
- [ ] Memory usage stable
- [ ] No "too many open files" errors

---

## 🔍 **COMPREHENSIVE TESTING**

### User Flows

#### Guest User Flow
1. [ ] Browse books
2. [ ] View book details
3. [ ] Add books to cart
4. [ ] View cart
5. [ ] Proceed to checkout
6. [ ] Register account
7. [ ] Complete purchase

#### Registered User Flow
1. [ ] Login
2. [ ] Browse books
3. [ ] Add to cart
4. [ ] Checkout
5. [ ] View orders
6. [ ] Access library
7. [ ] Read eBook
8. [ ] Leave review
9. [ ] Update profile
10. [ ] Logout

#### Admin Flow
1. [ ] Admin login
2. [ ] View dashboard
3. [ ] Manage users
4. [ ] Manage books
5. [ ] Manage orders
6. [ ] View analytics
7. [ ] Update settings
8. [ ] Send emails

---

## 🛡️ **SECURITY TESTING**

### Manual Security Tests

#### SQL Injection
Test on all input fields:
```
' OR '1'='1
'; DROP TABLE users; --
1' UNION SELECT * FROM users--
```

Verify:
- [ ] No SQL errors
- [ ] No data leakage
- [ ] Queries are parameterized

#### XSS
Test on all input fields:
```
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
```

Verify:
- [ ] Scripts don't execute
- [ ] Content is escaped
- [ ] No JavaScript in attributes

#### Path Traversal
Test on file operations:
```
../../../etc/passwd
..%2F..%2F..%2Fetc%2Fpasswd
....//....//....//etc/passwd
```

Verify:
- [ ] Access denied
- [ ] No system files exposed
- [ ] Proper error messages

#### File Upload
Test with:
- [ ] PHP file
- [ ] EXE file
- [ ] File with double extension (.jpg.php)
- [ ] Oversized file
- [ ] File with malicious content

Verify:
- [ ] Only allowed types accepted
- [ ] Content validation works
- [ ] Files stored securely

#### Authentication
- [ ] Brute force protection works
- [ ] Session timeout works
- [ ] Token expiration works
- [ ] Password requirements enforced

---

## 📊 **PERFORMANCE TESTING**

### Load Testing
```bash
# Install Apache Bench
# Test API endpoint
ab -n 1000 -c 10 https://api.readnwin.com/api/books

# Test with authentication
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" https://api.readnwin.com/api/orders
```

Verify:
- [ ] Response times acceptable
- [ ] No errors under load
- [ ] Rate limiting works
- [ ] Database performs well

---

## 🔧 **AUTOMATED TESTING**

### Run Test Suite
```bash
cd readnwin-backend
pytest tests/ -v

cd ../frontend
npm test
```

### Security Scan
```bash
# Install OWASP ZAP
# Run automated scan
zap-cli quick-scan https://readnwin.com

# Or use online tools:
# - https://observatory.mozilla.org/
# - https://securityheaders.com/
```

---

## ✅ **FINAL CHECKLIST**

Before deploying to production:

### Code Quality
- [ ] All tests passing
- [ ] No console errors
- [ ] No console warnings
- [ ] Code reviewed
- [ ] Documentation updated

### Security
- [ ] All critical issues fixed
- [ ] All high issues fixed
- [ ] Security scan passed
- [ ] Penetration test passed
- [ ] Credentials rotated

### Performance
- [ ] Load test passed
- [ ] Response times acceptable
- [ ] Database optimized
- [ ] Caching working

### Functionality
- [ ] All user flows work
- [ ] All admin functions work
- [ ] Payments processing
- [ ] Emails sending
- [ ] Files uploading

### Monitoring
- [ ] Error logging configured
- [ ] Security logging configured
- [ ] Performance monitoring setup
- [ ] Alerts configured

### Backup
- [ ] Database backed up
- [ ] Code backed up
- [ ] Rollback plan ready
- [ ] Emergency contacts listed

---

## 📝 **TEST RESULTS TEMPLATE**

```
Date: ___________
Phase: ___________
Tester: ___________

Tests Passed: ___ / ___
Tests Failed: ___

Failed Tests:
1. ___________
2. ___________

Issues Found:
1. ___________
2. ___________

Notes:
___________

Sign-off: ___________
```

---

## 🆘 **ISSUE TRACKING**

When you find an issue:

1. **Document it**:
   - What were you testing?
   - What did you expect?
   - What actually happened?
   - Steps to reproduce

2. **Categorize it**:
   - Severity: Critical/High/Medium/Low
   - Type: Bug/Security/Performance
   - Component: Backend/Frontend/Database

3. **Fix it**:
   - Create fix
   - Test fix
   - Document fix
   - Retest original issue

4. **Verify**:
   - Run full test suite
   - Check for regressions
   - Update documentation

---

**Remember**: It's better to find issues during testing than in production!
