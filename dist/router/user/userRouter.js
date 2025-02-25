"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_js_1 = require("../../controller/userController.js");
const authuser_js_1 = __importDefault(require("../../middlewares/user/authuser.js"));
const userRouter = express_1.default.Router();
// userRouter.get('/', (req, res, next) => {
//     res.send('user working well.');
// });
userRouter.post('/createData', userController_js_1.createData);
userRouter.get('/getAllData', userController_js_1.getAllData);
userRouter.delete('/deleteUser/:id', userController_js_1.deleteUser);
userRouter.get('/getUser', authuser_js_1.default, userController_js_1.getUser);
userRouter.patch('/updateUser/:id', authuser_js_1.default, userController_js_1.updateUser);
userRouter.post('/login', userController_js_1.login);
userRouter.get('/logout', userController_js_1.logout);
userRouter.get('/about', authuser_js_1.default, userController_js_1.about);
exports.default = userRouter;
