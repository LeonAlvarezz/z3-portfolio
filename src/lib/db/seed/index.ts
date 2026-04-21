import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  auths,
  blogs,
  categories,
  categoryOnBlogs,
  categoryOnPortfolios,
  permissionFlags,
  portfolios,
  resources,
  roles,
  users,
} from "@/lib/db/schema";
import env from "@/lib/env";
import logger from "@/lib/logger";
import { RoleModel } from "@/modules/role/role.model";
import { hashPassword } from "@/util/password";
import { CategoryModel } from "@/modules/category/category.model";

const baseResources = [
  "User",
  "Role",
  "Resource",
  "Portfolio",
  "Blog",
  "Category",
] as const;

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
    cover_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    github_link: "https://github.com/example/personal-portfolio-site",
    preview_link: "https://portfolio.example.com",
    gallery: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    ],
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
    cover_url: "https://images.unsplash.com/photo-1552664730-d307ca884978",
    github_link: "https://github.com/example/task-management-dashboard",
    preview_link: "https://tasks.example.com",
    gallery: [
      "https://images.unsplash.com/photo-1552664730-d307ca884978",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    ],
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
    cover_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    content: {
      blocks: [
        {
          type: "heading",
          data: {
            text: "Architecture Decisions",
            level: 2,
          },
        },
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
    cover_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
    content: {
      blocks: [
        {
          type: "heading",
          data: {
            text: "Why UX Matters",
            level: 2,
          },
        },
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

type ResourceName = (typeof baseResources)[number];

function permissionFor(roleName: RoleModel.Enum, resourceName: ResourceName) {
  if (roleName === RoleModel.Enum.Admin) {
    return { read: true, write: true, delete: true };
  }

  const userManagedResources = new Set<ResourceName>([
    "Portfolio",
    "Blog",
    "Category",
  ]);

  if (userManagedResources.has(resourceName)) {
    return { read: true, write: true, delete: true };
  }

  return {
    read: resourceName === "User",
    write: false,
    delete: false,
  };
}

export async function seedDatabase() {
  await db.transaction(async (tx) => {
    const resourceByName = new Map<
      ResourceName,
      typeof resources.$inferSelect
    >();
    const baseRoles = Object.values(RoleModel.Enum);
    const insertedRoles: RoleModel.Entity[] = [];
    for (const name of baseRoles) {
      const [role] = await tx
        .insert(roles)
        .values({ name })
        .onConflictDoUpdate({
          target: roles.name,
          set: { name },
        })
        .returning();
      insertedRoles.push(role);
    }

    logger.info("Roles seeded", { count: insertedRoles.length });

    for (const name of baseResources) {
      const [resource] = await tx
        .insert(resources)
        .values({ name })
        .onConflictDoUpdate({
          target: resources.name,
          set: { name },
        })
        .returning();

      resourceByName.set(name, resource);
    }

    logger.info("Resources seeded", { count: resourceByName.size });

    for (const role of insertedRoles) {
      for (const resourceName of baseResources) {
        const resource = resourceByName.get(resourceName);
        if (!resource)
          throw new Error(`Missing seeded resource: ${resourceName}`);

        const permission = permissionFor(
          role.name as RoleModel.Enum,
          resourceName,
        );

        await tx
          .insert(permissionFlags)
          .values({
            role_id: role.id,
            resource_id: resource.id,
            ...permission,
          })
          .onConflictDoUpdate({
            target: [permissionFlags.role_id, permissionFlags.resource_id],
            set: permission,
          });
      }
    }

    logger.info("Permissions seeded", {
      count: baseRoles.length * baseResources.length,
    });

    const adminRole = insertedRoles.find(
      (role) => role.name === RoleModel.Enum.Admin,
    );
    if (!adminRole) throw new Error("Missing seeded Admin role");

    const [user] = await tx
      .insert(users)
      .values({
        username: seedUser.username,
        email: seedUser.email,
        role_id: adminRole.id,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          username: seedUser.username,
          role_id: adminRole.id,
        },
      })
      .returning();

    const passwordHash = await hashPassword(seedUser.password);

    await tx
      .insert(auths)
      .values({
        user_id: user.id,
        password_hash: passwordHash,
      })
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
        const [insertedCategory] = await tx
          .insert(categories)
          .values({
            name: category.name,
            color: category.color,
            user_id: user.id,
          })
          .onConflictDoNothing()
          .returning();

        if (insertedCategory) return insertedCategory;

        const [existingCategory] = await tx
          .select()
          .from(categories)
          .where(
            sql`${categories.user_id} = ${user.id} and ${categories.name} = ${category.name}`,
          )
          .limit(1);

        if (!existingCategory) {
          throw new Error(`Missing seeded category: ${category.name}`);
        }

        return existingCategory;
      }),
    );

    const categoryByName = new Map(
      insertedCategories.map((category) => [category.name, category]),
    );

    logger.info("Categories seeded", { count: insertedCategories.length });

    const insertedPortfolios = await Promise.all(
      seedPortfolios.map(async (portfolio) => {
        const publishedAt = portfolio.published
          ? new Date().toISOString()
          : null;

        const [insertedPortfolio] = await tx
          .insert(portfolios)
          .values({
            slug: portfolio.slug,
            title: portfolio.title,
            description: portfolio.description,
            cover_url: portfolio.cover_url,
            github_link: portfolio.github_link,
            preview_link: portfolio.preview_link,
            gallery: [...portfolio.gallery],
            content: portfolio.content,
            user_id: user.id,
            published_at: publishedAt,
          })
          .onConflictDoUpdate({
            target: portfolios.slug,
            set: {
              title: portfolio.title,
              description: portfolio.description,
              cover_url: portfolio.cover_url,
              github_link: portfolio.github_link,
              preview_link: portfolio.preview_link,
              gallery: [...portfolio.gallery],
              content: portfolio.content,
              user_id: user.id,
              published_at: publishedAt,
            },
          })
          .returning();

        await tx
          .delete(categoryOnPortfolios)
          .where(
            sql`${categoryOnPortfolios.portfolio_id} = ${insertedPortfolio.id}`,
          );

        const portfolioCategoryValues = portfolio.categoryNames.map(
          (categoryName) => {
            const category = categoryByName.get(categoryName);
            if (!category) {
              throw new Error(
                `Missing category for portfolio seed: ${categoryName}`,
              );
            }

            return {
              portfolio_id: insertedPortfolio.id,
              category_id: category.id,
            };
          },
        );

        if (portfolioCategoryValues.length) {
          await tx.insert(categoryOnPortfolios).values(portfolioCategoryValues);
        }

        return insertedPortfolio;
      }),
    );

    logger.info("Portfolios seeded", { count: insertedPortfolios.length });

    const insertedBlogs = await Promise.all(
      seedBlogs.map(async (blog) => {
        const publishedAt = blog.published ? new Date().toISOString() : null;

        const [insertedBlog] = await tx
          .insert(blogs)
          .values({
            slug: blog.slug,
            title: blog.title,
            description: blog.description,
            cover_url: blog.cover_url,
            content: blog.content,
            user_id: user.id,
            published_at: publishedAt,
          })
          .onConflictDoUpdate({
            target: blogs.slug,
            set: {
              title: blog.title,
              description: blog.description,
              cover_url: blog.cover_url,
              content: blog.content,
              user_id: user.id,
              published_at: publishedAt,
            },
          })
          .returning();

        await tx
          .delete(categoryOnBlogs)
          .where(sql`${categoryOnBlogs.blog_id} = ${insertedBlog.id}`);

        const blogCategoryValues = blog.categoryNames.map((categoryName) => {
          const category = categoryByName.get(categoryName);
          if (!category) {
            throw new Error(`Missing category for blog seed: ${categoryName}`);
          }

          return {
            blog_id: insertedBlog.id,
            category_id: category.id,
          };
        });

        if (blogCategoryValues.length) {
          await tx.insert(categoryOnBlogs).values(blogCategoryValues);
        }

        return insertedBlog;
      }),
    );

    logger.info("Blogs seeded", { count: insertedBlogs.length });
  });
}

async function main() {
  try {
    logger.info("Starting database seed");
    await seedDatabase();
    logger.info("Database seed completed");
    process.exit(0);
  } catch (error) {
    logger.error("Database seed failed", error);
    process.exit(1);
  }
}

main();
