-- User File Collections
-- Allows users to organize files into personal collections

-- Create user_file_collections table
CREATE TABLE IF NOT EXISTS public.user_file_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#279989',
    icon VARCHAR(50) DEFAULT 'folder-heart',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(user_id, vault_id, name)
);

-- Create user_collection_files junction table
CREATE TABLE IF NOT EXISTS public.user_collection_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES public.user_file_collections(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(collection_id, file_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_file_collections_user ON public.user_file_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_file_collections_vault ON public.user_file_collections(vault_id);
CREATE INDEX IF NOT EXISTS idx_user_collection_files_collection ON public.user_collection_files(collection_id);
CREATE INDEX IF NOT EXISTS idx_user_collection_files_file ON public.user_collection_files(file_id);

-- RLS policies
ALTER TABLE public.user_file_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection_files ENABLE ROW LEVEL SECURITY;

-- Users can only see their own collections
CREATE POLICY "Users can view own collections"
    ON public.user_file_collections
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own collections
CREATE POLICY "Users can create own collections"
    ON public.user_file_collections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own collections
CREATE POLICY "Users can update own collections"
    ON public.user_file_collections
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete own collections"
    ON public.user_file_collections
    FOR DELETE
    USING (auth.uid() = user_id);

-- Collection files policies
CREATE POLICY "Users can view files in own collections"
    ON public.user_collection_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_file_collections
            WHERE id = collection_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add files to own collections"
    ON public.user_collection_files
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_file_collections
            WHERE id = collection_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove files from own collections"
    ON public.user_collection_files
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_file_collections
            WHERE id = collection_id AND user_id = auth.uid()
        )
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_file_collections_updated_at
    BEFORE UPDATE ON public.user_file_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_user_collection_updated_at();
