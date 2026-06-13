import React, { useState, useRef, useEffect } from 'react';
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
  Scroll
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

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

interface ShoppingListItem {
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  shelf: string;
  taken: true | false
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

const ClickToEdit = ({ initialValue, onSave }: { initialValue: string, onSave: (val: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique quand on passe en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Optionnel : sélectionne tout le texte d'un coup
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
      <span className="text-lg font-semibold text-on-surface tracking-tight">
        {value}
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
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { id: '1', productId: '1', quantity: 0.2, unit: 'unité' },
    { id: '2', productId: '2', quantity: 10, unit: 'g' },
    { id: '3', productId: '3', quantity: 10, unit: 'g' },
    { id: '4', productId: '4', quantity: 2, unit: 'unité' },
  ]);

  const addIngredient = () => {
    //TODO valeur par défaut
    setIngredients([...ingredients, { id: Date.now().toString(), productId: '', quantity: 0, unit: 'units' }]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)

  const meals = ["Alpin", "Montagnard"]

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


      <div className="">
        <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
          <div className="py-2">
            <div className="relative w-full">
              <select className="w-full p-2 appearance-none bg-surface-container-high/50 rounded-lg text-sm focus:ring-2 focus:ring-primary-light/50 cursor-pointer">
                <option>Nouveau produit</option>
                {meals.map((meal) => (
                  <option>{meal}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center justify-between py-2 gap-4">
            <ClickToEdit
              initialValue="Nom du plat"
              onSave={(newValue) => {
                console.log("Nouveau nom :", newValue);
              }}
            />

            <label className="inline-flex items-center gap-4 cursor-pointer">
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">
                Veggie
              </span>
              <input type="checkbox" className="sr-only peer" />
              <div className="relative w-11 h-6 rounded-full peer 
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
                  peer-checked:after:translate-x-5">
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {ingredients.map((ingredient) => (
                <motion.div
                  key={ingredient.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-7 gap-4 p-4 items-end rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low overflow-hidden"
                >
                  <div className="col-span-3">
                    <label className="block mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Ingrédient</label>
                    <div className="relative">
                      <select
                        value={ingredient.productId}
                        // onChange={(e) => updateArticleProduct(article.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-lg appearance-none bg-white text-sm focus:ring-2 focus:ring-primary-light/50 pr-10 cursor-pointer"
                      >
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className="block mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Quantité</label>
                    <div className="relative flex items-center">
                      <input
                        className="tabular-nums w-full px-4 py-3 pr-16 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary-light/50"
                        type="number"
                        defaultValue={ingredient.quantity}
                      />
                      <span className="absolute right-4 text-xs font-medium text-on-surface-variant">{ingredient.unit}</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeIngredient(ingredient.id)}
                      className="p-3 text-tertiary/40 hover:text-tertiary transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={addIngredient}
              className="flex items-center gap-2 text-primary font-semibold text-sm hover:opacity-80"
            >
              <PlusCircle size={16} />
              Ajouter un ingrédient
            </button>
            <div className="flex gap-4">
              <button className="px-10 py-3 rounded-lg font-bold text-white signature-gradient shadow-lg hover:scale-[1.02] active:scale-[0.98]">Enregistrer</button>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const ProductsView = () => {

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const addProduct = () => {
    //TODO valeur par défaut
    setProducts([...products, { id: Date.now().toString(), name: '' }]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(ing => ing.id !== id));
  };

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
          // TODO Dynamiser
          />
        </div>

        <div className="flex-col space-y-4">
          <AnimatePresence initial={false}>
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-3 gap-2 p-3 items-end bg-surface-container-low/50 rounded-lg overflow-hidden"
              >
                <div className="col-span-2">
                  <label className="block px-3 mt-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Ingrédient</label>
                  <div className="flex-1 min-w-0">
                    <ClickToEdit
                      initialValue={product.name}
                      onSave={(newValue) => {
                        console.log("Nouveau nom :", newValue);
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="p-3 text-tertiary/40 hover:text-tertiary transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={addProduct}
            className="flex items-center gap-2 text-primary font-semibold text-sm hover:opacity-80"
          >
            <PlusCircle size={16} />
            Ajouter un ingrédient
          </button>
          <div className="flex gap-4">
            <button className="px-10 py-3 rounded-lg font-bold text-white signature-gradient shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">Enregistrer</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ArticlesView = () => {
  const [articles, setArticles] = useState<Article[]>([
    { id: '1', name: 'Tomate', productId: '1', brand: 'Pouce', quantity: 0.2, unit: 'unité' },
    { id: '2', name: 'Salade', productId: '2', brand: 'Auchan rouge', quantity: 10, unit: 'g' },
    { id: '3', name: 'Emmental rapé', productId: '2', brand: 'Pouce', quantity: 10, unit: 'g' },
    { id: '4', name: 'Saucisse', productId: '3', brand: 'Pouce', quantity: 6, unit: 'unité' },
  ]);

  const addArticle = () => {
    //TODO valeur par défaut
    setArticles([...articles, { id: Date.now().toString(), name: '', productId: '', brand: '', quantity: 0, unit: 'units' }]);
  };

  const removeArticle = (id: string) => {
    setArticles(articles.filter(ing => ing.id !== id));
  };

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)

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
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary-light/50 text-sm placeholder:text-on-surface-variant/60 outline-none transition-all"
            placeholder="Chercher un produit"
            type="text"
          // TODO Dynamiser
          />
        </div>

        <div className="flex-1 space-y-4">
          <AnimatePresence initial={false}>
            {articles.map((article) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-12 gap-4 items-end bg-surface-container-low/50 p-4 rounded-lg group overflow-hidden"
              >
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nom de l'article</label>
                  <div className="flex-1 min-w-0">
                    <ClickToEdit
                      initialValue={article.name}
                      onSave={(newValue) => {
                        console.log("Nouveau nom :", newValue);
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-6">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Ingrédient associé</label>
                  <div className="relative">
                    <select
                      value={article.productId}
                      // onChange={(e) => updateArticleProduct(article.id, e.target.value)}
                      className="w-full appearance-none bg-white border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-light/50 pr-10 cursor-pointer outline-none"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Marque</label>
                  <div className="flex-1 min-w-0">
                    <ClickToEdit
                      initialValue={article.brand}
                      onSave={(newValue) => {
                        console.log("Nouveau nom :", newValue);
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Quantité</label>
                  <div className="relative flex items-center">
                    <input
                      className="tabular-nums w-full bg-white border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-light/50 pr-16 outline-none"
                      type="number"
                      defaultValue={article.quantity}
                    />
                    <span className="absolute right-4 text-xs font-medium text-on-surface-variant">{article.unit}</span>
                  </div>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => removeArticle(article.id)}
                    className="p-3 text-tertiary/40 hover:text-tertiary transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-outline-variant/10 flex justify-between items-center">
          <button
            onClick={addArticle}
            className="flex items-center gap-2 text-primary font-semibold text-sm hover:opacity-80 transition-all"
          >
            <PlusCircle size={16} />
            Ajouter un ingrédient
          </button>
          <div className="flex gap-4">
            <button className="px-10 py-3 rounded-lg font-bold text-white signature-gradient shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">Enregistrer</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PlanningView = () => {
  type ProdCard = { id: string; title: string; units: number; };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  const [meals, setMeals] = useState<Record<string, ProdCard[]>>(() => ({
    Lundi: [{ id: 'm1', title: 'Vosgien', units: 12 }],
    Mardi: [
      { id: 't1', title: 'Alpin', units: 8 },
      { id: 't2', title: 'Chèvre frais', units: 6 }
    ],
    Mercredi: [{ id: 'w1', title: 'Wrap', units: 14 }],
    Jeudi: [
    ],
    Vendredi: [
      { id: 'f1', title: 'Comtois', units: 10 },
      { id: 'f2', title: 'Lance roquette', units: 6 }
    ]
  }));

  const addCard = (day: string) => {
    const newCard: ProdCard = {
      id: Date.now().toString(),
      title: 'New Meal',
      units: 100
    };
    setMeals((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), newCard]
    }));
  };

  const removeMeal = (day: string, id: string) => {
    setMeals((prev) => ({
      ...prev,
      [day]: prev[day].filter(card => card.id !== id)
    }));
  };

  {/* TODO options dynamiques */ }
  const meals_names = ["Alpin", "Homard"]
  const dates = ["26 Oct.", "27 Oct.", "28 Oct.", "29 Oct.", "30 Oct."]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-[1200px] mx-auto"
    >
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-on-surface mb-2">Planning hebdomadaire</h2>
        </div>
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
          {/* TODO ajouter boutons de navigation */}
          <button className="p-2 hover:bg-surface-container rounded transition-colors"><ChevronLeft size={18} /></button>
          <div className="px-6 py-2"><span className="font-semibold text-sm">{dates[0]} - {dates[dates.length - 1]}</span></div>
          <button className="p-2 hover:bg-surface-container rounded transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {days.map((day, idx) => (
          <div key={day} className="flex flex-col gap-4">
            <div className="px-4 py-2 bg-surface-container rounded-t-lg">
              <h3 className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{day}</h3>
              <p className="text-xs text-on-surface-variant/70">{dates[idx]}</p>
            </div>
            <AnimatePresence>
              {(meals[day] || []).map((card) => (
<motion.div
  key={card.id}
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  exit={{ opacity: 0, height: 0 }}
  className="p-0"
>
  <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-xl shadow-sm border-l-4 border-primary/0 animate-pop">
    {/* 1. Zone Select : On réduit un peu le padding interne */}
    <div className="relative mb-3">
      <select className="w-full appearance-none bg-surface-container border-none rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-light/50 pr-9 cursor-pointer outline-none font-semibold text-on-surface">
        <option>{card.title}</option>
        {meals_names.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
    </div>

    <div className="grid grid-cols-1 min-[180px]:grid-cols-[1fr_auto] items-center gap-2">
  
  {/* Bloc Quantité : prend toute la place (1fr) quand c'est sur deux lignes */}
  <div className="flex items-center gap-2 min-w-0">
    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider shrink-0">
      Qté :
    </span>
    <div className="flex-1 min-w-0">
      <ClickToEdit
        initialValue={card.units.toString()}
        onSave={(newValue) => console.log(newValue)}
      />
    </div>
  </div>

  {/* Bloc Poubelle : Se centre en mode 1 colonne, se cale à droite en mode 2 colonnes */}
  <div className="flex justify-center min-[180px]:justify-end">
    <button
      className="p-2 text-tertiary/40 hover:text-tertiary hover:bg-tertiary/5 rounded-full transition-all shrink-0"
      onClick={() => removeMeal(day, card.id)}
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

            {/* dashed add card */}
            <div className="py-0">
              <button
                onClick={() => addCard(day)}
                className="w-full bg-surface-container-lowest p-4 rounded-xl border-dashed border-2 border-outline-variant/30 flex flex-col items-center justify-center hover:border-primary/50 transition-colors group cursor-pointer"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-2 transition-colors">+</span>
                <span className="text-[10px] uppercase font-bold tracking-widest material-symbols-outlined text-on-surface-variant group-hover:text-primary mb-2 transition-colors">Ajouter un plat</span>
              </button>
            </div>
          </div>
        ))}
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
