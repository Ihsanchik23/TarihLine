create or replace function public.move_route_item(p_item_id uuid, p_direction text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_route_id uuid;
  v_position integer;
  v_neighbor_id uuid;
  v_neighbor_position integer;
  v_temporary_position integer;
begin
  if p_direction not in ('up', 'down') or (select auth.uid()) is null then
    return false;
  end if;

  select route_items.route_id
  into v_route_id
  from public.route_items
  join public.routes on routes.id = route_items.route_id
  where route_items.id = p_item_id
    and routes.user_id = (select auth.uid());

  if v_route_id is null then
    return false;
  end if;

  perform 1
  from public.route_items
  where route_id = v_route_id
  order by id
  for update;

  select position
  into v_position
  from public.route_items
  where id = p_item_id
    and route_id = v_route_id;

  if p_direction = 'up' then
    select id, position
    into v_neighbor_id, v_neighbor_position
    from public.route_items
    where route_id = v_route_id
      and position < v_position
    order by position desc
    limit 1;
  else
    select id, position
    into v_neighbor_id, v_neighbor_position
    from public.route_items
    where route_id = v_route_id
      and position > v_position
    order by position
    limit 1;
  end if;

  if v_neighbor_id is null then
    return false;
  end if;

  select coalesce(max(position), 0) + 1
  into v_temporary_position
  from public.route_items
  where route_id = v_route_id;

  update public.route_items
  set position = v_temporary_position
  where id = p_item_id;

  update public.route_items
  set position = v_position
  where id = v_neighbor_id;

  update public.route_items
  set position = v_neighbor_position
  where id = p_item_id;

  return true;
end;
$$;

revoke all on function public.move_route_item(uuid, text) from public, anon;
grant execute on function public.move_route_item(uuid, text) to authenticated;
