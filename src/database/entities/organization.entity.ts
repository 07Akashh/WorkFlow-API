import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";

import { OrgMember } from "./org-member.entity.js";
import { Project } from "./project.entity.js";

@Entity({ name: "organizations" })
export class Organization {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 150,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 150,
    unique: true,
  })
  slug!: string;

  @OneToMany(() => OrgMember, (member) => member.organization)
  members!: Relation<OrgMember[]>;

  @OneToMany(() => Project, (project) => project.organization)
  projects!: Relation<Project[]>;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
  })
  updatedAt!: Date;
}
