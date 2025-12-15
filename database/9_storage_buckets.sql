-- ============================================
-- STORAGE BUCKETS SETUP FOR ADMIN
-- Run these SQL commands in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. BLOG IMAGES BUCKET
-- Purpose: Blog post cover images and inline images
-- ============================================

-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Enable for blog-images bucket
CREATE POLICY "Blog images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'blog-images' 
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'blog-images' 
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'blog-images' 
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

-- ============================================
-- 2. TUTORIAL MEDIA BUCKET
-- Purpose: Tutorial videos and images
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('tutorial-media', 'tutorial-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Enable for tutorial-media bucket
CREATE POLICY "Tutorial media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'tutorial-media');

CREATE POLICY "Admins can upload tutorial media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'tutorial-media' 
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update tutorial media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'tutorial-media' 
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete tutorial media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'tutorial-media' 
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

-- ============================================
-- 3. CONTENT ASSETS BUCKET
-- Purpose: General content assets (PDFs, documents, misc)
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('content-assets', 'content-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Enable for content-assets bucket
CREATE POLICY "Content assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-assets');

CREATE POLICY "Admins can upload content assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'content-assets' 
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update content assets"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'content-assets' 
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete content assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'content-assets' 
    AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
);

-- ============================================
-- BUCKET CONFIGURATION SUMMARY
-- ============================================
/*
BUCKET NAME         | PUBLIC READ | ADMIN WRITE | USE CASE
--------------------|-------------|-------------|---------------------------
blog-images         | ✅          | ✅          | Blog cover & inline images
tutorial-media      | ✅          | ✅          | Tutorial videos & images  
content-assets      | ✅          | ✅          | PDFs, documents, misc files
avatars             | ✅          | Users only  | User profile pictures (existing)

FILE SIZE LIMITS (configure in Supabase Dashboard):
- blog-images:      5MB max (optimized images)
- tutorial-media:   500MB max (video support)
- content-assets:   50MB max (documents)

ALLOWED MIME TYPES:
- blog-images:      image/jpeg, image/png, image/webp, image/gif
- tutorial-media:   image/*, video/mp4, video/webm, video/quicktime
- content-assets:   image/*, application/pdf, application/msword, 
                    application/vnd.openxmlformats-officedocument.*

FILE PATH STRUCTURE:
- blog-images:      {article-slug}/{filename}.{ext}
- tutorial-media:   {tutorial-id}/{type}/{filename}.{ext}
- content-assets:   {content-type}/{year}/{month}/{filename}.{ext}
*/

-- ============================================
-- USAGE IN FRONTEND (JavaScript/React)
-- ============================================
/*
import { supabase } from '../lib/supabaseClient'

// Upload blog image
const uploadBlogImage = async (file, articleSlug) => {
  const filename = `${articleSlug}/${Date.now()}-${file.name}`
  
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(data.path)
  
  return publicUrl
}

// Upload tutorial video
const uploadTutorialVideo = async (file, tutorialId) => {
  const filename = `${tutorialId}/video/${Date.now()}-${file.name}`
  
  const { data, error } = await supabase.storage
    .from('tutorial-media')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  return supabase.storage.from('tutorial-media').getPublicUrl(data.path).data.publicUrl
}

// Delete file
const deleteFile = async (bucket, path) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) throw error
}
*/
