select
  qr_code_id,
  device,
  scanned_at
from public.scans
order by scanned_at desc;
