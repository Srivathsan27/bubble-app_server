import {
  Ctx,
  Field,
  FieldResolver,
  ObjectType,
  Resolver,
  Root,
} from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { MyContext } from "../types/MyContext";
import { User } from "./User";

@ObjectType()
@Entity()
export class UserProfile extends BaseEntity {
  @Field()
  @PrimaryColumn()
  userId!: number;

  @Field()
  @Column({ type: "text", default: "" })
  name!: string;

  @Field()
  @Column({ type: "text", default: "" })
  bio!: string;

  @Field()
  @Column({ type: "text", default: "" })
  sex!: string;

  //Gql fields:

  @Field()
  isOwnProfile!: boolean;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: "userId", referencedColumnName: "id" })
  user!: User;
}

@Resolver(() => UserProfile)
export class ProfileResolver {
  @FieldResolver()
  isOwnProfile(@Root() profile: UserProfile, @Ctx() { req }: MyContext) {
    if (req.session.userId) {
      return profile.userId === req.session.userId;
    }
    return false;
  }
}
