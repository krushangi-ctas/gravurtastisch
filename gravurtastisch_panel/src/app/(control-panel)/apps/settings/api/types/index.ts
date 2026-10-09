
export type UpdateUserData = {
  name: string;
  email: string;
  // contact_no: string;
};

export type UpdatePasswordData = {
  currentPassword: string;
  password: string;
  passwordConfirm?: string;
};

export type SettingsSecurity = {
  id: string;
  currentPassword?: string;
  newPassword?: string;
  passwordConfirm?: string;
  twoStepVerification?: boolean;
  askPasswordChange?: boolean;
};


