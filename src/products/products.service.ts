import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService'); //better display of errors in the terminal

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ) { }

  async create(createProductDto: CreateProductDto, user: User) {

    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map( image => this.productImageRepository.create({url: image})),
        user
      });
      await this.productRepository.save(product);

      return {...product, images};

    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto

    return this.productRepository.find({
      take: limit,
      skip: offset,
      relations:{
        images: true
      } //show the images when it's true

      // FOR DON'T SHOW IMAGES ID IT'S NEXT CODE:
      /*const products = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations:{
          images: true
        }

        return products.map(product => ({
          ...product,
          images: product.images.map(img => img.url)
        }))*/

    });
  }

  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where(`UPPER(title)=:title or slug=:slug`, {
          title: term.toUpperCase(),
          slug: term.toLowerCase()
        })
        .leftJoinAndSelect('prod.images', 'prodImages')// FOR MORE INFORMATION, SEE IN DOCUMENTION OF TYPEORM OF EAGER
        .getOne();
    }

    if (!product) throw new NotFoundException(`Product with id '${term}' not found`);
    
    return product;

  }

  // IT DOES NOT WORK?
  async update(id: string, updateProductDto: UpdateProductDto, user: User) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({id, ...toUpdate});

    if (!product) throw new NotFoundException(`Product with id '${id}' not found`);

    // create query runner// FOR MORE INFORMATION, SEE DOCUMENTATION OF TYPEORM
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect(); // connect BD
    await queryRunner.startTransaction(); 

    try {

      if ( images ){
        await queryRunner.manager.delete( ProductImage, { product: { id }}); // product: { id } = productId of ProductImages

        product.images = images.map( image => this.productImageRepository.create({ url: image }));
      }

      product.user = user;

      await queryRunner.manager.save( product );

      // await this.productRepository.save(product); // before of update productImage

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(id);

    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExceptions(error);

    }

  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return 'Product deleted'
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail)
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs')
  }

  // DON'T SHOW IMAGES ID
  async findOnePlain(term: string){

    const { images = [], ...rest } = await this.findOne(term);

    return{
      ...rest,
      images: images.map( image => image.url )
    }

  }

  async deleteAllProduct(){

    const query = this.productRepository.createQueryBuilder('product');
    
    try {

      return await query
      .delete()
      .where({})
      .execute()
      
    } catch (error) {
      
      this.handleDBExceptions(error);

    }

  }

}
