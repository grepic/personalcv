"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const application_routes_1 = __importDefault(require("./routes/application.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const follow_routes_1 = __importDefault(require("./routes/follow.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const candidateReview_routes_1 = __importDefault(require("./routes/candidateReview.routes"));
const candidateComment_routes_1 = __importDefault(require("./routes/candidateComment.routes"));
const companyReview_routes_1 = __importDefault(require("./routes/companyReview.routes"));
const portfolio_routes_1 = __importDefault(require("./routes/portfolio.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const recommendation_routes_1 = __importDefault(require("./routes/recommendation.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/posts', post_routes_1.default);
app.use('/api/jobs', job_routes_1.default);
app.use('/api/applications', application_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/follow', follow_routes_1.default);
app.use('/api/messages', message_routes_1.default);
app.use('/api', candidateReview_routes_1.default);
app.use('/api', candidateComment_routes_1.default);
app.use('/api', companyReview_routes_1.default);
app.use('/api', portfolio_routes_1.default);
app.use('/api', service_routes_1.default);
app.use('/api', recommendation_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map