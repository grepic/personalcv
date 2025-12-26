import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function createCompanyReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getCompanyReviews(req: AuthRequest, res: Response): Promise<void>;
export declare function updateCompanyReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteCompanyReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=companyReview.controller.d.ts.map