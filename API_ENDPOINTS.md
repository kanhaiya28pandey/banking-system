# 🚀 BANKING SYSTEM API DOCUMENTATION

## Complete API Endpoints - All Controllers

---

## 🔑 AUTHENTICATION

### Login (Public)
```
POST /auth/login
Body: {
  "username": "string",
  "password": "string"
}
Response: {
  "success": true,
  "token": "JWT_TOKEN",
  "user": { ... }
}
```

---

## 🛡️ ADMIN CONTROLLER
**Base URL:** `/api/admin`
**Required Role:** ADMIN
**All endpoints require JWT token with ADMIN role**

### 1. Get All Users (with filters)
```
GET /users?page=0&size=20&role=USER&status=ACTIVE
Response: {
  "success": true,
  "count": 10,
  "data": [ ... ]
}
```

### 2. Get User Details
```
GET /users/{userId}
Response: {
  "success": true,
  "data": { id, username, email, role, status, branch, ... }
}
```

### 3. Assign Role to User
```
POST /users/{userId}/assign-role
Body: { "roleName": "MANAGER|EMPLOYEE|USER" }
Response: { "success": true, "message": "Role assigned successfully" }
✅ Logs: ROLE_ASSIGNED
✅ Notification: Sent to user
```

### 4. Block User Account
```
POST /users/{userId}/block
Body: { "reason": "string describing why account is blocked" }
Response: { "success": true }
✅ Logs: ACCOUNT_BLOCKED
✅ Status Changed: ACTIVE → BLOCKED
✅ Notification: Sent to user
```

### 5. Unblock User Account
```
POST /users/{userId}/unblock
Response: { "success": true }
✅ Logs: ACCOUNT_UNBLOCKED
✅ Status Changed: BLOCKED → ACTIVE
✅ Notification: Sent to user
```

### 6. View Audit Logs
```
GET /audit-logs?action=TRANSFER_COMPLETED&userId=5&limit=50
Response: {
  "success": true,
  "count": 20,
  "data": [ { id, user, action, entity, ip, userAgent, timestamp, ... } ]
}
```

### 7. View Suspicious Activities
```
GET /suspicious-activities?severity=CRITICAL&resolved=false
Response: {
  "success": true,
  "count": 5,
  "data": [ { id, user, activityType, severity, description, ... } ]
}
```

### 8. Mark Suspicious Activity as Resolved
```
POST /suspicious-activities/{activityId}/resolve
Response: { "success": true }
✅ Status Changed: unresolved → resolved
```

### 9. Create Branch
```
POST /branches
Body: { "name": "string", "location": "string" }
Response: {
  "success": true,
  "data": { id, name, location }
}
✅ Logs: BRANCH_CREATED
```

### 10. Dashboard Statistics
```
GET /dashboard/stats
Response: {
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalBranches": 5,
    "unresolvedSuspiciousActivities": 2
  }
}
```

---

## 👔 MANAGER CONTROLLER
**Base URL:** `/api/manager`
**Required Role:** MANAGER or ADMIN
**Manage approvals and branch operations**

### 1. Get Pending Approvals
```
GET /approvals/pending
Response: {
  "success": true,
  "count": 3,
  "data": [ 
    {
      id, transactionId, amount, requestedBy, status, 
      expiresAt, actionType, ...
    }
  ]
}
```

### 2. Approve Transaction
```
POST /approvals/{approvalId}/approve
Response: { "success": true }
✅ Logs: APPROVAL_APPROVED
✅ Status: PENDING → APPROVED
✅ Transaction: PENDING → COMPLETED (if OTP already verified)
✅ Notification: Sent to requester
```

### 3. Reject Transaction
```
POST /approvals/{approvalId}/reject
Body: { "reason": "string" }
Response: { "success": true }
✅ Logs: APPROVAL_REJECTED
✅ Status: PENDING → REJECTED
✅ Notification: Sent to requester with reason
```

### 4. Freeze User Account (Suspicious Activity)
```
POST /accounts/{userId}/freeze
Body: { "reason": "string - reason for freezing" }
Response: { "success": true }
✅ Logs: ACCOUNT_FROZEN
✅ Status: ACTIVE → FROZEN
✅ Notification: Sent to user
```

### 5. Unfreeze User Account
```
POST /accounts/{userId}/unfreeze
Response: { "success": true }
✅ Logs: ACCOUNT_UNFROZEN
✅ Status: FROZEN → ACTIVE
✅ Notification: Sent to user
```

### 6. View Branch Users
```
GET /branch/users
Response: {
  "success": true,
  "count": 45,
  "data": [ users in manager's branch ]
}
```

---

## 👨‍💼 EMPLOYEE CONTROLLER
**Base URL:** `/api/employee`
**Required Role:** EMPLOYEE or ADMIN
**Handle daily banking operations**

### 1. Get Assigned Users
```
GET /assigned-users
Response: {
  "success": true,
  "count": 30,
  "data": [ users in employee's branch ]
}
```

### 2. Create New User (Customer)
```
POST /users/create
Body: {
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass123"
}
Response: {
  "success": true,
  "data": { "userId": 123, "username": "john_doe" }
}
✅ Logs: USER_CREATED
✅ Role: USER
✅ Branch: Same as employee's branch
✅ Notification: Sent to new user
```

### 3. Update User KYC Information
```
POST /users/{userId}/kyc-update
Body: {
  "fullName": "John Doe",
  "phone": "9876543210",
  "address": "123 Main St, City",
  "kycStatus": "VERIFIED"
}
Response: { "success": true }
✅ Logs: KYC_UPDATED (with old/new values)
✅ Notification: Sent to user
```

### 4. Request Manager Approval
```
POST /approvals/request
Body: {
  "actionType": "ACCOUNT_CLOSURE|SPECIAL_REQUEST",
  "targetUserId": 123,
  "reason": "User requested account closure"
}
Response: { "success": true }
✅ Logs: APPROVAL_REQUESTED
✅ Notification: Sent to branch manager
```

### 5. Get User Details (KYC View)
```
GET /users/{userId}/details
Response: {
  "success": true,
  "data": {
    id, username, email, fullName, phone, address,
    kycVerified, status, createdAt
  }
}
⚠️ Only see users from same branch
```

### 6. Report ATM Issue
```
POST /support/atm-issue
Body: {
  "userId": 123,
  "issueType": "NOT_DISPENSING|FROZEN|OTHER",
  "description": "ATM not dispensing cash"
}
Response: { "success": true }
✅ Logs: ATM_ISSUE_REPORTED
```

---

## 👤 USER/CUSTOMER TRANSACTION CONTROLLER
**Base URL:** `/api/transaction`
**Required Role:** USER (or higher)
**Handle customer transactions with full security**

### 1. Initiate Transfer (Complex Security Flow)
```
POST /transfer
Body: {
  "fromAccountNumber": "ACC001",
  "toAccountNumber": "ACC002",
  "amount": 50000,
  "description": "Payment for rent"
}

Security Gates:
[GATE 1] Account must be ACTIVE
[GATE 2] Daily limit check
[GATE 3] Per-transaction limit check
[GATE 4] OTP requirement check (if > ₹10K)
[GATE 5] Manager approval check (if > ₹2L)
[GATE 6] Suspicious activity detection

Scenarios:
---
Scenario A: Small transfer (< ₹10K)
Response: { "success": true, "transactionId": 456 }
✅ Instant completion
✅ Debits from account
✅ Credits to account
✅ Notifications sent

---
Scenario B: Medium transfer (₹10K - ₹2L)
Response: {
  "success": true,
  "requiresOTP": true,
  "transactionId": 456,
  "message": "OTP sent to your email"
}
⏳ User must verify OTP
→ Then complete transfer

---
Scenario C: Large transfer (> ₹2L)
Response: {
  "success": true,
  "requiresApproval": true,
  "transactionId": 456,
  "message": "Requires manager approval"
}
⏳ Manager must approve (24 hour window)
✅ Auto-rejects if timeout

---
Scenario D: Very Large Transfer (> ₹2L + needs OTP)
Response: {
  "success": true,
  "requiresOTP": true,
  "requiresApproval": true,
  "transactionId": 456
}
⏳ First: Verify OTP
⏳ Then: Wait for manager approval
✅ Logs: TRANSFER_INITIATED
```

### 2. Verify OTP for Transaction
```
POST /{transactionId}/verify-otp
Body: { "otpCode": "123456" }

Scenarios:
---
If only OTP required:
Response: { "success": true, "message": "Transfer completed" }
✅ Transaction executes immediately
✅ Notifications sent

---
If OTP + Approval required:
Response: {
  "success": true,
  "requiresApproval": true,
  "message": "OTP verified. Pending manager approval"
}
⏳ Wait for manager approval

---
Failed OTP:
Response: { "success": false, "message": "Invalid OTP" }
⚠️ 3 failed attempts → Account locked 1 hour
```

### 3. Withdraw from ATM
```
POST /withdraw
Body: {
  "accountNumber": "ACC001",
  "amount": 10000
}
Response: {
  "success": true,
  "amount": 10000,
  "newBalance": 40000
}
✅ Logs: WITHDRAWAL_COMPLETED
✅ Notification: Sent to user
```

### 4. View Transaction History
```
GET /history?accountNumber=ACC001&limit=20
Response: {
  "success": true,
  "count": 15,
  "data": [
    {
      id, fromAccount, toAccount, amount, type,
      status, createdAt, completedAt, ...
    }
  ]
}
```

### 5. Get Pending Approvals
```
GET /pending-approvals
Response: {
  "success": true,
  "data": [ approvals waiting for manager ]
}
```

---

## 🔒 SECURITY FLOW SUMMARY

### Transaction Amount Based Rules:

```
Amount < ₹10,000
├─ Daily Limit Check ✅
├─ Per-Txn Limit Check ✅
├─ OTP: ❌ Not required
├─ Approval: ❌ Not required
└─ Result: ✅ Instant completion

₹10,000 - ₹50,000
├─ Daily Limit Check ✅
├─ Per-Txn Limit Check ✅
├─ OTP: ✅ Required
├─ Approval: ❌ Not required
└─ Result: ⏳ Wait for OTP, then complete

₹50,000 - ₹2,00,000
├─ Daily Limit Check ✅
├─ Per-Txn Limit Check ✅
├─ OTP: ✅ Required
├─ Approval: ✅ Required
└─ Result: ⏳ OTP + Manager Approval

> ₹2,00,000
├─ Daily Limit Check ✅
├─ Per-Txn Limit Check: ❌ May exceed
├─ OTP: ✅ Required
├─ Approval: ✅ Required
└─ Result: ❌ Not allowed (exceeds limit)
```

---

## 📝 RESPONSE FORMATS

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🚨 SECURITY STATUS CODES

| Status | Meaning |
|--------|---------|
| 200 | Operation successful |
| 400 | Bad request / validation error |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (insufficient permissions) |

---

## 🔐 ERROR SCENARIOS

### Account Locked (Failed OTP 3 times)
- Account locked for 1 hour
- Cannot login or perform transactions
- Admin must unlock manually if needed

### Account Frozen (Suspicious Activity)
- Detected: Rapid transactions, unusual amounts, new IP
- Cannot perform transactions
- Manager must review and unfreeze

### Account Blocked (Admin Action)
- Cannot access account
- Must contact support/admin

---

## 📊 AUDIT TRAIL

Every action is logged with:
- User ID & Username
- Action type
- Entity type & ID
- IP address & User-Agent
- Old/New values (for updates)
- Timestamp
- Success/Failure status

---

## 🧪 COMPLETE EXAMPLE FLOW

### Example: User A transfers ₹75,000 to User B

```
1. POST /api/transaction/transfer
   ├─ Amount: ₹75,000
   ├─ From Account: ACC_001 (ACTIVE)
   ├─ To Account: ACC_002 (ACTIVE)
   └─ Response: requiresOTP=true, requiresApproval=true

2. System sends OTP email: 123456

3. POST /api/transaction/{txnId}/verify-otp
   ├─ OTP Code: 123456
   └─ Response: requiresApproval=true (waiting for manager)

4. Manager sees approval request
   POST /api/manager/approvals/{approvalId}/approve

5. System executes transfer:
   ├─ User A balance: 100,000 - 75,000 = 25,000
   └─ User B balance: 50,000 + 75,000 = 125,000

6. Notifications sent to both users

7. Both actions logged in audit trail
```

---

## 🔑 REQUIRED HEADERS

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [x] AdminController (10 endpoints)
- [x] ManagerController (6 endpoints)
- [x] EmployeeController (6 endpoints)
- [x] UserTransactionController (5 endpoints)
- [x] Role-Based Access Control Middleware
- [x] Transaction Security Service with 6 gates
- [x] OTP Service with auto-locking
- [x] Audit Logging Service
- [x] Suspicious Activity Detection (5 rules)
- [x] Notification Service
- [x] Complete API endpoints (27 total)

---

**Total API Endpoints: 27**
**Total Security Gates: 6 per transaction**
**Total Detection Rules: 5**
**Total Audit Actions: 14+**
