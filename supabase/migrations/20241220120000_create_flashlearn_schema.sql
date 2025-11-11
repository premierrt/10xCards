-- migration: create_flashlearn_schema
-- purpose: create core tables for flashlearn mvp application
-- affected tables: flashcards, flashcard_sets, flashcard_set_flashcards
-- special notes: 
--   - users table is managed by supabase auth, no need to create
--   - implements row level security for all tables
--   - creates proper indexes for performance optimization

-- =============================================================================
-- flashcards table
-- stores individual flashcard questions and answers
-- =============================================================================
create table flashcards (
    flashcard_id serial primary key,
    question varchar(200) not null,
    answer varchar(500) not null,
    status varchar(20) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);

-- enable row level security for flashcards table
alter table flashcards enable row level security;

-- create rls policies for flashcards table
-- allow authenticated users to select all flashcards
create policy "authenticated users can select flashcards"
    on flashcards for select
    to authenticated
    using (true);

-- allow anonymous users to select all flashcards (for public access)
create policy "anonymous users can select flashcards"
    on flashcards for select
    to anon
    using (true);

-- allow authenticated users to insert new flashcards
create policy "authenticated users can insert flashcards"
    on flashcards for insert
    to authenticated
    with check (true);

-- allow authenticated users to update flashcards
create policy "authenticated users can update flashcards"
    on flashcards for update
    to authenticated
    using (true);

-- allow authenticated users to delete flashcards
create policy "authenticated users can delete flashcards"
    on flashcards for delete
    to authenticated
    using (true);

-- =============================================================================
-- flashcard_sets table
-- stores collections of flashcards owned by users
-- =============================================================================
create table flashcard_sets (
    set_id serial primary key,
    user_id uuid references auth.users(id) on delete cascade,
    name varchar(255) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp,
    
    -- ensure unique set names per user
    unique(user_id, name)
);

-- enable row level security for flashcard_sets table
alter table flashcard_sets enable row level security;

-- create rls policies for flashcard_sets table
-- authenticated users can select only their own sets
create policy "users can select own flashcard sets"
    on flashcard_sets for select
    to authenticated
    using (auth.uid() = user_id);

-- anonymous users cannot select flashcard sets
create policy "anonymous users cannot select flashcard sets"
    on flashcard_sets for select
    to anon
    using (false);

-- authenticated users can insert their own flashcard sets
create policy "users can insert own flashcard sets"
    on flashcard_sets for insert
    to authenticated
    with check (auth.uid() = user_id);

-- authenticated users can update only their own flashcard sets
create policy "users can update own flashcard sets"
    on flashcard_sets for update
    to authenticated
    using (auth.uid() = user_id);

-- authenticated users can delete only their own flashcard sets
create policy "users can delete own flashcard sets"
    on flashcard_sets for delete
    to authenticated
    using (auth.uid() = user_id);

-- =============================================================================
-- flashcard_set_flashcards table
-- junction table linking flashcard sets to individual flashcards
-- =============================================================================
create table flashcard_set_flashcards (
    set_flashcard_id serial primary key,
    set_id integer references flashcard_sets(set_id) on delete cascade,
    flashcard_id integer references flashcards(flashcard_id) on delete cascade,
    
    -- ensure no duplicate flashcards in the same set
    unique(set_id, flashcard_id)
);

-- enable row level security for flashcard_set_flashcards table
alter table flashcard_set_flashcards enable row level security;

-- create rls policies for flashcard_set_flashcards table
-- authenticated users can select flashcards from their own sets
create policy "users can select flashcards from own sets"
    on flashcard_set_flashcards for select
    to authenticated
    using (
        exists (
            select 1 from flashcard_sets fs 
            where fs.set_id = flashcard_set_flashcards.set_id 
            and fs.user_id = auth.uid()
        )
    );

-- anonymous users cannot select flashcard set associations
create policy "anonymous users cannot select flashcard set associations"
    on flashcard_set_flashcards for select
    to anon
    using (false);

-- authenticated users can insert flashcards into their own sets
create policy "users can insert flashcards into own sets"
    on flashcard_set_flashcards for insert
    to authenticated
    with check (
        exists (
            select 1 from flashcard_sets fs 
            where fs.set_id = flashcard_set_flashcards.set_id 
            and fs.user_id = auth.uid()
        )
    );

-- authenticated users can update flashcard associations in their own sets
create policy "users can update flashcards in own sets"
    on flashcard_set_flashcards for update
    to authenticated
    using (
        exists (
            select 1 from flashcard_sets fs 
            where fs.set_id = flashcard_set_flashcards.set_id 
            and fs.user_id = auth.uid()
        )
    );

-- authenticated users can delete flashcard associations from their own sets
create policy "users can delete flashcards from own sets"
    on flashcard_set_flashcards for delete
    to authenticated
    using (
        exists (
            select 1 from flashcard_sets fs 
            where fs.set_id = flashcard_set_flashcards.set_id 
            and fs.user_id = auth.uid()
        )
    );

-- =============================================================================
-- indexes for performance optimization
-- =============================================================================

-- index on flashcard_sets name for fast lookup by set name
create index idx_flashcard_sets_name on flashcard_sets(name);

-- index on flashcard_sets user_id for fast user-specific queries
create index idx_flashcard_sets_user_id on flashcard_sets(user_id);

-- index on flashcard_set_flashcards set_id for fast set lookups
create index idx_flashcard_set_flashcards_set_id on flashcard_set_flashcards(set_id);

-- index on flashcard_set_flashcards flashcard_id for fast flashcard lookups
create index idx_flashcard_set_flashcards_flashcard_id on flashcard_set_flashcards(flashcard_id);

-- index on flashcards status for filtering by status
create index idx_flashcards_status on flashcards(status);

-- =============================================================================
-- functions for automatic timestamp updates
-- =============================================================================

-- function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = current_timestamp;
    return new;
end;
$$ language plpgsql;

-- trigger to automatically update updated_at on flashcards table
create trigger update_flashcards_updated_at
    before update on flashcards
    for each row execute function update_updated_at_column();

-- trigger to automatically update updated_at on flashcard_sets table
create trigger update_flashcard_sets_updated_at
    before update on flashcard_sets
    for each row execute function update_updated_at_column();

-- =============================================================================
-- comments for documentation
-- =============================================================================

comment on table flashcards is 'stores individual flashcard questions and answers with status tracking';
comment on column flashcards.question is 'the question text displayed to users, max 200 characters';
comment on column flashcards.answer is 'the answer text shown after user response, max 500 characters';
comment on column flashcards.status is 'current status of the flashcard (e.g., draft, approved, rejected)';

comment on table flashcard_sets is 'collections of flashcards owned by users';
comment on column flashcard_sets.user_id is 'references auth.users(id) - the owner of this flashcard set';
comment on column flashcard_sets.name is 'display name for the flashcard set, unique per user';

comment on table flashcard_set_flashcards is 'junction table linking flashcard sets to individual flashcards';
comment on column flashcard_set_flashcards.set_id is 'foreign key to flashcard_sets table';
comment on column flashcard_set_flashcards.flashcard_id is 'foreign key to flashcards table';