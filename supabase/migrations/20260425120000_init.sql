 -- Skin Intelligence — initial schema
  -- Tables for manual logging. Whoop sync integration arrives in a later migration.                                                                                                                           
                                                                                                                                                                                                               
  create extension if not exists "uuid-ossp";
                                                                                                                                                                                                               
  -- ----------------------------------------------------------------                                                                                                                                          
  -- profiles: one row per authed user, mirrored from auth.users.
  -- ----------------------------------------------------------------                                                                                                                                          
  create table public.profiles (                                                                                                                                                                               
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz default now()                                                                                                                                                                       
  );              

  create or replace function public.handle_new_user()                                                                                                                                                          
  returns trigger language plpgsql security definer as $$
  begin                                                                                                                                                                                                        
    insert into public.profiles (id) values (new.id) on conflict do nothing;
    return new;
  end;                                                                                                                                                                                                         
  $$;
                                                                                                                                                                                                               
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
                                                                                                                                                                                                               
  -- ----------------------------------------------------------------
  -- manual_log: one row per user per day. Severity, itch, stress, etc.                                                                                                                                        
  -- ----------------------------------------------------------------
  create table public.manual_log (                                                                                                                                                                             
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,                                                                                                                                         
    date date not null,                                                                                                                                                                                        
    eczema_severity smallint check (eczema_severity between 0 and 5),
    itch_level smallint check (itch_level between 0 and 5),                                                                                                                                                    
    stress_level smallint check (stress_level between 0 and 5),
    menstrual_day smallint check (menstrual_day between 1 and 60),                                                                                                                                             
    body_parts_affected text[] default '{}'::text[],
    topicals_used text[] default '{}'::text[],                                                                                                                                                                 
    notes text,   
    created_at timestamptz default now(),                                                                                                                                                                      
    updated_at timestamptz default now(),
    unique (user_id, date)                                                                                                                                                                                     
  );
                                                                                                                                                                                                               
  create index manual_log_user_date_idx on public.manual_log (user_id, date desc);

  -- ----------------------------------------------------------------
  -- food_log: one row per meal.
  -- ----------------------------------------------------------------                                                                                                                                          
  create table public.food_log (
    id uuid primary key default uuid_generate_v4(),                                                                                                                                                            
    user_id uuid not null references auth.users(id) on delete cascade,
    date date not null,                                                                                                                                                                                        
    time time,
    description text,                                                                                                                                                                                          
    tags text[] default '{}'::text[],
    created_at timestamptz default now()
  );

  create index food_log_user_date_idx on public.food_log (user_id, date desc);                                                                                                                                 
   
  -- ----------------------------------------------------------------                                                                                                                                          
  -- photos: metadata. Files live in storage bucket 'photos'.
  -- ----------------------------------------------------------------                                                                                                                                          
  create table public.photos (
    id uuid primary key default uuid_generate_v4(),                                                                                                                                                            
    user_id uuid not null references auth.users(id) on delete cascade,
    date date not null,                                                                                                                                                                                        
    kind text not null check (kind in ('skin', 'food', 'cream')),
    storage_path text not null,                                                                                                                                                                                
    notes text,   
    created_at timestamptz default now()                                                                                                                                                                       
  );
                                                                                                                                                                                                               
  create index photos_user_date_idx on public.photos (user_id, date desc);

  -- ----------------------------------------------------------------
  -- Row Level Security: each user only sees their own rows.
  -- ----------------------------------------------------------------                                                                                                                                          
  alter table public.profiles enable row level security;
  alter table public.manual_log enable row level security;                                                                                                                                                     
  alter table public.food_log enable row level security;
  alter table public.photos enable row level security;                                                                                                                                                         
   
  create policy "own profile" on public.profiles for all                                                                                                                                                       
    using (auth.uid() = id) with check (auth.uid() = id);
  create policy "own manual_log" on public.manual_log for all                                                                                                                                                  
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "own food_log" on public.food_log for all                                                                                                                                                      
    using (auth.uid() = user_id) with check (auth.uid() = user_id);                                                                                                                                            
  create policy "own photos" on public.photos for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);                                                                                                                                            
                                                                                                                                                                                                               
  -- ----------------------------------------------------------------
  -- Storage bucket for photos (private, per-user folders).                                                                                                                                                    
  -- ----------------------------------------------------------------
  insert into storage.buckets (id, name, public)                                                                                                                                                               
  values ('photos', 'photos', false)
  on conflict (id) do nothing;                                                                                                                                                                                 
                  
  create policy "upload own photos" on storage.objects for insert                                                                                                                                              
    with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
  create policy "read own photos" on storage.objects for select                                                                                                                                                
    using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);                                                                                                                         
  create policy "delete own photos" on storage.objects for delete
    using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);                                                                                                                         
                  
