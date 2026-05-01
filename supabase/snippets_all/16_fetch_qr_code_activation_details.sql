select
  code,
  activated,
  activated_by,
  activated_at
from public.qr_codes
where code = 'DC-TEST-001';
