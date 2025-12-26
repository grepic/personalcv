import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function createPortfolioProject(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getUserPortfolioProjects(req: AuthRequest, res: Response): Promise<void>;
export declare function updatePortfolioProject(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deletePortfolioProject(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=portfolio.controller.d.ts.map