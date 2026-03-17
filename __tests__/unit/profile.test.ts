import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProfile, saveProfile, clearProfile } from '../../app/lib/profile';
import type { UserProfile } from '../../app/types/profile';

const mockProfile: UserProfile = {
  role: 'mom',
  dueDate: '2025-12-01',
  createdAt: '2025-03-17T00:00:00.000Z',
};

describe('profile utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getProfile', () => {
    it('returns null when no profile stored', () => {
      expect(getProfile()).toBeNull();
    });

    it('returns the stored profile', () => {
      localStorage.setItem('pregnancy_profile', JSON.stringify(mockProfile));
      expect(getProfile()).toEqual(mockProfile);
    });

    it('returns null when stored value is malformed JSON', () => {
      localStorage.setItem('pregnancy_profile', 'not-json');
      expect(getProfile()).toBeNull();
    });
  });

  describe('saveProfile', () => {
    it('saves profile to localStorage', () => {
      saveProfile(mockProfile);
      const raw = localStorage.getItem('pregnancy_profile');
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual(mockProfile);
    });

    it('overwrites an existing profile', () => {
      saveProfile(mockProfile);
      const updated: UserProfile = { ...mockProfile, role: 'dad' };
      saveProfile(updated);
      expect(getProfile()?.role).toBe('dad');
    });
  });

  describe('clearProfile', () => {
    it('removes profile from localStorage', () => {
      saveProfile(mockProfile);
      clearProfile();
      expect(getProfile()).toBeNull();
    });

    it('does not throw when no profile exists', () => {
      expect(() => clearProfile()).not.toThrow();
    });
  });
});
