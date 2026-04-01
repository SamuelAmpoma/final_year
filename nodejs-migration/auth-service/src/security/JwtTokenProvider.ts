import jwt from 'jsonwebtoken';

export interface TokenPayload {
  sub: number;
  email: string;
  role: string;
}

export class JwtTokenProvider {
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private jwtExpiration: number;
  private jwtRefreshExpiration: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret =
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
    this.jwtExpiration = parseInt(process.env.JWT_EXPIRATION || '3600');
    this.jwtRefreshExpiration = parseInt(
      process.env.JWT_REFRESH_EXPIRATION || '604800'
    );
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiration,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiration,
    });
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.jwtSecret) as unknown as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.jwtRefreshSecret) as unknown as TokenPayload;
  }

  extractUsername(token: string): string {
    try {
      const payload = this.verifyRefreshToken(token);
      return payload.email;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  isTokenValid(token: string): boolean {
    try {
      this.verifyRefreshToken(token);
      return true;
    } catch {
      return false;
    }
  }

  getJwtExpiration(): number {
    return this.jwtExpiration;
  }
}
