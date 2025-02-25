import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { validateUser } from '../validations/user/validateuser.js';
import { validateUserUpdate } from '../validations/user/validateUserUpdate.js';
import { NextFunction, Request, Response } from 'express';

dotenv.config();
const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: { id: number };
}

// create new data for user 
export const createData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log('create user req.body: ', req.body);

        // joi validation for incoming data from frontend
        const { error, value } = validateUser(req.body);

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
            const salt = await bcrypt.genSalt(10);
            const hashpassword = await bcrypt.hash(password, salt);

            const newuser = await prisma.user.create({
                data: { name, about, age, email, contact: `+${String(contact)}`, password: hashpassword }
            });
            console.log('new user account: ', newuser);

            res.status(201).json({ message: 'user account created.' });
            return;
        }
    } catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};

// get all the data from database
export const getAllData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

// delete user by id
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    } catch (err) {
        res.status(500).json({ error: err });
        return;
    }
}

// get the user data by id
export const getUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
    } catch (err) {
        res.status(500).json({ error: err });
        return;
    }
}

// update the user data by id
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log('user update req.body: ', req.body);
        if (req.body.password === '') {
            delete req.body.password;
        }
        const { error: er, value: val } = validateUserUpdate(req.body);

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

            const id: number = req.user.id;
            console.log(typeof id, id);

            const { name, about, age, email, contact, password } = val;

            let updateuser = '';

            if (password) {
                const salt = await bcrypt.genSalt(10);
                const hashpassword = await bcrypt.hash(password, salt);
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
    } catch (err) {
        res.status(500).json({ error: err });
        return;
    }
}

// user login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log(req.body);

        // joi validation for incoming data from frontend
        function validateUser(user: any) {
            const JoiSchema = Joi.object({

                email: Joi.string()
                    .email({ tlds: { allow: ['com', 'net', 'org'] } })
                    .pattern(/@(gmail|yahoo)\.com$/)
                    .min(5)
                    .max(50)
                    .required(),

                password: Joi.string()
                    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]|;:\'",.<>?/]).{8,}$'))
                    .message('Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.')
                    .max(50)
                    .required()

            }).options({ abortEarly: false });// get all the errors, not only first error

            return JoiSchema.validate(user)
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
                const matchpassword = await bcrypt.compare(password, user.password);
                if (matchpassword) {

                    // access token
                    const token = jwt.sign({ id: user.id, email }, process.env.SECRETKEY || '', { expiresIn: '1d' });
                    res.cookie('jwt_token', token, {
                        httpOnly: true,// cannot access cookie via js
                        path: '/',// set the cookie is available from
                        secure: true,// allow cookies to be sent over sent only https
                        sameSite: 'strict'// prevents CSRF attacks by blocking cross-site cookie sharing
                    });
                    console.log('accesstoken: ', token);

                    // generate refreshed token
                    const refreshedToken = jwt.sign({ email }, process.env.SECRETKEY || '', { expiresIn: '2d' });

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
    } catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};

//user logout
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        res.clearCookie('jwt_token', { path: '/' });
        res.status(200).json({ message: 'user log out successfully.' });
        return;
    } catch (err) {
        res.status(500).json({ error: err });
        return;
    }
};

// about the user details
export const about = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log('logged user data.');
        if (!req.user) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }
        res.status(200).json({ message: req.user });
        return;
    } catch (err) {
        res.status(500).json({ error: err });
        return;
    }
}
