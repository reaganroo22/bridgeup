-- Add edit functionality to messages table
ALTER TABLE public.messages 
ADD COLUMN edit_count INTEGER DEFAULT 0,
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN image_url TEXT,
ADD COLUMN audio_url TEXT;

-- Update the original content column to NOT NULL (it should already be NOT NULL)
-- This is just to ensure consistency
ALTER TABLE public.messages 
ALTER COLUMN content DROP NOT NULL;

-- Now make content nullable since we might have image/audio only messages
-- But ensure at least one content type exists
ALTER TABLE public.messages 
ADD CONSTRAINT check_message_content 
CHECK (
  content IS NOT NULL AND content != '' 
  OR image_url IS NOT NULL 
  OR audio_url IS NOT NULL
);

-- Add index for edited messages for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_edited ON public.messages(edited_at) WHERE edited_at IS NOT NULL;

-- Add index for edit_count for analytics
CREATE INDEX IF NOT EXISTS idx_messages_edit_count ON public.messages(edit_count) WHERE edit_count > 0;