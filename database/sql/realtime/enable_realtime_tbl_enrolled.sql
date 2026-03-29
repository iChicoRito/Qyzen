-- ==================== ENABLE REAL-TIME ON TBL_ENROLLED ====================
-- File: database/sql/realtime/enable_realtime_tbl_enrolled.sql
-- Created: 2026-03-29
-- Purpose: Add tbl_enrolled to Supabase realtime publication.

ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_enrolled;
