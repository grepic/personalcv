"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.getRefreshTokenExpiry = getRefreshTokenExpiry;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
}
function getRefreshTokenExpiry() {
    const expiresIn = JWT_REFRESH_EXPIRES_IN;
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
        throw new Error('Invalid JWT_REFRESH_EXPIRES_IN format');
    }
    const value = parseInt(match[1]);
    const unit = match[2];
    const now = new Date();
    switch (unit) {
        case 'd':
            return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
        case 'h':
            return new Date(now.getTime() + value * 60 * 60 * 1000);
        case 'm':
            return new Date(now.getTime() + value * 60 * 1000);
        case 's':
            return new Date(now.getTime() + value * 1000);
        default:
            throw new Error('Invalid time unit');
    }
}
//# sourceMappingURL=jwt.js.map