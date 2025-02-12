import express from "express"
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import { z } from "zod";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

require('dotenv').config();

const referralSchema = z.object({
  referrerName: z.string().min(2),
  referrerEmail: z.string().email(),
  refereeName: z.string().min(2),
  refereeEmail: z.string().email(),
  course: z.string().min(2),
});


  app.post("/api/referral", async (req: any, res: any): Promise<void> => {
      try {

        const validation = referralSchema.safeParse(req.body);
        if (!validation.success) {
          res.status(400).json({ error: validation.error });
          return;
        }
  
        const { referrerName, referrerEmail, refereeName, refereeEmail, course } = req.body;
  
      
        let user = await prisma.user.findUnique({ where: { email: referrerEmail } });
        if (!user) {
          user = await prisma.user.create({ data: { name: referrerName, email: referrerEmail } });
        }
  
     
        await prisma.referral.create({
          data: {
            referrerId: user.id,
            refereeName,
            refereeEmail,
            course,
          },
        });
        
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
        });
  
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: refereeEmail,
          subject: "You've Been Referred!",
          text: `Hello ${refereeName},\n\nYou have been referred for the ${course} course by ${referrerName}.`,
        });
  
        res.status(201).json({ message: "Referral submitted successfully!" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

app.listen(5000, () => console.log("Server running on port 5000"));
