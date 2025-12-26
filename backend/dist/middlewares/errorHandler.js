"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.message,
        });
    }
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
}
//# sourceMappingURL=errorHandler.js.map