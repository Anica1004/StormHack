import express from "express";
import {
  getDiseaseGuide,
  getAllDiseases,
} from "../controllers/diseaseController";

const router = express.Router();

router.post("/guide", getDiseaseGuide);
router.get("/", getAllDiseases);

export default router;
