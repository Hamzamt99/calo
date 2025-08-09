// src/modules/auth/queries.ts

export const FIND_USER_BY_USERNAME = `
  SELECT id FROM users WHERE username = :username
`;

export const FIND_USER_BY_EMAIL = `
  SELECT * FROM users WHERE email = :email
`;

export const INSERT_USER = `
  INSERT INTO users (email, password, name, lastName, username)
  VALUES (:email, :password, :name, :lastName, :username)
`;