-- ============================================================================
-- CAPACITY CONNECT — Supabase schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================================

-- ---------- extensions ----------
create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type user_role as enum ('trainee', 'trainer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type course_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enrollment_status as enum ('enrolled', 'in_progress', 'completed', 'failed');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'trainee',
  status approval_status not null default 'pending',
  designation text,
  region text,
  qualifications text,
  skills text[] default '{}',
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- courses ----------
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  trainer_id uuid references profiles(id) on delete set null,
  status course_status not null default 'draft',
  cover_color text default '#0B3D5C',
  created_at timestamptz not null default now()
);

-- ---------- course materials ----------
create table if not exists course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  type text not null default 'link', -- video | pdf | slides | link
  url text not null,
  created_at timestamptz not null default now()
);

-- ---------- enrollments ----------
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  trainee_id uuid references profiles(id) on delete cascade,
  status enrollment_status not null default 'enrolled',
  progress int not null default 0,
  enrolled_at timestamptz not null default now(),
  unique (course_id, trainee_id)
);

-- ---------- quizzes ----------
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  deadline timestamptz,
  pass_percent int not null default 60,
  created_at timestamptz not null default now()
);

-- ---------- quiz questions ----------
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question text not null,
  options jsonb not null, -- ["opt a","opt b","opt c","opt d"]
  correct_index int not null,
  difficulty int not null default 1, -- 1 easy .. 3 hard
  created_at timestamptz not null default now()
);

-- ---------- quiz attempts ----------
create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  trainee_id uuid references profiles(id) on delete cascade,
  score int not null,
  total int not null,
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

-- ---------- certificates ----------
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  cert_hash text not null,
  issued_at timestamptz not null default now(),
  unique (trainee_id, course_id)
);

-- ---------- feedback ----------
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  trainee_id uuid references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (course_id, trainee_id)
);

-- ---------- announcements ----------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Auto-create a profile row whenever someone signs up
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
  safe_role public.user_role;
begin
  requested_role := new.raw_user_meta_data->>'role';
  safe_role := case
    when requested_role in ('trainee', 'trainer', 'admin')
      then requested_role::user_role
    else 'trainee'::user_role
  end;

  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.email, ''),
    safe_role,
    'pending'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_materials enable row level security;
alter table enrollments enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table certificates enable row level security;
alter table feedback enable row level security;
alter table announcements enable row level security;

-- small helper: is the current user an approved admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$ language sql stable security definer;

create or replace function public.is_approved()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and status = 'approved'
  );
$$ language sql stable security definer;

-- ---------- profiles policies ----------
create policy "profiles: self read" on profiles for select
  using (id = auth.uid() or is_admin() or status = 'approved');

create policy "profiles: self update" on profiles for update
  using (id = auth.uid() or is_admin());

create policy "profiles: admin insert" on profiles for insert
  with check (id = auth.uid());

-- ---------- courses policies ----------
create policy "courses: read published or own" on courses for select
  using (status = 'published' or trainer_id = auth.uid() or is_admin());

create policy "courses: trainer/admin write" on courses for insert
  with check (trainer_id = auth.uid() or is_admin());

create policy "courses: trainer/admin update" on courses for update
  using (trainer_id = auth.uid() or is_admin());

create policy "courses: trainer/admin delete" on courses for delete
  using (trainer_id = auth.uid() or is_admin());

-- ---------- course_materials policies ----------
create policy "materials: read if approved" on course_materials for select
  using (is_approved());

create policy "materials: trainer/admin write" on course_materials for insert
  with check (
    is_admin() or exists (select 1 from courses c where c.id = course_id and c.trainer_id = auth.uid())
  );

create policy "materials: trainer/admin delete" on course_materials for delete
  using (
    is_admin() or exists (select 1 from courses c where c.id = course_id and c.trainer_id = auth.uid())
  );

-- ---------- enrollments policies ----------
create policy "enrollments: read own or trainer/admin" on enrollments for select
  using (
    trainee_id = auth.uid() or is_admin() or
    exists (select 1 from courses c where c.id = course_id and c.trainer_id = auth.uid())
  );

create policy "enrollments: trainee insert self" on enrollments for insert
  with check (trainee_id = auth.uid());

create policy "enrollments: trainee/trainer/admin update" on enrollments for update
  using (
    trainee_id = auth.uid() or is_admin() or
    exists (select 1 from courses c where c.id = course_id and c.trainer_id = auth.uid())
  );

-- ---------- quizzes / questions ----------
create policy "quizzes: read if approved" on quizzes for select using (is_approved());
create policy "quizzes: trainer/admin write" on quizzes for insert
  with check (is_admin() or exists (select 1 from courses c where c.id = course_id and c.trainer_id = auth.uid()));
create policy "quizzes: trainer/admin update" on quizzes for update
  using (is_admin() or exists (select 1 from courses c where c.id = course_id and c.trainer_id = auth.uid()));
create policy "quizzes: trainer/admin delete" on quizzes for delete
  using (is_admin() or exists (select 1 from courses c where c.id = course_id and c.trainer_id = auth.uid()));

create policy "questions: read if approved" on quiz_questions for select using (is_approved());
create policy "questions: trainer/admin write" on quiz_questions for insert
  with check (is_admin() or exists (
    select 1 from quizzes q join courses c on c.id = q.course_id
    where q.id = quiz_id and c.trainer_id = auth.uid()));
create policy "questions: trainer/admin delete" on quiz_questions for delete
  using (is_admin() or exists (
    select 1 from quizzes q join courses c on c.id = q.course_id
    where q.id = quiz_id and c.trainer_id = auth.uid()));

-- ---------- quiz attempts ----------
create policy "attempts: read own or trainer/admin" on quiz_attempts for select
  using (
    trainee_id = auth.uid() or is_admin() or exists (
      select 1 from quizzes q join courses c on c.id = q.course_id
      where q.id = quiz_id and c.trainer_id = auth.uid())
  );
create policy "attempts: trainee insert self" on quiz_attempts for insert
  with check (trainee_id = auth.uid());

-- ---------- certificates ----------
create policy "certs: read own or trainer/admin" on certificates for select
  using (trainee_id = auth.uid() or is_admin() or exists (
    select 1 from courses c where c.id = course_id and c.trainer_id = auth.uid()));
create policy "certs: system insert" on certificates for insert
  with check (trainee_id = auth.uid() or is_admin());

-- ---------- feedback ----------
create policy "feedback: read if approved" on feedback for select using (is_approved());
create policy "feedback: trainee insert self" on feedback for insert with check (trainee_id = auth.uid());

-- ---------- announcements ----------
create policy "announcements: read if approved" on announcements for select using (is_approved());
create policy "announcements: admin write" on announcements for insert with check (is_admin());
create policy "announcements: admin delete" on announcements for delete using (is_admin());

-- ============================================================================
-- Done. Next: create your first admin account by signing up in the app,
-- then in Table Editor → profiles, set that row's role = 'admin' and
-- status = 'approved' manually (one-time bootstrap step).
-- ============================================================================
