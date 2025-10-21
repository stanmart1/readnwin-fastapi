-- Add highlights and notes tables for e-reader features

-- Create highlights table
CREATE TABLE IF NOT EXISTS highlights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    color VARCHAR(50) DEFAULT 'yellow',
    start_offset INTEGER NOT NULL,
    end_offset INTEGER NOT NULL,
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    highlight_id INTEGER REFERENCES highlights(id) ON DELETE SET NULL,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_highlights_user_book ON highlights(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_book ON notes(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created ON highlights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);

-- Grant permissions (adjust as needed)
-- GRANT ALL ON highlights TO your_db_user;
-- GRANT ALL ON notes TO your_db_user;
-- GRANT USAGE, SELECT ON SEQUENCE highlights_id_seq TO your_db_user;
-- GRANT USAGE, SELECT ON SEQUENCE notes_id_seq TO your_db_user;
