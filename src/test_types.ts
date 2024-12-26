import { User } from '@react-native-google-signin/google-signin';

export interface SignInSuccessResponse {
  user: User;
}

export type SignInResponse = SignInSuccessResponse;

export interface GoogleSignInError {
  code: number;
  message: string;
}
