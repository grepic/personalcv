"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController = __importStar(require("../controllers/user.controller"));
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/onboarding', auth_1.authenticate, userController.onboarding);
router.get('/profile/:userId', userController.getProfile);
router.put('/profile', auth_1.authenticate, userController.updateProfile);
router.post('/skills', auth_1.authenticate, userController.addSkill);
router.delete('/skills/:skillId', auth_1.authenticate, userController.removeSkill);
router.post('/experience', auth_1.authenticate, userController.addExperience);
router.put('/experience/:experienceId', auth_1.authenticate, userController.updateExperience);
router.delete('/experience/:experienceId', auth_1.authenticate, userController.deleteExperience);
router.get('/search', userController.searchUsers);
exports.default = router;
//# sourceMappingURL=user.routes.js.map