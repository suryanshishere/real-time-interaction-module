import nodemailer from "nodemailer";
import HttpError from "@utils/http-errors";
import { NextFunction } from "express";

const sendEmail = async (
  next: NextFunction,
  email: string,
  subject: string,
  text: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: 587,
      secure: true,
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      text: text,
    });
  } catch (error) {
    return next(
      new HttpError("Failed to send email, please try again later.", 500)
    );
  }
};

export default sendEmail;
