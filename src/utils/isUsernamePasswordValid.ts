import { UserPassInput } from "../InputTypes/userPassInput";
import { FieldError } from "../ObjectTypes/FieldError";

export const isUsernameValid = (username: string) => {
  const errors: FieldError[] = [];
  if (username.length < 3) {
    errors.push({
      field: "username",
      message: "The length of the username must be greater than 2",
    });
  }
  return errors;
};

export const isPasswordValid = (password: string) => {
  const errors: FieldError[] = [];

  if (password.length < 3) {
    errors.push({
      field: "password",
      message: "The length of the password must be greater than 2",
    });
  }
  return errors;
};
export const isUsernamePasswordValid = (input: UserPassInput) => {
  const errors: FieldError[] = [];
  if (input.username.length < 3) {
    errors.push({
      field: "username",
      message: "The length of the username must be greater than 2",
    });
  }
  if (input.password.length < 3) {
    errors.push({
      field: "password",
      message: "The length of the password must be greater than 2",
    });
  }
  return errors;
};
