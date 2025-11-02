import { UserDto } from "./user.dto";

export interface LoogedInDto {
  token: string;
  user: UserDto;
}