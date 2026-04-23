import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateQuestDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ description: '0=on-chain, 1=content, 2=development, 3=community' })
  @IsNumber()
  @Min(0)
  @Max(3)
  questType!: number;

  @ApiProperty()
  @IsString()
  paymentToken!: string;

  @ApiProperty()
  @IsString()
  rewardPerCompletion!: string;

  @ApiProperty({ description: '0 = unlimited' })
  @IsNumber()
  @Min(0)
  maxCompletions!: number;

  @ApiProperty()
  @IsNumber()
  deadlineBlock!: number;

  @ApiProperty({ description: 'Reputation gate ID (0 = no gate)', required: false })
  @IsNumber()
  @IsOptional()
  reputationGateId?: number;
}

export class CompleteQuestDto {
  @ApiProperty({ description: 'Proof of completion (URL or hash)' })
  @IsString()
  verificationUrl!: string;
}

export class VerifyCompletionDto {
  @ApiProperty()
  @IsString()
  completer!: string;

  @ApiProperty()
  @IsString()
  verificationUrl!: string;
}
