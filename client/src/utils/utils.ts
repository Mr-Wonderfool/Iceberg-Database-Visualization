import { UserRegister } from "../types/types";

export const emailPattern = {
  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  message: "Invalid email address",
};

export const namePattern = {
  value: /^[A-Za-z\s\u00C0-\u017F]{1,30}$/,
  message: "Invalid name",
};

export const passwordRules = () => {
  const rules = {
    minLength: {
      value: 5,
      message: "Password must be at least 5 characters",
    },
    required: "Password is required",
  };
  return rules;
};

export const confirmPasswordRules = (getValues: () => UserRegister) => {
  const rules = {
    validate: (value: string) => {
      const password = getValues().password;
      return value === password ? true : "The passwords do not match";
    },
    required: "Password confirmation is required",
  };

  return rules;
};
