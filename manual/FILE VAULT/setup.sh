#!/bin/bash

# ================================================================
# FILE VAULT - AUTOMATIC SETUP SCRIPT
# ================================================================

set -e

echo "🚀 Starting File Vault setup..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from /home/claude/eos2-main"
    exit 1
fi

# Step 1: Copy migration file
echo "📋 Step 1: Copying SQL migration..."
if [ -f "/mnt/user-data/outputs/008_file_vault_complete_with_storage.sql" ]; then
    cp /mnt/user-data/outputs/008_file_vault_complete_with_storage.sql supabase/migrations/
    echo "✅ Migration file copied"
else
    echo "❌ Error: Migration file not found!"
    exit 1
fi

# Step 2: Apply migration
echo ""
echo "📦 Step 2: Applying migration (this creates everything)..."
echo "   - Storage bucket"
echo "   - Storage policies"
echo "   - Database tables"
echo "   - Database policies"
echo ""

supabase db push

echo ""
echo "✅ Migration applied!"

# Step 3: Verify
echo ""
echo "🔍 Step 3: Verifying setup..."
echo ""
echo "Please check Supabase Dashboard:"
echo ""
echo "1. Database > Tables"
echo "   Should see: file_vaults, file_folders, files,"
echo "               file_shares, file_versions, file_activities"
echo ""
echo "2. Storage > Buckets"
echo "   Should see: file-vault"
echo ""
echo "3. Storage > file-vault > Policies"
echo "   Should see: 5 policies (upload, read, update, delete, public read)"
echo ""

# Step 4: Install dependencies
echo "📚 Step 4: Installing dependencies..."
cd apps/web
npm install

echo ""
echo "✅ Dependencies installed!"
echo ""

# Done
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Open: http://localhost:3000/file-vault"
echo "3. Try uploading a file!"
echo ""
echo "If something doesn't work, check:"
echo "- Supabase Dashboard > Database > Tables"
echo "- Supabase Dashboard > Storage > Buckets"
echo "- Browser DevTools > Console (for errors)"
echo ""

