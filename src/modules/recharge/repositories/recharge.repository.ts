import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    supplierId: string,
    supplierName: string,
    cellPhone: string,
    amount: number,
  ): Promise<RechargeEntity> {
    const recharge = this.repository.create({
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
  ): Promise<void> {
    const result = await this.repository.update(
      { id, status: RechargeStatus.PENDING },
      {
        status: RechargeStatus.SUCCESS,
        transactionalId,
        providerMessage,
      },
    );

    if (result.affected === 0) {
      throw new ConflictException(
        'La recarga no existe o ya no está pendiente',
      );
    }
  }

  async markFailed(id: string, providerMessage: string): Promise<void> {
    const result = await this.repository.update(
      { id, status: RechargeStatus.PENDING },
      {
        status: RechargeStatus.FAILED,
        providerMessage,
      },
    );

    if (result.affected === 0) {
      throw new NotFoundException(
        'No se encontró una recarga pendiente para actualizar',
      );
    }
  }

  async markUnknown(id: string, providerMessage: string): Promise<void> {
    const result = await this.repository.update(
      { id, status: RechargeStatus.PENDING },
      {
        status: RechargeStatus.UNKNOWN,
        providerMessage,
      },
    );

    if (result.affected === 0) {
      throw new NotFoundException(
        'No se encontró una recarga pendiente para actualizar',
      );
    }
  }

  async findById(id: string): Promise<RechargeEntity | null> {
    return this.repository.findOneBy({ id });
  }

  async findAll(): Promise<RechargeEntity[]> {
    return this.repository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }
  
}
