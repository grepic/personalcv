import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function createJob(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getJobs(req: AuthRequest, res: Response): Promise<void>;
export declare function getJob(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateJob(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateJobStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=job.controller.d.ts.map