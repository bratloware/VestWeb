import { describe, it, expect } from '@jest/globals';
import { hashPassword, comparePassword } from '../../../src/services/hashService.js';

describe('hashService', () => {
  describe('hashPassword', () => {
    it('should return a bcrypt hash string', async () => {
      const hash = await hashPassword('mypassword123');
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$2b\$/); // bcrypt hash prefix
    });

    it('should produce different hashes for the same password', async () => {
      const hash1 = await hashPassword('same_password');
      const hash2 = await hashPassword('same_password');
      expect(hash1).not.toBe(hash2); // bcrypt uses random salt
    });

    it('should not return the plain-text password', async () => {
      const password = 'plain_text_pass';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
    });
  });

  describe('comparePassword', () => {
    it('should return true when the password matches the hash', async () => {
      const password = 'correctpassword';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false when the password does not match', async () => {
      const hash = await hashPassword('correctpassword');
      const result = await comparePassword('wrongpassword', hash);
      expect(result).toBe(false);
    });

    it('should return false for an empty password against a valid hash', async () => {
      const hash = await hashPassword('somepassword');
      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });
  });
});
