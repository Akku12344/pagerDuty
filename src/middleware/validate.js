import { AppError } from "../lib/errors.js";

export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      return next(
        new AppError(
          "Validation failed",
          400,
          result.error.flatten()
        )
      );
    }

    req[property] = result.data;
    next();
  };
};