# Schemat bazy danych PostgreSQL dla FlashLearn MVP

## 1. Tabele

### 1.1. Tabela: users
This table is managed by Supabase Auth.
- **user_id** (SERIAL, PRIMARY KEY)  
- **email** (VARCHAR(255), UNIQUE, NOT NULL)  
- **password_hash** (VARCHAR(255), NOT NULL)  
- **created_at** (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)  

### 1.2. Tabela: flashcards  
- **flashcard_id** (SERIAL, PRIMARY KEY)  
- **question** (VARCHAR(200), NOT NULL)  
- **answer** (VARCHAR(500), NOT NULL)  
- **status** (VARCHAR(20), NOT NULL)  

### 1.3. Tabela: flashcard_sets  
- **set_id** (SERIAL, PRIMARY KEY)  
- **user_id** (INTEGER, REFERENCES users(user_id), ON DELETE CASCADE)  
- **name** (VARCHAR(255) UNIQUE NOT NULL)  
- **created_at** (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)  
- **updated_at** (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)  

### 1.4. Tabela: flashcard_set_flashcards  
- **set_flashcard_id** (SERIAL, PRIMARY KEY)  
- **set_id** (INTEGER, REFERENCES flashcard_sets(set_id), ON DELETE CASCADE)  
- **flashcard_id** (INTEGER, REFERENCES flashcards(flashcard_id), ON DELETE CASCADE)  

## 2. Relacje między tabelami
- `users` (1) → `flashcard_sets` (N)  
- `flashcard_sets` (1) → `flashcard_set_flashcards` (N)  
- `flashcards` (1) → `flashcard_set_flashcards` (N)  

## 3. Indeksy
- **Index on email** in users for fast lookup  
- **Index on name** in flashcard_sets for fast access by set name  

## 4. Zasady PostgreSQL  
- Hasła użytkowników są przechowywane w postaci skrótu za pomocą algorytmu haszującego.

## 5. Dodatkowe uwagi
- Schemat nie uwzględnia zaawansowanych funkcji bezpieczeństwa jak Row-Level Security (RLS) w MVP.
- Nie przewiduje się edycji zaakceptowanych fiszek ani ograniczeń dotyczących liczby zaakceptowanych fiszek w zestawach.