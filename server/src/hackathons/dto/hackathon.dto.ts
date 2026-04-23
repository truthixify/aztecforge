import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, Min, Max } from 'class-validator';

export class CreateHackathonDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  paymentToken!: string;

  @ApiProperty()
  @IsString()
  totalPrizePool!: string;

  @ApiProperty()
  @IsNumber()
  submissionDeadline!: number;

  @ApiProperty()
  @IsNumber()
  judgingDeadline!: number;

  @ApiProperty({ description: 'Track names' })
  @IsArray()
  @IsString({ each: true })
  tracks!: string[];
}

export class RegisterTeamDto {
  @ApiProperty()
  @IsString()
  teamName!: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  members?: string[];
}

export class SubmitProjectDto {
  @ApiProperty()
  @IsNumber()
  teamId!: number;

  @ApiProperty()
  @IsNumber()
  trackIndex!: number;

  @ApiProperty()
  @IsString()
  projectName!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  repoUrl!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  demoUrl?: string;
}

export class ScoreSubmissionDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  feedback?: string;
}

export class AwardPrizeDto {
  @ApiProperty()
  @IsNumber()
  teamId!: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  placement!: number;

  @ApiProperty()
  @IsString()
  prizeAmount!: string;
}
