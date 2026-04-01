import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  ON_DUTY = 'ON_DUTY',
  RESPONDING = 'RESPONDING',
  AT_SCENE = 'AT_SCENE',
  RETURNING = 'RETURNING',
  MAINTENANCE = 'MAINTENANCE',
}

export enum VehicleType {
  AMBULANCE = 'AMBULANCE',
  FIRE_ENGINE = 'FIRE_ENGINE',
  POLICE_CAR = 'POLICE_CAR',
  RESCUE_UNIT = 'RESCUE_UNIT',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  registrationNumber!: string;

  @Column({ type: 'enum', enum: VehicleType })
  vehicleType!: VehicleType;

  @Column()
  stationId!: number;

  @Column()
  stationName!: string;

  @Column()
  driverName!: string;

  @Column()
  driverPhone!: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude!: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude!: number;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status!: VehicleStatus;

  @Column({ nullable: true })
  assignedIncidentId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
