import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types/MyContext";

export const isAuth: MiddlewareFn<MyContext> = ({ context: { req } }, next) => {
  if (req.session.userId) {
    return next();
  } else {
    throw new Error("User not authorized!");
  }
};
