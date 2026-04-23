import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SubmitWorkDto {
  @ApiProperty({ description: 'URL or hash of the submitted work' })
  @IsString()
  submissionUrl!: string;

  @ApiProperty({ description: 'Description of what was done' })
  @IsString()
  submissionNotes!: string;
}
