import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface ProductQueryFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Service providing core business logic for product management.
 * Performs database queries and transactions utilizing Prisma ORM.
 */
@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  /**
   * Persists a new Product in SQLite database.
   *
   * @param createProductDto - Transfer object containing new product specifications.
   * @returns Promise resolving to the persisted Product record.
   */
  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        title: createProductDto.title,
        description: createProductDto.description,
        price: createProductDto.price,
        image: createProductDto.image,
        category: createProductDto.category,
        stock: createProductDto.stock ?? 0,
      },
    });
  }

  /**
   * Performs dynamic, database-level queries to fetch list of products based on query constraints.
   * Supports pagination, category exact matches, price bounds, and case-insensitive OR matches on title/description.
   *
   * @param filters - ProductQueryFilters object containing query criteria.
   * @returns Object wrapping products list, count total, page offset, and total pages.
   */
  async findAll(filters: ProductQueryFilters) {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
    } = filters;

    const where: Prisma.ProductWhereInput = {};

    // Apply case-insensitive wildcard searches across title/description fields
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Apply exact filter for category
    if (category) {
      where.category = category;
    }

    // Construct price range comparison criteria
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Prisma.FloatFilter = {};
      if (minPrice !== undefined) {
        priceFilter.gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        priceFilter.lte = Number(maxPrice);
      }
      where.price = priceFilter;
    }

    // Bound page and limits to positive numbers
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const shouldSortByRating = sortBy === 'rating';
    const querySkip = shouldSortByRating ? undefined : skip;
    const queryTake = shouldSortByRating ? undefined : limitNumber;
    let queryOrderBy: Prisma.ProductOrderByWithRelationInput | undefined = undefined;

    if (sortBy && sortBy !== 'rating') {
      const order = sortOrder === 'asc' ? 'asc' : 'desc';
      if (sortBy === 'price') {
        queryOrderBy = { price: order };
      } else if (sortBy === 'title') {
        queryOrderBy = { title: order };
      } else if (sortBy === 'newest') {
        queryOrderBy = { createdAt: 'desc' };
      }
    } else if (!sortBy) {
      queryOrderBy = { createdAt: 'desc' };
    }

    // Concurrently fetch products chunk and calculate total matches count
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: querySkip,
        take: queryTake,
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: queryOrderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    let productsWithRatings = products.map((product) => {
      const reviews = product.reviews || [];
      const reviewsCount = reviews.length;
      const averageRating =
        reviewsCount > 0
          ? Number(
              (
                reviews.reduce((sum, r) => sum + r.rating, 0) /
                reviewsCount
              ).toFixed(1),
            )
          : 0;

      // Extract reviews array to minimize response payload size
      const { reviews: _, ...productData } = product as any;

      return {
        ...productData,
        averageRating,
        reviewsCount,
      };
    });

    if (shouldSortByRating) {
      const order = sortOrder === 'asc' ? 'asc' : 'desc';
      productsWithRatings.sort((a, b) => {
        if (order === 'asc') {
          return a.averageRating - b.averageRating;
        } else {
          return b.averageRating - a.averageRating;
        }
      });
      // Apply pagination manually
      productsWithRatings = productsWithRatings.slice(skip, skip + limitNumber);
    }

    const totalPages = Math.ceil(total / limitNumber);

    return {
      products: productsWithRatings,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages,
    };
  }

  /**
   * Retrieves single product information from database.
   * Throws 404 Exception if the product ID is not found.
   *
   * @param id - Product unique database identifier (UUID).
   * @returns Promise resolving to the found product.
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    const reviews = product.reviews || [];
    const reviewsCount = reviews.length;
    const averageRating =
      reviewsCount > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) /
              reviewsCount
            ).toFixed(1),
          )
        : 0;

    return {
      ...product,
      reviews,
      averageRating,
      reviewsCount,
    };
  }

  /**
   * Modifies columns of an existing product.
   * Throws 404 Exception if the target product ID does not exist.
   *
   * @param id - Target product UUID.
   * @param updateProductDto - Updated properties.
   * @returns Promise resolving to the modified product record.
   */
  async update(id: string, updateProductDto: UpdateProductDto) {
    // Ensure product exists
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        title: updateProductDto.title,
        description: updateProductDto.description,
        price: updateProductDto.price,
        image: updateProductDto.image,
        category: updateProductDto.category,
        stock: updateProductDto.stock,
      },
    });
  }

  /**
   * Permanently deletes a product record.
   * Throws 404 Exception if the target product ID does not exist.
   *
   * @param id - Target product UUID to delete.
   * @returns Promise resolving to the deleted product record.
   */
  async remove(id: string) {
    // Ensure product exists
    await this.findOne(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
