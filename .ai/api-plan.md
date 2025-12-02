# REST API Plan

## 1. Resources
- Users: correspond to the `users` table.
- Flashcards: correspond to the `flashcards` table.
- Flashcard Sets: correspond to the `flashcard_sets` table.
- Flashcard Set Flashcards: correspond to the `flashcard_set_flashcards` table.

## 2. Endpoints


### Flashcards
- **POST /api/flashcards/generate**
  - Generates flashcards proposal from input text.
  - **Request JSON**: `{ "text": "input text here", "count": 20 }`
  - **Response JSON**: `[ { "flashcard_id": 1, "question": "?", "answer": "..." }, ... ]`
  - **Success Codes**: 200 OK
  - **Error Codes**: 400 Bad Request, 401 Unauthorized

- **GET /api/flashcards**
  - Retrieves list of generated flashcards with pagination and sorting.
  - **Query Parameters**:
    - `page` (default: 1)
    - `limit` (default: 10, max: 100)
    - `sort_by` (default: "created_at", options: "created_at", "question", "answer")
    - `sort_order` (default: "desc", options: "asc", "desc")
  - **Response JSON**: `{ "flashcards": [...], "pagination": { "page": 1, "limit": 10, "total": 50, "total_pages": 5 } }`
  - **Success Codes**: 200 OK
  - **Error Codes**: 400 Bad Request (if pagination or sorting parameters are invalid), 401 Unauthorized

- **PATCH /api/flashcards/{flashcard_id}**
  - Partially updates a specific flashcard (any selected fields).
  - **Request JSON**: `{ "status": "accepted" }` or `{ "question": "Updated question?", "answer": "Updated answer" }`
  - **Response JSON**: `{ "flashcard_id": 1, "question": "Updated question?", "answer": "Updated answer", "status": "accepted" }`
  - **Success Codes**: 200 OK
  - **Error Codes**: 404 Not Found (if flashcard doesn't exist), 400 Bad Request (if validation fails), 401 Unauthorized

- **PATCH /api/flashcards/bulk**
  - Updates multiple flashcards at once (typically for status changes).
  - **Request JSON**: `{ "flashcard_ids": [1, 3, 5, 7], "updates": { "status": "accepted" } }`
  - **Response JSON**: `{ "updated_count": 3, "failed_count": 1, "results": [{ "flashcard_id": 1, "status": "updated" }, { "flashcard_id": 3, "status": "updated" }, { "flashcard_id": 5, "status": "updated" }, { "flashcard_id": 7, "status": "not_found" }] }`
  - **Success Codes**: 200 OK
  - **Error Codes**: 400 Bad Request (if no IDs provided, invalid format, or validation fails), 401 Unauthorized

- **DELETE /api/flashcards/{flashcard_id}**
  - Deletes a specific flashcard.
  - **Response JSON**: `{ "message": "Flashcard deleted successfully." }`
  - **Success Codes**: 200 OK
  - **Error Codes**: 404 Not Found (if flashcard doesn't exist), 401 Unauthorized

- **DELETE /api/flashcards**
  - Deletes multiple flashcards at once.
  - **Request JSON**: `{ "flashcard_ids": [1, 3, 5, 7] }`
  - **Response JSON**: `{ "deleted_count": 3, "failed_count": 1, "results": [{ "flashcard_id": 1, "status": "deleted" }, { "flashcard_id": 3, "status": "deleted" }, { "flashcard_id": 5, "status": "deleted" }, { "flashcard_id": 7, "status": "not_found" }] }`
  - **Success Codes**: 200 OK
  - **Error Codes**: 400 Bad Request (if no IDs provided or invalid format), 401 Unauthorized

### Flashcard Sets
- **POST /api/flashcard-sets**
  - Creates a flashcard set with accepted flashcards.
  - **Request JSON**: `{ "user_id": 1, "name": "Unique Set Name", "flashcard_ids": [1, 3, 5] }`
  - **Response JSON**: `{ "set_id": 1, "created_at": "2023-01-01T00:00:00Z", "flashcards_added": 3 }`
  - **Success Codes**: 201 Created
  - **Error Codes**: 400 Bad Request (if name is taken or flashcards are not accepted), 401 Unauthorized

- **GET /api/flashcard-sets**
  - Retrieves list of user's flashcard sets.
  - **Query Parameters**:
    - `page` (default: 1)
    - `limit` (default: 10, max: 100)
  - **Response JSON**: `{ "sets": [{ "set_id": 1, "name": "Set Name", "flashcard_count": 15, "created_at": "2023-01-01T00:00:00Z" }], "pagination": { "page": 1, "limit": 10, "total": 5, "total_pages": 1 } }`
  - **Success Codes**: 200 OK
  - **Error Codes**: 401 Unauthorized

- **DELETE /api/flashcard-sets/{set_id}**
  - Deletes a flashcard set.
  - **Response JSON**: `{ "message": "Set deleted successfully." }`
  - **Success Codes**: 200 OK
  - **Error Codes**: 404 Not Found, 401 Unauthorized



## 3. Authentication and Authorization
- Token-based auth using Supabase Auth.

## 4. Validation and Business Logic
- **User registration**: Validate email uniqueness and password strength.
- **Flashcard generation**: Validate input text length (1000–10000 words).
- **Flashcard set uniqueness**: Validate that the set name is unique when creating or updating a set.
- Business logic for study sessions where user indicates whether they know the answer, affecting subsequent sessions.
