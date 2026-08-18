-- Create review_replies table
CREATE TABLE review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  comment text NOT NULL,
  is_admin_reply boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX review_replies_review_id_idx ON review_replies(review_id);
CREATE INDEX review_replies_user_id_idx ON review_replies(user_id);
