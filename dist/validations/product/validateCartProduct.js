"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCartProduct = void 0;
const joi_1 = __importDefault(require("joi"));
const validateCartProduct = (user) => {
    const JoiSchema = joi_1.default.object({
        productName: joi_1.default.string()
            .min(5)
            .max(30)
            .required(),
        stock: joi_1.default.number()
            .min(1)
            .max(100)
            .required(),
        price: joi_1.default.number().min(1).max(100000),
        p_id: joi_1.default.number().min(1).max(100000),
        // user_id: Joi.number().min(1).max(100000),
        quantity: joi_1.default.number().integer().min(1).max(40),
    }).options({ abortEarly: false }); // get all the errors, not only first error
    return JoiSchema.validate(user);
};
exports.validateCartProduct = validateCartProduct;
