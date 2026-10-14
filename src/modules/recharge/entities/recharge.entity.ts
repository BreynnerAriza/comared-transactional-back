import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { RechargeStatus } from '../enums/recharge-status.enum';

@Entity('recharge')
@Index('uk_recharge_transactional_id', ['transactionalId'], {
  unique: true,
})
export class RechargeEntity {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_recharge_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ name: 'supplier_id', type: 'varchar', length: 50 })
  supplierId: string;

  @Column({ name: 'supplier_name', type: 'varchar', length: 150 })
  supplierName: string;

  @Column({ name: 'cell_phone', type: 'varchar', length: 10 })
  cellPhone: string;

  @Column({
    name: 'amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  amount: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: RechargeStatus.PENDING,
  })
  status: RechargeStatus;

  @Column({
    name: 'transactional_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  transactionalId: string | null;

  @Column({
    name: 'provider_message',
    type: 'text',
    nullable: true,
  })
  providerMessage: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;

}
