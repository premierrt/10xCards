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

### Flashcard Sets
- **POST /api/flashcard-sets**
  - Creates a flashcard set.
  - **Request JSON**: `{ "user_id": 1, "name": "Unique Set Name" }`
  - **Response JSON**: `{ "set_id": 1, "created_at": "2023-01-01T00:00:00Z" }`
  - **Success Codes**: 201 Created
  - **Error Codes**: 400 Bad Request (if name is taken), 401 Unauthorized

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
