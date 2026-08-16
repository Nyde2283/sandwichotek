import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  Factory,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Settings,
  PlusCircle,
  Download,
  History,
  ChevronDown,
  ChevronLeft,
  Calendar,
  Egg,
  ScrollText,
  Droplets,
  Fish,
  Leaf,
  Link as LinkIcon,
  ArrowLeftRight,
  Package,
  Pencil,
  MoreHorizontal,
  ChevronRight,
  Camera,
  Trash2,
  Zap,
  Apple,
  ClipboardCheck,
  AppleIcon,
  Eye,
  Plus,
  Scroll,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
const BASE_URL = 'http://localhost:8000'
const APP_NAME = "Sandwichotek"
const SHOPPING_LIST_NAME = "Liste de courses"
const RECIPES_NAME = "Recettes"
const PRODUCTS_NAME = "Produits"
const ARTICLES_NAMES = "Articles"
const PLANNING_NAME = "Planning hebdomadaire"


const SIDEBAR_IDS = {
  SHOPPING_LIST_NAME: 'shoppinglist',
  RECIPES_NAME: "recipes",
  PRODUCTS_NAME: "products",
  ARTICLES_NAMES: "articles",
  PLANNING_NAME: "planning",
} as const


type ViewType = 'shoppinglist' | 'recipes' | 'products' | 'articles' | 'planning';

// --- Types ---



interface RecipeIngredient {
  id: string;
  productId: string;
  quantity: number;
  unit: string;
}

interface Product {
  id: string;
  name: string;
}

interface Article {
  id: string;
  name: string;
  productId: string;
  brand: string;
  quantity: number;
  unit: string;
}

interface Ingredient {
  id: number;
  name: string;
  note: string;
  brand: number;
  shelf: number;
  unit: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Shelf {
  id: number,
  name: string
}

interface RecipeItem {
  ingredient: Ingredient,
  quantity: number,
}

interface Recipe {
  meal_id: number,
  items: RecipeItem[],
}

interface MealProduction {
  id: number,
  meal_id: number,
  date: string,
  quantity: number,
}

interface Meal {
  id: number,
  name: string,
  veggy: boolean,
  meal_productions: MealProduction[],
  recipe_items: RecipeItem[],
}

interface ShoppingListItem {
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  shelf: string;
  taken: true | false
}

interface ProdCard {
  productionId: number; // L'ID de la MealProduction en BDD (pour les update/delete)
  mealId: number;       // L'ID du plat
  title: string;        // Le nom du plat
  units: number;        // La quantité produite
  date: string;         // La date (ex: "2026-07-25")
}

// --- Mock Data ---


const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Tomate' },
  { id: '2', name: 'Salade' },
  { id: '3', name: 'Emmental rapé' },
  { id: '4', name: 'Saucisse' },
]


interface ShoppingList {
  id: string;
  date: string;
  items: ShoppingListItem[];
}

// --- Mock Data ---
const SHOPPING_DATA: ShoppingList[] = [
  {
    id: "SL-001",
    date: "2026-03-25",
    items: [
      {name: 'Tomate', brand: 'Pouce', quantity: 12, unit: 'unité', shelf: 'Légumes', taken: true},
      {name: 'Brie', brand: 'Pouce', quantity: 250, unit: 'g', shelf: 'Produits laitiers', taken: true},
      {name: 'Oignon Rouge', brand: '', quantity: 2, unit: 'unité', shelf: 'Légumes', taken: false}
    ]
  },
  {
    id: "SL-002",
    date: "2026-04-01",
    items: [
      {name: 'Tomate', brand: 'Pouce', quantity: 9, unit: 'unité', shelf: 'Légumes', taken: false},
      {name: 'Comté', brand: 'Pouce', quantity: 420, unit: 'g', shelf: 'Produits laitiers', taken: true},
      {name: 'Boeuf haché surgelé', brand: 'Pouce', quantity: 800, unit: 'g', shelf: 'Surgelés', taken: false}
    ]
  },
  {
    id: "SL-003",
    date: "2026-03-10",
    items: [
      {name: 'Concombre', brand: '', quantity: 3, unit: 'g', shelf: 'Légumes', taken: false},
      {name: 'Crème fraîche', brand: 'Pouce', quantity: 15, unit: 'cL', shelf: 'Produits laitiers', taken: true},
      {name: 'Durum', brand: '', quantity: 8, unit: 'unité', shelf: 'Produits du monde', taken: false}
    ]
  }
]

/**
 * Génère les dates de la semaine (format YYYY-MM-DD) à partir d'une date donnée.
 * @param referenceDate La date de référence (par défaut aujourd'hui)
 * @param includeWeekend Inclure le samedi et le dimanche (défaut : false)
 */
export const getWeekDates = (referenceDate = new Date(), includeWeekend = false): string[] => {
  const date = new Date(referenceDate);
  
  // 1. Trouver le jour de la semaine (0 = Dimanche, 1 = Lundi, ..., 6 = Samedi)
  const dayOfWeek = date.getDay();
  
  // 2. Calculer le décalage pour remonter jusqu'au Lundi
  // En JS, le dimanche est 0. On le transforme en 7 pour simplifier les calculs.
  const distanceToMonday = (dayOfWeek === 0 ? 7 : dayOfWeek) - 1;
  
  // 3. Poser la date au lundi de la semaine en cours
  const monday = new Date(date);
  monday.setDate(date.getDate() - distanceToMonday);

  // 4. Générer les 5 (ou 7) jours de la semaine
  const daysCount = includeWeekend ? 7 : 5;
  const weekDates: string[] = [];

  for (let i = 0; i < daysCount; i++) {
    const currentDay = new Date(monday);
    currentDay.setDate(monday.getDate() + i);
    
    // Formatage au format 'YYYY-MM-DD' (ex: "2026-07-20")
    const isoDate = currentDay.toISOString().split('T')[0];
    weekDates.push(isoDate);
  }

  return weekDates;
};

const formatDateHeader = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

async function sendAPIPOST(route: String, payload: {}): Promise<Response> {
  const res = await fetch(`${BASE_URL}/${route}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  return res
}

async function sendAPIGET(route: String): Promise<Response> {
  const res = await fetch(`${BASE_URL}/${route}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  return res
}

async function sendAPIPUT(route: String, payload: {}): Promise<Response> {
  const res = await fetch(`${BASE_URL}/${route}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  return res
}

async function sendAPIDELETE(route: String): Promise<Response> {
  const res = await fetch(`${BASE_URL}/${route}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  return res
}

const ClickToEdit = ({ initialValue, onSave, placeholder }: { initialValue: string, onSave: (val: string) => void, placeholder?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Sélectionne tout le texte d'un coup
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      onSave(value);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex-1 min-w-0">
        {/* className="flex items-center gap-2 w-full max-w-md"> */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          onBlur={handleSave}
          className="bg-surface-container w-full border-2 border-primary rounded-lg px-3 py-1.5 text-lg font-semibold outline-none shadow-sm
          animate-pop"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="group flex items-center justify-start cursor-pointer py-1 px-1 rounded-xl border-2 border-transparent hover:bg-surface-container-low animate-pop"
    >
      <span className={`text-lg font-semibold tracking-tight ${!value && placeholder ? 'text-on-surface-variant/50 italic' : 'text-on-surface'}`}>
        {value || placeholder || ''}
      </span>
      <Pencil
        size={16}
        className="text-on-surface-variant opacity-100 group-hover:opacity-100 ml-2"
      />
    </div>
  );
};

// --- Components ---

interface SidebarProps {
  currentView: ViewType;
  setView: (v: ViewType) => void;
  isOpen: boolean;           // Nouvel état
  setIsOpen: (o: boolean) => void; // Pour fermer
}

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-10 bg-primary rounded-xl flex items-center justify-center text-white"></div>
      <div>
        <h1 className="text-lg font-bold text-primary uppercase tracking-widest leading-none mb-1">{APP_NAME}</h1>
        <p className="text-[0.65rem] text-on-surface-variant font-medium">Le bar, c'est mieux maintenant</p>
      </div>
    </div>
  )
}

const Sidebar = ({ currentView, setView, isOpen, setIsOpen }: SidebarProps) => {
  const navItems = [
    { id: SIDEBAR_IDS.SHOPPING_LIST_NAME, icon: <ScrollText size={20} />, label: SHOPPING_LIST_NAME },
    { id: SIDEBAR_IDS.RECIPES_NAME, icon: <Utensils size={20} />, label: RECIPES_NAME },
    { id: SIDEBAR_IDS.PRODUCTS_NAME, icon: <AppleIcon size={20} />, label: PRODUCTS_NAME },
    { id: SIDEBAR_IDS.ARTICLES_NAMES, icon: <ShoppingCart size={20} />, label: ARTICLES_NAMES },
    { id: SIDEBAR_IDS.PLANNING_NAME, icon: <Calendar size={20} />, label: PLANNING_NAME },
  ];

  return (
    <>
      {/* Overlay : floute l'arrière-plan quand la sidebar est ouverte sur mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed left-0 top-0 h-screen w-64 z-50 bg-surface-container-low border-r border-outline-variant/15 flex flex-col py-4 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 overflow-auto
      `}>
        <div className="px-4 mb-10">
          <Logo></Logo>  
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id as ViewType);
                setIsOpen(false); // Ferme la sidebar après clic sur mobile
              }}
              className={`w-full group flex items-center py-3 px-6 transition-all relative text-left ${currentView === item.id ? 'text-primary font-semibold bg-white/50' : 'text-on-surface-variant hover:bg-surface-container-high/50'
                }`}
            >
              {currentView === item.id && (
                <motion.div layoutId="activeNav" className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <span className={`mr-4 ${currentView === item.id ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>
                {item.icon}
              </span>
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto px-6">
          <a href="#" className="flex items-center py-2 text-tertiary font-medium text-sm">
            <LogOut size={18} className="mr-3" /> Déconnexion
          </a>
        </div>
      </aside>
    </>
  );
};

const TopBar = ({ title }: { title: string }) => {
  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-surface flex items-center justify-between px-12 max-w-[1440px] mx-auto">


      <div className="flex items-center gap-6">
        {/* Place holder pour une éventuelle topbar */}
      </div>
    </header>
  );
};

const ShoppingRow: React.FC<{ list: ShoppingList }> = ({ list }) => {
  const [isOpen, setIsOpen] = useState(false);

  const [items, setItems] = useState(list.items);

  const toggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index] = { 
      ...newItems[index], 
      taken: !newItems[index].taken 
    };
    setItems(newItems);
  };

  return (
    <>
    {/* </>div className="w-full py-2"> */}
      <tr 
        onClick={() => setIsOpen(!isOpen)} 
        className="hover:bg-surface-container-low transition-colors group cursor-pointer border-b border-outline-variant/50"
      >
        <td className="px-6 py-4">
          <div className="gap-4 flex items-center justify-left">
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              className="text-on-surface-variant"
            >
              <ChevronRight size={18} />
            </motion.div>
            <span className="font-medium text-sm text-on-surface">
              {new Date(list.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
        </td>
        <td className="px-6 text-sm font-mono text-primary/80">
          #{list.id.slice(-6).toUpperCase()}
        </td>
        <td className="px-6 text-right">
          <span className="text-sm text-on-surface-variant tabular-nums">
            {items.length} <span className="text-[10px] uppercase font-bold tracking-tight">produits</span>
          </span>
        </td>
        <td className="px-6 text-right">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
            items.every(i => i.taken) ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
          }`}>
            {items.filter(i => i.taken).length} / {items.length} PRIS
          </span>
        </td>
      </tr>
      
      <AnimatePresence>
        {isOpen && (
          <tr key="details">
            <td colSpan={4} className="p-0 bg-surface-container-low/20">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className=""
              >
                <div className="pb-2">
                  <table className="w-full text-left border-collapse bg-surface-container-lowest rounded-b-lg shadow-custom">
                    <thead>
                      <tr className="border-b border-outline-variant">
                        <th className="w-10 px-4 py-2"></th>
                        <th className="px-4 py-2 text-[0.6rem] uppercase font-bold tracking-[0.15em] text-on-surface-variant/70">Article</th>
                        <th className="px-4 py-2 text-[0.6rem] uppercase font-bold tracking-[0.15em] text-on-surface-variant/70">Marque</th>
                        <th className="px-4 py-2 text-[0.6rem] uppercase font-bold tracking-[0.15em] text-on-surface-variant/70 text-right">Quantité</th>
                        <th className="px-4 py-2 text-[0.6rem] uppercase font-bold tracking-[0.15em] text-on-surface-variant/70">Rayon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {items.map((item, idx) => (
                        <tr 
                          key={idx} 
                          className={`text-xs transition-all ${item.taken ? 'opacity-40 bg-surface-container-low/30' : 'opacity-100'}`}
                        >
                          <td className="px-4 py-2.5 text-center">
                            <input 
                              type="checkbox" 
                              checked={item.taken}
                              onChange={() => toggleItem(idx)}
                              onClick={(e) => e.stopPropagation()} 
                              className="w-4 h-4 rounded border-outline-variant text-primary accent-primary cursor-pointer"
                            />
                          </td>
                          
                          <td className={`px-4 py-2.5 font-medium transition-all ${item.taken ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                            {item.name}
                          </td>
                          
                          <td className="px-4 py-2.5 text-on-surface-variant/80 italic">
                            {item.brand || "—"}
                          </td>
                          
                          <td className="px-4 py-2.5 text-right tabular-nums text-on-surface font-medium">
                            {item.quantity} <span className="text-[10px] text-on-surface-variant font-normal">{item.unit}</span>
                          </td>
                          
                          <td className="px-4 py-2.5 text-[10px] text-on-surface-variant/80 uppercase tracking-tight">
                            {item.shelf}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

const ShoppingListViewv2 = () => {
  const sortedData = [...SHOPPING_DATA].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto w-full"
    >
      <header className="mb-6">
        <h2 className="text-4xl font-medium tracking-tight">{SHOPPING_LIST_NAME}</h2>
      </header>
      <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
      <div className="w-full mb-4 border-b border-outline-variant/10 flex items-center justify-between">
        <h3 className="font-semibold text-on-surface text-lg">Historique des courses</h3>
        <span className="text-xs text-on-surface-variant font-medium bg-surface-container-high px-2 py-1 rounded">
          {sortedData.length} listes au total
        </span>
      </div>

      {/* Table */}
      <div className="rounded-t-lg bg-surface-container-high border-outline-variant/50">
        <table className="w-full table-auto md:table-fixed">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="px-6 py-4 text-[0.65rem] uppercase font-bold text-on-surface-variant text-left">Date de la liste</th>
              <th className="px-6 py-4 text-[0.65rem] uppercase font-bold text-on-surface-variant text-left">Référence</th>
              <th className="px-6 py-4 text-[0.65rem] uppercase font-bold text-on-surface-variant text-right">Volume</th>
              <th className="px-6 py-4 text-[0.65rem] uppercase font-bold text-on-surface-variant text-right">Statut</th>
            </tr>
          </thead>
          <tbody className="bg-surface-container-low">
            {sortedData.map((list) => (
              <ShoppingRow key={list.id} list={list} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="px-6 py-6 bg-surface-container-high flex items-center justify-between rounded-b-lg border-outline-variant/50">
        {/* <button className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer disabled:opacity-30">
          Précédent
        </button>
        <div className="flex gap-2">
          <span className="w-7 h-7 flex items-center justify-center bg-primary text-on-primary text-[10px] font-bold rounded-full shadow-sm">1</span>
          <span className="w-7 h-7 flex items-center justify-center text-on-surface-variant text-[10px] font-bold hover:bg-surface-container-high rounded-full cursor-pointer transition-all">2</span>
        </div>
        <button className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
          Suivant
        </button> */}
      </div>
      </section>
    </motion.div>
  );
};


const ShoppingListView = () => {
  // TODO chargement dynamique de la liste et disponibilité des boutons
  return (

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-on-surface mb-2">{SHOPPING_LIST_NAME}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))]">
        <div className="w-full">
          <ShoppingListTable />
        </div>
      </div>
    </motion.div>
  );
};

const ShoppingListTable = () => {
  // TODO ajouter chargement dynamique des dates
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(25,28,30,0.04)]">
      <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
        <h3 className="font-semibold text-on-surface">Liste du xx/xx</h3>
        <span className="text-xs text-on-surface-variant font-medium">14 produits</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 text-[0.65rem] uppercase font-bold tracking-widest text-on-surface-variant">Date de la liste de courses</th>
              {/* Autres infos de la liste de course */}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {/* Affichage des éléments de l'inventaire à remplacer par la liste des listes de course (table principale)*/}
            {/* {SHOPPING_DATA.map((item) => (
              <tr key={item.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm text-on-surface">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-5 text-right tabular-nums text-sm text-on-surface">
                  €{item.price.toFixed(2)} <span className="text-[10px] text-on-surface-variant">/{item.unit}</span>
                </td>
                <td className={`px-4 py-5 text-right tabular-nums text-sm `}>
                  {item.quantity} <span className="text-[10px] text-on-surface-variant">{item.quantityUnit}</span>
                </td>
                <td className="px-4 py-5">
                  <span className="text-xs py-1 px-2.5 bg-surface-container-high rounded text-on-surface-variant font-medium">{item.shelf}</span>
                </td>
                <td className="px-4 py-5 text-sm text-on-surface-variant">{item.brand}</td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${item.stock === 'Oui' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                    }`}>
                    {item.stock}
                  </span>
                </td>
              </tr>
            ))} */}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant/10 flex items-center justify-between">
        <button className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Previous</button>
        <div className="flex gap-2">
          <span className="w-6 h-6 flex items-center justify-center bg-primary text-on-primary text-[10px] font-bold rounded">1</span>
          <span className="w-6 h-6 flex items-center justify-center text-on-surface-variant text-[10px] font-bold hover:bg-surface-container-high rounded cursor-pointer transition-colors">2</span>
          <span className="w-6 h-6 flex items-center justify-center text-on-surface-variant text-[10px] font-bold hover:bg-surface-container-high rounded cursor-pointer transition-colors">3</span>
        </div>
        <button className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Next</button>
      </div>
    </div>
  );
};

const RecipeCreatorView = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal>({
    id: 0,
    name: "Nom de la recette",
    veggy: false,
    meal_productions: [],
    recipe_items: [],
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [persistedItemIngredientIds, setPersistedItemIngredientIds] = useState<Record<number, Set<number>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Charge la liste des ingrédients depuis l'API
  const loadIngredients = async () => {
    try {
      const res = await sendAPIGET('ingredients/');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch ingredients: ${res.status} ${text}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) return;

      const mapped: Ingredient[] = json.map((it: any) => ({
        id: it.id ?? 0,
        name: it.name ?? '',
        brand: it.brand?.id ?? it.brand_id ?? 0,
        shelf: it.shelf?.id ?? it.shelf_id ?? 0,
        unit: it.unit ?? 'unité',
        note: it.remark ?? it.note ?? '',
      }));

      setIngredients(mapped);
    } catch (err) {
      console.error('Error loading ingredients', err);
    }
  };

  // Charge la recette pour un repas donné
  const loadRecipeForMeal = async (mealId: number) => {
    if (!mealId || mealId <= 0) return;
    try {
      const res = await sendAPIGET(`meals/${mealId}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch meal recipe: ${res.status} ${text}`);
      }

      const data = await res.json();
      const items: RecipeItem[] = Array.isArray(data.recipe_items)
        ? data.recipe_items.map((item: any) => ({
            quantity: item.quantity ?? 0,
            ingredient: {
              id: item.ingredient?.id ?? item.ingredient_id ?? 0,
              name: item.ingredient?.name ?? '',
              unit: item.ingredient?.unit ?? 'unité',
              note: item.ingredient?.remark ?? item.ingredient?.note ?? '',
              brand: item.ingredient?.brand?.id ?? item.ingredient?.brand_id ?? 0,
              shelf: item.ingredient?.shelf?.id ?? item.ingredient?.shelf_id ?? 0,
            },
          }))
        : [];

      setRecipes((prev) => {
        const filtered = prev.filter((r) => r.meal_id !== mealId);
        return [...filtered, { meal_id: mealId, items }];
      });

      setPersistedItemIngredientIds((prev) => ({
        ...prev,
        [mealId]: new Set(items.map((it) => it.ingredient.id)),
      }));
    } catch (err) {
      console.error(`Error loading recipe for meal ${mealId}`, err);
    }
  };

  // Charge la liste des repas depuis l'API
  const loadMeals = async (targetMealId?: number) => {
    try {
      const res = await sendAPIGET('meals/');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch meals: ${res.status} ${text}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) return;

      const mapped: Meal[] = json.map((it: any) => ({
        id: it.id ?? 0,
        name: it.name ?? '',
        veggy: Boolean(it.veggy),
        meal_productions: Array.isArray(it.meal_productions) ? it.meal_productions : [],
        recipe_items: [],
      }));

      setMeals(mapped);

      if (targetMealId !== undefined) {
        if (targetMealId === 0) {
          setSelectedMeal({
            id: 0,
            name: "Nom de la recette",
            veggy: false,
            meal_productions: [],
            recipe_items: [],
          });
        } else {
          const found = mapped.find((m) => m.id === targetMealId);
          if (found) {
            setSelectedMeal(found);
            await loadRecipeForMeal(found.id);
          }
        }
      } else if (mapped.length > 0) {
        setSelectedMeal((prev) => {
          if (!prev || prev.id === 0) {
            loadRecipeForMeal(mapped[0].id);
            return mapped[0];
          }
          const existing = mapped.find((m) => m.id === prev.id);
          if (existing) return existing;
          loadRecipeForMeal(mapped[0].id);
          return mapped[0];
        });
      }
    } catch (err) {
      console.error('Error loading meals', err);
    }
  };

  useEffect(() => {
    loadIngredients();
    loadMeals();
  }, []);

  // Dérivation directe de la recette active
  const selectedRecipe = recipes.find((r) => r.meal_id === (selectedMeal?.id ?? 0)) || {
    meal_id: selectedMeal?.id ?? 0,
    items: [],
  };

  // Sélection d'un repas depuis le dropdown
  const handleSelectMeal = (mealId: number) => {
    if (mealId === 0) {
      setSelectedMeal({
        id: 0,
        name: "Nom de la recette",
        veggy: false,
        meal_productions: [],
        recipe_items: [],
      });
      setRecipes((prev) => {
        const filtered = prev.filter((r) => r.meal_id !== 0);
        return [...filtered, { meal_id: 0, items: [] }];
      });
    } else {
      const meal = meals.find((m) => m.id === mealId);
      if (meal) {
        setSelectedMeal(meal);
        loadRecipeForMeal(meal.id);
      }
    }
  };

  // Mise à jour locale du nom de la recette
  const handleNameChange = (newName: string) => {
    const updatedName = newName.trim() || "Nom de la recette";
    setSelectedMeal((prev) =>
      prev
        ? { ...prev, name: updatedName }
        : { id: 0, name: updatedName, veggy: false, meal_productions: [], recipe_items: [] }
    );
    if (selectedMeal && selectedMeal.id > 0) {
      setMeals((prev) =>
        prev.map((m) => (m.id === selectedMeal.id ? { ...m, name: updatedName } : m))
      );
    }
  };

  // Mise à jour locale du statut Veggie
  const handleVeggyToggle = (isVeggy: boolean) => {
    setSelectedMeal((prev) =>
      prev
        ? { ...prev, veggy: isVeggy }
        : { id: 0, name: "Nom de la recette", veggy: isVeggy, meal_productions: [], recipe_items: [] }
    );
    if (selectedMeal && selectedMeal.id > 0) {
      setMeals((prev) =>
        prev.map((m) => (m.id === selectedMeal.id ? { ...m, veggy: isVeggy } : m))
      );
    }
  };

  // Ajout d'un ingrédient à la recette
  const addRecipeItem = () => {
    const defaultIngredient = ingredients.length > 0
      ? ingredients[0]
      : { id: 0, name: '', unit: 'unité', note: '', brand: 0, shelf: 0 };

    const newItem: RecipeItem = {
      ingredient: { ...defaultIngredient },
      quantity: 0,
    };

    const currentMealId = selectedMeal?.id ?? 0;
    setRecipes((prev) => {
      const existing = prev.find((r) => r.meal_id === currentMealId);
      if (existing) {
        return prev.map((r) =>
          r.meal_id === currentMealId
            ? { ...r, items: [...r.items, newItem] }
            : r
        );
      }
      return [...prev, { meal_id: currentMealId, items: [newItem] }];
    });
  };

  // Changement d'ingrédient pour un item
  const handleIngredientChange = (itemIndex: number, newIngredientId: number) => {
    const newIng = ingredients.find((i) => i.id === newIngredientId);
    if (!newIng) return;

    const currentMealId = selectedMeal?.id ?? 0;
    setRecipes((prev) =>
      prev.map((r) => {
        if (r.meal_id !== currentMealId) return r;
        const updatedItems = [...r.items];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          ingredient: { ...newIng },
        };
        return { ...r, items: updatedItems };
      })
    );
  };

  // Changement de la quantité d'un item
  const handleQuantityChange = (itemIndex: number, newQuantity: number) => {
    const currentMealId = selectedMeal?.id ?? 0;
    setRecipes((prev) =>
      prev.map((r) => {
        if (r.meal_id !== currentMealId) return r;
        const updatedItems = [...r.items];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          quantity: newQuantity,
        };
        return { ...r, items: updatedItems };
      })
    );
  };

  // Suppression d'un ingrédient (API si persisté, local si non persisté)
  const handleDeleteItem = async (itemIndex: number, item: RecipeItem) => {
    const currentMealId = selectedMeal?.id ?? 0;
    const isPersisted =
      currentMealId > 0 &&
      persistedItemIngredientIds[currentMealId]?.has(item.ingredient.id);

    if (isPersisted) {
      try {
        const res = await sendAPIDELETE(
          `meals/${currentMealId}/ingredients/${item.ingredient.id}`
        );
        if (!res.ok) {
          const errText = await res.text();
          console.error(`Failed to delete recipe item: ${res.status} ${errText}`);
          alert(`Erreur lors de la suppression de l'ingrédient (${res.status})`);
          return;
        }

        setPersistedItemIngredientIds((prev) => {
          const nextSet = new Set(prev[currentMealId]);
          nextSet.delete(item.ingredient.id);
          return { ...prev, [currentMealId]: nextSet };
        });
      } catch (err) {
        console.error('Error deleting recipe item', err);
        alert("Erreur lors de la suppression de l'ingrédient");
        return;
      }
    }

    setRecipes((prev) =>
      prev.map((r) => {
        if (r.meal_id !== currentMealId) return r;
        return {
          ...r,
          items: r.items.filter((_, idx) => idx !== itemIndex),
        };
      })
    );
  };

  // Suppression du repas (DELETE /meals/{meal_id})
  const handleDeleteMeal = async () => {
    if (!selectedMeal || selectedMeal.id <= 0) return;
    try {
      const res = await sendAPIDELETE(`meals/${selectedMeal.id}`);
      if (res.ok || res.status === 204) {
        const deletedId = selectedMeal.id;
        const remainingMeals = meals.filter((m) => m.id !== deletedId);
        setMeals(remainingMeals);
        setRecipes((prev) => prev.filter((r) => r.meal_id !== deletedId));
        setPersistedItemIngredientIds((prev) => {
          const next = { ...prev };
          delete next[deletedId];
          return next;
        });

        if (remainingMeals.length > 0) {
          setSelectedMeal(remainingMeals[0]);
          await loadRecipeForMeal(remainingMeals[0].id);
        } else {
          setSelectedMeal({
            id: 0,
            name: "Nom de la recette",
            veggy: false,
            meal_productions: [],
            recipe_items: [],
          });
        }
      } else {
        const errorText = await res.text();
        console.error(`Failed to delete meal ${selectedMeal.id}:`, res.status, errorText);
        if (res.status === 422) {
          alert('Impossible de supprimer ce plat car il est utilisé dans des plannings ou contient des éléments liés.');
        } else {
          alert(`Erreur lors de la suppression (${res.status})`);
        }
      }
    } catch (err) {
      console.error(`Error deleting meal ${selectedMeal.id}:`, err);
    }
  };

  // Sauvegarde globale du plat (POST si id == 0, PUT si id > 0) et de ses ingrédients
  const handleSaveMeal = async () => {
    setIsSaving(true);
    try {
      const mealName = selectedMeal?.name?.trim() || "Nom de la recette";
      const mealVeggy = selectedMeal?.veggy ?? false;
      const currentItems = selectedRecipe.items;

      if (!selectedMeal || selectedMeal.id === 0) {
        const res = await sendAPIPOST('meals/', {
          name: mealName,
          veggy: mealVeggy,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to create meal: ${res.status} ${text}`);
        }

        const createdMeal = await res.json();
        const newMealId = createdMeal.id;

        const savedIngredientIds = new Set<number>();
        for (const item of currentItems) {
          if (item.ingredient.id > 0) {
            try {
              const itemRes = await sendAPIPOST(`meals/${newMealId}/ingredients`, {
                meal_id: newMealId,
                ingredient_id: item.ingredient.id,
                quantity: item.quantity,
              });
              if (itemRes.ok) {
                savedIngredientIds.add(item.ingredient.id);
              }
            } catch (itemErr) {
              console.error(`Failed to add ingredient ${item.ingredient.id}`, itemErr);
            }
          }
        }

        setPersistedItemIngredientIds((prev) => ({
          ...prev,
          [newMealId]: savedIngredientIds,
        }));

        setRecipes((prev) => {
          const filtered = prev.filter((r) => r.meal_id !== 0 && r.meal_id !== newMealId);
          return [...filtered, { meal_id: newMealId, items: currentItems }];
        });

        setSelectedMeal({
          id: newMealId,
          name: createdMeal.name,
          veggy: Boolean(createdMeal.veggy),
          meal_productions: [],
          recipe_items: [],
        });

        await loadMeals(newMealId);
      } else {
        const mealId = selectedMeal.id;
        const res = await sendAPIPUT(`meals/${mealId}`, {
          name: mealName,
          veggy: mealVeggy,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to update meal: ${res.status} ${text}`);
        }

        const persistedSet = persistedItemIngredientIds[mealId] || new Set<number>();
        const updatedPersistedSet = new Set(persistedSet);

        for (const item of currentItems) {
          if (item.ingredient.id > 0) {
            if (persistedSet.has(item.ingredient.id)) {
              try {
                await sendAPIPUT(`meals/${mealId}/ingredients/${item.ingredient.id}`, {
                  quantity: item.quantity,
                });
              } catch (itemErr) {
                console.error(`Failed to update quantity for ingredient ${item.ingredient.id}`, itemErr);
              }
            } else {
              try {
                const itemRes = await sendAPIPOST(`meals/${mealId}/ingredients`, {
                  meal_id: mealId,
                  ingredient_id: item.ingredient.id,
                  quantity: item.quantity,
                });
                if (itemRes.ok) {
                  updatedPersistedSet.add(item.ingredient.id);
                }
              } catch (itemErr) {
                console.error(`Failed to add ingredient ${item.ingredient.id}`, itemErr);
              }
            }
          }
        }

        setPersistedItemIngredientIds((prev) => ({
          ...prev,
          [mealId]: updatedPersistedSet,
        }));

        await loadRecipeForMeal(mealId);
        await loadMeals(mealId);
      }
    } catch (err) {
      console.error('Error saving meal', err);
      alert('Erreur lors de la sauvegarde de la recette');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto w-full"
    >
      <header className="mb-6">
        <h2 className="text-4xl font-medium tracking-tight">{RECIPES_NAME}</h2>
      </header>

      <div>
        <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
          <div className="py-2">
            <div className="relative w-full">
              <select
                value={selectedMeal?.id ?? 0}
                onChange={(e) => handleSelectMeal(Number(e.target.value))}
                className="w-full appearance-none bg-surface-container-low rounded-lg border-none p-2 px-10 text-center [text-align-last:center] text-4xl font-medium tracking-tight text-on-surface cursor-pointer outline-none focus:ring-0"
              >
                <option value={0}>Nouvelle recette</option>
                {meals.map((meal) => (
                  <option
                    key={meal.id}
                    value={meal.id}
                    className="text-base font-normal text-left"
                  >
                    {meal.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between py-2 gap-4">
            <ClickToEdit
              initialValue={selectedMeal?.name ?? "Nom de la recette"}
              onSave={handleNameChange}
            />

            <label className="inline-flex items-center gap-4 cursor-pointer">
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">
                Veggie
              </span>
              <input
                type="checkbox"
                checked={selectedMeal?.veggy ?? false}
                onChange={(e) => handleVeggyToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className="relative w-11 h-6 rounded-full peer 
                  bg-surface-container-high 
                  transition-colors duration-500 ease-in-out
                  peer-checked:bg-primary 
                  peer-focus:outline-none 
                  after:content-[''] 
                  after:absolute 
                  after:top-[4px] 
                  after:start-[4px] 
                  after:bg-white 
                  after:rounded-full 
                  after:h-4 
                  after:w-4 
                  after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.4,0,0.2,1)]
                  peer-checked:after:translate-x-5"
              ></div>
            </label>
          </div>

          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {!selectedRecipe || selectedRecipe.items.length === 0 ? (
                <p className="text-center text-on-surface-variant py-8">
                  Aucun ingrédient associé à ce plat.
                </p>
              ) : (
                selectedRecipe.items.map((item, index) => (
                  <motion.div
                    key={`${item.ingredient.id}-${index}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-7 gap-4 p-4 items-end rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low overflow-hidden"
                  >
                    <div className="col-span-3">
                      <label className="block mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Ingrédient
                      </label>
                      <div className="relative">
                        <select
                          value={item.ingredient.id}
                          onChange={(e) =>
                            handleIngredientChange(index, Number(e.target.value))
                          }
                          className="w-full px-4 py-3 rounded-lg appearance-none bg-white text-sm focus:ring-2 focus:ring-primary-light/50 pr-10 cursor-pointer"
                        >
                          {ingredients.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                        />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <label className="block mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Quantité
                      </label>
                      <div className="relative flex items-center">
                        <input
                          className="tabular-nums w-full px-4 py-3 pr-16 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-light/50"
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleQuantityChange(index, isNaN(val) ? 0 : val);
                          }}
                        />
                        <span className="absolute right-4 text-xs font-medium text-on-surface-variant">
                          {item.ingredient.unit}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(index, item)}
                        className="p-3 text-tertiary/40 hover:text-tertiary transition-colors"
                        title="Supprimer l'ingrédient"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={addRecipeItem}
              className="flex items-center gap-2 text-primary font-semibold text-sm hover:opacity-80 transition-opacity"
            >
              <PlusCircle size={16} />
              Ajouter un ingrédient
            </button>
            <div className="flex items-center gap-3">
              {selectedMeal && selectedMeal.id > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteMeal}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-lg font-semibold text-tertiary bg-tertiary/10 hover:bg-tertiary/20 transition-colors"
                  title="Supprimer la recette"
                >
                  <Trash2 size={18} />
                  <span>Supprimer</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveMeal}
                disabled={isSaving}
                className="px-10 py-3 rounded-lg font-bold text-white signature-gradient shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const ProductsView = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [persistedIngredients, setPersistedIngredients] = useState<Ingredient[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [shelfs, setShelfs] = useState<Shelf[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const hasUnsavedCard = useMemo(() => {
    return ingredients.some((ing) => ing.id === 0);
  }, [ingredients]);

  const addIngredient = () => {
    if (hasUnsavedCard) return;
    setIngredients((prev) => [
      ...prev,
      { id: 0, name: '', brand: 0, shelf: 0, unit: 'unité', note: '' },
    ]);
  };

  const updateIngredientField = (
    id: number,
    field: keyof Ingredient,
    value: any
  ) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const isIngredientDirty = (ing: Ingredient): boolean => {
    if (ing.id === 0) return true;
    const persisted = persistedIngredients.find((p) => p.id === ing.id);
    if (!persisted) return true;
    return (
      ing.name.trim() !== persisted.name.trim() ||
      ing.unit.trim() !== persisted.unit.trim() ||
      ing.brand !== persisted.brand ||
      ing.shelf !== persisted.shelf ||
      (ing.note ?? '').trim() !== (persisted.note ?? '').trim()
    );
  };

  const handleSaveIngredient = async (ing: Ingredient) => {
    const payload = {
      name: ing.name,
      unit: ing.unit,
      remark: ing.note || '',
      shelf_id: ing.shelf > 0 ? ing.shelf : null,
      brand_id: ing.brand > 0 ? ing.brand : null,
    };

    try {
      let res: Response;
      if (ing.id === 0) {
        res = await sendAPIPOST('ingredients/', payload);
      } else {
        res = await sendAPIPUT(`ingredients/${ing.id}`, payload);
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to save ingredient:', res.status, errorText);
        alert(`Erreur lors de la sauvegarde (${res.status})`);
        return;
      }

      const savedData = await res.json();
      const updatedIngredient: Ingredient = {
        id: savedData.id,
        name: savedData.name ?? '',
        unit: savedData.unit ?? 'unité',
        note: savedData.remark ?? savedData.note ?? '',
        brand: savedData.brand?.id ?? savedData.brand_id ?? 0,
        shelf: savedData.shelf?.id ?? savedData.shelf_id ?? 0,
      };

      setIngredients((prev) =>
        prev.map((item) => (item.id === ing.id ? updatedIngredient : item))
      );

      setPersistedIngredients((prev) => {
        const exists = prev.some((p) => p.id === updatedIngredient.id);
        if (exists) {
          return prev.map((p) => (p.id === updatedIngredient.id ? updatedIngredient : p));
        } else {
          return [...prev, updatedIngredient];
        }
      });
    } catch (err) {
      console.error('Error saving ingredient:', err);
    }
  };

  const handleDeleteIngredient = async (id: number) => {
    if (id === 0) {
      setIngredients((prev) => prev.filter((ing) => ing.id !== 0));
      return;
    }

    try {
      const res = await sendAPIDELETE(`ingredients/${id}`);
      if (res.ok || res.status === 204) {
        setIngredients((prev) => prev.filter((ing) => ing.id !== id));
        setPersistedIngredients((prev) => prev.filter((ing) => ing.id !== id));
      } else {
        const errorText = await res.text();
        console.error(`Failed to delete ingredient ${id}:`, res.status, errorText);
        if (res.status === 422) {
          alert('Impossible de supprimer cet ingrédient car il est utilisé dans des recettes ou des listes de courses.');
        } else {
          alert(`Erreur lors de la suppression (${res.status})`);
        }
      }
    } catch (err) {
      console.error(`Error deleting ingredient ${id}:`, err);
    }
  };

  const loadIngredients = async () => {
    try {
      const res = await sendAPIGET('ingredients/');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch ingredients: ${res.status} ${text}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) {
        console.warn('Unexpected ingredients response:', json);
        return;
      }

      const mapped: Ingredient[] = json.map((it: any) => ({
        id: it.id ?? 0,
        name: it.name ?? '',
        brand: it.brand?.id ?? it.brand_id ?? 0,
        shelf: it.shelf?.id ?? it.shelf_id ?? 0,
        unit: it.unit ?? 'unité',
        note: it.remark ?? it.note ?? '',
      }));

      setIngredients(mapped);
      setPersistedIngredients(mapped);
    } catch (err) {
      console.error('Error loading ingredients', err);
    }
  };

  const loadBrands = async () => {
    try {
      const res = await sendAPIGET('brands/');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch brands: ${res.status} ${text}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) {
        console.warn('Unexpected brands response:', json);
        return;
      }

      const mapped: Brand[] = json.map((it: any) => ({
        id: it.id ?? 0,
        name: it.name ?? '',
        brand: it.brand ?? 0,
        shelf: it.shelf ?? 0,
        note: it.note ?? '',
      }));

      setBrands(mapped);
    } catch (err) {
      console.error('Error loading brands', err);
    }
  };

  const loadShelfs = async () => {
    try {
      const res = await sendAPIGET('shelfs/');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch shelfs: ${res.status} ${text}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) {
        console.warn('Unexpected shelfs response:', json);
        return;
      }

      const mapped: Shelf[] = json.map((it: any) => ({
        id: it.id ?? 0,
        name: it.name ?? '',
      }));

      setShelfs(mapped);
    } catch (err) {
      console.error('Error loading shelfs', err);
    }
  };

  useEffect(() => {
    loadIngredients();
    loadBrands();
    loadShelfs();
  }, []);

  const filteredIngredients = ingredients.filter(
    (ing) =>
      ing.id === 0 ||
      ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto w-full"
    >
      <header className="mb-6">
        <h2 className="text-4xl font-medium tracking-tight">{PRODUCTS_NAME}</h2>
      </header>

      <div className="p-4 h-full flex flex-col gap-4 bg-surface-container-lowest rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full focus:ring-2 focus:ring-primary-light/50 text-sm placeholder:text-on-surface-variant/60"
            placeholder="Chercher un produit"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-col space-y-4">
          <AnimatePresence initial={false}>
            {filteredIngredients.map((ingredient: Ingredient) => {
              const isDirty = isIngredientDirty(ingredient);
              return (
                <motion.div
                  key={ingredient.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 items-center bg-surface-container-low/50 rounded-lg overflow-hidden"
                >
                  <div className="w-full">
                    <label className="block px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Ingrédient
                    </label>
                    <ClickToEdit
                      initialValue={ingredient.name}
                      placeholder="Nom de l'ingrédient"
                      onSave={(newValue) => {
                        updateIngredientField(ingredient.id, 'name', newValue);
                      }}
                    />
                  </div>

                  <div className="w-full">
                    <label className="block px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Unité
                    </label>
                    <ClickToEdit
                      initialValue={ingredient.unit}
                      placeholder="Unité"
                      onSave={(newValue) => {
                        updateIngredientField(ingredient.id, 'unit', newValue);
                      }}
                    />
                  </div>

                  <div className="w-full">
                    <label className="block px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Marque
                    </label>
                    <div className="relative">
                      <select
                        value={ingredient.brand || 0}
                        onChange={(e) =>
                          updateIngredientField(ingredient.id, 'brand', Number(e.target.value))
                        }
                        className="w-full appearance-none bg-white border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-light/50 pr-10 cursor-pointer outline-none"
                      >
                        <option value={0}>Aucune marque</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <label className="block px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Rayon
                    </label>
                    <div className="relative">
                      <select
                        value={ingredient.shelf || 0}
                        onChange={(e) =>
                          updateIngredientField(ingredient.id, 'shelf', Number(e.target.value))
                        }
                        className="w-full appearance-none bg-white border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-light/50 pr-10 cursor-pointer outline-none"
                      >
                        <option value={0}>Aucun rayon</option>
                        {shelfs.map((shelf) => (
                          <option key={shelf.id} value={shelf.id}>
                            {shelf.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-start md:justify-end items-center gap-2">
                    <button
                      onClick={() => handleSaveIngredient(ingredient)}
                      disabled={!isDirty}
                      className={`p-2 transition-colors rounded-md ${
                        isDirty
                          ? 'text-primary hover:bg-primary/10 cursor-pointer'
                          : 'text-on-surface-variant/30 cursor-not-allowed'
                      }`}
                      title={isDirty ? 'Enregistrer les modifications' : 'Aucune modification'}
                    >
                      <Save size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteIngredient(ingredient.id)}
                      className="p-2 text-tertiary/40 hover:text-tertiary transition-colors rounded-md"
                      title="Supprimer"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={addIngredient}
            disabled={hasUnsavedCard}
            className={`flex items-center gap-2 font-semibold text-sm transition-all ${
              hasUnsavedCard
                ? 'text-on-surface-variant/40 cursor-not-allowed opacity-50'
                : 'text-primary hover:opacity-80'
            }`}
          >
            <PlusCircle size={16} />
            Ajouter un ingrédient
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ArticlesView = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<number>(0);

  // Charge la liste des recettes depuis l'API
  const loadRecipes = async () => {
    try {
      const res = await sendAPIGET('recipes/');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch recipes: ${res.status} ${text}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) {
        console.warn('Unexpected recipes response:', json);
        return;
      }

      const mapped: Recipe[] = json.map((it: any) => ({
        meal_id: it.meal_id ?? 0,
        items: Array.isArray(it.items)
          ? it.items.map((item: any) => ({
              quantity: item.quantity ?? 0,
              ingredient: {
                id: item.ingredient?.id ?? 0,
                name: item.ingredient?.name ?? '',
                unit: item.ingredient?.unit ?? '',
                note: item.ingredient?.remark ?? '',
                brand: item.ingredient?.brand_id ?? 0,
                shelf: item.ingredient?.shelf_id ?? 0,
              },
            }))
          : [],
      }));

      setRecipes(mapped);

      // Met à jour l'ID sélectionné par défaut une fois les recettes chargées
      if (mapped.length > 0 && mapped[0].meal_id) {
        setSelectedMealId(mapped[0].meal_id);
      }
    } catch (err) {
      console.error('Error loading recipes', err);
    }
  };

  // Charge la liste des repas depuis l'API
  const loadMeals = async () => {
    try {
      const res = await sendAPIGET('meals/');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch meals: ${res.status} ${text}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) return;

      const mapped: Meal[] = json.map((it: any) => ({
        id: it.id ?? 0,
        name: it.name ?? '',
        veggy: Boolean(it.veggy),
        meal_productions: Array.isArray(it.meal_productions) ? (it.meal_productions as MealProduction[]) : [],
        recipe_items: [],
      }));

      setMeals(mapped);
    } catch (err) {
      console.error('Error loading meals', err);
    }
  };

  useEffect(() => {
    loadRecipes();
    loadMeals();
  }, []);

  // Dérivation directe de la recette active
  const selectedRecipe = recipes.find((r) => r.meal_id === selectedMealId);

  // Sauvegarde d'un ingrédient de la recette
  const saveRecipeItem = async (item: RecipeItem) => {
    try {
      const payload = {
        name: item.ingredient.name,
        unit: item.ingredient.unit,
        remark: item.ingredient.note,
        shelf_id: item.ingredient.shelf,
        brand_id: item.ingredient.brand,
      };

      const res = await sendAPIPOST('ingredients/', payload);
      if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Error saving ingredient', err);
    }
  };

  // Suppression locale d'un ingrédient
  const removeRecipeItem = (ingredientId: number) => {
    if (!selectedRecipe) return;

    setRecipes((prevRecipes) =>
      prevRecipes.map((r) => {
        if (r.meal_id !== selectedMealId) return r;
        return {
          ...r,
          items: r.items.filter((item) => item.ingredient.id !== ingredientId),
        };
      })
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto w-full"
    >
      <header className="mb-12">
        <h2 className="text-4xl font-medium tracking-tight mb-2">{ARTICLES_NAMES}</h2>
      </header>

      <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm h-full flex flex-col gap-4">
        {/* Select du Meal / Recette */}
        <div className="relative inline-block w-full">
          <select
            value={selectedMealId}
            onChange={(e) => setSelectedMealId(Number(e.target.value))}
            className="w-full appearance-none bg-surface-container-low rounded-lg border-none p-2 px-10 text-center [text-align-last:center] text-4xl font-medium tracking-tight text-on-surface cursor-pointer outline-none focus:ring-0"
          >
            {recipes.map((recipe) => {
              const meal = meals.find((m) => m.id === recipe.meal_id);
              return (
                <option
                  key={recipe.meal_id}
                  value={recipe.meal_id}
                  className="text-base font-normal text-left"
                >
                  {meal ? meal.name : `Recette #${recipe.meal_id}`}
                </option>
              );
            })}
          </select>

          <ChevronDown
            size={28}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>

        {/* Liste dynamique des RecipeItems */}
        <div className="flex-1 space-y-4">
          <AnimatePresence initial={false}>
            {!selectedRecipe || selectedRecipe.items.length === 0 ? (
              <p className="text-center text-on-surface-variant py-8">
                Aucun ingrédient associé à ce plat.
              </p>
            ) : (
              selectedRecipe.items.map((item) => (
                <motion.div
                  key={item.ingredient.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-12 gap-4 items-end bg-surface-container-low/50 p-4 rounded-lg group overflow-hidden"
                >
                  {/* Nom de l'ingrédient */}
                  <div className="col-span-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Ingrédient
                    </label>
                    <div className="flex-1 min-w-0">
                      <ClickToEdit
                        initialValue={item.ingredient.name}
                        onSave={(newValue) => console.log('Nouveau nom :', newValue)}
                      />
                    </div>
                  </div>

                  {/* Association Ingrédient / Produit */}
                  <div className="col-span-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Produit / Marque associé
                    </label>
                    <div className="relative">
                      <select
                        value={item.ingredient.id}
                        onChange={(e) => console.log('Changer produit vers :', e.target.value)}
                        className="w-full appearance-none bg-white border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-light/50 pr-10 cursor-pointer outline-none"
                      >
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Sauvegarde */}
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => saveRecipeItem(item)}
                      className="px-2 py-2 rounded-lg font-bold text-white signature-gradient shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Save size={20} />
                    </button>
                  </div>

                  {/* Note / Remarque */}
                  <div className="col-span-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Note / Remarque
                    </label>
                    <div className="flex-1 min-w-0">
                      <ClickToEdit
                        initialValue={item.ingredient.note || ''}
                        onSave={(newValue) => console.log('Nouvelle note :', newValue)}
                      />
                    </div>
                  </div>

                  {/* Quantité & Unité */}
                  <div className="col-span-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Quantité
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="tabular-nums w-full bg-white border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-light/50 pr-16 outline-none"
                        type="number"
                        defaultValue={item.quantity}
                      />
                      <span className="absolute right-4 text-xs font-medium text-on-surface-variant">
                        {item.ingredient.unit}
                      </span>
                    </div>
                  </div>

                  {/* Suppression */}
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => removeRecipeItem(item.ingredient.id)}
                      className="p-3 text-tertiary/40 hover:text-tertiary transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const PlanningView = () => {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  // 1. États
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [mealsList, setMealsList] = useState<Meal[]>([]);
  const [productionsByDate, setProductionsByDate] = useState<Record<string, ProdCard[]>>({});

  // 2. Dates calculées pour la semaine
  const currentWeekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // 3. Navigation Semaine
  const handlePreviousWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  // 4. Regroupement des données API
  const groupProductionsByDate = (mealsFromApi: Meal[]): Record<string, ProdCard[]> => {
    const grouped: Record<string, ProdCard[]> = {};

    mealsFromApi.forEach((meal) => {
      meal.meal_productions.forEach((prod) => {
        if (!grouped[prod.date]) {
          grouped[prod.date] = [];
        }

        grouped[prod.date].push({
          productionId: prod.id,
          mealId: meal.id,
          title: meal.name,
          units: prod.quantity,
          date: prod.date,
        });
      });
    });

    return grouped;
  };

  // 5. Chargement API
  const loadMeals = async () => {
    try {
      const res = await sendAPIGET('meals/');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch meals: ${res.status} ${text}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) return;

      const mapped: Meal[] = json.map((it: any) => ({
        id: it.id ?? 0,
        name: it.name ?? '',
        veggy: Boolean(it.veggy),
        meal_productions: Array.isArray(it.meal_productions)
          ? it.meal_productions.map((prod: any): MealProduction => ({
              id: prod.id ?? 0,
              meal_id: prod.meal_id ?? it.id ?? 0,
              date: prod.date ?? '',
              quantity: prod.quantity ?? 0,
            }))
          : [],
        recipe_items: Array.isArray(it.recipe_items)
          ? it.recipe_items.map((item: any): RecipeItem => ({
              ingredient: {
                id: item.ingredient?.id ?? item.ingredient_id ?? 0,
                name: item.ingredient?.name ?? '',
                note: item.ingredient?.note ?? '',
                brand: item.ingredient?.brand ?? 0,
                shelf: item.ingredient?.shelf ?? 0,
                unit: item.ingredient?.unit ?? '',
              },
              quantity: item.quantity ?? 0,
            }))
          : [],
      }));

      setMealsList(mapped);
      setProductionsByDate(groupProductionsByDate(mapped));
    } catch (err) {
      console.error('Error loading meals', err);
    }
  };

  useEffect(() => {
    loadMeals();
  }, []);

  // 6. Interactions (Ajout / Changement de Plat / Supprimer)
  const addCard = (dateStr: string) => {
    const defaultMeal = mealsList[0];
    if (!defaultMeal) return;

    const newCard: ProdCard = {
      productionId: Date.now(), // Temporaire en local avant sync API
      mealId: defaultMeal.id,
      title: defaultMeal.name,
      units: 10,
      date: dateStr,
    };

    setProductionsByDate((prev) => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), newCard],
    }));
  };

  const removeMeal = (dateStr: string, productionId: number) => {
    setProductionsByDate((prev) => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).filter((card) => card.productionId !== productionId),
    }));
  };

  const handleMealChange = (dateStr: string, productionId: number, newMealId: number) => {
    const targetMeal = mealsList.find((m) => m.id === newMealId);
    if (!targetMeal) return;

    setProductionsByDate((prev) => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).map((card) =>
        card.productionId === productionId
          ? { ...card, mealId: targetMeal.id, title: targetMeal.name }
          : card
      ),
    }));
  };

  const handleQuantityChange = (dateStr: string, productionId: number, newQty: number) => {
    setProductionsByDate((prev) => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).map((card) =>
        card.productionId === productionId ? { ...card, units: newQty } : card
      ),
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-[1200px] mx-auto"
    >
      {/* Header avec Navigation de Semaine */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-on-surface mb-2">
            Planning hebdomadaire
          </h2>
        </div>
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
          <button
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-surface-container rounded transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-6 py-2">
            <span className="font-semibold text-sm">
              {formatDateHeader(currentWeekDates[0])} - {formatDateHeader(currentWeekDates[4])}
            </span>
          </div>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-surface-container rounded transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grille des 5 Jours */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {days.map((dayName, idx) => {
          const dateStr = currentWeekDates[idx];
          const dayCards = productionsByDate[dateStr] || [];

          return (
            <div key={dayName} className="flex flex-col gap-4">
              {/* En-tête du jour */}
              <div className="px-4 py-2 bg-surface-container rounded-t-lg">
                <h3 className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                  {dayName}
                </h3>
                <p className="text-xs text-on-surface-variant/70">
                  {formatDateHeader(dateStr)}
                </p>
              </div>

              {/* Cartes de Production */}
              <AnimatePresence>
                {dayCards.map((card) => (
                  <motion.div
                    key={card.productionId}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-0"
                  >
                    <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-xl shadow-sm border-l-4 border-primary/0 animate-pop">
                      {/* Select Plat */}
                      <div className="relative mb-3">
                        <select
                          value={card.mealId}
                          onChange={(e) =>
                            handleMealChange(dateStr, card.productionId, Number(e.target.value))
                          }
                          className="w-full appearance-none bg-surface-container border-none rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-light/50 pr-9 cursor-pointer outline-none font-semibold text-on-surface"
                        >
                          {mealsList.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                        />
                      </div>

                      {/* Quantité + Poubelle */}
                      <div className="grid grid-cols-1 min-[180px]:grid-cols-[1fr_auto] items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider shrink-0">
                            Qté :
                          </span>
                          <div className="flex-1 min-w-0">
                            <ClickToEdit
                              initialValue={card.units.toString()}
                              onSave={(newValue) =>
                                handleQuantityChange(
                                  dateStr,
                                  card.productionId,
                                  Number(newValue) || 0
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="flex justify-center min-[180px]:justify-end">
                          <button
                            className="p-2 text-tertiary/40 hover:text-tertiary hover:bg-tertiary/5 rounded-full transition-all shrink-0"
                            onClick={() => removeMeal(dateStr, card.productionId)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Bouton Ajouter */}
              <div className="py-0">
                <button
                  onClick={() => addCard(dateStr)}
                  className="w-full bg-surface-container-lowest p-4 rounded-xl border-dashed border-2 border-outline-variant/30 flex flex-col items-center justify-center hover:border-primary/50 transition-colors group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-2 transition-colors">
                    +
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">
                    Ajouter un plat
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewType>(SIDEBAR_IDS.SHOPPING_LIST_NAME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Nettoyage si le composant est démonté
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen flex bg-surface">
      <Sidebar
        currentView={view}
        setView={setView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 min-h-screen flex flex-col lg:ml-64 transition-all">
        {/* Header mobile avec bouton Burger */}
        <header className="flex justify-start h-16 bg-surface-container-low border-b border-outline-variant/15 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-4 text-on-surface-variant hover:bg-surface-container-high rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <Logo></Logo>
          </div>
        </header>

        <div className="px-6 lg:px-12 py-8 max-w-[1440px] mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            {view === SIDEBAR_IDS.SHOPPING_LIST_NAME ? (
              <ShoppingListViewv2 key={SIDEBAR_IDS.SHOPPING_LIST_NAME} />
            ) : view === SIDEBAR_IDS.RECIPES_NAME ? (
              <RecipeCreatorView key={SIDEBAR_IDS.RECIPES_NAME} />
            ) : view === SIDEBAR_IDS.PRODUCTS_NAME ? (
              <ProductsView key={SIDEBAR_IDS.PRODUCTS_NAME} />
            ) : view === SIDEBAR_IDS.ARTICLES_NAMES ? (
              <ArticlesView key={SIDEBAR_IDS.ARTICLES_NAMES} />
            ) : (
              <PlanningView key={SIDEBAR_IDS.PLANNING_NAME} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
