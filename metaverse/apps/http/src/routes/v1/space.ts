import { Router } from "express";
import {
  AddElementSchema,
  CreateSpaceSchema,
  DeleteElementSchema,
} from "../../types";
import client from "@repo/db/client";
import { userMiddleware } from "../../middleware/user";
export const spaceRouter = Router();

spaceRouter.post("/", userMiddleware, async (req, res) => {
  const parsedData = CreateSpaceSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  if (!parsedData.data.mapId) {
    const space = await client.space.create({
      data: {
        name: parsedData.data.name,
        width: parseInt(parsedData.data.dimensions.split("x")[0]),
        height: parseInt(parsedData.data.dimensions.split("x")[1]),
        creatorId: req.userId as string,
      },
    });
    res.json({ spaceId: space.id });
  }
  const map = await client.map.findUnique({
    where: {
      id: parsedData.data.mapId,
    },
    select: {
      mapElements: true,
      width: true,
      height: true,
    },
  });
  if (!map) {
    res.status(400).json({ message: "Map not found" });
  }
  let space = await client.$transaction(async () => {
    const space = await client.space.create({
      data: {
        name: parsedData.data.name,
        width: map.width,
        height: map.height,
        creatorId: req.userId as string,
      },
    });
    await client.spaceElements.createMany({
      data: map.mapElements.map((e: any) => ({
        spaceId: space.id,
        elementId: e.elementId,
        x: e.x!,
        y: e.y!,
      })),
    });
    return space;
  });
  res.json({ spaceId: space.id });
});

spaceRouter.delete("/:spaceId", async (req, res) => {
  const space = await client.space.findUnique({
    where: {
      id: req.params.spaceId,
    },
    select: {
      creatorId: true,
    },
  });
  if (!space) {
    res.status(400).json({ message: "Space not found" });
    return;
  }
  if (space?.creatorId !== req.userId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }
  await client.space.delete({
    where: {
      id: req.params.spaceId,
    },
  });
  res.json({ message: "Space deleted" });
});

spaceRouter.get("/all", userMiddleware, async (req, res) => {
  const spaces = await client.space.findMany({
    where: {
      creatorId: req.userId,
    },
  });
  res.json({
    spaces: spaces.map((s: any) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail,
      dimensions: `${s.width}x${s.height}`,
    })),
  });
});

spaceRouter.post("/element", userMiddleware, async (req, res) => {
  const parsedData = AddElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  const space = await client.space.findUnique({
    where: {
      id: req.body.spaceId,
      creatorId: req.userId,
    },
    select: {
      width: true,
      height: true,
    },
  });

  if (!space) {
    res.status(400).json({ message: "Space not found" });
    return;
  }
  await client.spaceElements.create({
    data: {
      spaceId: req.body.spaceId,
      elementId: req.body.elements,
      x: req.body.x,
      y: req.body.y,
    },
  });
  res.status(200).json({ message: "Element added" });
});

spaceRouter.delete("/element", async (req, res) => {
  const parsedData = DeleteElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  const spaceElement = await client.spaceElements.findUnique({
    where: {
      id: parsedData.data.id,
    },
    select: {
      space: true,
    },
  });
  if (
    !spaceElement?.space.creatorId ||
    spaceElement.space.creatorId !== req.userId
  ) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }
  await client.spaceElements.delete({
    where: {
      id: parsedData.data.id,
    },
  });

  res.status(200).json({ message: "Element deleted" });
  return;
});

spaceRouter.get("/:spaceId", async (req, res) => {
  const space = await client.space.findUnique({
    where: {
      id: req.params.spaceId,
    },
    include: {
      elements: {
        include: {
          element: true,
        },
      },
    },
  });
  if (!space) {
    res.status(400).json({ message: "Space not found" });
    return;
  }
  res.json({
    dimensions: `${space.width}x${space.height}`,

    elements: space.elements.map((e: any) => ({
      id: e.id,
      element: {
        id: e.element.id,
        width: e.element.width,
        height: e.element.height,
        imageUrl: e.element.imageUrl,
        static: e.element.static,
      },

      x: e.x,
      y: e.y,
    })),
  });
});
