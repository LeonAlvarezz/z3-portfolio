ALTER TABLE "category_on_blogs" DROP CONSTRAINT "category_on_blogs_category_id_categories_id_fk";--> statement-breakpoint
ALTER TABLE "category_on_portfolios" DROP CONSTRAINT "category_on_portfolios_category_id_categories_id_fk";--> statement-breakpoint
ALTER TABLE "category_on_blogs" DROP CONSTRAINT "category_on_blogs_blog_id_category_id_pk";--> statement-breakpoint
ALTER TABLE "category_on_portfolios" DROP CONSTRAINT "category_on_portfolios_portfolio_id_category_id_pk";--> statement-breakpoint

CREATE SEQUENCE "categories_id_int_seq";--> statement-breakpoint

ALTER TABLE "categories" ADD COLUMN "id_int" integer;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id_int" SET DEFAULT nextval('categories_id_int_seq');--> statement-breakpoint
UPDATE "categories" SET "id_int" = nextval('categories_id_int_seq') WHERE "id_int" IS NULL;--> statement-breakpoint
SELECT setval('categories_id_int_seq', COALESCE((SELECT MAX("id_int") FROM "categories"), 0) + 1, false);--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id_int" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "category_on_blogs" ADD COLUMN "category_id_int" integer;--> statement-breakpoint
ALTER TABLE "category_on_portfolios" ADD COLUMN "category_id_int" integer;--> statement-breakpoint

UPDATE "category_on_blogs" AS cob
SET "category_id_int" = c."id_int"
FROM "categories" AS c
WHERE cob."category_id" = c."id";--> statement-breakpoint

UPDATE "category_on_portfolios" AS cop
SET "category_id_int" = c."id_int"
FROM "categories" AS c
WHERE cop."category_id" = c."id";--> statement-breakpoint

ALTER TABLE "category_on_blogs" ALTER COLUMN "category_id_int" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "category_on_portfolios" ALTER COLUMN "category_id_int" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "categories" DROP CONSTRAINT "categories_pkey";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "categories" RENAME COLUMN "id_int" TO "id";--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER SEQUENCE "categories_id_int_seq" OWNED BY "categories"."id";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" SET DEFAULT nextval('categories_id_int_seq');--> statement-breakpoint

ALTER TABLE "category_on_blogs" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "category_on_blogs" RENAME COLUMN "category_id_int" TO "category_id";--> statement-breakpoint
ALTER TABLE "category_on_portfolios" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "category_on_portfolios" RENAME COLUMN "category_id_int" TO "category_id";--> statement-breakpoint

ALTER TABLE "category_on_blogs" ADD CONSTRAINT "category_on_blogs_blog_id_category_id_pk" PRIMARY KEY("blog_id","category_id");--> statement-breakpoint
ALTER TABLE "category_on_portfolios" ADD CONSTRAINT "category_on_portfolios_portfolio_id_category_id_pk" PRIMARY KEY("portfolio_id","category_id");--> statement-breakpoint
ALTER TABLE "category_on_blogs" ADD CONSTRAINT "category_on_blogs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_on_portfolios" ADD CONSTRAINT "category_on_portfolios_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
