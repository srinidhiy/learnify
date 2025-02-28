alter table "public"."documents" alter column "status" drop default;

alter type "public"."document_status" rename to "document_status__old_version_to_be_dropped";

create type "public"."document_status" as enum ('unread', 'in_progress', 'completed', 'archived');

alter table "public"."documents" alter column status type "public"."document_status" using status::text::"public"."document_status";

alter table "public"."documents" alter column "status" set default 'unread'::document_status;

drop type "public"."document_status__old_version_to_be_dropped";


