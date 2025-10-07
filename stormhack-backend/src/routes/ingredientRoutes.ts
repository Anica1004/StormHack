import express from "express";
import {
  getIngredientCompatibility,
  searchIngredients,
} from "../controllers/ingredientController";

const router = express.Router();

router.get("/search", searchIngredients);
router.get("/:name/compatibility", getIngredientCompatibility);

export default router;
