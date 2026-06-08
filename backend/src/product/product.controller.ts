import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

/**
 * Controller managing the product catalog resources.
 * Exposes public endpoints for catalog exploration, and restricted ADMIN-role endpoints for inventory management.
 */
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Creates a new product in the store catalog.
   * Restricted to admin accounts.
   *
   * @param createProductDto - CreateProductDto containing title, description, price, category, stock, and image.
   * @returns The newly created Product entity.
   */
  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  /**
   * Retrieves a paginated list of catalog products filtered by search keywords, category, and price boundaries.
   * Accessible by public users.
   *
   * @param search - Optional query search term matched against title and description.
   * @param category - Optional exact category filter.
   * @param minPrice - Optional minimum price bound.
   * @param maxPrice - Optional maximum price bound.
   * @param page - Optional page number for pagination.
   * @param limit - Optional page limit count.
   * @returns A paginated object containing matching products, pagination info, and metadata.
   */
  @Get()
  @Public()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productService.findAll({
      search,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Retrieves the details of a single product by its unique database ID.
   * Accessible by public users.
   *
   * @param id - UUID of the product.
   * @returns The found Product entity.
   */
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  /**
   * Modifies an existing product's fields.
   * Restricted to admin accounts.
   *
   * @param id - UUID of the product to update.
   * @param updateProductDto - UpdateProductDto containing updated fields.
   * @returns The updated Product entity.
   */
  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  /**
   * Deletes a product from the database catalog.
   * Restricted to admin accounts.
   *
   * @param id - UUID of the product to delete.
   */
  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
