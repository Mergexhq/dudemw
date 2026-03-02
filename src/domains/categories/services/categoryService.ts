import { prisma } from '@/lib/db';
import { Category, CategoryWithChildren, CategoryFilters, CreateCategoryData, UpdateCategoryData } from '../types';

class CategoryServiceClass {
  async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    const categories = await prisma.categories.findMany({
      where: {
        ...(filters?.search ? { name: { contains: filters.search, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { name: 'asc' },
    });
    return categories as unknown as Category[];
  }

  async getCategoryTree(): Promise<CategoryWithChildren[]> {
    const data = await prisma.categories.findMany({ orderBy: { name: 'asc' } });

    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    data.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        status: category.status as "active" | "inactive" | undefined,
        display_order: category.display_order ?? undefined,
        children: []
      } as unknown as CategoryWithChildren);
    });

    data.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      rootCategories.push(categoryWithChildren);
    });

    return rootCategories;
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await prisma.categories.findUniqueOrThrow({ where: { id } });
    return category as unknown as Category;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const category = await prisma.categories.findFirstOrThrow({ where: { slug } });
    return category as unknown as Category;
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    const category = await prisma.categories.create({ data: data as any });
    return category as unknown as Category;
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    const category = await prisma.categories.update({ where: { id }, data: data as any });
    return category as unknown as Category;
  }

  async deleteCategory(id: string): Promise<void> {
    await prisma.categories.delete({ where: { id } });
  }
}

export const categoryService = new CategoryServiceClass();

