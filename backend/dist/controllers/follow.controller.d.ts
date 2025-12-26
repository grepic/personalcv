import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function followCompany(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function unfollowCompany(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getFollowedCompanies(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function addFollowedRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function removeFollowedRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getFollowedRoles(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=follow.controller.d.ts.map