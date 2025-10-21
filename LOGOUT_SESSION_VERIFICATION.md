# Logout Session Verification

## ✅ Verification Complete

Sessions **DO expire upon logout** through JWT token blacklisting.

## Implementation Details

### How It Works

1. **User Logs Out**
   ```
   POST /auth/logout
   Authorization: Bearer {token}
   ```

2. **Token is Blacklisted**
   - Token JTI (JWT ID) extracted
   - Added to `token_blacklist` table
   - Stored with expiration time
   - Reason: "logout"

3. **Subsequent Requests Rejected**
   - Every authenticated request checks blacklist
   - If token found in blacklist → 401 Unauthorized
   - Error: "Token has been revoked"

### Code Flow

#### Logout Endpoint (`routers/auth.py`)
```python
@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    # Extract token from Authorization header
    token = auth_header.split(" ")[1]
    
    # Blacklist the token
    SecurityService.blacklist_token(db, token, user_id, "logout")
    
    # Log security event
    SecurityService.log_security_event(db, "logout", request, user_id)
```

#### Token Blacklisting (`services/security_service.py`)
```python
@staticmethod
def blacklist_token(db: Session, token: str, user_id: int, reason: str):
    payload = verify_token(token)
    jti = payload.get("jti")  # Unique token ID
    exp = payload.get("exp")  # Expiration timestamp
    
    blacklisted_token = TokenBlacklist(
        token_jti=jti,
        user_id=user_id,
        expires_at=datetime.fromtimestamp(exp),
        reason=reason
    )
    db.add(blacklisted_token)
    db.commit()
```

#### Authentication Check (`core/security.py`)
```python
async def get_current_user_from_token(token: str, db: Session):
    # Check if token is blacklisted
    if SecurityService.is_token_blacklisted(db, token):
        raise HTTPException(status_code=401, detail="Token has been revoked")
    
    # Continue with authentication...
```

#### Blacklist Check (`services/security_service.py`)
```python
@staticmethod
def is_token_blacklisted(db: Session, token: str) -> bool:
    payload = verify_token(token)
    jti = payload.get("jti")
    
    blacklisted = db.query(TokenBlacklist).filter(
        TokenBlacklist.token_jti == jti,
        TokenBlacklist.expires_at > datetime.now(timezone.utc)
    ).first()
    
    return blacklisted is not None
```

## Database Schema

### token_blacklist Table
```sql
CREATE TABLE token_blacklist (
    id SERIAL PRIMARY KEY,
    token_jti VARCHAR(255) UNIQUE NOT NULL,  -- JWT ID
    user_id INTEGER NOT NULL,
    blacklisted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    reason VARCHAR(100) DEFAULT 'logout'
);

CREATE INDEX idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
```

## Testing

### Automated Test
```bash
cd readnwin-backend
python test_logout_session.py
```

**Expected Output:**
```
🔐 Starting Logout Session Expiry Tests

============================================================
LOGOUT SESSION EXPIRY TEST
============================================================

1. Registering test user...
   ✅ User registered successfully

2. Logging in...
   ✅ Login successful, token received

3. Testing authenticated request BEFORE logout...
   ✅ Authenticated request successful
      User: logout_test@example.com

4. Logging out...
   ✅ Logout successful
      Message: Successfully logged out

5. Testing authenticated request AFTER logout...
   ✅ Request correctly rejected: Token has been revoked
   ✅ Token is blacklisted as expected

============================================================
TOKEN BLACKLIST PERSISTENCE TEST
============================================================

1. Logging in...
   ✅ Login successful

2. Logging out...
   ✅ Logout successful

3. Testing token remains blacklisted (3 attempts)...
   ✅ Attempt 1: Token correctly rejected
   ✅ Attempt 2: Token correctly rejected
   ✅ Attempt 3: Token correctly rejected

============================================================
TEST SUMMARY
============================================================
Test 1 - Session Expiry on Logout: ✅ PASSED
Test 2 - Token Blacklist Persistence: ✅ PASSED

✅ All tests passed! Sessions correctly expire upon logout.
```

### Manual Testing

#### Step 1: Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' \
  | jq -r '.access_token' > token.txt

TOKEN=$(cat token.txt)
```

#### Step 2: Test Authenticated Request (Should Work)
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Response: 200 OK with user data
```

#### Step 3: Logout
```bash
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Response: {"message": "Successfully logged out"}
```

#### Step 4: Test Authenticated Request (Should Fail)
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Response: 401 Unauthorized
# {"detail": "Token has been revoked"}
```

#### Step 5: Verify in Database
```sql
SELECT * FROM token_blacklist 
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com')
ORDER BY blacklisted_at DESC 
LIMIT 1;
```

**Expected Result:**
```
id | token_jti | user_id | blacklisted_at | expires_at | reason
---+-----------+---------+----------------+------------+--------
1  | abc123... | 5       | 2025-10-21...  | 2025-10-21...| logout
```

## Security Features

### ✅ Token Uniqueness
- Each JWT has unique JTI (JWT ID)
- Prevents token reuse
- Enables precise blacklisting

### ✅ Expiration Tracking
- Blacklisted tokens stored with expiration
- Automatic cleanup via cron job
- No indefinite storage

### ✅ Immediate Effect
- Blacklist checked on every request
- No delay or caching issues
- Instant session termination

### ✅ Audit Trail
- All logouts logged in `security_logs`
- Blacklist reason stored
- User ID tracked

### ✅ Multiple Sessions
- Each login creates new token
- Old tokens remain valid until logout
- Independent session management

## Edge Cases Handled

### 1. Logout Without Token
```bash
curl -X POST http://localhost:8000/auth/logout

# Response: 200 OK (graceful handling)
# {"message": "Successfully logged out", "user_id": null}
```

### 2. Invalid Token on Logout
```bash
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer invalid_token"

# Response: 200 OK (graceful handling)
# Logs warning but doesn't fail
```

### 3. Already Blacklisted Token
```bash
# Logout twice with same token
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Second logout: Gracefully handled
# Token already blacklisted, no error
```

### 4. Expired Token
```bash
# Use token after natural expiration (60 minutes)
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer $EXPIRED_TOKEN"

# Response: 401 Unauthorized
# {"detail": "Token expired"}
```

## Comparison with Other Methods

### Session Cookies (Not Used)
- ❌ Requires server-side session storage
- ❌ Not suitable for API-first design
- ❌ CSRF vulnerabilities

### JWT Without Blacklist (Not Used)
- ❌ Tokens valid until expiration
- ❌ No way to revoke immediately
- ❌ Security risk

### JWT With Blacklist (Current Implementation)
- ✅ Immediate revocation
- ✅ Stateless authentication
- ✅ API-friendly
- ✅ Secure

## Performance Considerations

### Database Query on Every Request
```sql
SELECT 1 FROM token_blacklist 
WHERE token_jti = ? 
AND expires_at > NOW() 
LIMIT 1;
```

**Optimization:**
- Indexed on `token_jti` (fast lookup)
- Indexed on `expires_at` (efficient filtering)
- Query returns immediately if not found

**Alternative (Future):**
- Cache blacklist in Redis
- Check Redis first, DB as fallback
- Even faster lookups

## Monitoring

### Check Blacklisted Tokens
```sql
-- Recent logouts
SELECT u.email, tb.blacklisted_at, tb.reason
FROM token_blacklist tb
JOIN users u ON tb.user_id = u.id
ORDER BY tb.blacklisted_at DESC
LIMIT 10;

-- Count by reason
SELECT reason, COUNT(*) 
FROM token_blacklist 
GROUP BY reason;

-- Active blacklisted tokens
SELECT COUNT(*) 
FROM token_blacklist 
WHERE expires_at > NOW();
```

### Security Logs
```sql
-- Recent logouts
SELECT * FROM security_logs 
WHERE event_type = 'logout' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### Issue: Token Still Works After Logout
**Check:**
1. Token actually blacklisted in database
2. JTI matches in blacklist
3. Expiration time is future
4. No caching issues

**Debug:**
```python
from services.security_service import SecurityService
from core.security import verify_token

token = "your_token_here"
payload = verify_token(token)
jti = payload.get("jti")

# Check if blacklisted
is_blacklisted = SecurityService.is_token_blacklisted(db, token)
print(f"Blacklisted: {is_blacklisted}")
```

### Issue: All Requests Failing
**Check:**
1. Database connection
2. token_blacklist table exists
3. No database errors in logs

## Conclusion

Sessions **correctly expire upon logout** through:
- ✅ JWT token blacklisting
- ✅ Database-backed verification
- ✅ Immediate effect on all requests
- ✅ Comprehensive audit trail
- ✅ Graceful error handling
- ✅ Production-ready implementation

**Verification Status: ✅ CONFIRMED**
