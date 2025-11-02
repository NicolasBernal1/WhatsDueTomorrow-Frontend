export interface BaseResponseDto<T> {
  status: number,
  message: string,
  data?: T; 
}