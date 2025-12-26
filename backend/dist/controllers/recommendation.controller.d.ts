import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function createRecommendation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getUserRecommendations(req: AuthRequest, res: Response): Promise<void>;
export declare function updateRecommendation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteRecommendation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function toggleRecommendationVisibility(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=recommendation.controller.d.ts.map