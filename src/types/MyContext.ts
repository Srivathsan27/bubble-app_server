import { Request, Response } from "express";
import { createPostTitleLoader } from "../Loaders/postTitleLoader";
import { createUserLoader } from "../Loaders/userLoader";

export type MyContext = {
  req: Request;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>;
  postTitleLoader: ReturnType<typeof createPostTitleLoader>;
};
