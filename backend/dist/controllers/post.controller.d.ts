import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getFeed(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createPost(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getPost(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updatePost(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deletePost(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=post.controller.d.ts.map