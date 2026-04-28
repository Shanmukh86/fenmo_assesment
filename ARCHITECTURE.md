# Architecture & Design Decisions

## 🎯 Project Goals

Build a production-quality full-stack expense tracker that demonstrates:
1. **Data Integrity**: Money handling without floating-point errors
2. **Idempotency**: Safe API calls with retry logic
3. **Clean Code**: Separation of concerns, testable architecture
4. **Real-World UX**: Loading states, error handling, edge cases
5. **Minimal Scope**: MVP with depth, not breadth

---

## 📐 Tech Stack Rationale

### Backend: Node.js + Express

**Chosen**: ✅ Express 4
**Alternatives Considered**: FastAPI, Go Echo, Spring Boot

**Why Express?**
- Lightweight, easy to understand
- Excellent for REST APIs
- Large ecosystem (middleware, testing)
- Widely adopted for full-stack apps
- Fits MVP timeline

**Tradeoffs**:
- Not as fast as Go/Rust (but sufficient for this scale)
- Single-threaded (fine for I/O-bound operations)
- Requires explicit routing setup (good for learning)

---

### Database: MySQL + Prisma

**Chosen**: ✅ MySQL 8+ with Prisma ORM
**Alternatives Considered**: MongoDB, MySQL, Supabase

**Why MySQL?**
```
✅ ACID compliance        → Reliable transactions
✅ Decimal type          → Exact money handling (0.1 + 0.2 = 0.3)
✅ Indexes              → Fast filtering/sorting
✅ Unique constraints   → Enforce business rules
✅ JSON support        → Future extensibility
✅ Free & open source  → No vendor lock-in
```

**Why NOT MongoDB?**
```
❌ Floating-point numbers        → $25.01 becomes 25.009999...
❌ No transactions               → Can't update balances atomically
❌ Document duplication         → No unique constraints across docs
❌ Schema flexibility overkill  → We have fixed schema
```

**Why Prisma?**
```
✅ Type-safe queries       → Catch errors at dev time
✅ Auto migrations         → Version control for schema
✅ Intuitive API          → "find", "create", "update"
✅ Client auto-generation  → Less boilerplate
✅ Excellent docs         → Easy to learn
```

**Alternative ORM Comparison**:
| ORM | Approach | Learning Curve | Type Safety |
|-----|----------|---|---|
| Prisma | Schema-first | Easy | Excellent |
| TypeORM | Decorator-based | Medium | Good |
| Sequelize | Instance-based | Medium | Basic |
| Knex | Query builder | Hard | Basic |

---

### Frontend: React + Vite

**Chosen**: ✅ React 18 + Vite
**Alternatives**: Vue, Svelte, vanilla JS

**Why React?**
```
✅ Component reusability
✅ Hooks for state management (simpler than Redux)
✅ Largest ecosystem
✅ Easiest for beginners
✅ Works with Vite beautifully
```

**Why Vite (not Webpack)?**
```
✅ 10x faster dev server      → Instant feedback
✅ Native ES modules         → No transpilation overhead
✅ Built-in CSS handling     → No config needed
✅ Lightning-fast HMR        → Change code, see result immediately
✅ Production-optimized build → Tree-shaking, code splitting
```

**Why Vanilla CSS (not Tailwind/Bootstrap)?**
```
✅ Total control           → Style exactly what you want
✅ Zero dependencies       → Easier to maintain
✅ Small CSS file          → Fast to download
✅ Learn CSS fundamentals  → Better for learning
✅ No CSS class conflicts  → Predictable styling

❌ More CSS to write
❌ Not as fast as pre-built utilities
→ Trade off acceptable for learning project
```

**State Management Decision**:
- ✅ React Hooks only (useState, useEffect)
- ❌ Redux (overkill, adds boilerplate)
- ❌ Context API (fine, but hooks sufficient)
- ❌ Zustand (great but not needed)

**Rationale**: 
- Simple app, 2 main components
- Minimal shared state (expenses list, filters)
- Props passing clear and explicit
- Easy to test and understand

---

## 🏗️ Backend Architecture

### Pattern: MVC → Controller-Service-Repository

```
Route Handler
    ↓
Controller (HTTP layer)
    - Parse request
    - Call service
    - Format response
    - Error handling
    ↓
Service (Business logic)
    - Validation
    - Business rules
    - Idempotency
    - Orchestration
    ↓
Repository (Data access)
    - Database queries
    - Filters, sorting
    - Aggregations
```

### File Structure Explanation

```
backend/
├── src/
│   ├── index.js                    ← Express app setup (middleware, routes)
│   ├── server.js                   ← Server bootstrap (listen)
│   ├── db.js                       ← Prisma client singleton
│   │
│   ├── routes/expenseRoutes.js     ← Route definitions
│   │   Route: POST /api/expenses
│   │   ├─→ Controller.createExpense
│   │
│   ├── controllers/expenseController.js  ← HTTP request/response
│   │   - Parse request body
│   │   - Call service.createExpense()
│   │   - Return 201 or 400
│   │
│   ├── services/expenseService.js  ← Business logic
│   │   - Validate amount > 0
│   │   - Check idempotency key
│   │   - Insert into database
│   │   - Return expense object
│   │
│   └── middleware/
│       ├── errorHandler.js         ← Catch errors, format response
│       │   - Prisma errors → 400/409
│       │   - Validation errors → 400
│       │   - Unknown → 500
│       │
│       └── validation.js           ← Input validation rules
│           - amount must be positive
│           - category must be string
│           - date must be valid
```

### Why This Architecture?

**Benefits**:
1. **Testability**: Service logic separated from HTTP
   ```javascript
   // Easy to unit test
   const result = expenseService.createExpense({amount: 50, ...});
   expect(result.amount).toBe(50);
   ```

2. **Reusability**: Same service for API + GraphQL + gRPC
   ```javascript
   // REST endpoint uses service
   router.post('/expenses', controller.createExpense);
   
   // GraphQL mutation could use same service
   mutation: {
     createExpense: (_, args) => expenseService.createExpense(args)
   }
   ```

3. **Maintainability**: Changes in one layer don't affect others
   ```javascript
  // Change database from PostgreSQL to MySQL?
   // Only modify service data access
   // Controllers, routes unchanged!
   ```

4. **Readability**: Clear what each file does
   ```
   routes/    = "How do I call this?"
   controllers/ = "How do I handle HTTP?"
   services/  = "What is the business logic?"
   ```

---

## 💾 Database Design Decisions

### 1. UUID vs Auto-Increment ID

**Chosen**: ✅ UUID (gen_random_uuid())

**Comparison**:
```
Auto-Increment:
  ✅ Smaller (4-8 bytes)
  ✅ Easier to reason about
  ❌ Sequential, guessable
  ❌ Hard to merge databases

UUID:
  ✅ Globally unique
  ✅ Generated client-side
  ✅ Can merge databases
  ❌ Larger (16 bytes)
  ❌ Less sequential (worse for B-tree)
```

**Decision Rationale**: 
- Future-proofs for scaling, data merging
- Acceptable storage tradeoff
- Better security (can't enumerate IDs)

---

### 2. DECIMAL(19, 2) for Money

**Chosen**: ✅ DECIMAL(19, 2)

**Problem Illustrated**:
```javascript
// Using FLOAT
0.1 + 0.2 === 0.3  // FALSE! ← Floating-point error

// Using DECIMAL(19, 2)
DECIMAL 0.10 + DECIMAL 0.20 === DECIMAL 0.30  // TRUE!
```

**Storage**: 
- Can store up to 17 digits + 2 decimal places
- Maximum: $99,999,999,999,999.99
- Sufficient for any individual expense

**Why not just JavaScript numbers?**
```javascript
// Frontend: 50.00 (user input)
// JavaScript: 50 (loses precision in some cases)
// Database: DECIMAL(19, 2) → 50.00 (exact)
// ← Database is source of truth for money!
```

---

### 3. Idempotency Key Design

**Problem**: Duplicate submissions from:
- User clicks submit multiple times
- Network timeout, user retries
- Page refresh after submission
- Browser crash and recovery
- Client-side retry logic

**Solution**:
```sql
CREATE TABLE expenses (
    ...
    idempotency_key VARCHAR(255) NOT NULL UNIQUE
);
```

**How It Works**:
```
Client generates ID: "expense_1714330800000_abc123"
           ↓
   POST /api/expenses
   {amount: 50, idempotency_key: "expense_1714330800000_abc123"}
           ↓
   Server checks: "Does this key exist?"
           ↓
   YES? Return existing expense
   NO? Create new, return it
           ↓
   Next time same key submitted → Returns same expense
```

**Key Generation** (Frontend):
```javascript
// Use timestamp + random
"expense_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
// Result: "expense_1714330800000_a7f3x2k1"

// Persist in localStorage
localStorage.setItem('idempotency_key', key);

// Survives page refresh!
```

**Why VARCHAR(255)?**
- Plenty of space for any unique ID format
- Typical IDs: UUIDs (36), timestamps (20), custom (50)
- UNIQUE constraint prevents duplicates

---

### 4. Indexes for Performance

```sql
CREATE INDEX expenses_category_idx ON expenses(category);
CREATE INDEX expenses_date_idx ON expenses(date);
```

**Why?**
- Queries with WHERE category = '...' → 10x faster
- Queries with ORDER BY date → 10x faster
- Without indexes: scan all rows (slow at 1000+ records)

**When to add more?**
- If filtering by user_id: `CREATE INDEX ON expenses(user_id)`
- If filtering by date range: `CREATE INDEX ON expenses(date)`
- If combining: `CREATE INDEX ON expenses(user_id, date)`

---

## 🔐 Idempotency Implementation Details

### Why Server-Side?

**Alternative: Client-Side Deduplication**
```javascript
// Bad: Only works on same browser/device
const submitted = new Set();
if (submitted.has(key)) return;
submitted.add(key);
```

Problems:
- Lost on page refresh
- Different tab = different Set
- Different browser = no protection

**Better: Server-Side + Client-Side**
```javascript
// Client persists in localStorage
localStorage.setItem('expense_idempotency_key', key);

// Server checks database
const existing = await db.findByIdempotencyKey(key);
if (existing) return existing;

// Result: Protected across refreshes, browsers, devices!
```

---

### Edge Cases Handled

```
Scenario 1: User clicks submit → page refreshes
┌─────────────────────────────────────────┐
│ POST /api/expenses                      │
│ idempotency_key: "expense_123"          │
├─────────────────────────────────────────┤
│ Server: Find key "expense_123"          │
│ → Not found                             │
│ → Create expense                        │
│ → Return 201 ✓                          │
│ → Page refreshes ✓                      │
│ → localStorage still has key ✓          │
└─────────────────────────────────────────┘

Scenario 2: Same key resubmitted
┌─────────────────────────────────────────┐
│ POST /api/expenses                      │
│ idempotency_key: "expense_123"          │
├─────────────────────────────────────────┤
│ Server: Find key "expense_123"          │
│ → Found! (from scenario 1)              │
│ → Return existing expense ✓             │
│ → No duplicate created ✓                │
└─────────────────────────────────────────┘

Scenario 3: Browser network retry
┌─────────────────────────────────────────┐
│ Client: Submit fails (timeout)          │
│ → Retry automatically                   │
│ → Same idempotency_key ✓                │
│ → Server: Key exists, return old ✓      │
│ → Result: User sees expense only once ✓ │
└─────────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

### Component Structure

```
App.jsx (Root)
├── Header
├── ExpenseForm.jsx
│   ├── Form inputs
│   ├── Loading spinner
│   └── Success/error messages
│
└── ExpenseList.jsx
    ├── Filter controls (category dropdown)
    ├── Sort controls (date/amount)
    ├── Expense table
    │   └── Each row = 1 expense
    ├── Empty state
    ├── Loading state
    └── Error state
```

### State Management Strategy

**Component-Level State** (useState):
```javascript
// In ExpenseForm
const [formData, setFormData] = useState({
  amount: '',
  category: '',
  description: '',
  date: ''
});
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
```

**Why not Context/Redux?**
- Only 2 main components (Form, List)
- Minimal shared state
- Props passing clear
- Simpler to test and understand

**If this grew to 10+ components:**
- → Use Context API (no new dependency)
- → Or Zustand (small, simple)
- → Or Redux (if really needed)

**Global Error State**:
```javascript
// App.jsx
const [error, setError] = useState(null);

// Pass down to form
<ExpenseForm onError={setError} />

// Display globally
{error && <Alert type="error">{error}</Alert>}
```

---

### Loading States Pattern

```javascript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (isLoading) return;  // Prevent multiple submissions
  
  setIsLoading(true);
  try {
    await api.createExpense(formData);
  } catch (err) {
    onError(err.message);
  } finally {
    setIsLoading(false);
  }
};

// Disable button during submission
<button disabled={isLoading}>
  {isLoading ? '...' : 'Submit'}
</button>
```

**Benefits**:
- Prevents double-submission (disabled button)
- User sees loading state (better UX)
- Form fields disabled during request
- Automatic cleanup in finally block

---

### Error Handling Flow

```javascript
try {
  // Make API call
  const response = await api.getExpenses(filters);
  
  // If fails, fetch throws error
  if (!response.ok) throw new Error(response.statusText);
  
  setExpenses(response.data);
} catch (error) {
  // Display user-friendly message
  setError(error.message);
  
  // Log for debugging
  console.error('Failed to load:', error);
}
```

**Key Principle**: 
- Try/Catch at API boundary
- Format errors for user
- Log for debugging
- Show retry button

---

## 🔄 API Contract Design

### Request/Response Format

**Consistent Response Format**:
```javascript
// Success
{
  success: true,
  data: {...},
  summary: {...},
  timestamp: "2026-04-28T..."
}

// Error
{
  error: "User-friendly message",
  code: "ERROR_CODE",
  timestamp: "2026-04-28T..."
}
```

**Why consistent format?**
- Client always knows what to expect
- Easy to write reusable error handler
- Can add monitoring/alerting easily

---

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET /expenses |
| 201 | Created | POST /expenses successful |
| 400 | Bad Request | Invalid amount (user error) |
| 404 | Not Found | GET /expenses/invalid-id |
| 409 | Conflict | Duplicate idempotency key |
| 500 | Server Error | Database connection failed |

**Frontend Handling**:
```javascript
if (response.status === 400) {
  // Show user: "Please fix your input"
} else if (response.status === 500) {
  // Show user: "Server error, try again later"
} else {
  // Success: update UI
}
```

---

## 🚀 Deployment Considerations

### Environment Configuration

**Development** (.env):
```
NODE_ENV=development
DATABASE_URL=mysql://localhost:3306/expense_tracker
CLIENT_URL=http://localhost:5173
```

**Production** (Heroku config vars):
```
NODE_ENV=production
DATABASE_URL=mysql://xxx:yyy@ec2-host:3306/db
CLIENT_URL=https://expense-tracker.herokuapp.com
```

**Why externalize?**
- Same code runs everywhere
- Secrets never in source code
- Easy to change without redeployment

---

### Scaling Roadmap

**Phase 1 (Current)** - MVP
- Single server, single database
- <100 users
- Load: ~1000 requests/day

**Phase 2** - Growth
- Add authentication (block Phase 1 blocker)
- Add pagination (if >1000 expenses)
- Add error tracking (Sentry)
- Cache category totals (Redis)

**Phase 3** - Scale
- Load balancer (multiple API servers)
- Database read replicas
- CDN for frontend
- Message queue for bulk imports

**Phase 4** - Enterprise
- Advanced caching strategies
- Search engine (Elasticsearch)
- Machine learning (expense categorization)
- Mobile app
- API rate limiting, API keys

---

## 📝 Code Quality Standards

### Clean Code Principles Applied

1. **Meaningful Names**
   ```javascript
   ✅ const expenseService = new ExpenseService();
   ❌ const es = new ES();
   ```

2. **Single Responsibility**
   ```javascript
   ✅ expenseService.createExpense()
   ❌ expenseService.createAndNotifyAndLog()
   ```

3. **Comments for Why, Not What**
   ```javascript
   ✅ // Store decimal to avoid floating-point errors
      amount: Decimal @db.Decimal(19, 2)
   
   ❌ // Set amount as decimal
      amount: Decimal @db.Decimal(19, 2)
   ```

4. **DRY (Don't Repeat Yourself)**
   ```javascript
   ✅ const formatCurrency = (amount) => 
        parseFloat(amount).toFixed(2);
   
   ❌ // In 5 different files:
      parseFloat(amount).toFixed(2)
   ```

5. **Error Handling**
   ```javascript
   ✅ if (!formData.amount) throw new Error('Amount required');
   ❌ if (!formData.amount) console.log('error');
   ```

---

## 🔮 Future Improvements

### High Priority (If Adding Auth)

```javascript
// Add authentication middleware
router.post('/expenses', authenticateUser, controller.createExpense);

// Filter by user
const expenses = await prisma.expense.findMany({
  where: {
    userId: req.user.id  // ← Add this
  }
});

// Database schema update
model Expense {
  userId String  // ← Add this
  user   User    @relation(fields: [userId], references: [id])
}
```

### Medium Priority (If Adding Edit/Delete)

```javascript
// Add soft deletes for audit trail
model Expense {
  ...
  deletedAt DateTime?  // null = not deleted
}

// Query only active expenses
const active = await prisma.expense.findMany({
  where: { deletedAt: null }
});
```

### Low Priority (If Becoming Popular)

```javascript
// Add full-text search
model Expense {
  ...
  description String @db.Text
  
  @@fulltext([description])
}

// Search
const results = await prisma.expense.findMany({
  where: {
    search: "coffee"  // ← Full-text search
  }
});
```

---

**Built with production-quality standards** 🏆
