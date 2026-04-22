import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  auths,
  blogs,
  categories,
  categoryOnBlogs,
  categoryOnPortfolios,
  portfolios,
  users,
} from "@/lib/db/schema";
import logger from "@/lib/logger";
import { hashPassword } from "@/util/password";
import { CategoryModel } from "@/modules/category/category.model";
import { seedBase } from "./seed-base";

const seedUser = {
  username: "admin",
  email: "admin@example.com",
  password: "12345678",
};

const seedCategories = [
  { name: "Web Development", color: CategoryModel.ColorEnum.BLUE },
  { name: "Mobile Apps", color: CategoryModel.ColorEnum.GREEN },
  { name: "UI/UX Design", color: CategoryModel.ColorEnum.VIOLET },
] as const;

const seedPortfolios = [
  {
    slug: "personal-portfolio-site",
    title: "Personal Portfolio Site",
    description:
      "A modern personal portfolio website built to showcase projects, skills, and contact information.",
    github_link: "https://github.com/example/personal-portfolio-site",
    preview_link: "https://portfolio.example.com",
    content: {
      blocks: [
        {
          type: "paragraph",
          data: {
            text: "A responsive portfolio platform with CMS-style editing and public sharing.",
          },
        },
      ],
    },
    categoryNames: ["Web Development", "UI/UX Design"],
    published: true,
  },
  {
    slug: "task-management-dashboard",
    title: "Task Management Dashboard",
    description:
      "A productivity dashboard for managing tasks, teams, and project timelines.",
    github_link: "https://github.com/example/task-management-dashboard",
    preview_link: "https://tasks.example.com",
    content: {
      blocks: [
        {
          type: "paragraph",
          data: {
            text: "Built with a focus on collaboration, analytics, and clean information architecture.",
          },
        },
      ],
    },
    categoryNames: ["Web Development"],
    published: true,
  },
] as const;

const seedBlogs = [
  {
    slug: "building-a-scalable-portfolio-platform",
    title: "Building a Scalable Portfolio Platform",
    description:
      "Lessons learned from designing and shipping a portfolio platform with reusable modules.",
    content: {
      blocks: [
        { type: "heading", data: { text: "Architecture Decisions", level: 2 } },
        {
          type: "paragraph",
          data: {
            text: "This article covers modular backend design, schema validation, and deployment considerations.",
          },
        },
      ],
    },
    categoryNames: ["Web Development"],
    published: true,
  },
  {
    slug: "designing-better-user-experiences",
    title: "Designing Better User Experiences",
    description:
      "Practical ideas for improving usability, accessibility, and visual consistency in digital products.",
    content: {
      blocks: [
        { type: "heading", data: { text: "Why UX Matters", level: 2 } },
        {
          type: "paragraph",
          data: {
            text: "Good user experience reduces friction and helps users achieve their goals faster.",
          },
        },
      ],
    },
    categoryNames: ["UI/UX Design"],
    published: true,
  },
] as const;

async function main() {
  try {
    logger.info("Starting dev seed");
    await db.transaction(async (tx) => {
      const { adminRole } = await seedBase(tx);

      const [user] = await tx
        .insert(users)
        .values({
          username: seedUser.username,
          email: seedUser.email,
          role_id: adminRole.id,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: { username: seedUser.username, role_id: adminRole.id },
        })
        .returning();

      const passwordHash = await hashPassword(seedUser.password);
      await tx
        .insert(auths)
        .values({ user_id: user.id, password_hash: passwordHash })
        .onConflictDoUpdate({
          target: auths.user_id,
          set: {
            password_hash: passwordHash,
            password_updated_at: new Date().toISOString(),
          },
        });

      logger.info("Seed user ready", {
        email: seedUser.email,
        username: seedUser.username,
      });

      const insertedCategories = await Promise.all(
        seedCategories.map(async (category) => {
          const [inserted] = await tx
            .insert(categories)
            .values({ name: category.name, color: category.color, user_id: user.id })
            .onConflictDoNothing()
            .returning();

          if (inserted) return inserted;

          const [existing] = await tx
            .select()
            .from(categories)
            .where(
              sql`${categories.user_id} = ${user.id} and ${categories.name} = ${category.name}`,
            )
            .limit(1);

          if (!existing)
            throw new Error(`Missing seeded category: ${category.name}`);
          return existing;
        }),
      );

      const categoryByName = new Map(
        insertedCategories.map((c) => [c.name, c]),
      );
      logger.info("Categories seeded", { count: insertedCategories.length });

      const insertedPortfolios = await Promise.all(
        seedPortfolios.map(async (portfolio) => {
          const publishedAt = portfolio.published ? new Date().toISOString() : null;

          const [inserted] = await tx
            .insert(portfolios)
            .values({
              slug: portfolio.slug,
              title: portfolio.title,
              description: portfolio.description,
              github_link: portfolio.github_link,
              preview_link: portfolio.preview_link,
              content: portfolio.content,
              user_id: user.id,
              published_at: publishedAt,
            })
            .onConflictDoUpdate({
              target: portfolios.slug,
              set: {
                title: portfolio.title,
                description: portfolio.description,
                github_link: portfolio.github_link,
                preview_link: portfolio.preview_link,
                content: portfolio.content,
                user_id: user.id,
                published_at: publishedAt,
              },
            })
            .returning();

          await tx
            .delete(categoryOnPortfolios)
            .where(sql`${categoryOnPortfolios.portfolio_id} = ${inserted.id}`);

          const values = portfolio.categoryNames.map((name) => {
            const cat = categoryByName.get(name);
            if (!cat) throw new Error(`Missing category for portfolio seed: ${name}`);
            return { portfolio_id: inserted.id, category_id: cat.id };
          });

          if (values.length) await tx.insert(categoryOnPortfolios).values(values);

          return inserted;
        }),
      );
      logger.info("Portfolios seeded", { count: insertedPortfolios.length });

      const insertedBlogs = await Promise.all(
        seedBlogs.map(async (blog) => {
          const publishedAt = blog.published ? new Date().toISOString() : null;

          const [inserted] = await tx
            .insert(blogs)
            .values({
              slug: blog.slug,
              title: blog.title,
              description: blog.description,
              content: blog.content,
              user_id: user.id,
              published_at: publishedAt,
            })
            .onConflictDoUpdate({
              target: blogs.slug,
              set: {
                title: blog.title,
                description: blog.description,
                content: blog.content,
                user_id: user.id,
                published_at: publishedAt,
              },
            })
            .returning();

          await tx
            .delete(categoryOnBlogs)
            .where(sql`${categoryOnBlogs.blog_id} = ${inserted.id}`);

          const values = blog.categoryNames.map((name) => {
            const cat = categoryByName.get(name);
            if (!cat) throw new Error(`Missing category for blog seed: ${name}`);
            return { blog_id: inserted.id, category_id: cat.id };
          });

          if (values.length) await tx.insert(categoryOnBlogs).values(values);

          return inserted;
        }),
      );
      logger.info("Blogs seeded", { count: insertedBlogs.length });
    });
    logger.info("Dev seed completed");
    process.exit(0);
  } catch (error) {
    logger.error("Dev seed failed", error);
    process.exit(1);
  }
}

main();
