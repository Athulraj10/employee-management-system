import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('time_series_indexes')
@Index(['entityType', 'entityId', 'timeSeriesDate'])
@Index(['timeSeriesDate'])
export class TimeSeriesIndex {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'entity_type',
    comment: 'EMPLOYEE, PROJECT, CATEGORY',
  })
  entityType: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'date', name: 'time_series_date' })
  timeSeriesDate: Date;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'aggregation_period',
    default: 'daily',
    comment: 'daily, monthly, quarterly, yearly',
  })
  aggregationPeriod: string;

  @Column({
    type: 'text',
    name: 'indexed_data',
    nullable: true,
    comment: 'JSON string for quick lookups',
  })
  indexedData: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

