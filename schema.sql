create table courses(
    id serial primary key,
    title text not null,
    description text,
    price numeric(10,2) check(price >= 0),
    category text not null,
    isPublished boolean
);

create table enrollments(
    id serial primary key,
    courseId integer references courses(id) on delete  cascade,
    usersId integer references users(id) on delete cascade
);

create table users(
    id serial primary key,
    name text,
    password text not null,
    role text check(role in ('student','admin')),
    email text unique
);