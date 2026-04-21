import { BadRequestException, NotFoundException } from "@/core/error";
import { db } from "@/lib/db";
import { PortfolioRepository } from "./portfolio.repository";
import type { PortfolioModel } from "./portfolio.model";
import { getMeta } from "@/util/pagination";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueCategoryIds(categoryIds: string[]) {
  return [...new Set(categoryIds)];
}

export abstract class PortfolioService {
  // static async paginateByUser(userId: number, filter: PortfolioModel.Filter) {
  //   const result = await PortfolioRepository.paginateByUser(userId, filter);
  //   return {
  //     data: result.data,
  //     meta: paginationMeta(filter, result.total_count),
  //   };
  // }

  static async paginatePublishedByUser(
    filter: PortfolioModel.Filter,
    username: string,
  ) {
    const result = await PortfolioRepository.paginatePublishedByUsername(
      filter,
      username,
    );
    return {
      data: result.data,
      meta: getMeta(filter, result.total_count),
    };
  }

  static async findOwnedById(id: string, userId: number) {
    const portfolio = await PortfolioRepository.findOwnedById(id, userId);
    if (!portfolio)
      throw new NotFoundException({ message: "Portfolio not found" });
    return portfolio;
  }

  static async findPublishedBySlug(slug: string) {
    const portfolio = await PortfolioRepository.findPublishedBySlug(slug);
    if (!portfolio)
      throw new NotFoundException({ message: "Portfolio not found" });
    return portfolio;
  }

  static async create(userId: number, payload: PortfolioModel.Create) {
    const slug = await this.getAvailableSlug(payload.slug ?? payload.title);
    const categoryIds = uniqueCategoryIds(payload.category_ids ?? []);
    await this.assertCategoriesOwned(categoryIds, userId);

    return await db.transaction(async (tx) => {
      const portfolio = await PortfolioRepository.create(
        userId,
        {
          ...payload,
          slug,
        },
        tx,
      );

      await PortfolioRepository.replaceCategories(
        portfolio.id,
        categoryIds,
        tx,
      );
      return portfolio;
    });
  }

  static async update(
    id: string,
    userId: number,
    payload: PortfolioModel.Update,
  ) {
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
      const portfolio = await PortfolioRepository.update(
        id,
        userId,
        nextPayload,
        tx,
      );

      if (!portfolio)
        throw new NotFoundException({ message: "Portfolio not found" });

      if (categoryIds) {
        await PortfolioRepository.replaceCategories(id, categoryIds, tx);
      }

      return portfolio;
    });
  }

  static async delete(id: string, userId: number) {
    const portfolio = await PortfolioRepository.delete(id, userId);
    if (!portfolio)
      throw new NotFoundException({ message: "Portfolio not found" });
    return portfolio;
  }

  static async publish(id: string, userId: number) {
    const portfolio = await PortfolioRepository.publish(id, userId);
    if (!portfolio)
      throw new NotFoundException({ message: "Portfolio not found" });
    return portfolio;
  }

  static async unpublish(id: string, userId: number) {
    const portfolio = await PortfolioRepository.unpublish(id, userId);
    if (!portfolio)
      throw new NotFoundException({ message: "Portfolio not found" });
    return portfolio;
  }

  static async assignCategories(
    id: string,
    userId: number,
    payload: PortfolioModel.AssignCategories,
  ) {
    await this.findOwnedById(id, userId);
    const categoryIds = uniqueCategoryIds(payload.category_ids);
    await this.assertCategoriesOwned(categoryIds, userId);
    await PortfolioRepository.replaceCategories(id, categoryIds);
    return await this.findOwnedById(id, userId);
  }

  static async increaseView(slug: string) {
    const portfolio = await this.findPublishedBySlug(slug);
    await PortfolioRepository.increaseView(portfolio.id);
    return portfolio;
  }

  private static async getAvailableSlug(value: string, currentId?: string) {
    const baseSlug = slugify(value);
    if (!baseSlug) throw new BadRequestException({ message: "Invalid slug" });

    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await PortfolioRepository.findBySlug(slug);
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
    const owned = await PortfolioRepository.findOwnedCategories(
      uniqueIds,
      userId,
    );
    if (owned.length !== uniqueIds.length) {
      throw new BadRequestException({
        message: "One or more categories do not exist",
      });
    }
  }
}
