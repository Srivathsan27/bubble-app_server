import { Field, InputType } from "type-graphql";

@InputType()
export class ProfileInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  sex?: string;

  @Field(() => String, { nullable: true })
  bio?: string;
}
