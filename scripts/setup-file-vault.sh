#!/bin/bash

# ============================================================================
# FILE VAULT - AUTOMATED SETUP SCRIPT
# ============================================================================
# This script automates the entire File Vault setup process
# Usage: bash scripts/setup-file-vault.sh
# ============================================================================

set -e  # Exit on error

echo "FILE VAULT - Automated Setup Starting..."
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# 1. CHECK PREREQUISITES
# ============================================================================
echo "Step 1: Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}Node.js found:${NC} $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}npm found:${NC} $(npm --version)"

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI not found${NC}"
    echo "Please install Supabase CLI first:"
    echo "  npm install -g supabase"
    echo "  # OR"
    echo "  brew install supabase/tap/supabase"
    exit 1
fi
echo -e "${GREEN}Supabase CLI found:${NC} $(supabase --version)"

echo ""

# ============================================================================
# 2. VERIFY MIGRATION FILE
# ============================================================================
echo "Step 2: Verifying migration files..."

MIGRATION_FILE="supabase/migrations/007_file_vault_system.sql"

if [ -f "$MIGRATION_FILE" ]; then
    echo -e "${GREEN}Migration file found:${NC} $MIGRATION_FILE"
else
    echo -e "${RED}Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo ""

# ============================================================================
# 3. SUPABASE PROJECT LINK CHECK
# ============================================================================
echo "Step 3: Checking Supabase project link..."

if supabase projects list &> /dev/null; then
    echo -e "${GREEN}Supabase is linked${NC}"
else
    echo -e "${YELLOW}Supabase project may not be linked${NC}"
    echo ""
    echo "To link your project, run:"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "Get your project ref from:"
    echo "  https://app.supabase.com/project/_/settings/general"
    echo ""
fi

echo ""

# ============================================================================
# 4. DISPLAY NEXT STEPS
# ============================================================================
echo "============================================="
echo -e "${GREEN}SETUP PREPARATION COMPLETE${NC}"
echo "============================================="
echo ""
echo "Next steps to complete File Vault setup:"
echo ""
echo "1. Link Supabase project (if not linked):"
echo "   supabase link --project-ref YOUR_PROJECT_REF"
echo ""
echo "2. Apply database migrations:"
echo "   supabase db push"
echo ""
echo "3. Create storage bucket in Supabase Dashboard:"
echo "   - Go to: https://app.supabase.com/project/_/storage/buckets"
echo "   - Create bucket: file-vault"
echo "   - Settings: public=false, file size limit=50GB"
echo ""
echo "4. Apply storage RLS policies:"
echo "   - Go to: SQL Editor"
echo "   - Run: scripts/storage-policies.sql"
echo ""
echo "5. Verify setup:"
echo "   supabase migration list"
echo ""
echo "6. Start development:"
echo "   npm run dev"
echo ""
echo "============================================="
echo "Files created:"
echo "  - supabase/migrations/007_file_vault_system.sql"
echo "  - scripts/storage-policies.sql"
echo "============================================="
echo ""
