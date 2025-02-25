"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_js_1 = require("../../controller/productController.js");
const authuser_1 = __importDefault(require("../../middlewares/user/authuser"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const path_2 = require("path");
// const __filename = fileURLToPath(import.meta.url);
const __dirname = (0, path_2.dirname)(__filename);
const productRouter = express_1.default.Router();
const uploadDir = path_1.default.join(__dirname, '..', '..', 'uploads');
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    // filename: function (req: Request, file, cb) {
    //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //     cb(null, file.originalname + '-' + uniqueSuffix + path.extname(file.originalname).toLowerCase())
    // }
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${path_1.default.parse(file.originalname).name}-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 5 MB limit
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
const multerMiddleware = (req, res, next) => {
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
productRouter.post('/addProduct', multerMiddleware, productController_js_1.addProduct);
productRouter.post('/addCartProduct', authuser_1.default, productController_js_1.addCartProduct);
productRouter.get('/getUserCartId', authuser_1.default, productController_js_1.getUserCartId);
productRouter.delete('/deleteUserCart/:id', authuser_1.default, productController_js_1.deleteUserCart);
productRouter.get('/getAllCartProducts', authuser_1.default, productController_js_1.getAllCartProducts);
productRouter.patch('/updateQuantity/:id', authuser_1.default, productController_js_1.updateQuantity);
productRouter.get('/getAllProducts', productController_js_1.getAllProducts);
productRouter.get('/getAllCategories', productController_js_1.getAllCategories);
productRouter.get('/getProduct/:id', productController_js_1.getProduct);
productRouter.get('/getCategory/:id', productController_js_1.getCategory);
productRouter.delete('/deleteProduct/:id', productController_js_1.deleteProduct);
productRouter.delete('/deleteCategory/:id', productController_js_1.deleteCategory);
productRouter.delete('/deleteAllProducts', productController_js_1.deleteAllProducts);
productRouter.delete('/deleteAllCategories', productController_js_1.deleteAllCategories);
productRouter.delete('/deleteBatchProducts', productController_js_1.deleteBatchProducts);
productRouter.patch('/updateProduct/:id', multerMiddleware, productController_js_1.updateProduct);
productRouter.patch('/updateCategory/:id', productController_js_1.updateCategory);
productRouter.post('/pagination', productController_js_1.pagination);
productRouter.post('/orderPlace', productController_js_1.orderPlace);
exports.default = productRouter;
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
