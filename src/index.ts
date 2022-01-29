import "dotenv/config";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core/dist/plugin/landingPage/graphqlPlayground";
import { ApolloServer } from "apollo-server-express";
import mongoSession from "connect-mongodb-session";
import cors from "cors";
import express from "express";
import session from "express-session";
import path from "path";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { ConnectionOptions, createConnection } from "typeorm";
import { cookieName, MONGO_URL, PORT, prod } from "./constants/consts";
import { Hit } from "./entities/Hit";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { createUserLoader } from "./Loaders/userLoader";
import { Comment } from "./entities/Comment";
import { CommentResolver } from "./resolvers/comment";
import { createPostTitleLoader } from "./Loaders/postTitleLoader";
import { ProfileResolver, UserProfile } from "./entities/UserProfile";
import { Tag } from "./entities/Tag";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const main = async () => {
  const app = express();
  const mongoStore = mongoSession(session);

  const env = process.env;

  const typeormDevConfig: ConnectionOptions = {
    type: "postgres",
    database: process.env.POSTGRES_DBNAME as string,
    username: process.env.POSTGRES_USER as string,
    password: process.env.POSTGRES_PASS as string,
    logging: prod ? false : true,
    synchronize: prod ? false : true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [User, Post, Hit, Comment, UserProfile, Tag],
  };

  const typeormProdConfig: ConnectionOptions = {
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: prod ? false : true,
    synchronize: prod ? false : true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [User, Post, Hit, Comment, UserProfile, Tag],
    ssl: true,
  };

  const connection = await createConnection(
    !prod ? typeormDevConfig : typeormProdConfig
  );

  // await Post.delete({});
  // const t = 1;
  app.use(
    cors({
      // allowedHeaders: "*",
      credentials: true,
      origin: "*",
    })
  );

  app.set("trust proxy", 1);

  app.use(
    session({
      secret: process.env.COOKIE_SECRET as string,
      name: cookieName,
      resave: false,
      saveUninitialized: false,
      store: new mongoStore({
        uri: MONGO_URL,
        collection: "sessions",
      }),
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365 * 1,
        sameSite: "lax",
      },
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, PostResolver, CommentResolver, ProfileResolver],
      validate: false,
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
    context: ({ req, res }) => ({
      req,
      res,
      userLoader: createUserLoader(),
      postTitleLoader: createPostTitleLoader(),
    }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(PORT, () => {
    console.log("Server started at http://localhost:" + PORT + "/graphql ...");
  });
};

main();
