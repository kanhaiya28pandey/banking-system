# 🏦 Account Closure Workflow - Complete Implementation Guide

**Date:** April 19, 2026  
**Status:** ✏️ TO BE IMPLEMENTED

---

## 📋 Account Closure Permissions

### **Who Can Request Closure?**
| Role | Can Request | Notes |
|------|-------------|-------|
| **USER** | ✅ Yes | Can request their own account closure |
| **EMPLOYEE** | ✅ Yes | Can request on behalf of customer |
| **MANAGER** | ❌ No | Reviews/approves, doesn't request |
| **ADMIN** | ✅ Yes | Can force close any account |

### **Who Can Approve Closure?**
| Role | Can Approve | Authority |
|------|-------------|-----------|
| **USER** | ❌ No | Cannot approve own closure |
| **EMPLOYEE** | ❌ No | Can only request |
| **MANAGER** | ✅ Yes | Approves for their branch accounts |
| **ADMIN** | ✅ Yes | Approves/force closes any account |

### **Who Can Force Close?**
| Role | Can Force Close | Notes |
|------|----------------|-------|
| **USER** | ❌ No | Cannot force close |
| **EMPLOYEE** | ❌ No | Cannot force close |
| **MANAGER** | ❌ No | Cannot force close |
| **ADMIN** | ✅ Yes | Can force close without approval |

---

## 🔄 Account Closure Workflow

### **Step 1: User/Employee Requests Closure**
```
User/Employee initiates closure request
       ↓
System validates:
  ✓ Account status is ACTIVE
  ✓ No pending transactions
  ✓ No pending approvals
       ↓
Create Closure Request (status: PENDING)
       ↓
Notify assigned Manager
       ↓
Response: Closure request submitted
```

### **Step 2: Manager Reviews Request**
```
Manager receives notification
       ↓
Manager checks:
  ✓ Account balance
  ✓ Transaction history
  ✓ Pending items
  ✓ Customer history
       ↓
Manager either:
  A) APPROVES closure
  B) REJECTS with reason
```

### **Step 3a: Manager Approves**
```
Manager clicks APPROVE
       ↓
System validates final balance = 0
       ↓
Account status: ACTIVE → CLOSED
       ↓
Create Audit Log: ACCOUNT_CLOSED
       ↓
Send Notification to User:
  "Your account XXX has been closed"
       ↓
✅ Account Permanently Closed
```

### **Step 3b: Manager Rejects**
```
Manager clicks REJECT + reason
       ↓
Account status remains: ACTIVE
       ↓
Create Audit Log: ACCOUNT_CLOSURE_REJECTED
       ↓
Send Notification to User:
  "Your closure request was rejected: {reason}"
       ↓
Account can be used normally
```

### **Step 4: Admin Force Close (Emergency)**
```
Admin determines account needs closure
       ↓
Admin clicks FORCE CLOSE
       ↓
System creates:
  - Adjustment transaction to zero balance (if needed)
  - Closure record with admin reason
  - Audit log
       ↓
Account status: ACTIVE → CLOSED
       ↓
Send Notification to User:
  "Your account has been closed by administration"
```

---

## 📊 Account Status Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    ACCOUNT CREATED                           │
│                    Status: PENDING                           │
│                    (awaiting min deposit)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ (min deposit made)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    ACTIVE ACCOUNT                            │
│                  (ready for use)                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Can: Transfer, Withdraw, Receive Money               │  │
│  │ Cannot: No restrictions                              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────┬────────────────────────┬────────────────────────┘
           │                        │
      (closure request)        (suspicious activity)
      (or force close)         (or admin action)
           ↓                        ↓
    ┌─────────────────┐    ┌──────────────────┐
    │ CLOSURE_PENDING │    │ BLOCKED/FROZEN   │
    │ (awaiting mgr)  │    │ (account frozen) │
    └────────┬────────┘    └──────────────────┘
             │
      (manager approves or rejects)
             │
    ┌────────┴────────┐
    ↓                 ↓
┌─────────┐      ┌──────────┐
│ CLOSED  │      │ ACTIVE   │
│ (END)   │      │ (resume) │
└─────────┘      └──────────┘
```

---

## 💾 Database Models Needed

### **1. AccountClosure Model**
```java
@Document(collection = "account_closures")
public class AccountClosure {
    @Id
    private String id;
    
    private String accountId;              // Account being closed
    private String accountNumber;
    private String userId;                 // User requesting closure
    
    private String requestedBy;            // USER or EMPLOYEE id
    private LocalDateTime requestedAt;
    private String requestReason;          // Why closing?
    
    private String status;                 // PENDING, APPROVED, REJECTED, CLOSED, FORCE_CLOSED
    
    private String reviewedBy;             // Manager or Admin id
    private LocalDateTime reviewedAt;
    private String approvalReason;         // Approve/Reject reason
    
    private String closureType;            // USER_REQUESTED, EMPLOYEE_REQUESTED, ADMIN_FORCE_CLOSED
    
    private Double finalBalance;           // Balance at closure time
    private String closeReason;            // Final reason for closure
    private LocalDateTime closedAt;        // When actually closed
    
    // Audit fields
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

## 🔌 API Endpoints

### **User/Employee - Request Account Closure**
```
POST /api/account/{accountNumber}/request-closure
Body: {
  "reason": "Moving abroad",
  "requestedBy": "USER"  // or EMPLOYEE
}

Validations:
✓ Account exists
✓ Account is ACTIVE
✓ No pending transactions
✓ No pending approvals

Response:
{
  "success": true,
  "message": "Account closure request submitted",
  "data": {
    "closureId": "...",
    "status": "PENDING",
    "message": "Manager will review within 24 hours"
  }
}
```

---

### **Manager - View Pending Closures**
```
GET /api/manager/account-closures/pending
Response: [
  {
    "id": "...",
    "accountNumber": "ACC123",
    "userName": "John Doe",
    "requestReason": "Moving abroad",
    "requestedAt": "2026-04-19T10:00:00",
    "finalBalance": 0,
    "status": "PENDING"
  }
]
```

---

### **Manager - Approve Account Closure**
```
POST /api/manager/account-closures/{closureId}/approve
Body: {
  "reason": "All validations complete"
}

Validations:
✓ Closure request exists
✓ Status is PENDING
✓ Account balance is 0 (or close to 0)

Side Effects:
- Account status → CLOSED
- Create Audit Log: ACCOUNT_CLOSED
- Send notification to user
- Archive account data

Response:
{
  "success": true,
  "message": "Account closure approved",
  "data": {
    "closureId": "...",
    "accountNumber": "ACC123",
    "status": "CLOSED",
    "closedAt": "2026-04-19T11:30:00"
  }
}
```

---

### **Manager - Reject Account Closure**
```
POST /api/manager/account-closures/{closureId}/reject
Body: {
  "reason": "Pending transactions must complete first"
}

Side Effects:
- Account status remains ACTIVE
- Create Audit Log: ACCOUNT_CLOSURE_REJECTED
- Send notification to user

Response:
{
  "success": true,
  "message": "Closure request rejected",
  "data": {
    "closureId": "...",
    "status": "REJECTED",
    "reason": "Pending transactions must complete first"
  }
}
```

---

### **Admin - Force Close Account (Emergency)**
```
POST /api/admin/accounts/{accountNumber}/force-close
Body: {
  "reason": "Fraud detected",
  "adjustToZero": true  // Create adjustment txn if balance > 0?
}

Side Effects:
- Account status → CLOSED
- If adjustToZero: Create adjustment transaction to 0
- Create Audit Log: ACCOUNT_FORCE_CLOSED
- Create AccountClosure record with FORCE_CLOSED status
- Send notification to user
- Create SuspiciousActivity log if needed

Response:
{
  "success": true,
  "message": "Account force closed by admin",
  "data": {
    "accountNumber": "ACC123",
    "status": "CLOSED",
    "reason": "Fraud detected",
    "adjustmentTransactionId": "..."
  }
}
```

---

## 🎯 Closure Validations

### **Can Request Closure If:**
- ✅ Account status is ACTIVE
- ✅ No pending transactions (status = PENDING)
- ✅ No pending approvals
- ✅ No pending OTP verifications
- ✅ No freeze/lock status

### **Can Approve Closure If:**
- ✅ Closure request status is PENDING
- ✅ Account status is still ACTIVE
- ✅ Account balance = 0 (all money withdrawn)
- ✅ No pending transactions
- ✅ Requesting manager has authority

### **Cannot Approve If:**
- ❌ Account balance > 0
- ❌ Pending transactions exist
- ❌ Pending approvals exist
- ❌ Account locked/frozen
- ❌ Within 7 days of large transaction (security)

---

## 📋 Account Closure Checklist (Manager View)

```
Account Closure Request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Account: ACC625278380 (SAVINGS)
Customer: John Doe
Requested: Apr 19, 2026 10:00 AM
Reason: Moving abroad

Pre-Closure Checks:
  ☐ Current Balance: ₹0 ✅
  ☐ Pending Transactions: 0 ✅
  ☐ Pending Approvals: 0 ✅
  ☐ Recent Large Transactions: None ✅
  ☐ Account Lock Status: NONE ✅
  ☐ Customer KYC: VERIFIED ✅

Actions:
  [APPROVE]  [REJECT]  [REQUEST MORE INFO]
```

---

## 📧 Notifications

### **When User Requests Closure:**
```
TO: Manager
Subject: Account Closure Request
Body:
  John Doe has requested closure of account ACC625278380 (SAVINGS).
  Reason: Moving abroad
  Current Balance: ₹0
  
  Please review and approve/reject within 24 hours.
```

### **When Manager Approves:**
```
TO: User (John Doe)
Subject: Account Closure Approved
Body:
  Your account ACC625278380 (SAVINGS) has been successfully closed.
  
  Final Details:
  - Closed on: Apr 19, 2026 11:30 AM
  - Final Balance: ₹0
  - Account Status: CLOSED
  
  You can no longer use this account for transactions.
```

### **When Manager Rejects:**
```
TO: User (John Doe)
Subject: Account Closure Request Rejected
Body:
  Your account closure request has been rejected.
  
  Reason: Pending transactions must complete first
  
  Your account ACC625278380 remains ACTIVE.
  Please complete pending transactions and resubmit.
```

---

## 🔐 Audit Logging

All closure operations logged with:
```
Action: ACCOUNT_CLOSURE_REQUESTED
Entity: Account (ACC625278380)
User: john_doe
Timestamp: 2026-04-19 10:00:00
Details: {
  "requestReason": "Moving abroad",
  "requestedBy": "USER"
}

---

Action: ACCOUNT_CLOSED
Entity: Account (ACC625278380)
User: manager_001
Timestamp: 2026-04-19 11:30:00
Details: {
  "approvalReason": "All validations complete",
  "finalBalance": 0,
  "closureType": "APPROVED"
}
```

---

## ✅ Implementation Checklist

- [ ] Create AccountClosure model
- [ ] Create AccountClosureRepository
- [ ] Create AccountClosureService
- [ ] Add user-facing endpoint: POST /api/account/{accountNumber}/request-closure
- [ ] Add manager endpoint: GET /api/manager/account-closures/pending
- [ ] Add manager endpoint: POST /api/manager/account-closures/{id}/approve
- [ ] Add manager endpoint: POST /api/manager/account-closures/{id}/reject
- [ ] Add admin endpoint: POST /api/admin/accounts/{accountNumber}/force-close
- [ ] Update Account model: add status CLOSED
- [ ] Add validations for closure eligibility
- [ ] Add notifications (email + in-app)
- [ ] Add audit logging
- [ ] Frontend: Add closure request button
- [ ] Frontend: Manager dashboard to view pending closures
- [ ] Testing: All closure scenarios

---

## 🚀 Summary

**Account Closure Permissions:**
- **USER** - Can request closure (must get manager approval)
- **EMPLOYEE** - Can request on behalf of customer
- **MANAGER** - Reviews & approves/rejects closure requests
- **ADMIN** - Can force close accounts without approval

**Process:**
1. User/Employee → Request closure
2. Manager → Reviews & approves/rejects
3. Approved → Account status changes to CLOSED
4. Rejected → Account stays ACTIVE, user can try again

**Safety Features:**
- Account balance must be 0
- No pending transactions
- Manager approval required (unless admin force close)
- Audit trail of all closure actions
- Notifications sent to user

---

Would you like me to implement this complete Account Closure workflow?
