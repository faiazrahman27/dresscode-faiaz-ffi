select
  qr_code_id,
  user_id,
  full_name,
  created_at
from public.code_profiles
order by created_at desc;
