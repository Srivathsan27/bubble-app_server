import { Field, ObjectType } from "type-graphql";
import { UserProfile } from "../entities/UserProfile";
import { FieldError } from "./FieldError";

@ObjectType()
export class ProfileResponse {
  @Field(() => UserProfile, {nullable:true})
  profile?: UserProfile;

  @Field(() => FieldError, {nullable:true})
  error?: FieldError;
}
