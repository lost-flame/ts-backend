import express, { NextFunction, Request, Response } from "express";
import { addCartProduct, addProduct, deleteAllCategories, deleteAllProducts, deleteBatchProducts, deleteCategory, deleteProduct, getAllCategories, getAllProducts, getProduct, pagination, updateCategory, updateProduct, getAllCartProducts, getUserCartId, updateQuantity, deleteUserCart, orderPlace, getCategory } from "../../controller/productController.js";
import authuser from "../../middlewares/user/authuser";
import multer, { StorageEngine } from 'multer'
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const productRouter = express.Router();
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const storage: StorageEngine = multer.diskStorage({
    destination: function (req: Request, file, cb) {
        cb(null, uploadDir)
    },
    // filename: function (req: Request, file, cb) {
    //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //     cb(null, file.originalname + '-' + uniqueSuffix + path.extname(file.originalname).toLowerCase())
    // }
    filename: function (req: Request, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${path.parse(file.originalname).name}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }

});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },// 5 MB limit
}).single('productimg');

// productRouter.get('/', (req, res, next) => {
//     res.send('product router working.');
// });

// const multerMiddleware = (req: Request, res: Response, next: NextFunction) => {
//     // try {
//     upload(req, res, (err) => {
//         if (err) {
//             return res.status(400).json({ message: err.message });
//         }

//         console.log('multer registration req.file: ', req.file);
//         console.log('multer registration req.body: ', req.body);

//         next();
//     });
//     // }
//     // catch (err) {
//     //     console.error(err);
//     //     return res.status(500).json({ message: 'Internal error' });
//     // }
// };

const multerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => {
        if (err) {
            console.error("Multer Error: ", err);
            return res.status(400).json({ message: err.message });
        }
        console.log("Multer file: ", req.file);
        console.log("Multer body: ", req.body);
        
        next(); // Ensure the next middleware runs
    });
};


productRouter.post('/addProduct', multerMiddleware, addProduct);
productRouter.post('/addCartProduct', authuser, addCartProduct);
productRouter.get('/getUserCartId', authuser, getUserCartId);
productRouter.delete('/deleteUserCart/:id', authuser, deleteUserCart);
productRouter.get('/getAllCartProducts', authuser, getAllCartProducts);
productRouter.patch('/updateQuantity/:id', authuser, updateQuantity);
productRouter.get('/getAllProducts', getAllProducts);
productRouter.get('/getAllCategories', getAllCategories);
productRouter.get('/getProduct/:id', getProduct);
productRouter.get('/getCategory/:id', getCategory);
productRouter.delete('/deleteProduct/:id', deleteProduct);
productRouter.delete('/deleteCategory/:id', deleteCategory);
productRouter.delete('/deleteAllProducts', deleteAllProducts);
productRouter.delete('/deleteAllCategories', deleteAllCategories);
productRouter.delete('/deleteBatchProducts', deleteBatchProducts);
productRouter.patch('/updateProduct/:id', multerMiddleware, updateProduct);
productRouter.patch('/updateCategory/:id', updateCategory);
productRouter.post('/pagination', pagination);
productRouter.post('/orderPlace', orderPlace);

export default productRouter;

// (req, res, next) => {
//     try {
//         upload(req, res, (err) => {
//             if (err) {
//                 return res.status(400).json({ message: err.message });
//             }

//             console.log('multer registration req.file: ', req.file);
//             console.log('multer registration req.body: ', req.body);
//             if (req.file === undefined) {
//                 return res.status(400).json({ message: 'please select a new image.' });
//             }
//             next();
//         })
//     }
//     catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: 'Internal error' });
//     }
// }