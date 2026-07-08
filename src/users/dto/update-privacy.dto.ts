import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdatePrivacyDto {
  @IsOptional()
  @IsEnum(['public', 'private'])
  profileVisibility?: 'public' | 'private';

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;
}
