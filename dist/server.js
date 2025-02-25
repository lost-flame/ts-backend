"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const userRouter_1 = __importDefault(require("./router/user/userRouter"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const productRouter_1 = __importDefault(require("./router/product/productRouter"));
const path_2 = require("path");
// const __filename = fileURLToPath(import.meta.url);
const __dirname = (0, path_2.dirname)(__filename);
const prisma = new client_1.PrismaClient();
dotenv_1.default.config();
const server = (0, express_1.default)();
const options = {
    origin: "http://localhost:5173", // only allow this URL
    credentials: true // allow cookies over different CORS from frontend
};
server.use((0, cors_1.default)(options));
server.use((0, cookie_parser_1.default)());
server.use(body_parser_1.default.json());
server.use(body_parser_1.default.urlencoded({ extended: true }));
// this will serve files in the uploads directory under the /uploads URL path.
server.use('/uploads', express_1.default.static(path_1.default.join(__dirname, 'uploads')));
server.use('/user', userRouter_1.default);
server.use('/product', productRouter_1.default);
const srvr = server.listen(process.env.PORT, () => { console.log(`server is running at ${process.env.PORT}`); });
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await prisma.$disconnect(); // disconnecting the prisma
    srvr.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
