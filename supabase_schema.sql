-- IMPORTANT: Run this SQL in your Supabase Dashboard SQL Editor
-- This creates the required tables for shipshow.io

-- Create trigger function for updating timestamps
create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

-- Create User table
create table if not exists "User" (
  "id" text primary key,
  "handle" text not null unique,
  "name" text,
  "bio" text,
  "avatarUrl" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Create Project table
create table if not exists "Project" (
  "id" text primary key,
  "userId" text not null,
  "title" text not null,
  "description" text,
  "url" text,
  "imageUrl" text,
  "sort" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "Project_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade
);

-- Create Subscription table
create table if not exists "Subscription" (
  "id" text primary key,
  "userId" text not null unique,
  "stripeCustomerId" text,
  "stripeSubscriptionId" text,
  "status" text not null default 'free',
  "priceId" text,
  "currentPeriodEnd" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "Subscription_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade
);

-- Create Domain table
create table if not exists "Domain" (
  "id" text primary key,
  "userId" text not null,
  "domain" text not null unique,
  "handle" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "Domain_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade
);

-- Create indexes
create index if not exists "Project_userId_sort_idx" on "Project" ("userId","sort");
create index if not exists "Domain_domain_idx" on "Domain" ("domain");

-- Drop existing triggers if they exist
drop trigger if exists set_timestamp_user on "User";
drop trigger if exists set_timestamp_project on "Project";
drop trigger if exists set_timestamp_subscription on "Subscription";
drop trigger if exists set_timestamp_domain on "Domain";

-- Create triggers for auto-updating timestamps
create trigger set_timestamp_user before update on "User"
for each row execute function trigger_set_timestamp();
create trigger set_timestamp_project before update on "Project"
for each row execute function trigger_set_timestamp();
create trigger set_timestamp_subscription before update on "Subscription"
for each row execute function trigger_set_timestamp();
create trigger set_timestamp_domain before update on "Domain"
for each row execute function trigger_set_timestamp();
