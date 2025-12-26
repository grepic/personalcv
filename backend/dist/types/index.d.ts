import { Role } from '@prisma/client';
export interface JwtPayload {
    userId: string;
    roles: Role[];
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
//# sourceMappingURL=index.d.ts.map