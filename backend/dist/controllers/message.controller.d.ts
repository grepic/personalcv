import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getConversations(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getMessages(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function sendMessage(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function startConversation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=message.controller.d.ts.map