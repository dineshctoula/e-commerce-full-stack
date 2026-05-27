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
}

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(filters: ProductQueryFilters) {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = filters;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

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

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return {
      products,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

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

  async remove(id: string) {
    // Ensure product exists
    await this.findOne(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
