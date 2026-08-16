import { ProfileAvatarStorageService } from '../../../users/profile-avatar-storage.service';

type LeaderProfile = {
  name: string | null;
  avatarUrl: string | null;
  avatarStoragePath: string | null;
};

export function toPublicLeaderProfile(
  profile: LeaderProfile,
  profileAvatarStorageService: ProfileAvatarStorageService,
) {
  return {
    displayName: profile.name?.trim() || 'Learner',
    avatarUrl:
      (profile.avatarStoragePath
        ? profileAvatarStorageService.getPublicUrl(profile.avatarStoragePath)
        : null) ?? profile.avatarUrl,
  };
}
