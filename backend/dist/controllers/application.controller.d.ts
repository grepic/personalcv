import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function applyToJob(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getJobApplications(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateApplicationStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getMyApplications(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=application.controller.d.ts.map