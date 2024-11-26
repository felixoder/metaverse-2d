import z from "zod";
export const SignUpSchema = z.object({
  username: z.string().email(),
  password: z.string().min(8),
  type: z.enum(["user", "admin"]),
});

export const SignInSchema = z.object({
  username: z.string().email(),
  password: z.string().min(8),
});

export const UpdateMetaDataSchema = z.object({
  avatarId: z.string(),
});

export const CreateSpaceSchema = z.object({
  name: z.string(),
  // custom function that validadates 100x100 schema
  dimensions: z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
  mapId: z.string(),
});

export const AddElementSchema = z.object({
  spaceId: z.string(),
  elementId: z.string(),
  x: z.number(),
  y: z.number(),
});

export const CreateElementSchema = z.object({
  imageUrl: z.string(),
  width: z.number(),
  height: z.number(),
  static: z.boolean(),
});

export const UpdateElementSchame = z.object({
  imageUrl: z.string(),
});

export const CreateAvatarSchema = z.object({
  name: z.string(),
  imageUrl: z.string(),
});

export const CreateMapSchema = z.object({
  thumbnail: z.string(),
  dimensions: z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
  name: z.string(),
  defaultElements: z.array(
    z.object({
      elementId: z.string(),
      x: z.string(),
      y: z.string(),
    }),
  ),
});

export const DeleteElementSchema = z.object({
  id: z.string(),
});

// userId doesnot exist in the token
declare global {
  namespace Express {
    export interface Request {
      role?: "Admin" | "User";
      userId?: string;
    }
  }
}
