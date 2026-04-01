import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StationType {
  POLICE = 'POLICE',
  FIRE = 'FIRE',
  HOSPITAL = 'HOSPITAL',
}

@Entity('responder_stations')
export class ResponderStation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: StationType })
  stationType!: StationType;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude!: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude!: number;

  @Column()
  address!: string;

  @Column()
  phoneNumber!: string;

  @Column({ nullable: true })
  capacity!: number;

  @Column({ nullable: true })
  currentOccupancy!: number;

  @Column({ default: true })
  isAvailable!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
