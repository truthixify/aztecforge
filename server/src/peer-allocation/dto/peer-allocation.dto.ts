import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateCircleDto {
  @ApiProperty({ description: 'Circle name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Payment token address' })
  @IsString()
  paymentToken!: string;

  @ApiProperty({ description: 'Epoch duration in blocks' })
  @IsNumber()
  @Min(1)
  epochDurationBlocks!: number;

  @ApiProperty({ description: 'GIVE tokens per member per epoch' })
  @IsNumber()
  @Min(1)
  givePerMember!: number;

  @ApiProperty({ description: 'Reward pool per epoch in token base units' })
  @IsString()
  rewardPoolPerEpoch!: string;
}

export class AllocateGiveDto {
  @ApiProperty({ description: 'Recipient address' })
  @IsString()
  recipient!: string;

  @ApiProperty({ description: 'GIVE amount to allocate' })
  @IsNumber()
  @Min(1)
  amount!: number;
}

export class AddMemberDto {
  @ApiProperty({ description: 'Member address to add' })
  @IsString()
  member!: string;
}
