import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateBountyDto {
  @ApiProperty({ description: 'Payment token contract address' })
  @IsString()
  paymentToken!: string;

  @ApiProperty({ description: 'Reward amount in token base units' })
  @IsString()
  rewardAmount!: string;

  @ApiProperty({ description: 'Title of the bounty' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Full description of the bounty requirements' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Deadline as block number' })
  @IsNumber()
  @Min(1)
  deadlineBlock!: number;

  @ApiProperty({
    description: 'Whether the reward amount is publicly visible (default: true)',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isAmountPublic?: boolean = true;

  @ApiProperty({ description: 'Required skills (tags)', required: false })
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiProperty({ description: 'Difficulty level: easy, medium, hard', required: false })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiProperty({
    description: 'Accepted submission formats (what the creator will review)',
    required: false,
    example: ['github_repo', 'deployed_url', 'figma_link', 'document', 'video', 'other'],
  })
  @IsString({ each: true })
  @IsOptional()
  acceptedFormats?: string[];
}
