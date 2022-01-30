import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entities/User";
import { UserPassInput } from "../InputTypes/userPassInput";
import { MyContext } from "../types/MyContext";
import argon2 from "argon2";
// import {  } from 'typeorm'
import { Cookie } from "express-session";
import { cookieName, MONGO_URL } from "../constants/consts";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { Token } from "../store/PasswordChange/token";
import { connect } from "mongoose";
import { isValidEmail } from "../utils/isValidEmail";
import { FieldError } from "../ObjectTypes/FieldError";
import { UserResponse } from "../ObjectTypes/UserResponse";
import { BooleanResponse } from "../ObjectTypes/BooleanResponse";
import {
  isPasswordValid,
  isUsernamePasswordValid,
} from "../utils/isUsernamePasswordValid";
import { getConnection, QueryFailedError } from "typeorm";
import { isAuth } from "../middleware/isAuth";
import { UserProfile } from "../entities/UserProfile";
import { ProfileResponse } from "../ObjectTypes/ProfileResponse";
import { ProfileInput } from "../InputTypes/ProfileInput";
import { TaggedResponse, TaggedUser } from "../ObjectTypes/TaggedResponse";
import { setCookie } from "../utils/setCookie";

@Resolver(() => User)
export class UserResolver {
  @FieldResolver()
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    } else {
      return "";
    }
  }

  @Query(() => [User])
  async users(): Promise<User[] | null> {
    return await User.find();
  }

  @Mutation(() => UserResponse)
  async register(
    @Ctx() { req }: MyContext,
    @Arg("input", () => UserPassInput) input: UserPassInput
  ): Promise<UserResponse> {
    const errors = isUsernamePasswordValid(input);
    if (errors.length > 0) {
      return { errors };
    }
    const hashedPassword = await argon2.hash(input.password);
    let user: User;
    try {
      user = await User.create({
        username: input.username,
        password: hashedPassword,
        email: input.email,
      }).save();
      await UserProfile.create({
        userId: user.id,
      }).save();

      setCookie(req, user.id);

      return {
        user,
      };
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        err.message.includes("duplicate key value")
      ) {
        return {
          errors: [
            {
              field: "username",
              message: "Username is already taken",
            },
          ],
        };
      }
    }
    return {
      errors: [
        {
          field: "unknown",
          message: "Oops, Something went wrong!",
        },
      ],
    };
  }
  @Mutation(() => UserResponse)
  async login(
    @Ctx() { req }: MyContext,
    @Arg("input", () => UserPassInput) input: UserPassInput
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { username: input.username } });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "The user does not exist",
          },
        ],
      };
    }

    if (!(await argon2.verify(user.password, input.password))) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect Password",
          },
        ],
      };
    }

    setCookie(req, user.id);

    return {
      user,
    };
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    if (!req.session.userId) {
      return undefined;
    }
    return await User.findOne(req.session.userId);
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext): Promise<Boolean> {
    return new Promise((resolver) =>
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          resolver(false);
        } else {
          res.clearCookie(cookieName);
          resolver(true);
        }
      })
    );
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string
  ): Promise<Boolean | FieldError> {
    if (!isValidEmail(email)) {
      console.log("invalid email");
      return false;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log("invalid user");
      return true;
    }

    await connect(MONGO_URL + "change-password");

    let id = v4();

    const token = new Token({
      token: id,
      userId: user.id,
    });

    await token.save();

    const html = `You can proceed with changing the password using the link provided below <br> <a href="http://localhost:3000/change-password/${id}">Change Password</a> <br> The link is valid for 3 hours from now, please change password before it expires, if expired, please regenerate the link by cliking <a href="http://localhost:3000/forgot-password">here</a>`;

    await sendEmail(email, html, "Forgot Password Request");

    return true;
  }

  @Mutation(() => UserResponse, { nullable: true })
  async changePassword(
    @Ctx() { req }: MyContext,
    @Arg("password") password: string,
    @Arg("token") token: string
  ): Promise<UserResponse | null> {
    const errors = isPasswordValid(password);
    if (errors.length > 0) {
      return {
        errors,
      };
    }

    await connect(MONGO_URL + "change-password");

    const authToken = await Token.findOne({ token: token })
      .select("token userId")
      .exec();

    if (!authToken) {
      return {
        errors: [
          {
            field: "token",
            message: "Invalid token. Token has expired!",
          },
        ],
      };
    }
    const id = authToken.userId;
    const user = await User.findOne(id);
    const hasedNewPassword = await argon2.hash(password);

    if (user) {
      await User.update({ id }, { password: hasedNewPassword });
      // await authToken.delete();

      req.session.userId = user.id;
      req.session.cookie = new Cookie();

      return { user };
    } else {
      return null;
    }
  }

  @Mutation(() => BooleanResponse)
  async resetPassword(
    @Ctx() { req }: MyContext,
    @Arg("current") currentPassword: string,
    @Arg("new") newPassword: string
  ): Promise<BooleanResponse> {
    const user = await User.findOne(req.session.userId);

    if (!user) {
      return {
        errors: [
          {
            field: "user",
            message:
              "For some reason, we couldn't find your account! please contact us if you think this is a mistake!",
          },
        ],
      };
    }

    if (!(await argon2.verify(user.password, currentPassword))) {
      console.log("error!");
      return {
        errors: [
          {
            field: "currentPassword",
            message: "Incorrect Password!",
          },
        ],
      };
    }

    const errors = isPasswordValid(newPassword);
    if (errors.length > 0) {
      console.log("is it here?");
      console.log(errors);
      return {
        errors,
      };
    }

    const hashedPassword = await argon2.hash(newPassword);

    const updateResult = await User.update(
      { id: req.session.userId },
      { password: hashedPassword }
    );
    console.log(updateResult);

    return {
      status: true,
    };
  }

  @Query(() => UserResponse)
  @UseMiddleware(isAuth)
  async profile(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    try {
      const user = await User.findOne(id, { relations: ["profile"] });
      const tagStatus = (
        (await getConnection().query(
          `
        select count(*) "tagStatus"
        from tag t
        where t."userId" = $1 and t."friendId" = $2
      `,
          [req.session.userId, id]
        )) as any[]
      )[0].tagStatus;

      console.log("tag-return: ", tagStatus);

      const isTagged = tagStatus === "0" ? false : true;
      if (!user) {
        return {
          errors: [
            {
              field: "id",
              message: "the user does not exist!",
            },
          ],
        };
      }

      user.isTagged = isTagged;
      return {
        user,
      };
    } catch (err) {
      console.log(err);
      return {
        errors: [
          {
            field: "id",
            message: "the user does not exist!",
          },
        ],
      };
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async tagUser(
    @Ctx() { req }: MyContext,
    @Arg("friendId", () => Int!) id: number
  ): Promise<boolean> {
    if (req.session.userId === id) {
      return false;
    }
    try {
      await getConnection().query(
        `
      insert into tag("userId", "friendId") values ($1,$2) on conflict do nothing;
      `,
        [req.session.userId, id]
      );
      return true;
    } catch (err) {
      console.log("error: ", err);
      return false;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async untagUser(
    @Ctx() { req }: MyContext,
    @Arg("friendId", () => Int!) id: number
  ): Promise<boolean> {
    try {
      await getConnection().query(
        `
        delete from tag where "userId" = $1 and "friendId" = $2;
      `,
        [req.session.userId, id]
      );
      return true;
    } catch (err) {
      console.log("error: ", err);
      return false;
    }
  }

  @Mutation(() => ProfileResponse)
  @UseMiddleware(isAuth)
  async updateProfile(
    @Arg("id", () => Int!) userId: number,
    @Arg("input", () => ProfileInput) input: ProfileInput,
    @Ctx() { req }: MyContext
  ): Promise<ProfileResponse> {
    const { userId: currentUser } = req.session;

    const profile = await UserProfile.findOne(userId);

    if (!profile) {
      return {
        error: {
          field: "id",
          message: "the user does not exist",
        },
      };
    }

    if (profile.userId !== currentUser) {
      return {
        error: {
          field: "current user",
          message: "user not authorized",
        },
      };
    }

    await UserProfile.update(
      { userId: userId },
      {
        bio: input.bio ? input.bio : "",
        name: input.name ? input.name : "",
        sex: input.sex ? input.sex : "",
      }
    );

    profile.bio = input.bio ? input.bio : "";
    profile.name = input.name ? input.name : "";
    profile.sex = input.sex ? input.sex : "";

    return {
      profile,
    };
  }

  @Query(() => TaggedResponse)
  @UseMiddleware(isAuth)
  async tagged(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<TaggedResponse> {
    try {
      const data = (await getConnection().query(
        `
      select 
        u.id,
        u.username,
        (select count(*) from tag t where "userId" = $1 and "friendId" = u.id ) "isTagged"
      from public.user u
      where u.id in (
        select "friendId" from tag where "userId" = $2
      )
    
    `,
        [req.session.userId, id]
      )) as any[];

      data.forEach((user) => {
        user.isTagged = user.isTagged === "0" ? false : true;
        user.isOwnAccount = user.id === req.session.userId;
      });

      return {
        taggedUsers: data as TaggedUser[],
      };
    } catch (err) {
      console.log("error: ", err);
      return {
        error: {
          field: "id",
          message: "the user does not exist!",
        },
      };
    }
  }
}
