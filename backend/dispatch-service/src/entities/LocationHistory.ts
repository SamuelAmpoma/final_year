import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('location_history')
export class LocationHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  vehicleId!: number;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude!: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude!: number;

  @CreateDateColumn()
  timestamp!: Date;
}
