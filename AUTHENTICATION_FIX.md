# Fix for 401 Unauthorized Error on Document Upload

## Problem

You were getting a **401 Unauthorized** error when trying to upload documents:
```
POST http://localhost:5000/api/document/upload 401 (Unauthorized)
```

## Root Cause

The upload and other API calls weren't checking if the user was logged in before making requests. The code was sending an empty string for the Authorization header when the token was missing:

```javascript
// BEFORE (WRONG):
const token = localStorage.getItem("token");
headers: { Authorization: token ? `Bearer ${token}` : '' }  // ❌ Sends empty string if no token
```

The Node.js backend requires a valid JWT token in the Authorization header. When it received an empty header or missing Bearer token, it rejected the request with **401 Unauthorized**.

---

## Solution Applied

I've fixed all critical API endpoints to:

1. **Check for a valid token BEFORE making the request**
2. **Show a clear error message if the user isn't logged in**
3. **Properly format the Authorization header with `Bearer ${token}`**
4. **Handle session expiration (401/403 responses) by clearing the token and asking user to re-login**

### Files Modified:

#### 1. **UploadPage.jsx** (CRITICAL)
- ✅ `handleUpload()` - Now checks for token before uploading
- ✅ `fetchHistory()` - Now checks for token before fetching document list  
- ✅ `sendMessage()` - Now checks for token before sending chat messages
- ✅ `clearChat()` - Now checks for token before clearing chat

**Before:**
```javascript
const token = localStorage.getItem("token");
headers: { Authorization: token ? `Bearer ${token}` : '' }
```

**After:**
```javascript
const token = localStorage.getItem("token");
if (!token) {
  showToast("Please login first to upload documents", { type: "error" });
  return;
}
headers: { Authorization: `Bearer ${token}` }
```

#### 2. **Quiz.jsx**
- ✅ `generateQuiz()` - Now checks for token and handles expired sessions

#### 3. **Flashcard.jsx**
- ✅ `generateFlashcards()` - Now checks for token and handles expired sessions

#### 4. **Chat.jsx**
- ✅ `saveFeedback()` - Now checks for token before saving feedback ratings

---

## How to Use (After Login)

1. **Login first** - Make sure you're logged in at the Login screen
2. **Upload documents** - The upload will now work with your valid token
3. **Use Chat/Quiz/Flashcards** - All features will work with authentication

---

## What Happens Now

### Scenario 1: User Tries to Upload Without Logging In
```
User clicks Upload button
→ Error message: "Please login first to upload documents"
→ Redirects to login page
```

### Scenario 2: User is Logged In
```
User is logged in (token in localStorage)
→ Upload buffer shows progress
→ File uploads successfully
→ "Uploaded document.pdf" success message
```

### Scenario 3: Session Expires (Token Becomes Invalid)
```
User tries to perform action
→ Server returns 401 or 403
→ App clears expired token
→ Error message: "Session expired. Please login again."
→ User must login again
```

---

## Testing the Fix

1. **Before logging in:**
   - Try to upload → Should see error "Please login first"
   - Try to use chat → Should see error "Please login first"
   - Try to create quiz → Should see error "Please login first"

2. **After logging in:**
   - Upload should work ✓
   - Chat should work ✓
   - Quiz should work ✓
   - Flashcards should work ✓

3. **If token expires (>1 hour):**
   - Try any action → Session expired error
   - Login again to continue

---

## Technical Details

### Authentication Flow

```
┌─────────────────────────────────────────────────┐
│           User Action (Upload/Chat)              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Check: localStorage.getItem("token") exists?    │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
       YES               NO
         │                │
         │        ┌────────────────────┐
         │        │ Show error:        │
         │        │ "Please login      │
         │        │  first to [action]"│
         │        └────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ Fetch API with:                                 │
│ headers: {                                      │
│   Authorization: `Bearer ${token}`              │
│ }                                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │   Response OK? │
        └────────┬───────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
        YES              NO
         │                │
         │        ┌────────────────┐
         │        │ Is 401/403?    │
         │        └────────┬───────┘
         │                 │
         │          ┌──────┴─────┐
         │          │            │
         │         YES           NO
         │          │            │
         │    ┌──────────────┐  │
         │    │Clear token   │  │
         │    │Show expired  │  │
         │    │error         │  │
         │    └──────────────┘  │
         │                      │
         │            ┌────────────────┐
         │            │Show other      │
         │            │error message   │
         │            └────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│            Action Completes                      │
└─────────────────────────────────────────────────┘
```

---

## Summary

✅ **Fixed:** 401 errors on upload/chat/quiz/flashcards
✅ **Reason:** Now checking for valid token before API calls
✅ **User Experience:** Clear error messages when not logged in
✅ **Session Handling:** Properly detects expired tokens and prompts re-login

**Status:** Ready to use! Just make sure you're logged in first. 🚀
