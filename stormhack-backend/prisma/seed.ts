import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");
  // Clear existing data
  await prisma.source.deleteMany();
  await prisma.diseaseIngredient.deleteMany();
  await prisma.ingredientBenefit.deleteMany();
  await prisma.ingredientInteraction.deleteMany();
  await prisma.disease.deleteMany();
  await prisma.ingredient.deleteMany();
  console.log("✅ Cleared existing data");
  // ==================== CREATE INGREDIENTS ====================
  const spinach = await prisma.ingredient.create({
    data: { name: "spinach", category: "vegetable" },
  });
  const orange = await prisma.ingredient.create({
    data: { name: "orange", category: "fruit" },
  });
  const lentils = await prisma.ingredient.create({
    data: { name: "lentils", category: "legume" },
  });
  const bellPepper = await prisma.ingredient.create({
    data: { name: "bell pepper", category: "vegetable" },
  });
  const chickpeas = await prisma.ingredient.create({
    data: { name: "chickpeas", category: "legume" },
  });
  const lemonJuice = await prisma.ingredient.create({
    data: { name: "lemon juice", category: "condiment" },
  });
  const kidneyBeans = await prisma.ingredient.create({
    data: { name: "kidney beans", category: "legume" },
  });
  const beef = await prisma.ingredient.create({
    data: { name: "beef", category: "meat" },
  });
  const cereal = await prisma.ingredient.create({
    data: { name: "cereal", category: "grain" },
  });
  const orangeJuice = await prisma.ingredient.create({
    data: { name: "orange juice", category: "beverage" },
  });
  const tofu = await prisma.ingredient.create({
    data: { name: "tofu", category: "soy" },
  });
  const salmon = await prisma.ingredient.create({
    data: { name: "salmon", category: "seafood" },
  });
  const milk = await prisma.ingredient.create({
    data: { name: "milk", category: "dairy" },
  });
  const egg = await prisma.ingredient.create({
    data: { name: "egg", category: "egg" },
  });
  const kale = await prisma.ingredient.create({
    data: { name: "kale", category: "vegetable" },
  });
  const oliveOil = await prisma.ingredient.create({
    data: { name: "olive oil", category: "fat/oil" },
  });
  const carrot = await prisma.ingredient.create({
    data: { name: "carrot", category: "vegetable" },
  });
  const tomato = await prisma.ingredient.create({
    data: { name: "tomato", category: "vegetable" },
  });
  console.log("✅ Created 18 ingredients");
  // ==================== CREATE DISEASES ====================
  const ironDeficiencyAnemia = await prisma.disease.create({
    data: {
      name: "iron-deficiency anemia",
      description:
        "Too little iron to make healthy red blood cells, causing tiredness and pale skin.",
      type: "chronic",
    },
  });
  const osteoporosis = await prisma.disease.create({
    data: {
      name: "osteoporosis",
      description:
        "Bones become thin and fragile, increasing the risk of fractures.",
      type: "chronic",
    },
  });
  const hypertriglyceridemia = await prisma.disease.create({
    data: {
      name: "hypertriglyceridemia",
      description:
        "Triglyceride fat levels in the blood are too high, raising heart disease risk.",
      type: "chronic",
    },
  });
  const diabetes = await prisma.disease.create({
    data: {
      name: "diabetes",
      description:
        "Blood sugar stays too high because the body doesn't make or use insulin properly.",
      type: "chronic",
    },
  });
  const hypertension = await prisma.disease.create({
    data: {
      name: "hypertension",
      description:
        "Persistently high blood pressure that strains the heart and blood vessels.",
      type: "chronic",
    },
  });
  const gerd = await prisma.disease.create({
    data: {
      name: "gastroesophageal reflux disease (gerd)",
      description:
        "Stomach acid flows back into the esophagus, causing heartburn and irritation.",
      type: "chronic",
    },
  });
  const gout = await prisma.disease.create({
    data: {
      name: "gout",
      description:
        "A type of arthritis from high uric acid that triggers sudden, painful joint swelling (often the big toe).",
      type: "chronic",
    },
  });
  const cold = await prisma.disease.create({
    data: {
      name: "cold",
      description:
        "A common viral infection with runny nose, cough, sore throat, and mild fever.",
      type: "acute",
    },
  });
  const constipation = await prisma.disease.create({
    data: {
      name: "constipation",
      description: "Infrequent, hard, or difficult bowel movements.",
      type: "acute",
    },
  });
  const fatigue = await prisma.disease.create({
    data: {
      name: "fatigue",
      description:
        "Ongoing tiredness or low energy that doesn't improve with rest.",
      type: "acute",
    },
  });
  const diarrhea = await prisma.disease.create({
    data: {
      name: "diarrhea",
      description: "Frequent, loose, watery stools.",
      type: "acute",
    },
  });
  const soreThroat = await prisma.disease.create({
    data: {
      name: "sore throat",
      description: "Pain or scratchiness in the throat, worse when swallowing.",
      type: "acute",
    },
  });
  const indigestion = await prisma.disease.create({
    data: {
      name: "indigestion",
      description:
        "Upper-belly discomfort—bloating, burning, or fullness—after eating.",
      type: "acute",
    },
  });
  const nausea = await prisma.disease.create({
    data: {
      name: "nausea",
      description: "An uneasy feeling that you might vomit.",
      type: "acute",
    },
  });
  console.log("✅ Created 14 diseases");
  // ==================== CREATE INGREDIENT BENEFITS ====================
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: spinach.id,
      ingredientBId: orange.id,
      reason:
        "Vitamin C in oranges markedly enhances the absorption of non-heme iron from spinach, which by itself is absorbed poorly. Pairing them can help raise total iron uptake from the meal.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: lentils.id,
      ingredientBId: bellPepper.id,
      reason:
        "Bell peppers are very rich in vitamin C. When eaten with lentils, this vitamin converts plant iron into a form your body absorbs more easily, improving overall iron status.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: chickpeas.id,
      ingredientBId: lemonJuice.id,
      reason:
        "Squeezing lemon juice over chickpeas adds acid and vitamin C, both of which make the non-heme iron in chickpeas easier for the body to absorb during digestion.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: kidneyBeans.id,
      ingredientBId: beef.id,
      reason:
        "Beef provides the 'MFP factor' (from Meat, Fish, Poultry), which helps your body absorb more of the non-heme iron present in kidney beans when they are eaten together.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: cereal.id,
      ingredientBId: orangeJuice.id,
      reason:
        "Orange juice supplies vitamin C that supports the uptake of added (fortified) iron in cereal, increasing the amount of iron your body can use from the breakfast.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: tofu.id,
      ingredientBId: salmon.id,
      reason:
        "Salmon naturally contains vitamin D. Vitamin D promotes intestinal calcium absorption, so eating salmon with calcium-set tofu helps your body make better use of the tofu's calcium.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Calcium (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: milk.id,
      ingredientBId: egg.id,
      reason:
        "Egg yolks contain vitamin D, which supports your body's ability to absorb and utilize calcium from milk, contributing to healthier bones and teeth.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Vitamin D (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: kale.id,
      ingredientBId: oliveOil.id,
      reason:
        "Vitamin K in kale is fat‑soluble. Consuming kale with olive oil helps the vitamin dissolve into dietary fats and get packaged for absorption in the intestines.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Vitamin K (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: carrot.id,
      ingredientBId: oliveOil.id,
      reason:
        "Carrots are rich in beta‑carotene, a fat‑soluble precursor to vitamin A. Eating carrots with olive oil improves micelle formation and increases beta‑carotene absorption.",
      severity: 3,
      sources: {
        create: [
          {
            label:
              "NIH ODS – Vitamin A & Carotenoids (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientBenefit.create({
    data: {
      ingredientAId: tomato.id,
      ingredientBId: oliveOil.id,
      reason:
        "Tomatoes contain carotenoids such as lycopene that are better absorbed in the presence of fat. Adding olive oil helps more lycopene get into the bloodstream.",
      severity: 3,
      sources: {
        create: [
          {
            label: "AJCN/PubMed – Plasma lycopene with tomato and olive oil",
            url: "https://pubmed.ncbi.nlm.nih.gov/15927929/",
          },
        ],
      },
    },
  });
  console.log("✅ Created 10 ingredient benefits");
  // ==================== CREATE INGREDIENT INTERACTIONS (AVOID) ====================
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: spinach.id,
      ingredientBId: milk.id,
      reason:
        "Spinach contains oxalates that bind to calcium in milk, forming compounds your body cannot absorb well. This reduces how much calcium you get from the meal.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Calcium (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: spinach.id,
      ingredientBId: tofu.id,
      reason:
        "Oxalates in spinach also attach to the calcium in calcium‑set tofu, limiting the amount of calcium that can be taken up during digestion.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Calcium (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: milk.id,
      ingredientBId: spinach.id,
      reason:
        "Calcium from milk competes with non‑heme iron from spinach at the absorption stage, so taking them together can lower iron uptake from the spinach.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: milk.id,
      ingredientBId: lentils.id,
      reason:
        "When milk is consumed with lentils, calcium can interfere with the absorption of the lentils' non‑heme iron, reducing the iron your body retains.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: milk.id,
      ingredientBId: chickpeas.id,
      reason:
        "The calcium in milk can blunt the absorption of plant‑based iron from chickpeas, which may matter for people who rely on legumes for their iron needs.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: milk.id,
      ingredientBId: kidneyBeans.id,
      reason:
        "Drinking milk with kidney beans can reduce the efficiency of non‑heme iron absorption from the beans due to calcium's inhibitory effect.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: milk.id,
      ingredientBId: cereal.id,
      reason:
        "Calcium present in milk can hinder the absorption of the iron added to fortified cereal, lessening the benefit of the fortification.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: milk.id,
      ingredientBId: beef.id,
      reason:
        "Although beef provides well‑absorbed heme iron, calcium from milk can still interfere with iron uptake, lowering the total iron absorbed from the meal.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: tofu.id,
      ingredientBId: lentils.id,
      reason:
        "Calcium in tofu can reduce the absorption of non‑heme iron from lentils when eaten at the same time, diminishing iron availability.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.ingredientInteraction.create({
    data: {
      ingredientAId: tofu.id,
      ingredientBId: chickpeas.id,
      reason:
        "Eating calcium‑set tofu alongside chickpeas may lower iron absorption from the chickpeas due to calcium's competitive effect in the intestines.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  console.log("✅ Created 10 ingredient interactions");
  // ==================== CREATE DISEASE-INGREDIENT RELATIONSHIPS ====================
  // BENEFICIAL
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: ironDeficiencyAnemia.id,
      ingredientId: cereal.id,
      type: "BENEFICIAL",
      reason:
        "Iron‑fortified cereal provides added iron that can help replenish low iron stores in iron‑deficiency anemia.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: ironDeficiencyAnemia.id,
      ingredientId: orangeJuice.id,
      type: "BENEFICIAL",
      reason:
        "Vitamin C in orange juice enhances the absorption of non‑heme iron from foods and fortified products, supporting iron status.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: osteoporosis.id,
      ingredientId: salmon.id,
      type: "BENEFICIAL",
      reason:
        "Salmon naturally contains vitamin D, which helps the body absorb calcium and supports bone health in osteoporosis.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Vitamin D (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: osteoporosis.id,
      ingredientId: milk.id,
      type: "BENEFICIAL",
      reason:
        "Milk is a rich source of calcium that is essential for maintaining bone mineral density in osteoporosis.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NIH ODS – Calcium (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: hypertriglyceridemia.id,
      ingredientId: salmon.id,
      type: "BENEFICIAL",
      reason:
        "Fatty fish like salmon provide omega‑3 fatty acids that can help lower blood triglyceride levels.",
      severity: 3,
      sources: {
        create: [
          {
            label: "American Heart Association – Fish & Omega‑3",
            url: "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/fish-and-omega-3-fatty-acids",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: diabetes.id,
      ingredientId: lentils.id,
      type: "BENEFICIAL",
      reason:
        "Lentils are high in fiber and have a lower glycemic impact, which helps with steadier blood sugar control in type 2 diabetes.",
      severity: 3,
      sources: {
        create: [
          {
            label: "American Diabetes Association – Carbohydrates & diabetes",
            url: "https://diabetes.org/food-nutrition/understanding-carbs",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: hypertension.id,
      ingredientId: kale.id,
      type: "BENEFICIAL",
      reason:
        "Vegetables such as kale contribute potassium and fit into DASH‑style eating patterns that help lower blood pressure.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NHLBI – DASH Eating Plan",
            url: "https://www.nhlbi.nih.gov/education/dash-eating-plan",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: cold.id,
      ingredientId: orange.id,
      type: "BENEFICIAL",
      reason:
        "Whole oranges provide vitamin C, which may modestly shorten the duration or lessen the severity of common cold symptoms when intake is adequate.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Vitamin C (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: constipation.id,
      ingredientId: lentils.id,
      type: "BENEFICIAL",
      reason:
        "Lentils are rich in dietary fiber that helps add bulk and promote regular bowel movements, which can relieve short‑term constipation.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NHS – Constipation",
            url: "https://www.nhs.uk/conditions/constipation/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: constipation.id,
      ingredientId: chickpeas.id,
      type: "BENEFICIAL",
      reason:
        "Chickpeas supply fiber that supports stool formation and bowel regularity, aiding relief of mild, short‑term constipation.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NHS – Constipation",
            url: "https://www.nhs.uk/conditions/constipation/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: fatigue.id,
      ingredientId: cereal.id,
      type: "BENEFICIAL",
      reason:
        "Iron‑fortified cereal can help improve iron intake; if tiredness is related to low iron intake, better iron status may help reduce fatigue.",
      severity: 2,
      sources: {
        create: [
          {
            label: "NIH ODS – Iron (Health Professional Fact Sheet)",
            url: "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/",
          },
        ],
      },
    },
  });
  // AVOID
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: gerd.id,
      ingredientId: lemonJuice.id,
      type: "AVOID",
      reason:
        "Citrus juices like lemon juice can aggravate reflux symptoms in many people by increasing acidity.",
      severity: 4,
      sources: {
        create: [
          {
            label: "NHS – Acid reflux (heartburn): foods & lifestyle",
            url: "https://www.nhs.uk/conditions/heartburn-and-acid-reflux/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: gout.id,
      ingredientId: beef.id,
      type: "AVOID",
      reason:
        "Red meats such as beef contain purines that can raise uric acid and may trigger gout flares in susceptible individuals.",
      severity: 4,
      sources: {
        create: [
          {
            label: "NHS – Gout: causes & diet",
            url: "https://www.nhs.uk/conditions/gout/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: diabetes.id,
      ingredientId: orangeJuice.id,
      type: "AVOID",
      reason:
        "Fruit juice is concentrated in free sugars and can cause rapid blood sugar spikes, so it is best limited with diabetes.",
      severity: 5,
      sources: {
        create: [
          {
            label: "Diabetes Canada – Sugary drinks & diabetes",
            url: "https://www.diabetes.ca/healthy-living-resources/diet-nutrition/sugary-drinks",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: diarrhea.id,
      ingredientId: milk.id,
      type: "AVOID",
      reason:
        "During an episode of acute diarrhea, lactose in milk can be harder to digest and may worsen symptoms in some people.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NHS – Diarrhoea and vomiting",
            url: "https://www.nhs.uk/conditions/diarrhoea-and-vomiting/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: diarrhea.id,
      ingredientId: orangeJuice.id,
      type: "AVOID",
      reason:
        "Undiluted fruit juice is high in free sugars and can draw water into the bowel, potentially making diarrhea worse.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NHS – Diarrhoea and vomiting",
            url: "https://www.nhs.uk/conditions/diarrhoea-and-vomiting/",
          },
        ],
      },
    },
  });
  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: diarrhea.id,
      ingredientId: oliveOil.id,
      type: "AVOID",
      reason:
        "High‑fat foods like oils can slow gastric emptying and may aggravate diarrhea in the short term.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NHS – Diarrhoea and vomiting",
            url: "https://www.nhs.uk/conditions/diarrhoea-and-vomiting/",
          },
        ],
      },
    },
  });

  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: soreThroat.id,
      ingredientId: lemonJuice.id,
      type: "AVOID",
      reason:
        "Acidic drinks such as lemon juice can sting and irritate an already inflamed throat, worsening discomfort.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NHS – Sore throat",
            url: "https://www.nhs.uk/conditions/sore-throat/",
          },
        ],
      },
    },
  });

  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: indigestion.id,
      ingredientId: tomato.id,
      type: "AVOID",
      reason:
        "Tomatoes are acidic and can aggravate indigestion or heartburn in some people, especially during acute flare‑ups.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NHS – Indigestion (dyspepsia)",
            url: "https://www.nhs.uk/conditions/indigestion/",
          },
        ],
      },
    },
  });

  await prisma.diseaseIngredient.create({
    data: {
      diseaseId: nausea.id,
      ingredientId: beef.id,
      type: "AVOID",
      reason:
        "Rich, heavy, or fatty foods like red meat can be harder to tolerate and may worsen nausea; bland, lower‑fat options are usually better temporarily.",
      severity: 3,
      sources: {
        create: [
          {
            label: "NHS – Nausea and vomiting in adults",
            url: "https://www.nhs.uk/conditions/nausea-and-vomiting/",
          },
        ],
      },
    },
  });

  console.log("✅ Created 20 disease-ingredient relationships");
  console.log("🌱 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log("   - 18 ingredients");
  console.log("   - 14 diseases (7 chronic, 7 acute)");
  console.log("   - 10 beneficial food pairings");
  console.log("   - 10 food interactions to avoid");
  console.log("   - 11 beneficial disease relationships");
  console.log("   - 9 disease avoidance relationships");
  console.log("   - 40+ sources with citations");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
