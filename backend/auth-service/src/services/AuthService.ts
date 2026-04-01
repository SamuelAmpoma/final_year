import bcrypt from 'bcryptjs';
import { AppDataSource } from '../database/database';
import { User } from '../entities/User';
import { JwtTokenProvider, TokenPayload } from '../security/JwtTokenProvider';
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  AuthResponse,
  UserDTO,
} from '../dto/auth.dto';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private jwtTokenProvider = new JwtTokenProvider();

  async register(request: RegisterRequest): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: request.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(request.password, 10);

    // Create user
    const user = this.userRepository.create({
      name: request.name,
      email: request.email,
      password: hashedPassword,
      role: request.role,
      stationId: request.stationId,
      phoneNumber: request.phoneNumber,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtTokenProvider.generateToken(payload);
    const refreshToken = this.jwtTokenProvider.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtTokenProvider.getJwtExpiration(),
      user: this.mapToDTO(user),
    };
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: request.email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      request.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtTokenProvider.generateToken(payload);
    const refreshToken = this.jwtTokenProvider.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtTokenProvider.getJwtExpiration(),
      user: this.mapToDTO(user),
    };
  }

  async refreshToken(request: RefreshTokenRequest): Promise<AuthResponse> {
    try {
      const payload = this.jwtTokenProvider.verifyRefreshToken(
        request.refreshToken
      );

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const newPayload: TokenPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtTokenProvider.generateToken(newPayload);

      return {
        accessToken,
        refreshToken: request.refreshToken,
        tokenType: 'Bearer',
        expiresIn: this.jwtTokenProvider.getJwtExpiration(),
        user: this.mapToDTO(user),
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getProfile(userEmail: string): Promise<UserDTO> {
    const user = await this.userRepository.findOne({
      where: { email: userEmail },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.mapToDTO(user);
  }

  private mapToDTO(user: User): UserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      stationId: user.stationId,
      phoneNumber: user.phoneNumber,
    };
  }
}
