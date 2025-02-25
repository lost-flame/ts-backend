"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
// interface AuthRequest extends Request {
//     user?: { id: number }; // Adjust based on your user structure
// }
const authuser = async (req, res, next) => {
    try {
        const token = req.cookies?.jwt_token;
        if (!token) {
            console.log("No token provided.");
            res.status(401).json({ message: "Unauthorized: No token." });
            return;
        }
        // ✅ Ensure `verifytoken` is `JwtPayload`
        const verifytoken = jsonwebtoken_1.default.verify(token, process.env.SECRETKEY || "");
        console.log("Decoded JWT:", verifytoken);
        if (!verifytoken || typeof verifytoken !== "object" || !verifytoken.id) {
            res.status(401).json({ message: "Invalid token." });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: verifytoken.id },
        });
        if (!user) {
            console.log("User not found.");
            res.status(401).json({ message: "Unauthorized: User not found." });
            return;
        }
        console.log("Authenticated User:", user);
        req.user = user; //  Attach user to request
        next(); // Move to next middleware
    }
    catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
};
exports.default = authuser;
// import jwt, { JwtPayload } from "jsonwebtoken";
// import dotenv from 'dotenv';
// import { PrismaClient, User } from '@prisma/client';
// import express, { NextFunction, Request, Response } from "express";
// dotenv.config();
// const prisma = new PrismaClient();
// interface AuthRequest {
//     email: string;
//     password: string;
//     about: string;
//     age: string;
//     contact: string;
//     name: string;
//     id:number;
// }
// const authuser = async (req:AuthRequest, res:Response, next:NextFunction) => {
//     const token = req.cookies.jwt_token;
//     if (!token) {
//         console.log('no token access.');
//         return res.status(500).json({ message: 'invalid credentials.' });
//     }
//     const verifytoken = jwt.verify(token, process.env.SECRETKEY || '') as JwtPayload;
//     console.log('verifytoken: ', verifytoken);
//     const user = await prisma.user.findUnique({
//         where: { id: verifytoken.id }
//     });
//     if (!user) {
//         console.log('no user found.');
//         return res.status(500).json({ message: 'middleare invalid credentials.' });
//     }
//     console.log('middleware user: ',user);
//     req.user = user;
//     next();// pass to the next handler/middleware
// }
// export default authuser;
