import { Router } from "express";
import { UpdateMetaDataSchema } from "../../types";
import client from "@repo/db/client";
export const userRouter = Router();
import { userMiddleware } from "../../middleware/user";

userRouter.post("/metadata", userMiddleware, async (req, res) => {
  const parsedData = UpdateMetaDataSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({
      message: "Validttion failed",
    });
    return;
  }
  await client.user.update({
    where: {
      id: req.userId,
    },
    data: {
      avatarId: parsedData.data.avatarId,
    },
  });
  res.json({ message: "Metadata updated" });
});

userRouter.get("/metadata/bulk", async (req, res) => {
  const userIdString = (req.query.ids ?? "[]") as string;
  const userIds = userIdString.slice(1, userIdString?.length - 2).split(",");
  const metadata = await client.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      avatar: true,
      id: true,
    },
  });
  res.json({
    avatars: metadata.map((x: any) => ({
      userId: x.id,
      avatarId: x.avatar?.imageUrl,
    })),
  });
});
