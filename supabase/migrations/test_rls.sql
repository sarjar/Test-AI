-- Test script for RLS policies and user management

-- First, let's create a test user
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Create a test user in auth.users
    INSERT INTO auth.users (
        id,
        email,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'test@example.com',
        jsonb_build_object(
            'name', 'Test User',
            'full_name', 'Test User Full Name',
            'avatar_url', 'https://example.com/avatar.jpg'
        ),
        now(),
        now()
    ) RETURNING id INTO test_user_id;

    -- Verify the trigger created the user profile
    ASSERT EXISTS (
        SELECT 1 FROM public.users 
        WHERE user_id = test_user_id::text
    ), 'User profile was not created by trigger';

    -- Test RLS policies
    -- 1. Test SELECT policy
    SET LOCAL ROLE authenticated;
    SET LOCAL "request.jwt.claims" TO jsonb_build_object(
        'sub', test_user_id::text,
        'role', 'authenticated'
    );
    
    -- Should be able to view own profile
    ASSERT EXISTS (
        SELECT 1 FROM public.users 
        WHERE user_id = test_user_id::text
    ), 'Could not view own profile';

    -- Should not be able to view other profiles
    ASSERT NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE user_id != test_user_id::text
    ), 'Could view other profiles';

    -- 2. Test UPDATE policy
    -- Should be able to update own profile
    UPDATE public.users 
    SET name = 'Updated Name'
    WHERE user_id = test_user_id::text;
    
    ASSERT EXISTS (
        SELECT 1 FROM public.users 
        WHERE user_id = test_user_id::text 
        AND name = 'Updated Name'
    ), 'Could not update own profile';

    -- 3. Test INSERT policy
    -- Should not be able to insert another user's profile
    BEGIN
        INSERT INTO public.users (
            id,
            user_id,
            email,
            name,
            token_identifier
        ) VALUES (
            gen_random_uuid(),
            gen_random_uuid()::text,
            'other@example.com',
            'Other User',
            'other@example.com'
        );
        ASSERT false, 'Should not be able to insert another user profile';
    EXCEPTION
        WHEN OTHERS THEN
            -- Expected error
            NULL;
    END;

    -- Clean up
    DELETE FROM auth.users WHERE id = test_user_id;
    DELETE FROM public.users WHERE user_id = test_user_id::text;

    RAISE NOTICE 'All RLS policy tests passed successfully!';
END;
$$; 