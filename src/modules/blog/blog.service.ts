import { BadRequestException, NotFoundException } from "@/core/error";
import { db } from "@/lib/db";
import type { BlogModel } from "./blog.model";
import { slugify } from "@/util/string";
import { getMeta } from "@/util/pagination";
import { BlogRepository } from "./blog.repository";

function uniqueCategoryIds(categoryIds: string[]) {
  return [...new Set(categoryIds)];
}

export abstract class BlogService {
  // static async paginateByUser(userId: number, filter: BlogModel.Filter) {
  //   const result = await BlogRepository.paginateByUser(userId, filter);
  //   return {
  //     data: result.data,
  //     meta: getMeta(filter, result.total_count),
  //   };
  // }

  // static async paginatePublished(filter: BlogModel.Filter) {
  //   const result = await BlogRepository.paginatePublished(filter);
  //   return {
  //     data: result.data,
  //     meta: getMeta(filter, result.total_count),
  //   };
  // }
  //

  static async paginatePublishedByUsername(
    filter: BlogModel.Filter,
    username: string,
  ) {
    const result = await BlogRepository.paginatePublishedByUsername(
      filter,
      username,
    );
    return {
      data: result.data,
      meta: getMeta(filter, result.total_count),
    };
  }

  static async findOwnedById(id: string, userId: number) {
    const blog = await BlogRepository.findOwnedById(id, userId);
    if (!blog) throw new NotFoundException({ message: "Blog not found" });
    return blog;
  }

  static async findPublishedBySlug(slug: string) {
    const blog = await BlogRepository.findPublishedBySlug(slug);
    if (!blog) throw new NotFoundException({ message: "Blog not found" });
    return blog;
  }

  static async create(userId: number, payload: BlogModel.Create) {
    const slug = await this.getAvailableSlug(payload.slug ?? payload.title);
    const categoryIds = uniqueCategoryIds(payload.category_ids ?? []);
    await this.assertCategoriesOwned(categoryIds, userId);

    return await db.transaction(async (tx) => {
      const blog = await BlogRepository.create(
        userId,
        {
          ...payload,
          slug,
        },
        tx,
      );

      await BlogRepository.replaceCategories(blog.id, categoryIds, tx);
      return blog;
    });
  }

  static async update(id: string, userId: number, payload: BlogModel.Update) {
    await this.findOwnedById(id, userId);

    const { category_ids, ...updatePayload } = payload;
    const nextPayload = { ...updatePayload };
    const categoryIds = category_ids
      ? uniqueCategoryIds(category_ids)
      : undefined;

    if (payload.slug) {
      nextPayload.slug = await this.getAvailableSlug(payload.slug, id);
    }

    if (categoryIds) {
      await this.assertCategoriesOwned(categoryIds, userId);
    }

    return await db.transaction(async (tx) => {
      const blog = await BlogRepository.update(id, userId, nextPayload, tx);

      if (!blog) throw new NotFoundException({ message: "Blog not found" });

      if (categoryIds) {
        await BlogRepository.replaceCategories(id, categoryIds, tx);
      }

      return blog;
    });
  }

  static async delete(id: string, userId: number) {
    const blog = await BlogRepository.delete(id, userId);
    if (!blog) throw new NotFoundException({ message: "Blog not found" });
    return blog;
  }

  static async publish(id: string, userId: number) {
    const blog = await BlogRepository.publish(id, userId);
    if (!blog) throw new NotFoundException({ message: "Blog not found" });
    return blog;
  }

  static async unpublish(id: string, userId: number) {
    const blog = await BlogRepository.unpublish(id, userId);
    if (!blog) throw new NotFoundException({ message: "Blog not found" });
    return blog;
  }

  static async assignCategories(
    id: string,
    userId: number,
    payload: BlogModel.AssignCategories,
  ) {
    await this.findOwnedById(id, userId);
    const categoryIds = uniqueCategoryIds(payload.category_ids);
    await this.assertCategoriesOwned(categoryIds, userId);
    await BlogRepository.replaceCategories(id, categoryIds);
    return await this.findOwnedById(id, userId);
  }

  static async increaseView(slug: string) {
    const blog = await this.findPublishedBySlug(slug);
    await BlogRepository.increaseView(blog.id);
    return blog;
  }

  private static async getAvailableSlug(value: string, currentId?: string) {
    const baseSlug = slugify(value);
    if (!baseSlug) throw new BadRequestException({ message: "Invalid slug" });

    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await BlogRepository.findBySlug(slug);
      if (!existing || existing.id === currentId) return slug;
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private static async assertCategoriesOwned(
    categoryIds: string[],
    userId: number,
  ) {
    const uniqueIds = uniqueCategoryIds(categoryIds);
    const owned = await BlogRepository.findOwnedCategories(uniqueIds, userId);
    if (owned.length !== uniqueIds.length) {
      throw new BadRequestException({
        message: "One or more categories do not exist",
      });
    }
  }
}
