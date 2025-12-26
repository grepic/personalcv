import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function onboarding(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function addSkill(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function removeSkill(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function addExperience(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateExperience(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteExperience(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function searchUsers(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=user.controller.d.ts.map