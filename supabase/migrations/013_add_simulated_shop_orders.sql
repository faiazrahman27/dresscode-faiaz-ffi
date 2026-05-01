-- 013_add_simulated_shop_orders.sql
--
-- Purpose:
-- Add a production-shaped simulated shop flow.
--
-- This does not add real payment yet.
-- It creates products, simulated orders, order items, and QR assignments.
-- Public checkout goes through a controlled, rate-limited RPC.
--
-- Later, a payment provider can be added by changing order/payment statuses
-- and creating QR codes only after payment confirmation.

begin;

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'qr_product',
  description text,
  image_url text,
  price_cents integer not null default 0,
  currency text not null default 'EUR',
  code_type text not null default 'open',
  template_id uuid references public.content_templates(id) on delete set null,
  qr_quantity integer not null default 1,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_products_category_check
    check (category in ('qr_product', 'collectible', 'wearable', 'accessory', 'digital')),
  constraint shop_products_price_cents_check
    check (price_cents >= 0),
  constraint shop_products_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint shop_products_code_type_check
    check (code_type in ('open', 'locked')),
  constraint shop_products_qr_quantity_check
    check (qr_quantity between 1 and 20),
  constraint shop_products_locked_template_check
    check (
      (code_type = 'open' and template_id is null)
      or
      (code_type = 'locked' and template_id is not null)
    )
);

create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_email text not null,
  buyer_name text,
  status text not null default 'simulated',
  payment_status text not null default 'not_required',
  total_cents integer not null default 0,
  currency text not null default 'EUR',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_orders_buyer_email_length_check
    check (length(buyer_email) between 3 and 254),
  constraint shop_orders_status_check
    check (status in ('simulated', 'pending_payment', 'paid', 'fulfilled', 'cancelled')),
  constraint shop_orders_payment_status_check
    check (payment_status in ('not_required', 'pending', 'paid', 'failed', 'refunded')),
  constraint shop_orders_total_cents_check
    check (total_cents >= 0),
  constraint shop_orders_currency_check
    check (currency ~ '^[A-Z]{3}$')
);

create table if not exists public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  product_id uuid references public.shop_products(id) on delete set null,
  product_snapshot jsonb not null default '{}'::jsonb,
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  total_cents integer not null default 0,
  created_at timestamptz not null default now(),
  constraint shop_order_items_quantity_check
    check (quantity between 1 and 20),
  constraint shop_order_items_unit_price_check
    check (unit_price_cents >= 0),
  constraint shop_order_items_total_check
    check (total_cents >= 0)
);

create table if not exists public.shop_order_qr_codes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  order_item_id uuid not null references public.shop_order_items(id) on delete cascade,
  qr_code_id uuid not null references public.qr_codes(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint shop_order_qr_codes_qr_code_unique unique (qr_code_id)
);

create index if not exists shop_products_active_sort_idx
  on public.shop_products (is_active, sort_order, created_at desc);

create index if not exists shop_orders_buyer_email_idx
  on public.shop_orders (buyer_email);

create index if not exists shop_orders_created_at_idx
  on public.shop_orders (created_at desc);

create index if not exists shop_order_items_order_id_idx
  on public.shop_order_items (order_id);

create index if not exists shop_order_qr_codes_order_id_idx
  on public.shop_order_qr_codes (order_id);

create index if not exists shop_order_qr_codes_order_item_id_idx
  on public.shop_order_qr_codes (order_item_id);

drop trigger if exists set_shop_products_updated_at on public.shop_products;
create trigger set_shop_products_updated_at
before update on public.shop_products
for each row
execute function public.set_updated_at();

drop trigger if exists set_shop_orders_updated_at on public.shop_orders;
create trigger set_shop_orders_updated_at
before update on public.shop_orders
for each row
execute function public.set_updated_at();

alter table public.shop_products enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;
alter table public.shop_order_qr_codes enable row level security;

drop policy if exists public_can_read_active_shop_products on public.shop_products;
create policy public_can_read_active_shop_products
on public.shop_products
for select
to anon, authenticated
using (is_active = true);

drop policy if exists admins_can_manage_shop_products on public.shop_products;
create policy admins_can_manage_shop_products
on public.shop_products
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists admins_can_manage_shop_orders on public.shop_orders;
create policy admins_can_manage_shop_orders
on public.shop_orders
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists buyers_can_view_own_shop_orders on public.shop_orders;
create policy buyers_can_view_own_shop_orders
on public.shop_orders
for select
to authenticated
using (
  lower(buyer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists admins_can_manage_shop_order_items on public.shop_order_items;
create policy admins_can_manage_shop_order_items
on public.shop_order_items
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists buyers_can_view_own_shop_order_items on public.shop_order_items;
create policy buyers_can_view_own_shop_order_items
on public.shop_order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.shop_orders o
    where o.id = shop_order_items.order_id
      and lower(o.buyer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists admins_can_manage_shop_order_qr_codes on public.shop_order_qr_codes;
create policy admins_can_manage_shop_order_qr_codes
on public.shop_order_qr_codes
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists buyers_can_view_own_shop_order_qr_codes on public.shop_order_qr_codes;
create policy buyers_can_view_own_shop_order_qr_codes
on public.shop_order_qr_codes
for select
to authenticated
using (
  exists (
    select 1
    from public.shop_orders o
    where o.id = shop_order_qr_codes.order_id
      and lower(o.buyer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

revoke all on table public.shop_products from public, anon, authenticated;
revoke all on table public.shop_orders from public, anon, authenticated;
revoke all on table public.shop_order_items from public, anon, authenticated;
revoke all on table public.shop_order_qr_codes from public, anon, authenticated;

grant select on table public.shop_products to anon, authenticated;

grant select, insert, update, delete on table public.shop_products to authenticated;
grant select, insert, update, delete on table public.shop_orders to authenticated;
grant select, insert, update, delete on table public.shop_order_items to authenticated;
grant select, insert, update, delete on table public.shop_order_qr_codes to authenticated;

create or replace function public.create_simulated_shop_order(
  p_product_id uuid,
  p_buyer_email text,
  p_quantity integer default 1,
  p_buyer_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_rate jsonb;
  v_email text;
  v_buyer_name text;
  v_quantity integer;
  v_product public.shop_products%rowtype;
  v_order public.shop_orders%rowtype;
  v_item public.shop_order_items%rowtype;
  v_total_cents integer;
  v_total_qr_count integer;
  v_order_number text;
  v_code text;
  v_scratch_code text;
  v_label text;
  v_qr public.qr_codes%rowtype;
  v_qrs jsonb := '[]'::jsonb;
  v_attempt integer;
  v_index integer;
begin
  v_rate := public.check_endpoint_rate_limit(
    'simulated_shop_order',
    8,
    20,
    3600,
    900
  );

  if coalesce((v_rate ->> 'allowed')::boolean, false) is false then
    return jsonb_build_object('success', false) || v_rate;
  end if;

  v_email := lower(left(trim(coalesce(p_buyer_email, '')), 254));
  v_buyer_name := nullif(left(trim(coalesce(p_buyer_name, '')), 120), '');
  v_quantity := greatest(1, least(10, coalesce(p_quantity, 1)));

  if v_email = '' then
    return jsonb_build_object(
      'success', false,
      'status', 400,
      'message', 'Buyer email is required.'
    );
  end if;

  if v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object(
      'success', false,
      'status', 400,
      'message', 'Buyer email must be a valid email address.'
    );
  end if;

  select *
  into v_product
  from public.shop_products
  where id = p_product_id
    and is_active = true
  limit 1;

  if v_product.id is null then
    return jsonb_build_object(
      'success', false,
      'status', 404,
      'message', 'Product not found or inactive.'
    );
  end if;

  if v_product.code_type = 'locked' and v_product.template_id is null then
    return jsonb_build_object(
      'success', false,
      'status', 409,
      'message', 'This locked product is missing its template.'
    );
  end if;

  v_total_qr_count := v_quantity * v_product.qr_quantity;

  if v_total_qr_count > 20 then
    return jsonb_build_object(
      'success', false,
      'status', 400,
      'message', 'This simulated order would create too many QR codes.'
    );
  end if;

  v_total_cents := v_product.price_cents * v_quantity;
  v_order_number := 'DC-SIM-' || to_char(now(), 'YYYYMMDD') || '-' ||
    upper(left(replace(gen_random_uuid()::text, '-', ''), 8));

  insert into public.shop_orders (
    order_number,
    buyer_email,
    buyer_name,
    status,
    payment_status,
    total_cents,
    currency,
    notes
  )
  values (
    v_order_number,
    v_email,
    v_buyer_name,
    'simulated',
    'not_required',
    v_total_cents,
    v_product.currency,
    'Simulated checkout. No real payment was collected.'
  )
  returning *
  into v_order;

  insert into public.shop_order_items (
    order_id,
    product_id,
    product_snapshot,
    quantity,
    unit_price_cents,
    total_cents
  )
  values (
    v_order.id,
    v_product.id,
    jsonb_build_object(
      'id', v_product.id,
      'slug', v_product.slug,
      'name', v_product.name,
      'category', v_product.category,
      'description', v_product.description,
      'price_cents', v_product.price_cents,
      'currency', v_product.currency,
      'code_type', v_product.code_type,
      'qr_quantity', v_product.qr_quantity
    ),
    v_quantity,
    v_product.price_cents,
    v_total_cents
  )
  returning *
  into v_item;

  for v_index in 1..v_total_qr_count loop
    v_attempt := 0;

    loop
      v_attempt := v_attempt + 1;

      v_code := 'SHOP-' ||
        upper(left(replace(gen_random_uuid()::text, '-', ''), 6)) ||
        '-' ||
        upper(left(replace(gen_random_uuid()::text, '-', ''), 4));

      v_scratch_code :=
        upper(left(replace(gen_random_uuid()::text, '-', ''), 4)) || '-' ||
        upper(left(replace(gen_random_uuid()::text, '-', ''), 4)) || '-' ||
        upper(left(replace(gen_random_uuid()::text, '-', ''), 4));

      v_label := left(v_product.name || ' - ' || v_order.order_number || ' #' || v_index, 160);

      begin
        insert into public.qr_codes (
          code,
          scratch_code,
          label,
          code_type,
          activated,
          activated_by,
          activated_at,
          redeemed_by,
          redeemed_at,
          assigned_to,
          created_by,
          is_active,
          template_id,
          assigned_email
        )
        values (
          v_code,
          v_scratch_code,
          v_label,
          v_product.code_type,
          false,
          null,
          null,
          null,
          null,
          null,
          null,
          true,
          case when v_product.code_type = 'locked' then v_product.template_id else null end,
          v_email
        )
        returning *
        into v_qr;

        exit;
      exception
        when unique_violation then
          if v_attempt >= 12 then
            raise;
          end if;
      end;
    end loop;

    insert into public.shop_order_qr_codes (
      order_id,
      order_item_id,
      qr_code_id
    )
    values (
      v_order.id,
      v_item.id,
      v_qr.id
    );

    v_qrs := v_qrs || jsonb_build_array(
      jsonb_build_object(
        'id', v_qr.id,
        'code', v_qr.code,
        'scratch_code', v_qr.scratch_code,
        'label', v_qr.label,
        'code_type', v_qr.code_type,
        'assigned_email', v_qr.assigned_email,
        'activate_path', '/activate/' || v_qr.code,
        'public_path', '/p/' || v_qr.code
      )
    );
  end loop;

  return jsonb_build_object(
    'success', true,
    'message', 'Simulated order created.',
    'order', jsonb_build_object(
      'id', v_order.id,
      'order_number', v_order.order_number,
      'buyer_email', v_order.buyer_email,
      'buyer_name', v_order.buyer_name,
      'status', v_order.status,
      'payment_status', v_order.payment_status,
      'total_cents', v_order.total_cents,
      'currency', v_order.currency,
      'created_at', v_order.created_at
    ),
    'item', jsonb_build_object(
      'id', v_item.id,
      'product_id', v_product.id,
      'product_name', v_product.name,
      'quantity', v_item.quantity,
      'unit_price_cents', v_item.unit_price_cents,
      'total_cents', v_item.total_cents
    ),
    'qr_codes', v_qrs
  );
end;
$function$;

revoke execute on function public.create_simulated_shop_order(uuid, text, integer, text)
from public, anon, authenticated;

grant execute on function public.create_simulated_shop_order(uuid, text, integer, text)
to anon, authenticated;

insert into public.shop_products (
  slug,
  name,
  category,
  description,
  price_cents,
  currency,
  code_type,
  template_id,
  qr_quantity,
  is_active,
  sort_order
)
values
  (
    'creator-qr-card-pack',
    'Creator QR Card Pack',
    'qr_product',
    'A simulated pack of QR-linked profile cards for testing buyer-bound activation.',
    1200,
    'EUR',
    'open',
    null,
    1,
    true,
    10
  ),
  (
    'digital-identity-patch',
    'Digital Identity Patch',
    'collectible',
    'A collectible patch concept connected to a live digital identity page.',
    1800,
    'EUR',
    'open',
    null,
    1,
    true,
    20
  ),
  (
    'wearable-qr-label',
    'Wearable QR Label',
    'wearable',
    'A garment-label simulation for linking clothing, drops, and product stories to QR profiles.',
    2400,
    'EUR',
    'open',
    null,
    1,
    true,
    30
  ),
  (
    'collector-drop-bundle',
    'Collector Drop Bundle',
    'collectible',
    'A simulated bundle that creates multiple buyer-bound QR identities in one order.',
    3900,
    'EUR',
    'open',
    null,
    2,
    true,
    40
  )
on conflict (slug) do update
set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  code_type = excluded.code_type,
  template_id = excluded.template_id,
  qr_quantity = excluded.qr_quantity,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

commit;
