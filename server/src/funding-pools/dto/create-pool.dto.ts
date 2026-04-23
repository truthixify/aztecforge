import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max } from 'class-validator';

export class CreatePoolDto {
  @ApiProperty({ description: 'Payment token address' })
  @IsString()
  paymentToken!: string;

  @ApiProperty({ description: 'Purpose description' })
  @IsString()
  purpose!: string;

  @ApiProperty({ description: 'Pool type: 0=open, 1=quadratic, 2=retroactive, 3=streaming' })
  @IsNumber()
  @Min(0)
  @Max(3)
  poolType!: number;
}

export class DepositDto {
  @ApiProperty({ description: 'Deposit amount in token base units' })
  @IsString()
  amount!: string;
}

export class AllocateDto {
  @ApiProperty({ description: 'Recipient address' })
  @IsString()
  recipient!: string;

  @ApiProperty({ description: 'Allocation amount' })
  @IsString()
  amount!: string;

  @ApiProperty({ description: 'Reason for allocation' })
  @IsString()
  reason!: string;
}
