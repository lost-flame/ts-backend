import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import dotenv from 'dotenv';
import { validateProduct } from '../validations/product/validateproduct.js';
import { validateCartProduct } from '../validations/product/validateCartProduct.js';
import { validateOrderPlace } from '../validations/product/validateOrderPlace.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import swap from '../BLL/swap.js';
import { NextFunction, Request, Response } from 'express';

// const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: { id: number };
}

// add new product 
export const addProduct = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        console.log('req.body: ', req.body);
        console.log('req.file: ', req.file);
        let newobj = { ...req.body, productimg: req.file?.filename || undefined }
        // const { productData, selectValue } = req.body;

        // console.log('productData: ', productData);
        // console.log('selectValue: ', selectValue);

        // const newdata = { ...productData, categoryName: selectValue }
        // joi validation for incoming data from frontend
        const { error, value } = validateProduct(newobj);

        if (error) {
            console.log('error create: ', error);
            let str = error.details.map(err => err.message).join(', ');
            // str = str.join(', ');
            console.log('str: ', str);
             res.status(400).json({ message: str });
             return;
        }
        else {
            console.log("Validated Data,", value);

            const { name, description, price, stock, brand, ratings, category } = value;

            // duplicate product check
            const product = await prisma.product.findUnique({
                where: { name }
            });

            console.log('duplicate product data found: ', product);

            if (product) {
                 res.status(400).json({ message: 'same product already exists' });
                 return;
            }

            //duplicate category check
            // const oldcategoryid = await prisma.category.findUnique({
            //     where: { name: categoryName }
            // });

            // if (oldcategoryid) {
            //     console.log('duplicate category data found:', oldcategoryid);
            //     return res.status(200).json({ message: "category already exists." });
            // }
            let productimg;

            if (!req.file) {/// no image selects, req.file = {} empty object
                productimg = 'no-image';
            }
            else {// image selects
                productimg = req.file.filename;
            }
            console.log('productimg: ', typeof productimg, productimg);
            console.log('categoryName: ', category);
            const findcategory = await prisma.category.findFirst({
                where: {
                    name: category,
                },
            });
            console.log('category id:', findcategory);

            const newproduct = await prisma.product.create({
                data: {
                    name,
                    description,
                    brand,
                    price: parseFloat(price),
                    ratings,
                    stock: stock || 0,
                    category: { connect: { id: findcategory.id } },
                    productimg
                }
            });
            console.log('newproduct: ', newproduct);
             res.status(201).json({ message: 'product added successfully.' });
            return;
        }
    } catch (err) {
         res.status(500).json({ error: err });
         return;
    }
};

// get all the products data from database
export const getAllProducts = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        const allproducts = await prisma.product.findMany();
        console.log('allproducts: ', allproducts);
        res.status(200).json({ message: allproducts });
        return;
    }
    catch (err) {
        console.log(err)
         res.status(500).json({ error: err });
         return;
    }
};

// get all the categories data from database
export const getAllCategories = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        const allcategories = await prisma.category.findMany();
        console.log('allcategories: ', allcategories);
        res.status(200).json({ message: allcategories });
        return;
    }
    catch (err) {
         res.status(500).json({ error: err });
         return;
        }
};

// get a product by id
export const getProduct = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        let checkid = Joi.object({
            id: Joi.number(),
        }).options({ abortEarly: false }).validate(req.params);

        const { error, value } = checkid;

        if (error) {
            console.log(error);
             res.status(500).json({ error });
             return;
        }
        else {
            console.log("Validated Data,", value);
            const { id } = value;

            // retreive the entered id product
            const getid = await prisma.product.findFirst({
                where: { id },
                include: { category: true }
            });
            console.log('product id details along with category details: ', getid);

            if (getid === null) {
                console.log(getid);
                 res.status(500).json({ message: 'wrong id.' });
                return;
            }

            // const token = req.cookies.jwt_token;

            // if (!token) {
            //     console.log('no token access.');
            //     return res.json({ message: 'invalid credentials.' });
            // }
            // console.log('token: ', token, 'typeof: ', typeof token)
             res.status(200).json({ message: getid });
             return;
            }
    } catch (err) {
         res.status(500).json({ error: err });
         return;
    }
}

// get a category by id
export const getCategory = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        let checkid = Joi.object({
            id: Joi.number(),
        }).options({ abortEarly: false }).validate(req.params);

        const { error, value } = checkid;

        if (error) {
            console.log(error);
             res.status(500).json({ error });
            return;
        }
        else {
            console.log("Validated Data,", value);
            const { id } = value;

            // retreive the entered id product
            const getcategoryid = await prisma.product.findFirst({
                where: { id }
            });
            console.log('product id: ', getcategoryid);

            const getid = await prisma.category.findFirst({
                where: { id: getcategoryid.categoryId }
            });
            console.log('category id details: ', getid);

            if (getid === null) {
                console.log(getid);
                 res.status(500).json({ message: 'wrong id.' });
                return;
            }
             res.status(200).json({ message: getid });
            return;
        }
    } catch (err) {
         res.status(500).json({ error: err });
        return;
    }
}

// add products to the cart
export const addCartProduct = async (req: AuthRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        if (!req.user) {
             res.status(401).json({ message: "User not authenticated" });
             return;
            }
        const id = req.user.id;
        console.log('id: ', id);
        console.log('req.body: ', req.body);
        const { error, value } = validateCartProduct(req.body);

        if (error) {
            console.log(error);
             res.status(400).json({ error });
             return;
            }
        else {
            console.log("Validated Data,", value);
            const { p_id, price, quantity, stock, productName } = value;

            if (quantity === null && quantity <= 0) {
                console.log('no quantity entered');
                 res.status(400).json({ message: 'no quantity entered' });
                 return;
                }

            // if same user add same product again
            const user = await prisma.cart.findFirst({
                where: { productName }
            });

            if (user) {
                console.log('user: ', user)
                await prisma.cart.update({
                    where: { id: user.id },
                    data: { quantity: user.quantity + quantity }
                });

                 res.status(200).json({ message: 'quantity updated.' });
                 return;
            }

            // add to cart query
            const cartProduct = await prisma.cart.create({
                data: {
                    productName,
                    price: parseFloat(price),
                    user_id: id, quantity, stock, p_id
                }
            });
            console.log('cart details: ', cartProduct);

             res.status(200).json({ message: 'product added.' });
            return;
        }
    } catch (err) {
         res.status(500).json({ error: err });
        return;
    }
}

// update quantity of product
export const updateQuantity = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        console.log('quantity update id: ', req.params.id);
        const id = Number(req.params.id);
        console.log('req.body cart quantity: ', req.body);

        const user = await prisma.cart.findFirst({
            where: { id }
        });
        console.log('old user quantity: ', user);
        const updatequantity = await prisma.cart.update({
            where: { id },
            data: { quantity: Number(req.body.quantity) }
        });

        console.log('update quantity: ', updatequantity);
         res.status(200).json({ message: 'quantity updated.' });
         return;
    } catch (err) {
         res.status(500).json({ error: err });
         return;
    }
}

//get user cart id
export const getUserCartId = async (req: AuthRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }
        const id = req.user.id;
        console.log('get user cart id: ', id);
         res.status(200).json({ message: id });
         return;
    } catch (err) {
         res.status(500).json({ error: err });
         return;
    }
}

//delete user cart
export const deleteUserCart = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        const id = Number(req.params.id);
        console.log('delete user cart id: ', id);

        const usercartdelete = await prisma.cart.delete({
            where: { id }
        });
        console.log('usercartdelete: ', usercartdelete);
        res.status(200).json({ message: 'product from cart has been deleted.' });
        return;
    } catch (err) {
        res.status(500).json({ error: err });
        return;
    }
}

// get all cart products
export const getAllCartProducts = async (req: AuthRequest, res: Response, next: NextFunction):Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }
        const id = Number(req.user.id);
        console.log('user id for cart products: ', id);

        const usercart = await prisma.cart.findMany({
            where: { user_id: id }
        });

        console.log('user cart details: ', usercart);

         res.status(200).json({ message: usercart });
        return;
    } catch (err) {
         res.status(500).json({ error: err });
        return;
    }
}

// delete product by id
export const deleteProduct = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        let checkid = Joi.object({
            id: Joi.number(),
        }).options({ abortEarly: false }).validate(req.params);

        const { error, value } = checkid;

        if (error) {
            console.log(error);
             res.status(500).json({ error });
             return;
            }
        else {
            console.log("Validated Data,", value);
            const { id } = value;

            // check for wrong entered id
            const getid = await prisma.product.findFirst({
                where: { id }
            });

            if (getid === null) {
                console.log(getid);
                 res.status(500).json({ message: 'wrong id.' });
                 return;
                }

            const deleteproduct = await prisma.product.delete({
                where: { id }
            });

             res.status(200).json({ message: deleteproduct });
             return;
        }
    } catch (err) {
         res.status(500).json({ error: err });
        return;
    }
}

// delete category by id
export const deleteCategory = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        let checkid = Joi.object({
            id: Joi.number(),
        }).options({ abortEarly: false }).validate(req.params);

        const { error, value } = checkid;

        if (error) {
            console.log(error);
             res.status(500).json({ error });
             return;
        }
        else {
            console.log("Validated Data,", value);
            const { id } = value;

            // check for wrong entered id
            const getid = await prisma.category.findFirst({
                where: { id }
            });

            if (getid === null) {
                console.log(getid);
                 res.status(500).json({ message: 'wrong id.' });
                return;
            }

            const deletecategory = await prisma.category.delete({
                where: { id }
            });

             res.status(200).json({ message: deletecategory });
             return;
        }
    } catch (err) {
         res.status(500).json({ error: err });
         return;
    }
}

// delete all products
export const deleteAllProducts = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        const deleteallproducts = await prisma.product.deleteMany();
         res.status(200).json({ message: deleteallproducts });
         return;

    } catch (err) {
         res.status(500).json({ error: err });
         return;
    }
}

// delete all categories
export const deleteAllCategories = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        const deleteallcategories = await prisma.category.deleteMany();
         res.status(200).json({ message: deleteallcategories });
        return;

    } catch (err) {
         res.status(500).json({ error: err });
         return;
    }
}

// delete all product in batching
export const deleteBatchProducts = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        console.log(req.body)
        const { product } = req.body;
        console.log('batch delete products: ', product);

        const deleteallproducts = await prisma.product.deleteMany({
            where: {
                categoryId: {
                    in: product
                }
            }
        }
        );
        console.log(deleteallproducts);
         res.status(200).json({ message: deleteallproducts });
        return;

    } catch (err) {
         res.status(500).json({ error: err });
        return;
    }
}

// update the product data by id
export const updateProduct = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        console.log('req.body: ', req.body);
        console.log('req.filefddfdfdf: ', req.file);
        let newobj = { ...req.body, productimg: req.file?.filename || undefined }

        // joi validation for incoming data from frontend
        const { error, value } = validateProduct(newobj);

        if (error) {
            console.log('error create: ', error);
            let str = error.details.map(err => err.message).join(', ');
            // str = str.join(', ');
            console.log('str: ', str);
             res.status(400).json({ message: str });
            return;
        }
        else {
            console.log("Validated Data,", value);

            const { name, description, price, stock, brand, ratings, category } = value;

            // duplicate product check
            const product = await prisma.product.findUnique({
                where: { name }
            });

            console.log('duplicate product data found: ', product);

            let productimg;

            if (!req.file) {/// no image selects, req.file = {} empty object
                productimg = product.productimg;// update the old product image
            }
            else {// image selects
                //delete the old image then update the new image


                productimg = req.file.filename;
            }
            console.log('productimg: ', typeof productimg, productimg);

            const findcategory = await prisma.category.findFirst({
                where: {
                    name: category,
                },
            });
            console.log('category id:', findcategory);
            let id = product.id;
            const updateproduct = await prisma.product.update({
                where: { id },
                data: {
                    name, description, price: parseFloat(price), stock: Number(stock), brand, ratings: Number(ratings),
                    category: { connect: { id: findcategory.id } },
                    productimg
                }
            });
            console.log('updateCategory: ', updateproduct);
             res.status(200).json({ message: 'product has been updated successfully.' });
             return;
        }
    } catch (err) {
         res.status(500).json({ error: 'product has not been updated successfully.' });
         return;
    }
}

// update the category data by id
export const updateCategory = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        let checkid = Joi.object({
            id: Joi.number(),
        }).options({ abortEarly: false }).validate(req.params);

        const { error, value } = checkid;

        if (error) {
            console.log(error);
             res.status(500).json({ error });
             return;
        }
        else {
            console.log("Validated Data,", value);
            const { id } = value;

            // check for wrong entered id
            const getid = await prisma.category.findUnique({
                where: { id }
            });

            if (getid === null) {
                console.log(getid);
                 res.status(500).json({ message: 'wrong id.' });
                return;
            }

            const { name } = req.body;
            const updatecategory = await prisma.category.update({
                where: { id },
                data: { name }
            });
             res.status(200).json({ message: updatecategory });
            return;
        }
    } catch (err) {
         res.status(500).json({ error: err });
        return;
    }
}

// pagination for products
export const pagination = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        let { curPage, itemPage, brand, minprice, maxprice, filterSearch, minrating, maxrating } = req.body;
        // let curPage = page;
        let filterBrand = brand;
        // let priceSlider = price;
        // let ratingSlider = rating;
        console.log('filter brand: ', filterBrand);
        console.log('filter price min, max: ', minprice, maxprice);
        console.log('filter rating min, max: ', minrating, maxrating);
        console.log('filter search: ', filterSearch);

        console.log('currentPage: ', curPage, 'itemsPerPage: ', itemPage);

        curPage = parseInt(curPage);
        itemPage = parseInt(itemPage);

        // calculate skip value based on above data
        const skip = (curPage - 1) * itemPage;

        if (minprice > maxprice) {
            console.log('new ratings.')
            let newswap = swap(minprice, maxprice);
            console.log('newratings: ', newswap);
            minprice = newswap.a;
            maxprice = newswap.b;
        }

        if (minrating > maxrating) {
            console.log('new ratings.')
            let newswap = swap(minrating, maxrating);
            console.log('newratings: ', newswap);
            minrating = newswap.a;
            maxrating = newswap.b;
        }

        const filterapplycondition:any = {};
        if (filterBrand && filterBrand.length > 0) {
            filterapplycondition.brand = filterBrand;
        }
        if (minprice !== undefined && maxprice !== undefined) {
            filterapplycondition.price = {
                gte: Number(minprice),
                lte: Number(maxprice)
            }
        }
        if (minrating !== undefined && maxrating !== undefined) {
            filterapplycondition.ratings = {
                gte: Number(minrating),
                lte: Number(maxrating)
            }
        }
        if (filterSearch) {
            filterapplycondition.name = {// product name based search
                contains: filterSearch,  // Partial matching results
                // equals: filterSearch, // exact matching results
                mode: "insensitive"  // Case insensitive --> upper/lower cases both allows
            };
        }
        const paginationcategories = await prisma.product.findMany({
            where: filterapplycondition,
            skip,
            take: itemPage
        });
        console.log('paginationcategories: ', paginationcategories);


        const filterpagecount = await prisma.product.count({
            where: filterapplycondition
        });
        console.log('filterpagecount: ', filterpagecount);

        // let pageCount = await prisma.product.count();// total data page count
        // pageCount = Math.ceil(pageCount / itemPage);

        let pageCount = Math.ceil(filterpagecount / itemPage);
        console.log('page count: ', pageCount);
         res.status(200).json({ message: paginationcategories, pageCount: pageCount });
        return;

    } catch (err) {
         res.status(500).json({ error: err });
        return;
    }
}

// add orderplace details
export const orderPlace = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
    try {
        console.log('order place req.body: ', req.body);
        const { error, value } = validateOrderPlace(req.body);

        if (error) {
            console.log(error);
            let str = error.details.map(err => err.message).join(', ');
            // str = str.join(', ');
            console.log('str: ', str);
             res.status(400).json({ message: str });
            return;
        }
        else {
            console.log("Validated Data,", value);
            const { cart_id, p_id, user_id, price, quantity } = value;

            const deletecartproduct = await prisma.cart.delete({
                where: { id: cart_id }
            });
            console.log('deletecartproduct:', deletecartproduct);

            const orderplacedetails = await prisma.OrderPlace.create({
                data: {
                    price: parseFloat(price),
                    user_id, quantity, p_id
                }
            });
            console.log('cart details: ', orderplacedetails);

             res.status(200).json({ message: 'your order has been placed.' });
             return;
        }
    } catch (err) {
         res.status(500).json({ error: err });
         return;
    }
}