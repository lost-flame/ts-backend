"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProduct = void 0;
const joi_1 = __importDefault(require("joi"));
const validateProduct = (user) => {
    const JoiSchema = joi_1.default.object({
        name: joi_1.default.string()
            .min(2)
            .max(50)
            .trim()
            .required(),
        stock: joi_1.default.number()
            .min(1)
            .max(100)
            .required(),
        brand: joi_1.default.string()
            .min(5)
            .max(30)
            .required(),
        description: joi_1.default.string()
            .min(5)
            .max(200)
            .required(),
        price: joi_1.default.number().min(1).max(100000),
        ratings: joi_1.default.number().min(1).max(100000),
        // categoryId: Joi.number().integer().min(1).max(40),
        category: joi_1.default.string()
            .min(5)
            .max(30)
            .required(),
        productimg: joi_1.default.string()
            .min(5)
            .max(10000)
            .required(),
    }).options({ abortEarly: false }); // get all the errors, not only first error
    return JoiSchema.validate(user);
};
exports.validateProduct = validateProduct;
