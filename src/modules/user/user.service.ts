import { UserRepository } from "./user.repository";

export class UserService {
  static async findAll() {
    return await UserRepository.findAll();
  }
}
