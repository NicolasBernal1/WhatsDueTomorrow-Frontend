import { UserDto } from "./user.dto";

export interface LoggedInDto {
  token: string;
  user: UserDto;
}