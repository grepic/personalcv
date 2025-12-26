import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function createCandidateComment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getCandidateComments(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCandidateComment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=candidateComment.controller.d.ts.map