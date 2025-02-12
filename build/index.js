"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const body_parser_1 = __importDefault(require("body-parser"));
const zod_1 = require("zod");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
require('dotenv').config();
const referralSchema = zod_1.z.object({
    referrerName: zod_1.z.string().min(2),
    referrerEmail: zod_1.z.string().email(),
    refereeName: zod_1.z.string().min(2),
    refereeEmail: zod_1.z.string().email(),
    course: zod_1.z.string().min(2),
});
app.post("/api/referral", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = referralSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error });
            return;
        }
        const { referrerName, referrerEmail, refereeName, refereeEmail, course } = req.body;
        let user = yield prisma.user.findUnique({ where: { email: referrerEmail } });
        if (!user) {
            user = yield prisma.user.create({ data: { name: referrerName, email: referrerEmail } });
        }
        yield prisma.referral.create({
            data: {
                referrerId: user.id,
                refereeName,
                refereeEmail,
                course,
            },
        });
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        });
        yield transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: refereeEmail,
            subject: "You've Been Referred!",
            text: `Hello ${refereeName},\n\nYou have been referred for the ${course} course by ${referrerName}.`,
        });
        res.status(201).json({ message: "Referral submitted successfully!" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.listen(5000, () => console.log("Server running on port 5000"));
