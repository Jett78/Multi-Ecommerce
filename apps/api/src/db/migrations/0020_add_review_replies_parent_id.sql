-- Add parent_id column to review_replies table for nested/threaded replies
ALTER TABLE review_replies ADD COLUMN parent_id uuid REFERENCES review_replies(id) ON DELETE CASCADE;

-- Create index for parent_id
CREATE INDEX review_replies_parent_id_idx ON review_replies(parent_id);
