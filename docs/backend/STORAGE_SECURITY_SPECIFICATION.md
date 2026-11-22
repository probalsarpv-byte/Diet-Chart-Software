# Supabase Storage Security Specification

**Document ID:** SHUDDHO-DOC-R2-008  
**Storage Engine:** Supabase Private Storage (S3 API Compatible)  
**Security Standard:** Strict Private Access with Presigned URL Generation  

---

## 1. Storage Buckets Overview

| Bucket Name | Access Policy | Allowed MIME Types | File Size Limit | RLS Access Rule |
|---|---|---|---|---|
| `clinical-dossiers` | **Private** | `application/pdf`, `image/png`, `image/jpeg` | 50 MB | Same organization clinicians only |
| `patient-files` | **Private** | `application/pdf`, `application/json` | 25 MB | Same organization clinicians & patient token |

---

## 2. Storage RLS Policies

```sql
-- Policies for storage.objects table
CREATE POLICY "clinical_dossiers_select_policy"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'clinical-dossiers' AND
  (storage.foldername(name))[1] IN (SELECT org_id::text FROM public.current_clinician_org_ids())
);

CREATE POLICY "clinical_dossiers_insert_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'clinical-dossiers' AND
  (storage.foldername(name))[1] IN (SELECT org_id::text FROM public.current_clinician_org_ids())
);
```

---

## 3. Storage Metadata Tracking (`private_file_references`)

All file uploads are tracked in `public.private_file_references` with:
- `bucket_name`
- `storage_path`
- `file_name`
- `file_size_bytes`
- `mime_type`
- `uploaded_by` (Clinician UUID)
- `created_at`
