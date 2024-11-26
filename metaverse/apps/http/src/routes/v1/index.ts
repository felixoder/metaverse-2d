import { Router } from "express";
import { userRouter } from "./user";
import { spaceRouter } from "./space";
import { adminRouter } from "./admin";
import { SignInSchema, SignUpSchema } from "../../types";
import client from "@repo/db/client";
import { hash, compare } from "../../scrypt";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../../config";

export const router = Router();

interface User {
  username: string;
  password: string;
}

router.post("/signup", async (req, res) => {
  // check the user
  const parsedData = SignUpSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({
      message: "Validation Failed",
    });
    return;
  }

  const hashedPassword = await hash(parsedData.data.password);
  try {
    const user = await client.user.create({
      data: {
        username: parsedData.data.username,
        password: hashedPassword,
        role: parsedData.data.type === "admin" ? "Admin" : "User",
      },
    });
    res.json({
      userId: user.id,
    });
  } catch (e) {
    res.status(400).json({ message: "User already exists" });
  }
});
router.post("/signin", async (req, res) => {
  const parsedData = SignInSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(403).json({ message: "Validation Failed" });
    return;
  }
  try {
    const user = await client.user.findUnique({
      where: {
        username: parsedData.data.username,
      },
    });
    if (!user) {
      res.status(403).json({
        message: "User not found",
      });
    }
    if (!user || !user.password) {
      // Ensure user exists and password is defined
      res.status(403).json({
        message: "User not found or password missing",
      });
      return;
    }
    const isValid = await compare(parsedData.data.password, user.password);
    if (!isValid) {
      res.status(403).json({
        message: "Invalid password",
      });
      return;
    }
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      JWT_PASSWORD,
    );
    res.json({
      token,
    });
  } catch (e) {
    res.status(400).json({ message: "Interval Server error" });
  }
});

router.get("/elements", async (req, res) => {
  const elements = await client.element.findMany();
  res.json({
    elements: elements.map((e: any) => ({
      id: e.id,
      name: e.name,
      width: e.width,
      height: e.height,
      static: e.static,
    })),
  });
});

router.get("/avatars", async (req, res) => {
  const avatars = await client.avatar.findMany();
  res.json({
    avatars: avatars.map((x) => ({
      id: x.id,
      name: x.name,
      imageUrl: x.imageUrl,
    })),
  });
});

router.use("/user", userRouter);
router.use("/space", spaceRouter);
router.use("/admin", adminRouter);
