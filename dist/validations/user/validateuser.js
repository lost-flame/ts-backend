"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUser = void 0;
const joi_1 = __importDefault(require("joi"));
const validateUser = (user) => {
    const JoiSchema = joi_1.default.object({
        name: joi_1.default.string()
            .min(2)
            .max(50)
            .regex(/^[a-zA-Z\s]+$/)
            .trim()
            .required()
            .messages({
            'string.base': 'Name must be a string',
            'string.empty': 'Name cannot be empty',
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name cannot exceed 50 characters',
            'string.pattern.base': 'Name can only contain letters and spaces',
            'any.required': 'Name is required'
        }),
        email: joi_1.default.string()
            .email({ tlds: { allow: ['com', 'net', 'org'] } })
            .pattern(/@(gmail|yahoo)\.com$/)
            .min(5)
            .max(50)
            .required(),
        about: joi_1.default.string()
            .min(5)
            .max(200)
            .required(),
        age: joi_1.default.number().integer().min(1).max(40),
        contact: joi_1.default.number()
            .integer()
            .min(1000000000) // Minimum 10-digit number
            .max(9999999999) // Maximum 10-digit number
            .required(),
        password: joi_1.default.string()
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]|;:\'",.<>?/]).{8,}$'))
            .message('Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.')
            .max(50)
            .required()
    }).options({ abortEarly: false }); // get all the errors, not only first error
    return JoiSchema.validate(user);
};
exports.validateUser = validateUser;
