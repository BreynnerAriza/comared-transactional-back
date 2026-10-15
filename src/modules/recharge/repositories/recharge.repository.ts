import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RechargeEntity } from '../entities/recharge.entity';
import { RechargeStatus } from '../enums/recharge-status.enum';

@Injectable()
export class RechargeRepository {
  constructor(
    @InjectRepository(RechargeEntity)
    private readonly repository: Repository<RechargeEntity>,
  ) {}

  async createPending(
    userId: string,
    supplierId: string,
    supplierName: string,
    cellPhone: string,
    amount: number,
  ): Promise<RechargeEntity> {
    const recharge = this.repository.create({
      userId,
      supplierId,
      supplierName,
      cellPhone,
      amount,
      status: RechargeStatus.PENDING,
      transactionalId: null,
      providerMessage: null,
    });

    return this.repository.save(recharge);
  }

  async markSuccess(
    id: string,
    transactionalId: string,
    providerMessage: string,
  ): Promise<boolean> {
    const result = await this.repository.update(
      { id, status: RechargeStatus.PENDING },
      {
        status: RechargeStatus.SUCCESS,
        transactionalId,
        providerMessage,
      },
    );

    return (result.affected ?? 0) > 0;
  }

  async markFailed(id: string, providerMessage: string): Promise<boolean> {
    const result = await this.repository.update(
      { id, status: RechargeStatus.PENDING },
      {
        status: RechargeStatus.FAILED,
        providerMessage,
      },
    );

    return (result.affected ?? 0) > 0;
  }

  async markUnknown(id: string, providerMessage: string): Promise<boolean> {
    const result = await this.repository.update(
      { id, status: RechargeStatus.PENDING },
      {
        status: RechargeStatus.UNKNOWN,
        providerMessage,
      },
    );

    return (result.affected ?? 0) > 0;
  }

  async findById(id: string): Promise<RechargeEntity | null> {
    return this.repository.findOneBy({ id });
  }

  async findByUserId(
    userId: string,
    page: number,
    size: number,
  ): Promise<[RechargeEntity[], number]> {
    return this.repository.findAndCount({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
      skip: (page - 1) * size,
      take: size,
    });
  }
  
}
