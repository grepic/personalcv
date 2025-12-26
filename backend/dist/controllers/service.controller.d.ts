import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function createFreelancerService(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getUserFreelancerServices(req: AuthRequest, res: Response): Promise<void>;
export declare function updateFreelancerService(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteFreelancerService(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=service.controller.d.ts.map