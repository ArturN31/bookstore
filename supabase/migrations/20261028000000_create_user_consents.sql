create table public.user_consents (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null unique,
    analytics boolean default false not null,
    version text not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_consents enable row level security;

create policy "Users can view and update their own consent"
    on public.user_consents for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);