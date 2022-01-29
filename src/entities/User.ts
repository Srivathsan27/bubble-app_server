import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Comment } from "./Comment";
import { Tag } from "./Tag";
import { Hit } from "./Hit";
import { Post } from "./Post";
import { UserProfile } from "./UserProfile";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt!: Date;

  @Field(() => String, { nullable: false })
  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Field(() => String, { nullable: false })
  @Column({ unique: true })
  email!: string;

  @Field()
  isTagged!: boolean;

  //relations

  @OneToMany(() => Post, (post) => post.creator)
  posts!: Post[];

  @OneToMany(() => Hit, (hit) => hit.user)
  hits!: Hit[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];

  @Field(() => UserProfile)
  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile!: UserProfile;

  @OneToMany(() => Tag, (friend) => friend.user)
  tags!: Tag[];
}
