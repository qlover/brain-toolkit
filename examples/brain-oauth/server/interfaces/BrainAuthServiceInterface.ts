export type BrainVerifyLoginParams = {
  email: string;
  password: string;
};

export type BrainVerifyLoginResult = {
  userId: number;
  email: string;
  name: string;
};

export interface BrainAuthServiceInterface {
  verifyLogin(params: BrainVerifyLoginParams): Promise<BrainVerifyLoginResult>;
}
