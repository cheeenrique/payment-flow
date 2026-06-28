export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Conteúdo (claims) carregado dentro do JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/** Dados do usuário usados para gerar tokens. */
export interface JwtUserClaims {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface ITokenService {
  generateTokenPair(claims: JwtUserClaims): TokenPair;
  generateAccessToken(claims: JwtUserClaims): string;
  verifyRefreshToken(token: string): JwtPayload;
  getRefreshExpiresInMs(): number;
}
