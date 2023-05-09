import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "./product-image.entity";
import { User } from "src/auth/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({ name: 'products' })
export class Product {

    @ApiProperty({
        example: '031591be-8a36-4f34-bf9d-4b49683b3e1b',
        description: 'Prodcut ID',
        uniqueItems: true
    }) // FOR DOCUMENTATION
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        example: 'Kids Scribble T Logo Tee',
        description: 'Product Tile',
        uniqueItems: true
    })
    @Column('text', {
        unique: true,
    })
    title: string;

    @ApiProperty({
        example: 0,
        description: 'Product Price'
    })
    @Column('float', {
        default: 0
    })
    price: number;

    @ApiProperty({
        example: 'The Kids Scribble T Logo Tee is made from 100% Peruvian cotton and features a Tesla T sketched logo for every young artist to wear.',
        description: 'Product Description'
    })
    @Column({
        type: 'text',
        nullable: true
    })
    description: string;

    @ApiProperty({
        example: 'kids_scribble_t_logo_tee',
        description: 'Product Slug',
        uniqueItems: true
    })
    @Column('text', {
        unique: true
    })
    slug: string;

    @ApiProperty({
        example: 0,
        description: 'Product Stock'
    })
    @Column('int', {
        default: 0
    })
    stock: number;

    @ApiProperty({
        example: ['XS','S','M'],
        description: 'Product Sizes'
    })
    @Column('text', {
        array: true
    })
    sizes: string[];

    @ApiProperty({
        example: 'kid',
        description: 'Product Gender'
    })
    @Column('text')
    gender: string;

    @ApiProperty({
        example: ['shirt'],
        description: 'Product Tags'
    })
    @Column('text',{
        array: true,
        default: []
    })
    tags: string[];

    @ApiProperty()
    @OneToMany(
        () => ProductImage,
        (productImage) => productImage.product,
        { cascade: true, eager: true } // cascade: true = delete product => delete image 
        // eager: true = show all relations in the find( funtions GET ) // FOR MORE INFORMATION, SEE IN DOCUMENTION OF TYPEORM
    )
    images?: ProductImage[];

    @ManyToOne(
        () => User,
        ( user ) => user.product,
        { eager: true }
    )
    user: User;

    @BeforeInsert()
    checkSlugInsert() {
        if (!this.slug) {
            this.slug = this.title
        }

        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')//cualquier space lo replaza por un _
            .replaceAll("'", '')
    }

    @BeforeUpdate()
    checkSlugUpdate() {
        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')//cualquier space lo replaza por un _
            .replaceAll("'", '')
    }
} 

