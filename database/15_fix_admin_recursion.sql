-- ============================================
-- FIX ADMIN RLS INFINITE RECURSION
-- This fixes the infinite recursion error when
-- storage policies check the admins table
-- ============================================

-- Step 1: Create a SECURITY DEFINER function to check admin status
-- This bypasses RLS on the admins table
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = check_user_id
  );
$$;

-- Step 2: Create a function to check super admin status
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = check_user_id AND role = 'super_admin'
  );
$$;

-- Step 3: Fix admins table policies to not self-reference
DROP POLICY IF EXISTS "Admins can view admin table" ON admins;
CREATE POLICY "Admins can view admin table"
    ON admins FOR SELECT
    USING (
        -- Allow users to see their own admin record
        user_id = auth.uid()
        OR
        -- Allow service role
        auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;
CREATE POLICY "Super admins can manage admins"
    ON admins FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Step 4: Update storage bucket policies to use the new function
-- Drop old policies first
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload tutorial media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update tutorial media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete tutorial media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload content assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update content assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete content assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload user avatars for users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete user avatars" ON storage.objects;

-- Recreate storage policies using the new function

-- Blog images bucket
CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'blog-images' 
    AND public.is_admin()
);

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'blog-images' 
    AND public.is_admin()
);

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'blog-images' 
    AND public.is_admin()
);

-- Tutorial media bucket
CREATE POLICY "Admins can upload tutorial media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'tutorial-media' 
    AND public.is_admin()
);

CREATE POLICY "Admins can update tutorial media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'tutorial-media' 
    AND public.is_admin()
);

CREATE POLICY "Admins can delete tutorial media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'tutorial-media' 
    AND public.is_admin()
);

-- Content assets bucket
CREATE POLICY "Admins can upload content assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'content-assets' 
    AND public.is_admin()
);

CREATE POLICY "Admins can update content assets"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'content-assets' 
    AND public.is_admin()
);

CREATE POLICY "Admins can delete content assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'content-assets' 
    AND public.is_admin()
);

-- User avatars bucket - admin policies
CREATE POLICY "Admins can upload user avatars for users"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-avatars' 
    AND public.is_admin()
);

CREATE POLICY "Admins can update user avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'user-avatars' 
    AND public.is_admin()
);

CREATE POLICY "Admins can delete user avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user-avatars' 
    AND public.is_admin()
);

-- ============================================
-- Grant execute permissions on the functions
-- ============================================
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO anon;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Admin RLS recursion fix applied successfully!';
    RAISE NOTICE 'The is_admin() and is_super_admin() functions now handle admin checks without RLS recursion.';
END $$;
