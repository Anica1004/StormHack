import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// POST /api/diseases/guide
export const getDiseaseGuide = async (req: Request, res: Response) => {
  try {
    const { diseases, filter } = req.body; // diseases: string[], filter: 'avoid' | 'beneficial' | 'all'

    if (!diseases || !Array.isArray(diseases) || diseases.length === 0) {
      return res.status(400).json({
        error: "Bad request",
        message:
          'Request body must include "diseases" array with at least one disease',
      });
    }

    // Normalize disease names
    const diseaseNames = diseases.map((d) => d.toLowerCase());

    // Find diseases in database
    const foundDiseases = await prisma.disease.findMany({
      where: {
        name: {
          in: diseaseNames,
        },
      },
    });

    if (foundDiseases.length === 0) {
      return res.status(404).json({
        error: "No diseases found",
        message: "None of the specified diseases exist in our database",
        requestedDiseases: diseaseNames,
      });
    }

    const diseaseIds = foundDiseases.map((d) => d.id);

    // Fetch avoid relationships
    const avoidRelations = await prisma.diseaseIngredient.findMany({
      where: {
        diseaseId: { in: diseaseIds },
        type: "AVOID",
      },
      include: {
        ingredient: true,
        disease: true,
        sources: true,
      },
      orderBy: [{ severity: "desc" }, { ingredient: { name: "asc" } }],
    });

    // Fetch beneficial relationships
    const beneficialRelations = await prisma.diseaseIngredient.findMany({
      where: {
        diseaseId: { in: diseaseIds },
        type: "BENEFICIAL",
      },
      include: {
        ingredient: true,
        disease: true,
        sources: true,
      },
      orderBy: [{ severity: "desc" }, { ingredient: { name: "asc" } }],
    });

    // Group by ingredient to handle multiple diseases
    const avoidMap = new Map();
    avoidRelations.forEach((relation) => {
      const key = relation.ingredient.name;
      if (!avoidMap.has(key)) {
        avoidMap.set(key, {
          food: relation.ingredient.name,
          reason: relation.reason,
          severity: relation.severity,
          affectedDiseases: [relation.disease.name],
          sources: relation.sources.map((s) => ({
            label: s.label,
            url: s.url || null,
          })),
        });
      } else {
        const existing = avoidMap.get(key);
        existing.affectedDiseases.push(relation.disease.name);
        // Use highest severity
        existing.severity = Math.max(existing.severity, relation.severity);
        // Combine reasons if different
        if (!existing.reason.includes(relation.reason)) {
          existing.reason += "; " + relation.reason;
        }
      }
    });

    const beneficialMap = new Map();
    beneficialRelations.forEach((relation) => {
      const key = relation.ingredient.name;
      if (!beneficialMap.has(key)) {
        beneficialMap.set(key, {
          food: relation.ingredient.name,
          reason: relation.reason,
          severity: relation.severity,
          affectedDiseases: [relation.disease.name],
          sources: relation.sources.map((s) => ({
            label: s.label,
            url: s.url || null,
          })),
        });
      } else {
        const existing = beneficialMap.get(key);
        existing.affectedDiseases.push(relation.disease.name);
        existing.severity = Math.max(existing.severity, relation.severity);
        if (!existing.reason.includes(relation.reason)) {
          existing.reason += "; " + relation.reason;
        }
      }
    });

    // Convert maps to arrays
    const avoid = Array.from(avoidMap.values());
    const beneficial = Array.from(beneficialMap.values());

    // Apply filter
    let response: any = {
      diseases: foundDiseases.map((d) => d.name),
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
    console.error("Error in getDiseaseGuide:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET /api/diseases
export const getAllDiseases = async (req: Request, res: Response) => {
  try {
    const diseases = await prisma.disease.findMany({
      select: {
        name: true,
        description: true,
        type: true, // 添加这行
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      count: diseases.length,
      diseases,
    });
  } catch (error) {
    console.error("Error in getAllDiseases:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
