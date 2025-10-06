-- Add chore_id column to thanks table
-- This migration adds the missing chore_id foreign key to link thank you messages to specific chores

ALTER TABLE thanks 
ADD COLUMN chore_id bigint REFERENCES chores(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_thanks_chore_id ON thanks(chore_id);

-- Update RLS policies to include chore_id access patterns
-- Users can view thanks messages if they are involved in the chore
DROP POLICY IF EXISTS "Users can view thanks messages they are involved in" ON thanks;

CREATE POLICY "Users can view thanks messages they are involved in" ON thanks
  FOR SELECT USING (
    from_id = auth.uid() OR 
    to_id = auth.uid() OR
    (
      chore_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM chores 
        WHERE chores.id = thanks.chore_id 
        AND (chores.owner_id = auth.uid() OR chores.partner_id = auth.uid())
      )
    )
  );

-- Update insert policy to ensure proper chore access
DROP POLICY IF EXISTS "Users can insert thanks messages as sender" ON thanks;

CREATE POLICY "Users can insert thanks messages as sender" ON thanks
  FOR INSERT WITH CHECK (
    from_id = auth.uid() AND
    (
      chore_id IS NULL OR
      EXISTS (
        SELECT 1 FROM chores 
        WHERE chores.id = thanks.chore_id 
        AND (chores.owner_id = auth.uid() OR chores.partner_id = auth.uid())
      )
    )
  );

-- Add comment for documentation
COMMENT ON COLUMN thanks.chore_id IS 'Optional reference to the chore this thank you message is related to';