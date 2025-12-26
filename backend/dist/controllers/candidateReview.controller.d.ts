import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function createCandidateReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getCandidateReviews(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCandidateReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=candidateReview.controller.d.ts.map