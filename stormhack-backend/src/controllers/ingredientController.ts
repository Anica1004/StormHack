import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /api/ingredients/:name/compatibility
export const getIngredientCompatibility = async (
  req: Request,
  res: Response
) => {
  try {
    const { name } = req.params;
    const { filter } = req.query; // 'avoid', 'beneficial', or 'all' (default)

    if (!name) {
      return res.status(400).json({
        error: "Bad request",
        message: "Ingredient name is required",
      });
    }
    // Find the ingredient
    const ingredient = await prisma.ingredient.findUnique({
      where: { name: name.toLowerCase() },
    });

    if (!ingredient) {
      return res.status(404).json({
        error: "Ingredient not found",
        message: `Ingredient "${name}" does not exist in our database`,
      });
    }

    // Fetch avoid interactions
    const avoidInteractions = await prisma.ingredientInteraction.findMany({
      where: {
        OR: [
          { ingredientAId: ingredient.id },
          { ingredientBId: ingredient.id },
        ],
      },
      include: {
        ingredientA: true,
        ingredientB: true,
        sources: true,
      },
      orderBy: [{ severity: "desc" }, { ingredientB: { name: "asc" } }],
    });

    // Fetch beneficial pairings
    const beneficialPairings = await prisma.ingredientBenefit.findMany({
      where: {
        OR: [
          { ingredientAId: ingredient.id },
          { ingredientBId: ingredient.id },
        ],
      },
      include: {
        ingredientA: true,
        ingredientB: true,
        sources: true,
      },
      orderBy: [{ severity: "desc" }, { ingredientB: { name: "asc" } }],
    });

    // Format avoid results
    const avoid = avoidInteractions.map((interaction) => {
      const otherIngredient =
        interaction.ingredientAId === ingredient.id
          ? interaction.ingredientB
          : interaction.ingredientA;

      return {
        food: otherIngredient.name,
        reason: interaction.reason,
        severity: interaction.severity,
        sources: interaction.sources.map((s) => ({
          label: s.label,
          url: s.url || null,
        })),
      };
    });

    // Format beneficial results
    const beneficial = beneficialPairings.map((pairing) => {
      const otherIngredient =
        pairing.ingredientAId === ingredient.id
          ? pairing.ingredientB
          : pairing.ingredientA;

      return {
        food: otherIngredient.name,
        reason: pairing.reason,
        severity: pairing.severity,
        sources: pairing.sources.map((s) => ({
          label: s.label,
          url: s.url || null,
        })),
      };
    });

    // Apply filter
    let response: any = {
      ingredient: ingredient.name,
      category: ingredient.category,
    };

    if (!filter || filter === "all") {
      response.avoid = avoid;
      response.beneficial = beneficial;
    } else if (filter === "avoid") {
      response.avoid = avoid;
    } else if (filter === "beneficial") {
      response.beneficial = beneficial;
    }

    res.json(response);
  } catch (error) {
    console.error("Error in getIngredientCompatibility:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET /api/ingredients/search?q=query
export const searchIngredients = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        error: "Bad request",
        message: 'Query parameter "q" is required',
      });
    }

    const ingredients = await prisma.ingredient.findMany({
      where: {
        name: {
          contains: q.toLowerCase(),
        },
      },
      select: {
        name: true,
        category: true,
      },
      take: 10,
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      query: q,
      results: ingredients,
    });
  } catch (error) {
    console.error("Error in searchIngredients:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
