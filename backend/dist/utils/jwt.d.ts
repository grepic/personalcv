import { JwtPayload } from '../types';
export declare function generateAccessToken(payload: JwtPayload): string;
export declare function generateRefreshToken(payload: JwtPayload): string;
export declare function verifyAccessToken(token: string): JwtPayload;
export declare function verifyRefreshToken(token: string): JwtPayload;
export declare function getRefreshTokenExpiry(): Date;
//# sourceMappingURL=jwt.d.ts.map