-- Create mentor_videos table for video posts by mentors
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS mentor_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT NOT NULL,
    description TEXT,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE mentor_videos ENABLE ROW LEVEL SECURITY;

-- Allow mentors to insert their own videos
CREATE POLICY "Users can insert their own videos" ON mentor_videos
    FOR INSERT WITH CHECK (auth.uid() = mentor_id);

-- Allow mentors to update their own videos
CREATE POLICY "Users can update their own videos" ON mentor_videos
    FOR UPDATE USING (auth.uid() = mentor_id);

-- Allow mentors to delete their own videos
CREATE POLICY "Users can delete their own videos" ON mentor_videos
    FOR DELETE USING (auth.uid() = mentor_id);

-- Allow everyone to read videos (public viewing)
CREATE POLICY "Anyone can view videos" ON mentor_videos
    FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentor_videos_mentor_id ON mentor_videos(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_videos_created_at ON mentor_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_videos_featured ON mentor_videos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_mentor_videos_view_count ON mentor_videos(view_count DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_mentor_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_update_mentor_videos_updated_at
    BEFORE UPDATE ON mentor_videos
    FOR EACH ROW
    EXECUTE PROCEDURE update_mentor_videos_updated_at();

-- Insert some demo data for testing
INSERT INTO mentor_videos (mentor_id, video_url, title, description, is_featured) 
VALUES 
    -- Replace these UUIDs with actual mentor user IDs from your users table
    (
        (SELECT id FROM users WHERE full_name ILIKE '%sarah%' LIMIT 1),
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        'how i got into stanford (actual tips that worked)',
        'sharing my real application strategy + the mistakes i made',
        true
    ),
    (
        (SELECT id FROM users WHERE full_name ILIKE '%taylor%' LIMIT 1),
        'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        'nyu dorm life - what they don''t tell you',
        'the real tea on living in nyc as a college student',
        true
    )
ON CONFLICT DO NOTHING;

-- Verify the table was created
SELECT 'mentor_videos table created successfully!' as status;