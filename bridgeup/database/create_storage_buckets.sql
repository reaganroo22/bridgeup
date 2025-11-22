-- Create storage buckets for chat media uploads
-- Run this SQL in your Supabase SQL editor

-- Create chat-media bucket for images and videos in chats
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create mentor-videos bucket for mentor introduction videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mentor-videos', 'mentor-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for chat-media bucket
-- Allow authenticated users to upload to their own chat folders
CREATE POLICY "Users can upload chat media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-media' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to view chat media from their conversations
CREATE POLICY "Users can view chat media" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'chat-media'
        AND auth.role() = 'authenticated'
    );

-- Allow users to update their own chat media
CREATE POLICY "Users can update their chat media" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'chat-media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to delete their own chat media
CREATE POLICY "Users can delete their chat media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'chat-media'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- RLS Policies for mentor-videos bucket
-- Allow mentors to upload their introduction videos
CREATE POLICY "Mentors can upload videos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'mentor-videos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow anyone to view mentor videos (public)
CREATE POLICY "Anyone can view mentor videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'mentor-videos');

-- Allow mentors to update their own videos
CREATE POLICY "Mentors can update their videos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'mentor-videos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow mentors to delete their own videos
CREATE POLICY "Mentors can delete their videos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'mentor-videos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- RLS Policies for avatars bucket
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow anyone to view avatars (public profiles)
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Set up MIME type restrictions
UPDATE storage.buckets 
SET file_size_limit = 52428800, -- 50MB limit
    allowed_mime_types = ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ]
WHERE id IN ('chat-media', 'mentor-videos', 'avatars');

-- Verify buckets were created
SELECT 'Storage buckets created successfully!' as status,
       (SELECT COUNT(*) FROM storage.buckets WHERE id IN ('chat-media', 'mentor-videos', 'avatars')) as bucket_count;