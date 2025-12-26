import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getNotifications(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function markAsRead(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function markAllAsRead(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=notification.controller.d.ts.map