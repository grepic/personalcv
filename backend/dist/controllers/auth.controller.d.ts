import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function refresh(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function logout(req: AuthRequest, res: Response): Promise<void>;
export declare function me(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.controller.d.ts.map