const API_URL = 'http://127.0.0.1:8000';

// Fonction utilitaire pour envoyer les requêtes POST
async function postData(endpoint, data) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Erreur sur ${endpoint}: ${res.status} - ${text}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Erreur réseau sur ${endpoint}:`, err);
    return null;
  }
}

// Fonction pour ajouter des jours à une date
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function runSeed() {
  console.log('--- DÉBUT DE LA GÉNÉRATION DES DONNÉES ---');

  // 1. Création des Rayons (Shelves)
  const shelves = ['Fruits & Légumes', 'Frais', 'Épicerie Salée', 'Épicerie Sucrée', 'Boucherie', 'Surgelés'];
  const shelfIds = [];
  for (const name of shelves) {
    const res = await postData('/shelves/', { name });
    if (res && res.id) shelfIds.push(res.id);
  }
  console.log(`✅ ${shelfIds.length} rayons créés.`);

  // 2. Création des Marques (Brands)
  const brands = ['Marque Repère', 'Nestlé', 'Panzani', 'Lactel', 'Bio Village', 'Lustucru'];
  const brandIds = [];
  for (const name of brands) {
    const res = await postData('/brands/', { name });
    if (res && res.id) brandIds.push(res.id);
  }
  console.log(`✅ ${brandIds.length} marques créées.`);

  // 3. Création de 50 Ingrédients
  const units = ['kg', 'g', 'L', 'ml', 'pièce', 'botte', 'tranche'];
  const baseIngredients = ['Tomate', 'Oignon', 'Poulet', 'Riz', 'Pâtes', 'Lait', 'Oeuf', 'Farine', 'Sucre', 'Beurre', 'Pomme', 'Carotte', 'Boeuf', 'Poisson', 'Poivron'];
  const ingredientIds = [];
  
  for (let i = 1; i <= 50; i++) {
    const baseName = baseIngredients[i % baseIngredients.length];
    const shelfId = shelfIds[Math.floor(Math.random() * shelfIds.length)] || null;
    const brandId = brandIds[Math.floor(Math.random() * brandIds.length)] || null;
    const unit = units[Math.floor(Math.random() * units.length)];
    
    const res = await postData('/ingredients/', {
      name: `${baseName} (Var ${i})`,
      unit: unit,
      shelf_id: shelfId,
      brand_id: brandId,
      remark: `Généré automatiquement #${i}`
    });
    if (res && res.id) ingredientIds.push(res.id);
  }
  console.log(`✅ ${ingredientIds.length} ingrédients créés.`);

  // 4. Création de 20 Recettes (Meals) & Leurs Ingrédients
  const mealIds = [];
  for (let i = 1; i <= 20; i++) {
    const mealRes = await postData('/meals/', {
      name: `Recette Merveilleuse ${i}`,
      veggy: Math.random() > 0.5
    });
    
    if (mealRes && mealRes.id) {
      mealIds.push(mealRes.id);
      
      // Ajouter 3 à 6 ingrédients par recette via la route /meals/{meal_id}/ingredients
      const numItems = Math.floor(Math.random() * 4) + 3;
      for (let j = 0; j < numItems; j++) {
        const randomIngId = ingredientIds[Math.floor(Math.random() * ingredientIds.length)];
        
        await postData(`/meals/${mealRes.id}/ingredients`, {
          meal_id: mealRes.id,
          ingredient_id: randomIngId,
          quantity: Math.floor(Math.random() * 500) + 10
        });
      }
    }
  }
  console.log(`✅ ${mealIds.length} recettes créées avec leurs ingrédients.`);

  // 5. Création de 15 Listes de courses du 15/08/2026 au 25/10/2026
  let currentDate = '2026-08-15';
  const targetEndDate = '2026-10-25';
  let listCount = 0;

  while (listCount < 15 && currentDate <= targetEndDate) {
    // La liste couvre une période de 4 jours (ex: du 15 au 18)
    const rangeBegin = currentDate;
    const rangeEnd = addDays(currentDate, 3); 
    const shoppingDate = addDays(currentDate, -1); // Les courses sont faites la veille

    const listRes = await postData('/shopping_lists/', {
      shopping_date: shoppingDate,
      range_begin: rangeBegin,
      range_end: rangeEnd
    });

    if (listRes && listRes.id) {
      listCount++;
      
      // Ajouter 10 à 25 articles au hasard dans cette liste de courses
      const numShoppingItems = Math.floor(Math.random() * 16) + 10;
      for (let k = 0; k < numShoppingItems; k++) {
        const randomIngId = ingredientIds[Math.floor(Math.random() * ingredientIds.length)];
        await postData(`/shopping_lists/${listRes.id}/items`, {
          shopping_list_id: listRes.id,
          ingredient_id: randomIngId,
          quantity: Math.floor(Math.random() * 10) + 1,
          bought: Math.random() > 0.7 // 30% de chance d'être déjà acheté
        });
      }
    }

    // On avance de 4 à 5 jours pour la prochaine liste pour éviter le chevauchement
    currentDate = addDays(rangeEnd, Math.floor(Math.random() * 2) + 1);
  }

  console.log(`✅ ${listCount} listes de courses générées (avec articles).`);
  console.log('--- GÉNÉRATION TERMINÉE ---');
}

runSeed();
