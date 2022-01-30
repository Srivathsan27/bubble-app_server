import { Request } from "express";
import { Cookie } from "express-session";

export const setCookie = (req: Request, id: number) => {
  req.session.userId = id;
  req.session.cookie.sameSite = "none";
  req.session.cookie.secure = true;
  req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 365 * 1;
  req.session.cookie = new Cookie();
};
