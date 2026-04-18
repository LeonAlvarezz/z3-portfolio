import { NotFoundException } from "@/core/error";
import { CategoryRepository } from "./category.repository";
import type { CategoryModel } from "./category.model";

export abstract class CategoryService {
	static async findAllPublic() {
		return await CategoryRepository.findAllPublic();
	}

	static async findByUser(userId: number) {
		return await CategoryRepository.findByUser(userId);
	}

	static async create(
		userId: number,
		payload: CategoryModel.CreateCategoryDto,
	) {
		return await CategoryRepository.create(userId, payload);
	}

	static async update(
		id: string,
		userId: number,
		payload: CategoryModel.UpdateCategoryDto,
	) {
		const category = await CategoryRepository.update(id, userId, payload);
		if (!category)
			throw new NotFoundException({ message: "Category not found" });
		return category;
	}

	static async delete(id: string, userId: number) {
		const category = await CategoryRepository.delete(id, userId);
		if (!category)
			throw new NotFoundException({ message: "Category not found" });
		return category;
	}
}
