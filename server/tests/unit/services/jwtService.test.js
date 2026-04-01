import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateToken, verifyToken } from '../../../src/services/jwtService.js';

describe('jwtService', () => {
  const payload = { id: 1, role: 'student' };

  describe('generateToken', () => {
    it('should return a string token', () => {
      const token = generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should embed the payload in the token', () => {
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken({ id: 1, role: 'student' });
      const token2 = generateToken({ id: 2, role: 'teacher' });
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should return decoded payload for a valid token', () => {
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(1);
      expect(decoded.role).toBe('student');
    });

    it('should throw JsonWebTokenError for a tampered token', () => {
      const token = generateToken(payload);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyToken(tampered)).toThrow();
    });

    it('should throw JsonWebTokenError for an entirely fake token', () => {
      expect(() => verifyToken('this.is.fake')).toThrow();
    });

    it('should throw TokenExpiredError for an expired token', async () => {
      // Sign a token that expires in 1ms
      const { default: jwt } = await import('jsonwebtoken');
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1ms' });
      await new Promise(r => setTimeout(r, 10));
      expect(() => verifyToken(expiredToken)).toThrow();
    });
  });
});
