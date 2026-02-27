create table access_state
(
    last_update timestamp(6) with time zone,
    data        jsonb,
    key         varchar(255) not null primary key,
    type        varchar(255)
);

create index idx_access_type on access_state (type);
create index idx_access_last_update on access_state (last_update);

create table project_state
(
    last_update timestamp(6) with time zone,
    data        jsonb,
    key         varchar(255) not null primary key,
    type        varchar(255)
);

create index idx_project_type on project_state (type);
create index idx_project_last_update on project_state (last_update);

create table session_state
(
    expiry      timestamp(6) with time zone,
    last_update timestamp(6) with time zone,
    data        jsonb,
    key         varchar(255) not null primary key,
    type        varchar(255)
);

create index idx_session_type on session_state (type);
create index idx_session_expire on session_state (expiry);
