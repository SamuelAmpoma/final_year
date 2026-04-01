import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum IncidentType {
  FIRE = 'FIRE',
  MEDICAL = 'MEDICAL',
  ACCIDENT = 'ACCIDENT',
  HAZMAT = 'HAZMAT',
  OTHER = 'OTHER',
}

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  eventType!: string;

  @Column({ type: 'enum', enum: IncidentType, nullable: true })
  incidentType?: IncidentType;

  @Column({ nullable: true })
  region?: string;

  @Column({ nullable: true })
  responseTimeMinutes?: number;

  @Column({ nullable: true })
  incidentId?: number;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  timestamp!: Date;
}
