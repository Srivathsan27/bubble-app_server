import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Hit } from "./Hit";
import { HitType } from "../types/HitType";
import { Comment } from "./Comment";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  //Post attributes

  @Field(() => String)
  @Column()
  title!: string;

  @Field()
  @Column()
  content!: string;

  @Field(() => String)
  contentSnip!: string;

  @Field(() => Int)
  @Column({ type: "int", default: 0 })
  numberOfHits!: number;

  //Foreign key

  @Field()
  @Column({ type: "int" })
  creatorId!: number;

  //Relations

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  creator!: User;

  @OneToMany(() => Hit, (hit) => hit.post)
  hits!: Hit[];

  //Fields of Graphql Importance

  @Field()
  isOwnPost!: boolean;

  @Field(() => Int)
  hitStatus!: HitType;

  @Field(() => Int)
  numberOfComments!: number;

  //Date columns:

  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt!: Date;

  @Field(() => [Comment])
  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];
}
