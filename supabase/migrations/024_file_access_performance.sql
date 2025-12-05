-- =============================================
-- FILE VAULT - Performance Logging Enhancement
-- =============================================
-- Version: 1.0.0
-- Date: 2024-12-05
-- Description: Add performance tracking columns to file_accesses
-- =============================================

-- Add duration_ms column for tracking operation time
ALTER TABLE public.file_accesses
ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- Add operation_type for categorizing (upload, download, view, preview, thumbnail)
ALTER TABLE public.file_accesses
ADD COLUMN IF NOT EXISTS operation_type TEXT;

-- Add file_size_bytes for easier analytics
ALTER TABLE public.file_accesses
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

-- Add mime_type for file type analytics
ALTER TABLE public.file_accesses
ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Add cache_hit for tracking cache effectiveness
ALTER TABLE public.file_accesses
ADD COLUMN IF NOT EXISTS cache_hit BOOLEAN DEFAULT FALSE;

-- Add error flag for tracking failures
ALTER TABLE public.file_accesses
ADD COLUMN IF NOT EXISTS is_error BOOLEAN DEFAULT FALSE;

-- Add error_message for debugging
ALTER TABLE public.file_accesses
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add vault_id for easier tenant filtering
ALTER TABLE public.file_accesses
ADD COLUMN IF NOT EXISTS vault_id UUID REFERENCES public.file_vaults(id) ON DELETE CASCADE;

-- Add tenant_id for multi-tenant analytics
ALTER TABLE public.file_accesses
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create indexes for performance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_accesses_action_created
ON public.file_accesses(action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_accesses_vault
ON public.file_accesses(vault_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_accesses_tenant
ON public.file_accesses(tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_accesses_operation
ON public.file_accesses(operation_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_accesses_duration
ON public.file_accesses(duration_ms) WHERE duration_ms IS NOT NULL;

-- Create a function to log file access with performance data
CREATE OR REPLACE FUNCTION log_file_access(
  p_file_id UUID DEFAULT NULL,
  p_folder_id UUID DEFAULT NULL,
  p_vault_id UUID DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT 'view',
  p_operation_type TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_bytes_transferred BIGINT DEFAULT 0,
  p_file_size_bytes BIGINT DEFAULT 0,
  p_mime_type TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_cache_hit BOOLEAN DEFAULT FALSE,
  p_is_error BOOLEAN DEFAULT FALSE,
  p_error_message TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_access_id UUID;
BEGIN
  INSERT INTO public.file_accesses (
    file_id, folder_id, vault_id, tenant_id,
    action, operation_type,
    user_id, bytes_transferred, file_size_bytes, mime_type,
    duration_ms, cache_hit, is_error, error_message,
    ip_address, user_agent, details
  ) VALUES (
    p_file_id, p_folder_id, p_vault_id, p_tenant_id,
    p_action, p_operation_type,
    p_user_id, p_bytes_transferred, p_file_size_bytes, p_mime_type,
    p_duration_ms, p_cache_hit, p_is_error, p_error_message,
    p_ip_address, p_user_agent, p_details
  )
  RETURNING id INTO v_access_id;

  RETURN v_access_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for performance analytics
CREATE OR REPLACE VIEW file_performance_stats AS
SELECT
  vault_id,
  tenant_id,
  action,
  operation_type,

  -- Counts
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as count_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as count_7d,

  -- Bytes
  COALESCE(SUM(bytes_transferred), 0) as total_bytes,
  COALESCE(SUM(bytes_transferred) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'), 0) as bytes_24h,

  -- Duration stats
  COALESCE(AVG(duration_ms) FILTER (WHERE duration_ms > 0), 0) as avg_duration_ms,
  COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE duration_ms > 0), 0) as p95_duration_ms,
  COALESCE(MAX(duration_ms), 0) as max_duration_ms,

  -- Speed (bytes per second)
  CASE
    WHEN SUM(duration_ms) FILTER (WHERE duration_ms > 0) > 0
    THEN (SUM(bytes_transferred) FILTER (WHERE duration_ms > 0) * 1000.0 / SUM(duration_ms) FILTER (WHERE duration_ms > 0))
    ELSE 0
  END as avg_speed_bytes_per_sec,

  -- Cache stats
  COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits,
  COUNT(*) FILTER (WHERE cache_hit = false) as cache_misses,
  CASE
    WHEN COUNT(*) > 0
    THEN (COUNT(*) FILTER (WHERE cache_hit = true)::float / COUNT(*)::float)
    ELSE 0
  END as cache_hit_rate,

  -- Error stats
  COUNT(*) FILTER (WHERE is_error = true) as error_count,
  CASE
    WHEN COUNT(*) > 0
    THEN (COUNT(*) FILTER (WHERE is_error = true)::float / COUNT(*)::float)
    ELSE 0
  END as error_rate

FROM public.file_accesses
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY vault_id, tenant_id, action, operation_type;

-- Create a view for hourly breakdown
CREATE OR REPLACE VIEW file_access_hourly AS
SELECT
  vault_id,
  tenant_id,
  action,
  DATE_TRUNC('hour', created_at) as hour,
  EXTRACT(HOUR FROM created_at)::integer as hour_of_day,
  COUNT(*) as count,
  COALESCE(SUM(bytes_transferred), 0) as total_bytes,
  COALESCE(AVG(duration_ms), 0) as avg_duration_ms
FROM public.file_accesses
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY vault_id, tenant_id, action, DATE_TRUNC('hour', created_at), EXTRACT(HOUR FROM created_at);

-- RLS policy for the function
GRANT EXECUTE ON FUNCTION log_file_access TO authenticated;

COMMENT ON FUNCTION log_file_access IS 'Log file access with performance metrics';
COMMENT ON VIEW file_performance_stats IS 'Aggregated file access performance statistics';
COMMENT ON VIEW file_access_hourly IS 'Hourly breakdown of file accesses for last 24 hours';
