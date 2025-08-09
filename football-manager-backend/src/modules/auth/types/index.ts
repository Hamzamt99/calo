export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto extends LoginDto {
  name: string;
  username: string;
  lastName: string;
}

export interface UserRow {
  id: number;
  email: string;
  password: string;
}