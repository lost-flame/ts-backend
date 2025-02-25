"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.about = exports.logout = exports.login = exports.updateUser = exports.getUser = exports.deleteUser = exports.getAllData = exports.createData = void 0;
const client_1 = require("@prisma/client");
const joi_1 = __importDefault(require("joi"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const validateuser_js_1 = require("../validations/user/validateuser.js");
const validateUserUpdate_js_1 = require("../validations/user/validateUserUpdate.js");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
// create new data for user 
const createData = async (req, res, next) => {
    try {
        console.log('create user req.body: ', req.body);
        // joi validation for incoming data from frontend
        const { error, value } = (0, validateuser_js_1.validateUser)(req.body);
        if (error) {
            console.log(error);
            res.status(500).json({ error });
            return;
        }
        else {
            console.log("Validated Data,", value);
            const { name, about, age, email, contact, password } = value;
            const user = await prisma.user.findUnique({
                where: { email }
            });
            if (user) {
                res.status(200).json({ message: 'same user already exists' });
                return;
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashpassword = await bcryptjs_1.default.hash(password, salt);
            const newuser = await prisma.user.create({
                data: { name, about, age, email, contact: `+${String(contact)}`, password: hashpassword }
            });
            console.log('new user account: ', newuser);
            res.status(201).json({ message: 'user account created.' });
            return;
        }
    }
    catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};
exports.createData = createData;
// get all the data from database
const getAllData = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany();
        console.log(users);
        res.status(200).json({ message: users });
        return;
    }
    catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};
exports.getAllData = getAllData;
// delete user by id
const deleteUser = async (req, res, next) => {
    try {
        let checkid = joi_1.default.object({
            id: joi_1.default.number(),
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
            const getid = await prisma.user.findUnique({
                where: { id }
            });
            if (getid === null) {
                console.log(getid);
                res.status(500).json({ message: 'wrong id.' });
                return;
            }
            const deleteuser = await prisma.user.delete({
                where: { id }
            });
            res.status(200).json({ message: deleteuser });
            return;
        }
    }
    catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};
exports.deleteUser = deleteUser;
// get the user data by id
const getUser = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }
        let { id } = req.user;
        console.log('user data by id: ', id);
        const getuser = await prisma.user.findUnique({
            where: { id }
        });
        res.status(200).json({ message: getuser });
        return;
        // }
    }
    catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};
exports.getUser = getUser;
// update the user data by id
const updateUser = async (req, res, next) => {
    try {
        console.log('user update req.body: ', req.body);
        if (req.body.password === '') {
            delete req.body.password;
        }
        const { error: er, value: val } = (0, validateUserUpdate_js_1.validateUserUpdate)(req.body);
        if (er) {
            console.log(er);
            res.status(400).json({ er });
            return;
        }
        else {
            console.log("Validated Data,", val);
            if (!req.user) {
                res.status(401).json({ message: "User not authenticated" });
                return;
            }
            const id = req.user.id;
            console.log(typeof id, id);
            const { name, about, age, email, contact, password } = val;
            let updateuser = '';
            if (password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                const hashpassword = await bcryptjs_1.default.hash(password, salt);
                console.log('new pasword: ', hashpassword);
                updateuser = await prisma.user.update({
                    where: { id },
                    data: { password: hashpassword, name, about, age, email, contact: `+${String(contact)}` }
                });
            }
            else {
                updateuser = await prisma.user.update({
                    where: { id },
                    data: { name, about, age, email, contact: String(contact) }
                });
            }
            console.log('user data updated: ', updateuser);
            res.status(200).json({ message: 'user data updated.' });
            return;
            // }
        }
    }
    catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};
exports.updateUser = updateUser;
// user login
const login = async (req, res, next) => {
    try {
        console.log(req.body);
        // joi validation for incoming data from frontend
        function validateUser(user) {
            const JoiSchema = joi_1.default.object({
                email: joi_1.default.string()
                    .email({ tlds: { allow: ['com', 'net', 'org'] } })
                    .pattern(/@(gmail|yahoo)\.com$/)
                    .min(5)
                    .max(50)
                    .required(),
                password: joi_1.default.string()
                    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]|;:\'",.<>?/]).{8,}$'))
                    .message('Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.')
                    .max(50)
                    .required()
            }).options({ abortEarly: false }); // get all the errors, not only first error
            return JoiSchema.validate(user);
        }
        const { error, value } = validateUser(req.body);
        if (error) {
            console.log(error);
            res.status(500).json({ error });
            return;
        }
        else {
            console.log("Validated Data,", value);
            const { email, password } = value;
            const user = await prisma.user.findUnique({
                where: { email }
            });
            if (user) {
                const matchpassword = await bcryptjs_1.default.compare(password, user.password);
                if (matchpassword) {
                    // access token
                    const token = jsonwebtoken_1.default.sign({ id: user.id, email }, process.env.SECRETKEY || '', { expiresIn: '1d' });
                    res.cookie('jwt_token', token, {
                        httpOnly: true, // cannot access cookie via js
                        path: '/', // set the cookie is available from
                        secure: true, // allow cookies to be sent over sent only https
                        sameSite: 'strict' // prevents CSRF attacks by blocking cross-site cookie sharing
                    });
                    console.log('accesstoken: ', token);
                    // generate refreshed token
                    const refreshedToken = jsonwebtoken_1.default.sign({ email }, process.env.SECRETKEY || '', { expiresIn: '2d' });
                    const generatedToken = await prisma.user.update({
                        where: { email },
                        data: { refreshedToken }
                    });
                    console.log('generatedToken: ', generatedToken);
                    res.status(200).json({ message: 'user login successfully.' });
                    return;
                }
                else {
                    res.status(500).json({ message: 'invalid credentials.' });
                    return;
                }
            }
            res.status(500).json({ message: 'invalid credentials.' });
            return;
        }
    }
    catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};
exports.login = login;
//user logout
const logout = async (req, res, next) => {
    try {
        res.clearCookie('jwt_token', { path: '/' });
        res.status(200).json({ message: 'user log out successfully.' });
        return;
    }
    catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};
exports.logout = logout;
// about the user details
const about = async (req, res, next) => {
    try {
        console.log('logged user data.');
        if (!req.user) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }
        res.status(200).json({ message: req.user });
        return;
    }
    catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};
exports.about = about;
