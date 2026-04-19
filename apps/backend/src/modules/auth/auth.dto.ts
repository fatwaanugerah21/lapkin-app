export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  id: string;
  name: string;
  username: string;
  role: string;
  jobTitle: string;
  nip: string;
}

export interface UserSignatureResponseDto {
  signatureDataUrl: string | null;
}

export interface UpdateUserSignatureDto {
  signatureDataUrl: string | null;
}
