import { BaseRepository } from './BaseRepository';
import { UserProfile } from '../../types';

export class UserRepository extends BaseRepository<UserProfile> {
  protected collectionName = 'users';

  async updateProfile(id: string, data: Partial<UserProfile>): Promise<boolean> {
    return await this.update(id, data);
  }
}
export const userRepository = new UserRepository();
