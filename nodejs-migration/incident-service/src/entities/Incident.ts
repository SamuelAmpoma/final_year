import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IncidentStatus {
  CREATED = 'CREATED',
  DISPATCHED = 'DISPATCHED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export enum IncidentType {
  FIRE = 'FIRE',
  MEDICAL = 'MEDICAL',
  ACCIDENT = 'ACCIDENT',
  HAZMAT = 'HAZMAT',
  OTHER = 'OTHER',
}

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  citizenName!: string;

  @Column()
  citizenPhone!: string;

  @Column({ type: 'enum', enum: IncidentType })
  incidentType!: IncidentType;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude!: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude!: number;

  @Column()
  locationAddress!: string;

  @Column({ nullable: true })
  notes!: string;

  @Column()
  createdBy!: number;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.CREATED })
  status!: IncidentStatus;

  @Column({ nullable: true })
  assignedUnitId!: number;

  @Column({ nullable: true })
  assignedUnitName!: string;

  @Column({ nullable: true })
  assignedUnitType!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  dispatchedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
