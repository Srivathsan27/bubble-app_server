import session from "express-session";
import { User } from "../entities/User";

declare module "express-session" {
  export interface Session {
    userId: number;
  }
}
