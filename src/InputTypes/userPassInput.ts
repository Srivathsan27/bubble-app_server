import { Field, InputType } from "type-graphql";

@InputType()
export class UserPassInput {
  @Field()
  username!: string;

  @Field()
  password!: string;

  @Field(() => String, { nullable: true })
  email?: string;
}
