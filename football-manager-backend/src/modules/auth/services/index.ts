import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginDto, RegisterDto } from "../types";
import { teamQueue } from "../../../config/queue";
import { QueryTypes } from "sequelize";
import { UserRow } from "../types";
import { database } from "../../../config/database";
import { FIND_USER_BY_EMAIL, FIND_USER_BY_USERNAME, INSERT_USER } from "../queries";

function isRegisterDto(dto: LoginDto | RegisterDto): dto is RegisterDto {
  return "name" in dto && "username" in dto && "lastName" in dto;
}

export class AuthService {
  private db;
  constructor() { this.db = database; }

  public async registerOrLogin(dto: LoginDto | RegisterDto): Promise<{ token: string }> {
    try {
      const [users] = (await this.db.query(FIND_USER_BY_EMAIL, {
        type: QueryTypes.SELECT,
        replacements: { email: dto.email },
      })) as UserRow[];

      if (users) {
        // login
        const user = users;
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid) throw new Error("Invalid credentials");
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
        return { token };
      }

      if (!isRegisterDto(dto)) throw new Error("Registration requires name, username, and lastName.");

      const usernames = (await this.db.query(FIND_USER_BY_USERNAME, {
        type: QueryTypes.SELECT,
        replacements: { username: dto.username },
      })) as Array<{ id: number }>;

      if (usernames.length) throw new Error("Username already in use");

      const hash = await bcrypt.hash(dto.password, 10);
      const [userId] = await this.db.query(INSERT_USER, {
        type: QueryTypes.INSERT,
        replacements: {
          email: dto.email,
          password: hash,
          name: dto.name,
          username: dto.username,
          lastName: dto.lastName,
        },
      });

      if (!userId) throw new Error("Could not determine inserted user id");

      await teamQueue.add("create-team", { userId });

      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: "1d" });
      return { token };
    } catch (err: any) {
      throw new Error(err?.message || "Authentication failed");
    }
  }
}
