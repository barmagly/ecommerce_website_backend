import { Router } from "express";
import { validation } from "../middlewares/validation.middleware";
import * as authController from "./auth.controller";
import * as authSchema from "./auth.schema";
const router = Router();

router.post("/register", validation(authSchema.register), authController.register);