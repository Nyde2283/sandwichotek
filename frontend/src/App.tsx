import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  X,
  Utensils,
  LogOut,
  Search,
  PlusCircle,
  History,
  ChevronDown,
  ChevronLeft,
  Calendar,
  ScrollText,
  Pencil,
  ChevronRight,
  Trash2,
  AppleIcon,
  Plus,
  Tag,
  Layers,
  ShoppingCart,
  Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

/* ==========================================================================
   TYPES & INTERFACES
   ========================================================================== */

const ALLOWED_DOMAIN = "telecomnancy.net";

const API_URL = (window as any).env?.API_URL || 'http://localhost';
const API_PORT = (window as any).env?.API_PORT || '8000';

export const BASE_API_URL = `${API_URL}:${API_PORT}`;

const APP_NAME = 'Sandwichotek';
const SHOPPING_LIST_NAME = 'Liste de courses';
const RECIPES_NAME = 'Recettes';
const PRODUCTS_NAME = 'Produits';
const BRANDSANDSHELVES_NAME = 'Marques & Rayons';
const PLANNING_NAME = 'Planning hebdomadaire';

const SIDEBAR_IDS = {
  SHOPPING_LIST_NAME: 'shoppinglist',
  RECIPES_NAME: 'recipes',
  PRODUCTS_NAME: 'products',
  BRANDSANDSHELVES_NAME: 'brandsandshelves',
  PLANNING_NAME: 'planning',
} as const;

type ViewType = 'shoppinglist' | 'recipes' | 'products' | 'brandsandshelves' | 'planning';

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
  brand?: number;
  shelf?: number;
  note?: string;
}

interface Shelf {
  id: number;
  name: string;
}

interface RecipeItem {
  ingredient: Ingredient;
  quantity: number;
}

interface Recipe {
  meal_id: number;
  items: RecipeItem[];
}

interface MealProduction {
  id: number;
  meal_id: number;
  date: string;
  quantity: number;
}

interface Meal {
  id: number;
  name: string;
  veggy: boolean;
  meal_productions: MealProduction[];
  recipe_items: RecipeItem[];
}

interface ProdCard {
  productionId: number;
  mealId: number;
  title: string;
  units: number;
  date: string;
}

interface AvailableIngredient {
  id: number;
  name: string;
  unit: string;
  remark?: string | null;
  shelf_id?: number | null;
  brand_id?: number | null;
  shelf?: { id: number; name: string } | null;
  brand?: { id: number; name: string } | null;
}

interface APIShoppingItem {
  shopping_list_id: number;
  ingredient_id: number;
  quantity: number;
  bought: boolean;
  ingredient?: {
    id: number;
    name: string;
    unit: string;
    remark?: string;
    shelf?: { id: number; name: string };
    brand?: { id: number; name: string };
  };
}

interface APIShoppingList {
  id: number;
  shopping_date: string;
  range_begin: string;
  range_end: string;
  shopping_items?: APIShoppingItem[];
}

interface SidebarProps {
  currentView: ViewType;
  setView: (v: ViewType) => void;
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  onLogout: () => void;
}

interface ClickToEditProps {
  initialValue: string;
  onSave: (val: string) => void;
  placeholder?: string;
}

interface InlineQuantityInputProps {
  quantity: number;
  unit?: string;
  onSave: (newQuantity: number) => void;
}

interface ShoppingRowProps {
  list: APIShoppingList;
  isOpen: boolean;
  onToggleOpen: () => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onToggleItem: (listId: number, ingredientId: number, currentBought: boolean) => void;
  onUpdateQuantity: (listId: number, ingredientId: number, newQuantity: number) => void;
  onUpdatePlannedDate?: (listId: number, newDate: string) => Promise<void>;
  onAddItem: (payload: {
    shopping_list_id: number;
    ingredient_id: number;
    quantity: number;
    bought: boolean;
  }) => Promise<boolean>;
  onResync: (list: APIShoppingList) => void;
  isSyncing: boolean;
  availableIngredients: AvailableIngredient[];
}

/* ==========================================================================
   HELPERS & UTILS
   ========================================================================== */

export const formatDateISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateString = (): string => {
  return formatDateISO(new Date());
};

export const formatDateHeader = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export const getWeekDates = (referenceDate = new Date(), includeWeekend = false): string[] => {
  const date = new Date(referenceDate);
  const dayOfWeek = date.getDay();
  const distanceToMonday = (dayOfWeek === 0 ? 7 : dayOfWeek) - 1;
  const monday = new Date(date);
  monday.setDate(date.getDate() - distanceToMonday);

  const daysCount = includeWeekend ? 7 : 5;
  const weekDates: string[] = [];

  for (let i = 0; i < daysCount; i++) {
    const currentDay = new Date(monday);
    currentDay.setDate(monday.getDate() + i);
    weekDates.push(formatDateISO(currentDay));
  }

  return weekDates;
};

export const getInitialPlanningDate = (referenceDate = new Date()): Date => {
  const d = new Date(referenceDate);
  const day = d.getDay();
  if (day === 0 || day === 6) {
    const daysUntilNextMonday = day === 0 ? 1 : 2;
    const nextMonday = new Date(d);
    nextMonday.setDate(d.getDate() + daysUntilNextMonday);
    return nextMonday;
  }
  return d;
};

export const isIngredientDirty = (ing: Ingredient, persistedIngredients: Ingredient[]): boolean => {
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

const parseJwtPayload = (token: string) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};

const isTokenValid = (token: string): boolean => {
  try {
    const payload = parseJwtPayload(token);
    if (!payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('google_token');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function sendAPIPOST(route: string, payload: unknown): Promise<Response> {
  return await fetch(`${BASE_API_URL}/${route}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

async function sendAPIGET(route: string): Promise<Response> {
  return await fetch(`${BASE_API_URL}/${route}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

async function sendAPIPUT(route: string, payload: unknown): Promise<Response> {
  return await fetch(`${BASE_API_URL}/${route}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

async function sendAPIDELETE(route: string): Promise<Response> {
  return await fetch(`${BASE_API_URL}/${route}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export const isBrandDirty = (brand: Brand, persistedBrands: Brand[]): boolean => {
  if (brand.id === 0) return true;
  const original = persistedBrands.find((p) => p.id === brand.id);
  if (!original) return true;
  return brand.name.trim() !== original.name.trim();
};

export const isShelfDirty = (shelf: Shelf, persistedShelves: Shelf[]): boolean => {
  if (shelf.id === 0) return true;
  const original = persistedShelves.find((p) => p.id === shelf.id);
  if (!original) return true;
  return shelf.name.trim() !== original.name.trim();
};

export const fetchBrandsApi = async (): Promise<Brand[]> => {
  const res = await sendAPIGET('brands/');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch brands: ${res.status} ${text}`);
  }
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json.map((it: any) => ({
    id: it.id ?? 0,
    name: it.name ?? '',
    brand: it.brand ?? 0,
    shelf: it.shelf ?? 0,
    note: it.note ?? '',
  }));
};

export const saveBrandApi = async (brand: Brand): Promise<Brand> => {
  const payload = { name: brand.name };
  const res = brand.id === 0
    ? await sendAPIPOST('brands/', payload)
    : await sendAPIPUT(`brands/${brand.id}`, payload);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save brand (${res.status}): ${text}`);
  }
  const json = await res.json();
  return {
    id: json.id,
    name: json.name ?? '',
    brand: json.brand ?? 0,
    shelf: json.shelf ?? 0,
    note: json.note ?? '',
  };
};

export const deleteBrandApi = async (id: number): Promise<Response> => {
  return await sendAPIDELETE(`brands/${id}`);
};

export const fetchShelvesApi = async (): Promise<Shelf[]> => {
  const res = await sendAPIGET('shelves/');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch shelves: ${res.status} ${text}`);
  }
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json.map((it: any) => ({
    id: it.id ?? 0,
    name: it.name ?? '',
  }));
};

export const saveShelfApi = async (shelf: Shelf): Promise<Shelf> => {
  const payload = { name: shelf.name };
  const res = shelf.id === 0
    ? await sendAPIPOST('shelves/', payload)
    : await sendAPIPUT(`shelves/${shelf.id}`, payload);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save shelf (${res.status}): ${text}`);
  }
  const json = await res.json();
  return {
    id: json.id,
    name: json.name ?? '',
  };
};

export const deleteShelfApi = async (id: number): Promise<Response> => {
  return await sendAPIDELETE(`shelves/${id}`);
};

async function aggregateIngredientsForRange(rangeBegin: string, rangeEnd: string): Promise<Record<number, number>> {
  const prodRes = await sendAPIGET(`meal_productions/?after=${rangeBegin}&before=${rangeEnd}`);
  if (!prodRes.ok) throw new Error('Erreur lors de la récupération des productions.');
  const productions: any[] = await prodRes.json();

  const aggregatedTotals: Record<number, number> = {};
  const mealCache: Record<number, any> = {};

  for (const prod of productions) {
    const mealId = prod.meal_id;
    if (!mealCache[mealId]) {
      const mealRes = await sendAPIGET(`meals/${mealId}`);
      if (mealRes.ok) {
        mealCache[mealId] = await mealRes.json();
      }
    }
    const meal = mealCache[mealId];
    if (meal && Array.isArray(meal.recipe_items)) {
      for (const rItem of meal.recipe_items) {
        const ingId = rItem.ingredient_id ?? rItem.ingredient?.id;
        if (ingId) {
          const qty = (rItem.quantity ?? 0) * (prod.quantity ?? 0);
          aggregatedTotals[ingId] = (aggregatedTotals[ingId] || 0) + qty;
        }
      }
    }
  }

  return aggregatedTotals;
}

const ClickToEdit: React.FC<ClickToEditProps> = ({ initialValue, onSave, placeholder }) => {
  /* --- HOOKS & STATE --- */
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  /* --- HANDLERS --- */
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

  /* --- RENDER --- */
  if (isEditing) {
    return (
      <div className="flex-1 min-w-0">
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
          className="bg-surface-container w-full border-2 border-primary rounded-lg px-3 py-1.5 text-lg font-semibold outline-none shadow-sm animate-pop"
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

const Logo: React.FC = () => {
  /* --- RENDER --- */
  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-10 bg-primary rounded-xl flex items-center justify-center text-white" />
      <div>
        <h1 className="text-lg font-bold text-primary uppercase tracking-widest leading-none mb-1">{APP_NAME}</h1>
        <p className="text-[0.65rem] text-on-surface-variant font-medium">Le bar, c'est mieux maintenant</p>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen, onLogout }) => {
  /* --- HOOKS & STATE --- */
  const navItems = [
    { id: SIDEBAR_IDS.SHOPPING_LIST_NAME, icon: <ScrollText size={20} />, label: SHOPPING_LIST_NAME },
    { id: SIDEBAR_IDS.RECIPES_NAME, icon: <Utensils size={20} />, label: RECIPES_NAME },
    { id: SIDEBAR_IDS.PRODUCTS_NAME, icon: <AppleIcon size={20} />, label: PRODUCTS_NAME },
    { id: SIDEBAR_IDS.BRANDSANDSHELVES_NAME, icon: <ShoppingCart size={20} />, label: BRANDSANDSHELVES_NAME },
    { id: SIDEBAR_IDS.PLANNING_NAME, icon: <Calendar size={20} />, label: PLANNING_NAME },
  ];

  /* --- RENDER --- */
  return (
    <>
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

      <aside
        className={`
        fixed left-0 top-0 h-screen w-64 z-50 bg-surface-container-low border-r border-outline-variant/15 flex flex-col py-4 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 overflow-auto
      `}
      >
        <div className="px-4 mb-10">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id as ViewType);
                setIsOpen(false);
              }}
              className={`w-full group flex items-center py-3 px-6 transition-all relative text-left ${
                currentView === item.id
                  ? 'text-primary font-semibold bg-white/50'
                  : 'text-on-surface-variant hover:bg-surface-container-high/50'
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
          <button
        type="button"
        onClick={onLogout}
        className="flex items-center w-full py-2 text-tertiary font-medium text-sm hover:opacity-80 transition-opacity"
      >
        <LogOut size={18} className="mr-3" /> Déconnexion
      </button>
        </div>
      </aside>
    </>
  );
};

const InlineQuantityInput: React.FC<InlineQuantityInputProps> = ({ quantity, unit, onSave }) => {
  /* --- HOOKS & STATE --- */
  const [val, setVal] = useState<string>(String(Math.round(quantity)));

  useEffect(() => {
    setVal(String(Math.round(quantity)));
  }, [quantity]);

  /* --- HANDLERS --- */
  const handleBlur = () => {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed !== Math.round(quantity)) {
      onSave(parsed);
    } else {
      setVal(String(Math.round(quantity)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setVal(String(Math.round(quantity)));
      (e.target as HTMLInputElement).blur();
    }
  };

  /* --- RENDER --- */
  return (
    <div
      className="flex items-center justify-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="number"
        min="0"
        step="1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-20 text-right px-2 py-1 bg-surface-container-high/70 hover:bg-surface-container-high focus:bg-surface border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary rounded text-xs font-semibold tabular-nums text-on-surface outline-none transition-all cursor-text"
        title="Modifier la quantité"
      />
      {unit && (
        <span className="text-[10px] text-on-surface-variant font-normal min-w-[20px] text-left">
          {unit}
        </span>
      )}
    </div>
  );
};

const ShoppingRow: React.FC<ShoppingRowProps> = ({
  list,
  isOpen,
  onToggleOpen,
  onDelete,
  onToggleItem,
  onUpdateQuantity,
  onUpdatePlannedDate,
  onAddItem,
  onResync,
  isSyncing,
  availableIngredients,
}) => {
  /* --- HOOKS & STATE --- */
  const items = list.shopping_items || [];
  const boughtCount = items.filter((i) => i.bought).length;

  const todayStr = getTodayDateString();
  const isToday = Boolean(list.shopping_date && list.shopping_date === todayStr);
  const isCollapsed = !isOpen;
  const isCompleted = items.length > 0 && items.every((i) => i.bought);
  const isPast = Boolean(list.shopping_date && list.shopping_date < todayStr);
  const isDimmed = isPast || isCompleted;
  const isHighlightToday = isToday && isCollapsed && !isDimmed;

  const [selectedIngredientId, setSelectedIngredientId] = useState<number | ''>('');
  const [newQuantity, setNewQuantity] = useState<string>('1');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDateVal, setEditDateVal] = useState(list.shopping_date || '');

  useEffect(() => {
    setEditDateVal(list.shopping_date || '');
  }, [list.shopping_date]);

  const selectedIngredient = availableIngredients.find(
    (i) => i.id === Number(selectedIngredientId)
  );

  const sortedIngredients = useMemo(() => {
    return [...availableIngredients].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [availableIngredients]);

  /* --- HANDLERS --- */
  const handleSaveDate = async () => {
    setIsEditingDate(false);
    if (editDateVal && editDateVal !== list.shopping_date && onUpdatePlannedDate) {
      await onUpdatePlannedDate(list.id, editDateVal);
    }
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const numQty = parseInt(newQuantity, 10);
    if (!selectedIngredientId || isNaN(numQty) || numQty <= 0) return;

    setIsAdding(true);
    try {
      const success = await onAddItem({
        shopping_list_id: list.id,
        ingredient_id: Number(selectedIngredientId),
        quantity: numQty,
        bought: false,
      });
      if (success) {
        setSelectedIngredientId('');
        setNewQuantity('1');
      }
    } catch (err) {
      console.error('Error submitting new shopping item:', err);
    } finally {
      setIsAdding(false);
    }
  };

  /* --- RENDER --- */
  return (
    <>
      <tr
        onClick={onToggleOpen}
        className={`transition-all group cursor-pointer border-b border-outline-variant/50 ${
          isHighlightToday
            ? 'bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary shadow-xs'
            : isDimmed
            ? 'opacity-60 hover:opacity-90 bg-surface-container-lowest/40'
            : 'hover:bg-surface-container-low'
        }`}
      >
        <td className="px-6 py-4">
          <div className="gap-3 flex items-center justify-start">
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              className="text-on-surface-variant shrink-0"
            >
              <ChevronRight size={18} />
            </motion.div>

            <div className="flex flex-col min-w-0">
              {isEditingDate ? (
                <div
                  className="flex items-center gap-1.5 py-0.5 flex-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="date"
                    value={editDateVal}
                    onChange={(e) => setEditDateVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDate();
                      if (e.key === 'Escape') {
                        setEditDateVal(list.shopping_date || '');
                        setIsEditingDate(false);
                      }
                    }}
                    onBlur={handleSaveDate}
                    autoFocus
                    className="px-2 py-1 bg-surface border border-primary rounded text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleSaveDate}
                      className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                      title="Enregistrer la date prévisionnelle"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditDateVal(list.shopping_date || '');
                        setIsEditingDate(false);
                      }}
                      className="p-1 text-on-surface-variant hover:bg-surface-container-high rounded transition-colors"
                      title="Annuler"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* --- CHANGEMENT MAJEUR ICI : flex-wrap + shrink-0 pour préserver le badge --- */
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span
                    className={`font-medium text-sm whitespace-nowrap ${
                      isHighlightToday
                        ? 'text-primary font-bold'
                        : isDimmed
                        ? 'text-on-surface-variant'
                        : 'text-on-surface'
                    }`}
                  >
                    {list.shopping_date
                      ? new Date(list.shopping_date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>

                  {isHighlightToday && (
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary text-white shadow-xs">
                      Aujourd'hui
                    </span>
                  )}

                  {isPast && !isCompleted && (
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-surface-container text-on-surface-variant/70">
                      Passée
                    </span>
                  )}

                  {onUpdatePlannedDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingDate(true);
                      }}
                      className="shrink-0 opacity-0 group-hover/date:opacity-100 p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-all"
                      title="Modifier la date des courses prévues"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}

              {(list.range_begin || list.range_end) && (
                <span className="text-[10px] text-on-surface-variant/70 whitespace-nowrap mt-0.5">
                  Période : {list.range_begin ? new Date(list.range_begin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''} - {list.range_end ? new Date(list.range_end).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className={`px-6 text-sm font-mono ${isHighlightToday ? 'text-primary font-bold' : 'text-primary/80'}`}>
          #SL-{String(list.id).padStart(4, '0')}
        </td>
        <td className="px-6 text-right">
          <span className="text-sm text-on-surface-variant tabular-nums">
            {items.length} <span className="text-[10px] uppercase font-bold tracking-tight">produits</span>
          </span>
        </td>
        <td className="px-6 text-right">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
              isCompleted
                ? 'bg-green-500/10 text-green-600'
                : isHighlightToday
                ? 'bg-primary text-white'
                : isDimmed
                ? 'bg-surface-container-high text-on-surface-variant/70'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {boughtCount} / {items.length} PRIS {isCompleted ? '✓' : ''}
          </span>
        </td>
        <td className="px-6 text-right">
          <button
            type="button"
            onClick={(e) => onDelete(list.id, e)}
            className="p-2 text-tertiary/40 hover:text-tertiary hover:bg-tertiary/10 rounded-lg transition-colors"
            title="Supprimer la liste"
          >
            <Trash2 size={16} />
          </button>
        </td>
      </tr>

      <AnimatePresence>
        {isOpen && (
          <tr key={`details-${list.id}`}>
            <td colSpan={5} className="p-0 bg-surface-container-low/20">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div className="pb-2">
                  <div className="flex items-center justify-between px-4 py-2 bg-surface-container border-b border-outline-variant/30 rounded-t-lg">
                    <span className="text-xs font-semibold text-on-surface">
                      Articles de la liste ({items.length})
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResync(list);
                      }}
                      disabled={true}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-on-surface-variant/40 bg-surface-container-high/60 border border-outline-variant/30 transition-colors opacity-50 cursor-not-allowed"
                      title="Réactualisation temporairement désactivée"
                    >
                      <History size={13} className={isSyncing ? "animate-spin" : ""} />
                      <span>{isSyncing ? "Réactualisation..." : "Réactualiser"}</span>
                    </button>
                  </div>

                  <div className="bg-surface-container-lowest rounded-b-lg shadow-custom overflow-hidden">
                    {items.length === 0 ? (
                      <div className="py-6 text-center text-xs text-on-surface-variant">
                        Aucun produit dans cette liste de courses.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant">
                            <th className="w-10 px-4 py-2" />
                            <th className="px-4 py-2 text-[0.6rem] uppercase font-bold tracking-[0.15em] text-on-surface-variant/70">
                              Article
                            </th>
                            <th className="px-4 py-2 text-[0.6rem] uppercase font-bold tracking-[0.15em] text-on-surface-variant/70">
                              Marque
                            </th>
                            <th className="px-4 py-2 text-[0.6rem] uppercase font-bold tracking-[0.15em] text-on-surface-variant/70 text-right">
                              Quantité
                            </th>
                            <th className="px-4 py-2 text-[0.6rem] uppercase font-bold tracking-[0.15em] text-on-surface-variant/70">
                              Rayon
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/50">
                          {items.map((item, idx) => (
                            <tr
                              key={`${item.ingredient_id}-${idx}`}
                              className={`text-xs transition-all ${
                                item.bought
                                  ? 'opacity-40 bg-surface-container-low/30'
                                  : 'opacity-100'
                              }`}
                            >
                              <td className="px-4 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.bought}
                                  onChange={() =>
                                    onToggleItem(list.id, item.ingredient_id, item.bought)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-outline-variant text-primary accent-primary cursor-pointer"
                                />
                              </td>

                              <td
                                className={`px-4 py-2.5 font-medium transition-all ${
                                  item.bought
                                    ? 'line-through text-on-surface-variant'
                                    : 'text-on-surface'
                                }`}
                              >
                                {item.ingredient?.name || `Ingrédient #${item.ingredient_id}`}
                              </td>

                              <td className="px-4 py-2.5 text-on-surface-variant/80 italic">
                                {item.ingredient?.brand?.name || '—'}
                              </td>

                              <td className="px-4 py-2.5 text-right tabular-nums text-on-surface font-medium">
                                <InlineQuantityInput
                                  quantity={item.quantity}
                                  unit={item.ingredient?.unit}
                                  onSave={(newQty) =>
                                    onUpdateQuantity(list.id, item.ingredient_id, newQty)
                                  }
                                />
                              </td>

                              <td className="px-4 py-2.5 text-[10px] text-on-surface-variant/80 uppercase tracking-tight">
                                {item.ingredient?.shelf?.name || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    <form
                      onSubmit={handleAddItemSubmit}
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 bg-surface-container/60 border-t border-outline-variant/30 text-xs"
                    >
                      <div className="flex-1 min-w-[200px]">
                        <select
                          value={selectedIngredientId}
                          onChange={(e) => setSelectedIngredientId(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-md text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                        >
                          <option value="">Ajouter un ingrédient...</option>
                          {sortedIngredients.map((ing) => {
                            const isAlreadyInList = items.some((it) => it.ingredient_id === ing.id);
                            return (
                              <option key={ing.id} value={ing.id} disabled={isAlreadyInList}>
                                {ing.name}
                                {ing.brand?.name ? ` — ${ing.brand.name}` : ''}
                                {ing.unit ? ` (${ing.unit})` : ''}
                                {isAlreadyInList ? ' (déjà dans la liste)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Quantité"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                          className="w-24 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/50 rounded-md text-xs text-on-surface text-right focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm tabular-nums"
                        />
                        <span className="text-[11px] text-on-surface-variant font-medium min-w-[24px]">
                          {selectedIngredient?.unit || ''}
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedIngredientId || !newQuantity || Number(newQuantity) <= 0 || isAdding}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>{isAdding ? 'Ajout...' : 'Ajouter'}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

const ShoppingListViewv2: React.FC = () => {
  /* --- HOOKS & STATE --- */
  const [shoppingLists, setShoppingLists] = useState<APIShoppingList[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>([]);
  const [expandedListId, setExpandedListId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [plannedDate, setPlannedDate] = useState('');
  const [rangeBegin, setRangeBegin] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'past_completed'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [syncingListId, setSyncingListId] = useState<number | null>(null);

  /* --- HANDLERS --- */
  const fetchListDetails = async (listId: number) => {
    try {
      const res = await sendAPIGET(`shopping_lists/${listId}`);
      if (!res.ok) return;
      const data: APIShoppingList = await res.json();
      setShoppingLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, ...data } : l))
      );
    } catch (err) {
      console.error(`Error fetching shopping list details ${listId}:`, err);
    }
  };

  const loadShoppingLists = async (selectedId?: number) => {
    setIsLoading(true);
    try {
      const res = await sendAPIGET('shopping_lists/');
      if (!res.ok) throw new Error(`Failed to fetch shopping lists: ${res.status}`);

      const json = await res.json();
      if (!Array.isArray(json)) return;

      const mapped: APIShoppingList[] = await Promise.all(
        json.map(async (it: any) => {
          if (Array.isArray(it.shopping_items)) {
            return {
              id: it.id ?? 0,
              shopping_date: it.shopping_date ?? '',
              range_begin: it.range_begin ?? '',
              range_end: it.range_end ?? '',
              shopping_items: it.shopping_items,
            };
          }
          try {
            const detailRes = await sendAPIGET(`shopping_lists/${it.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              return {
                id: it.id ?? 0,
                shopping_date: it.shopping_date ?? '',
                range_begin: it.range_begin ?? '',
                range_end: it.range_end ?? '',
                shopping_items: detailData.shopping_items ?? [],
              };
            }
          } catch {
            // fallback handled below
          }
          return {
            id: it.id ?? 0,
            shopping_date: it.shopping_date ?? '',
            range_begin: it.range_begin ?? '',
            range_end: it.range_end ?? '',
            shopping_items: [],
          };
        })
      );

      mapped.sort((a, b) => {
        const dateA = a.shopping_date ? new Date(a.shopping_date).getTime() : 0;
        const dateB = b.shopping_date ? new Date(b.shopping_date).getTime() : 0;
        const diff = dateB - dateA;
        if (diff !== 0) return diff;
        return b.id - a.id;
      });

      setShoppingLists(mapped);

      const targetId = selectedId !== undefined ? selectedId : expandedListId;
      if (targetId !== null && mapped.some((l) => l.id === targetId)) {
        await fetchListDetails(targetId);
      }
    } catch (err) {
      console.error('Error loading shopping lists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadIngredients = async () => {
    try {
      const res = await sendAPIGET('ingredients/');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailableIngredients(data);
        }
      }
    } catch (err) {
      console.error('Error loading available ingredients:', err);
    }
  };

  useEffect(() => {
    loadShoppingLists();
    loadIngredients();
  }, []);

  const handleOpenGenerateModal = () => {
    const today = new Date();
    const todayStr = getTodayDateString();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 6);
    const nextWeekStr = formatDateISO(nextWeek);

    setPlannedDate(todayStr);
    setRangeBegin(todayStr);
    setRangeEnd(nextWeekStr);
    setShowGenerateModal(true);
  };

  const handleToggleExpandList = async (listId: number) => {
    if (expandedListId === listId) {
      setExpandedListId(null);
      return;
    }
    setExpandedListId(listId);
    await fetchListDetails(listId);
  };

  const handleDeleteShoppingList = async (listId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await sendAPIDELETE(`shopping_lists/${listId}`);
      if (res.ok || res.status === 204) {
        setShoppingLists((prev) => prev.filter((l) => l.id !== listId));
        if (expandedListId === listId) {
          setExpandedListId(null);
        }
      }
    } catch (err) {
      console.error(`Error deleting shopping list ${listId}:`, err);
    }
  };

  const handleToggleItemBought = async (listId: number, ingredientId: number, currentBought: boolean) => {
    try {
      await sendAPIPUT(`shopping_lists/${listId}/items/${ingredientId}`, {
        bought: !currentBought,
      });
      await fetchListDetails(listId);
    } catch (err) {
      console.error('Error updating item bought state:', err);
    }
  };

  const handleUpdateItemQuantity = async (listId: number, ingredientId: number, quantity: number) => {
    try {
      const res = await sendAPIPUT(`shopping_lists/${listId}/items/${ingredientId}`, {
        quantity,
      });
      if (res.ok) {
        await fetchListDetails(listId);
      }
    } catch (err) {
      console.error('Error updating item quantity:', err);
    }
  };

  const handleUpdatePlannedDate = async (listId: number, newDate: string) => {
    try {
      const res = await sendAPIPUT(`shopping_lists/${listId}`, {
        shopping_date: newDate,
      });
      if (res.ok) {
        await loadShoppingLists(listId);
      }
    } catch (err) {
      console.error('Error updating planned date:', err);
    }
  };

  const handleAddItem = async (payload: {
    shopping_list_id: number;
    ingredient_id: number;
    quantity: number;
    bought: boolean;
  }): Promise<boolean> => {
    try {
      const res = await sendAPIPOST(`shopping_lists/${payload.shopping_list_id}/items`, payload);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.detail || "Erreur lors de l'ajout de l'article.");
        return false;
      }
      await fetchListDetails(payload.shopping_list_id);
      return true;
    } catch (err) {
      console.error('Error adding item to shopping list:', err);
      return false;
    }
  };

  const handleResyncList = async (list: APIShoppingList) => {
    if (!list.range_begin || !list.range_end) {
      alert("Impossible de réactualiser : cette liste n'a pas de période définie.");
      return;
    }
    setSyncingListId(list.id);

    try {
      const expectedTotals = await aggregateIngredientsForRange(list.range_begin, list.range_end);

      const detailRes = await sendAPIGET(`shopping_lists/${list.id}`);
      const currentItems: APIShoppingItem[] = detailRes.ok ? (await detailRes.json()).shopping_items || [] : list.shopping_items || [];
      const existingItemsByIngId: Record<number, APIShoppingItem> = {};

      currentItems.forEach((it) => {
        existingItemsByIngId[it.ingredient_id] = it;
      });

      for (const [ingIdStr, newTotal] of Object.entries(expectedTotals)) {
        const ingId = Number(ingIdStr);
        const existingItem = existingItemsByIngId[ingId];

        if (!existingItem) {
          await sendAPIPOST(`shopping_lists/${list.id}/items`, {
            shopping_list_id: list.id,
            ingredient_id: ingId,
            quantity: newTotal,
            bought: false,
          });
        } else if (!existingItem.bought) {
          if (existingItem.quantity !== newTotal) {
            await sendAPIPUT(`shopping_lists/${list.id}/items/${ingId}`, {
              quantity: newTotal,
            });
          }
        } else {
          if (newTotal > existingItem.quantity) {
            const remainingQty = newTotal - existingItem.quantity;
            try {
              await sendAPIPOST(`shopping_lists/${list.id}/items`, {
                shopping_list_id: list.id,
                ingredient_id: ingId,
                quantity: remainingQty,
                bought: false,
              });
            } catch (err) {
              console.warn(`Impossible de créer une entrée delta pour l'item ${ingId}:`, err);
            }
          }
        }
      }

      await fetchListDetails(list.id);
    } catch (err: any) {
      console.error('Erreur lors de la synchronisation de la liste:', err);
      alert(err.message || 'Erreur lors de la réactualisation de la liste');
    } finally {
      setSyncingListId(null);
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!plannedDate) {
      alert('Veuillez sélectionner la date des courses prévues.');
      return;
    }
    if (!rangeBegin || !rangeEnd) {
      alert('Veuillez sélectionner une date de début et une date de fin de période.');
      return;
    }
    if (rangeBegin > rangeEnd) {
      alert('La date de début doit être antérieure ou égale à la date de fin.');
      return;
    }

    setIsGenerating(true);
    try {
      const aggregatedIngredients = await aggregateIngredientsForRange(rangeBegin, rangeEnd);

      const createListPayload = {
        shopping_date: plannedDate,
        range_begin: rangeBegin,
        range_end: rangeEnd,
      };

      const createListRes = await sendAPIPOST('shopping_lists/', createListPayload);
      if (!createListRes.ok) throw new Error('Erreur création liste');

      const createdList: APIShoppingList = await createListRes.json();
      const listId = createdList.id;

      for (const [ingIdStr, totalQty] of Object.entries(aggregatedIngredients)) {
        const ingId = Number(ingIdStr);
        try {
          await sendAPIPOST(`shopping_lists/${listId}/items`, {
            shopping_list_id: listId,
            ingredient_id: ingId,
            quantity: totalQty,
            bought: false,
          });
        } catch (itemErr) {
          console.warn(`Item ${ingId} not added:`, itemErr);
        }
      }

      setExpandedListId(listId);
      await loadShoppingLists(listId);
      setShowGenerateModal(false);
    } catch (err: any) {
      console.error('Error generating shopping list:', err);
      alert(err.message || 'Erreur lors de la génération de la liste de courses');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredShoppingLists = useMemo(() => {
    const todayStr = getTodayDateString();
    return shoppingLists.filter((list) => {
      const items = list.shopping_items || [];
      const isCompleted = items.length > 0 && items.every((i) => i.bought);
      const isPast = Boolean(list.shopping_date && list.shopping_date < todayStr);
      const isToday = Boolean(list.shopping_date && list.shopping_date === todayStr);

      if (filterTab === 'today') {
        return isToday;
      }
      if (filterTab === 'upcoming') {
        return Boolean(list.shopping_date && list.shopping_date >= todayStr) && !isCompleted;
      }
      if (filterTab === 'past_completed') {
        return isPast || isCompleted;
      }
      return true;
    });
  }, [shoppingLists, filterTab]);

  const todayCount = useMemo(() => {
    const todayStr = getTodayDateString();
    return shoppingLists.filter((l) => l.shopping_date === todayStr).length;
  }, [shoppingLists]);

  /* --- RENDER --- */
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
        <div className="w-full mb-4 pb-3 border-b border-outline-variant/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-on-surface text-lg">Historique des courses</h3>
            <span className="text-xs text-on-surface-variant font-medium bg-surface-container-high px-2.5 py-1 rounded-full">
              {shoppingLists.length} listes au total
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenGenerateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white signature-gradient shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Générer une liste</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterTab === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            Toutes ({shoppingLists.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterTab === 'today'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            Aujourd'hui ({todayCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterTab === 'upcoming'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            À venir
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('past_completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterTab === 'past_completed'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            Passées & Complétées
          </button>
        </div>

        <div className="rounded-t-lg bg-surface-container-high border-outline-variant/50 overflow-hidden">
          <table className="w-full table-auto md:table-fixed">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="px-6 py-4 text-[0.65rem] uppercase font-bold text-on-surface-variant text-left">
                  Date des courses prévues
                </th>
                <th className="px-6 py-4 text-[0.65rem] uppercase font-bold text-on-surface-variant text-left">
                  Référence
                </th>
                <th className="px-6 py-4 text-[0.65rem] uppercase font-bold text-on-surface-variant text-right">
                  Volume
                </th>
                <th className="px-6 py-4 text-[0.65rem] uppercase font-bold text-on-surface-variant text-right">
                  Statut
                </th>
                <th className="px-6 py-4 text-[0.65rem] uppercase font-bold text-on-surface-variant text-right w-20">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-container-low">
              {filteredShoppingLists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                    {isLoading
                      ? 'Chargement des listes de courses...'
                      : filterTab === 'today'
                      ? "Aucune liste de courses prévue pour aujourd'hui."
                      : 'Aucune liste de courses ne correspond au filtre sélectionné.'}
                  </td>
                </tr>
              ) : (
                filteredShoppingLists.map((list) => (
                  <ShoppingRow
                    key={list.id}
                    list={list}
                    isOpen={expandedListId === list.id}
                    onToggleOpen={() => handleToggleExpandList(list.id)}
                    onDelete={handleDeleteShoppingList}
                    onToggleItem={handleToggleItemBought}
                    onUpdateQuantity={handleUpdateItemQuantity}
                    onUpdatePlannedDate={handleUpdatePlannedDate}
                    onAddItem={handleAddItem}
                    onResync={handleResyncList}
                    isSyncing={syncingListId === list.id}
                    availableIngredients={availableIngredients}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-surface-container-high flex items-center justify-between rounded-b-lg border-outline-variant/50 text-xs text-on-surface-variant">
          <span>Cliquez sur une ligne pour afficher ou masquer le détail des articles. Survolez la date pour la modifier.</span>
        </div>
      </section>

      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Calendar size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-on-surface">Générer une liste</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Sélectionnez la date prévisionnelle des courses ainsi que la période des plannings de production pour agréger automatiquement tous les ingrédients nécessaires.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Date des courses prévues (Date prévisionnelle)
                  </label>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-lg text-sm text-on-surface border border-outline-variant/50 focus:ring-2 focus:ring-primary-light/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Période des productions - Date de début
                  </label>
                  <input
                    type="date"
                    value={rangeBegin}
                    onChange={(e) => setRangeBegin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-lg text-sm text-on-surface border border-outline-variant/50 focus:ring-2 focus:ring-primary-light/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Période des productions - Date de fin
                  </label>
                  <input
                    type="date"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-lg text-sm text-on-surface border border-outline-variant/50 focus:ring-2 focus:ring-primary-light/50 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleGenerateShoppingList}
                  disabled={isGenerating || !plannedDate || !rangeBegin || !rangeEnd}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-white signature-gradient shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      <span>Générer</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const RecipeCreatorView: React.FC = () => {
  /* --- HOOKS & STATE --- */
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

  /* --- HANDLERS --- */
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

  const selectedRecipe = recipes.find((r) => r.meal_id === (selectedMeal?.id ?? 0)) || {
    meal_id: selectedMeal?.id ?? 0,
    items: [],
  };

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

  /* --- RENDER --- */
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
              />
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

const ProductsView: React.FC = () => {
  /* --- HOOKS & STATE --- */
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [persistedIngredients, setPersistedIngredients] = useState<Ingredient[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const hasUnsavedCard = useMemo(() => {
    return ingredients.some((ing) => ing.id === 0);
  }, [ingredients]);

  /* --- HANDLERS --- */
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

  const loadShelves = async () => {
    try {
      const res = await sendAPIGET('shelves/');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch shelves: ${res.status} ${text}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) {
        console.warn('Unexpected shelves response:', json);
        return;
      }

      const mapped: Shelf[] = json.map((it: any) => ({
        id: it.id ?? 0,
        name: it.name ?? '',
      }));

      setShelves(mapped);
    } catch (err) {
      console.error('Error loading shelves', err);
    }
  };

  useEffect(() => {
    loadIngredients();
    loadBrands();
    loadShelves();
  }, []);

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

  const filteredIngredients = ingredients.filter(
    (ing) =>
      ing.id === 0 ||
      ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* --- RENDER --- */
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
              const isDirty = isIngredientDirty(ingredient, persistedIngredients);
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
                        {shelves.map((shelf) => (
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

export const BrandsAndShelvesView: React.FC = () => {
  /* --- HOOKS & STATE --- */
  const [activeTab, setActiveTab] = useState<'brands' | 'shelves'>('brands');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [brands, setBrands] = useState<Brand[]>([]);
  const [persistedBrands, setPersistedBrands] = useState<Brand[]>([]);

  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [persistedShelves, setPersistedShelves] = useState<Shelf[]>([]);

  const hasUnsavedBrand = useMemo(() => brands.some((b) => b.id === 0), [brands]);
  const hasUnsavedShelf = useMemo(() => shelves.some((s) => s.id === 0), [shelves]);

  /* --- DATA FETCHING --- */
  const loadBrands = async () => {
    try {
      const data = await fetchBrandsApi();
      setBrands(data);
      setPersistedBrands(data);
    } catch (err) {
      console.error('Error loading brands:', err);
    }
  };

  const loadShelves = async () => {
    try {
      const data = await fetchShelvesApi();
      setShelves(data);
      setPersistedShelves(data);
    } catch (err) {
      console.error('Error loading shelves:', err);
    }
  };

  useEffect(() => {
    loadBrands();
    loadShelves();
  }, []);

  /* --- BRAND HANDLERS --- */
  const addBrand = () => {
    if (hasUnsavedBrand) return;
    setBrands((prev) => [...prev, { id: 0, name: '' }]);
  };

  const updateBrandName = (id: number, name: string) => {
    setBrands((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)));
  };

  const handleSaveBrand = async (brand: Brand) => {
    if (!brand.name.trim()) {
      alert('Le nom de la marque ne peut pas être vide.');
      return;
    }
    try {
      const saved = await saveBrandApi(brand);
      setBrands((prev) => prev.map((b) => (b.id === brand.id ? saved : b)));
      setPersistedBrands((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved];
      });
    } catch (err) {
      console.error('Error saving brand:', err);
      alert('Erreur lors de la sauvegarde de la marque.');
    }
  };

  const handleDeleteBrand = async (id: number) => {
    if (id === 0) {
      setBrands((prev) => prev.filter((b) => b.id !== 0));
      return;
    }
    try {
      const res = await deleteBrandApi(id);
      if (res.ok || res.status === 204) {
        setBrands((prev) => prev.filter((b) => b.id !== id));
        setPersistedBrands((prev) => prev.filter((b) => b.id !== id));
      } else if (res.status === 422) {
        alert('Impossible de supprimer cette marque car elle est attribuée à des ingrédients.');
      } else {
        alert(`Erreur lors de la suppression (${res.status})`);
      }
    } catch (err) {
      console.error(`Error deleting brand ${id}:`, err);
    }
  };

  /* --- SHELF HANDLERS --- */
  const addShelf = () => {
    if (hasUnsavedShelf) return;
    setShelves((prev) => [...prev, { id: 0, name: '' }]);
  };

  const updateShelfName = (id: number, name: string) => {
    setShelves((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleSaveShelf = async (shelf: Shelf) => {
    if (!shelf.name.trim()) {
      alert('Le nom du rayon ne peut pas être vide.');
      return;
    }
    try {
      const saved = await saveShelfApi(shelf);
      setShelves((prev) => prev.map((s) => (s.id === shelf.id ? saved : s)));
      setPersistedShelves((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved];
      });
    } catch (err) {
      console.error('Error saving shelf:', err);
      alert('Erreur lors de la sauvegarde du rayon.');
    }
  };

  const handleDeleteShelf = async (id: number) => {
    if (id === 0) {
      setShelves((prev) => prev.filter((s) => s.id !== 0));
      return;
    }
    try {
      const res = await deleteShelfApi(id);
      if (res.ok || res.status === 204) {
        setShelves((prev) => prev.filter((s) => s.id !== id));
        setPersistedShelves((prev) => prev.filter((s) => s.id !== id));
      } else if (res.status === 422) {
        alert('Impossible de supprimer ce rayon car il est utilisé par des ingrédients.');
      } else {
        alert(`Erreur lors de la suppression (${res.status})`);
      }
    } catch (err) {
      console.error(`Error deleting shelf ${id}:`, err);
    }
  };

  /* --- FILTERED LISTS --- */
  const filteredBrands = brands.filter(
    (b) => b.id === 0 || b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShelves = shelves.filter(
    (s) => s.id === 0 || s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* --- RENDER --- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto w-full"
    >
      <header className="mb-6">
        <h2 className="text-4xl font-medium tracking-tight">{BRANDSANDSHELVES_NAME}</h2>
      </header>

      {/* TABS NAVIGATION */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setActiveTab('brands'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
            activeTab === 'brands'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <Tag size={16} />
          Marques ({brands.length})
        </button>
        <button
          onClick={() => { setActiveTab('shelves'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
            activeTab === 'shelves'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <Layers size={16} />
          Rayons ({shelves.length})
        </button>
      </div>

      <div className="p-4 h-full flex flex-col gap-4 bg-surface-container-lowest rounded-xl shadow-sm">
        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant size-4" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-full focus:ring-2 focus:ring-primary-light/50 text-sm placeholder:text-on-surface-variant/60"
            placeholder={activeTab === 'brands' ? 'Chercher une marque...' : 'Chercher un rayon...'}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* BRANDS VIEW */}
        {activeTab === 'brands' && (
          <div className="flex-col space-y-3">
            <AnimatePresence initial={false}>
              {filteredBrands.map((brand) => {
                const isDirty = isBrandDirty(brand, persistedBrands);
                return (
                  <motion.div
                    key={brand.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-[1fr_auto] gap-3 p-3 items-center bg-surface-container-low/50 rounded-lg overflow-hidden"
                  >
                    <div className="w-full">
                      <label className="block px-1 mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Marque
                      </label>
                      <ClickToEdit
                        initialValue={brand.name}
                        placeholder="Nom de la marque"
                        onSave={(newValue) => updateBrandName(brand.id, newValue)}
                      />
                    </div>

                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleSaveBrand(brand)}
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
                        onClick={() => handleDeleteBrand(brand.id)}
                        className="p-2 text-tertiary/40 hover:text-tertiary transition-colors rounded-md cursor-pointer"
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
        )}

        {/* SHELVES VIEW */}
        {activeTab === 'shelves' && (
          <div className="flex-col space-y-3">
            <AnimatePresence initial={false}>
              {filteredShelves.map((shelf) => {
                const isDirty = isShelfDirty(shelf, persistedShelves);
                return (
                  <motion.div
                    key={shelf.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-[1fr_auto] gap-3 p-3 items-center bg-surface-container-low/50 rounded-lg overflow-hidden"
                  >
                    <div className="w-full">
                      <label className="block px-1 mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Rayon
                      </label>
                      <ClickToEdit
                        initialValue={shelf.name}
                        placeholder="Nom du rayon"
                        onSave={(newValue) => updateShelfName(shelf.id, newValue)}
                      />
                    </div>

                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleSaveShelf(shelf)}
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
                        onClick={() => handleDeleteShelf(shelf.id)}
                        className="p-2 text-tertiary/40 hover:text-tertiary transition-colors rounded-md cursor-pointer"
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
        )}

        {/* ADD BUTTON */}
        <div className="flex justify-between items-center pt-2">
          {activeTab === 'brands' ? (
            <button
              onClick={addBrand}
              disabled={hasUnsavedBrand}
              className={`flex items-center gap-2 font-semibold text-sm transition-all ${
                hasUnsavedBrand
                  ? 'text-on-surface-variant/40 cursor-not-allowed opacity-50'
                  : 'text-primary hover:opacity-80 cursor-pointer'
              }`}
            >
              <PlusCircle size={16} />
              Ajouter une marque
            </button>
          ) : (
            <button
              onClick={addShelf}
              disabled={hasUnsavedShelf}
              className={`flex items-center gap-2 font-semibold text-sm transition-all ${
                hasUnsavedShelf
                  ? 'text-on-surface-variant/40 cursor-not-allowed opacity-50'
                  : 'text-primary hover:opacity-80 cursor-pointer'
              }`}
            >
              <PlusCircle size={16} />
              Ajouter un rayon
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const PlanningView: React.FC = () => {
  /* --- HOOKS & STATE --- */
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  const [currentDate, setCurrentDate] = useState<Date>(() => getInitialPlanningDate());
  const [mealsList, setMealsList] = useState<Meal[]>([]);
  const [productionsByDate, setProductionsByDate] = useState<Record<string, ProdCard[]>>({});

  const todayStr = useMemo(() => getTodayDateString(), []);
  const currentWeekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  /* --- HANDLERS --- */
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

  const fetchWeekData = async () => {
    if (!currentWeekDates || currentWeekDates.length < 5) return;
    const mondayDate = currentWeekDates[0];
    const fridayDate = currentWeekDates[4];

    try {
      const mealsRes = await sendAPIGET('meals/');
      let loadedMeals: Meal[] = [];
      if (mealsRes.ok) {
        const json = await mealsRes.json();
        if (Array.isArray(json)) {
          loadedMeals = json.map((it: any) => ({
            id: it.id ?? 0,
            name: it.name ?? '',
            veggy: Boolean(it.veggy),
            meal_productions: [],
            recipe_items: [],
          }));
          setMealsList(loadedMeals);
        }
      }

      const prodRes = await sendAPIGET(
        `meal_productions/?after=${mondayDate}&before=${fridayDate}`
      );
      if (prodRes.ok) {
        const productions: any[] = await prodRes.json();
        const grouped: Record<string, ProdCard[]> = {};

        currentWeekDates.forEach((d) => {
          grouped[d] = [];
        });

        if (Array.isArray(productions)) {
          productions.forEach((prod: any) => {
            const d = prod.date;
            if (!grouped[d]) {
              grouped[d] = [];
            }
            const matchingMeal = loadedMeals.find((m) => m.id === prod.meal_id);
            grouped[d].push({
              productionId: prod.id,
              mealId: prod.meal_id,
              title: prod.meal?.name || matchingMeal?.name || '',
              units: prod.quantity ?? 0,
              date: prod.date,
            });
          });
        }

        setProductionsByDate(grouped);
      }
    } catch (err) {
      console.error('Error fetching week data:', err);
    }
  };

  useEffect(() => {
    fetchWeekData();
  }, [currentWeekDates]);

  const addCard = async (dateStr: string) => {
    if (mealsList.length === 0) {
      alert("Aucun plat disponible. Créez d'abord des recettes dans l'onglet Recettes.");
      return;
    }
    const defaultMeal = mealsList[0];
    const payload = {
      meal_id: defaultMeal.id,
      date: dateStr,
      quantity: 10,
    };

    try {
      const res = await sendAPIPOST('meal_productions/', payload);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create meal production: ${res.status} ${text}`);
      }

      const createdProd = await res.json();
      const newCard: ProdCard = {
        productionId: createdProd.id,
        mealId: createdProd.meal_id,
        title: createdProd.meal?.name || defaultMeal.name,
        units: createdProd.quantity,
        date: createdProd.date,
      };

      setProductionsByDate((prev) => ({
        ...prev,
        [dateStr]: [...(prev[dateStr] || []), newCard],
      }));
    } catch (err) {
      console.error('Error creating meal production:', err);
      alert('Erreur lors de la création de la production');
    }
  };

  const removeMeal = async (dateStr: string, productionId: number) => {
    setProductionsByDate((prev) => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).filter(
        (card) => card.productionId !== productionId
      ),
    }));

    try {
      const res = await sendAPIDELETE(`meal_productions/${productionId}`);
      if (!res.ok && res.status !== 204) {
        const text = await res.text();
        console.error(`Failed to delete meal production ${productionId}:`, res.status, text);
        alert(`Erreur lors de la suppression (${res.status})`);
        fetchWeekData();
      }
    } catch (err) {
      console.error(`Error deleting meal production ${productionId}:`, err);
      alert('Erreur lors de la suppression');
      fetchWeekData();
    }
  };

  const handleMealChange = async (
    dateStr: string,
    productionId: number,
    newMealId: number
  ) => {
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

    try {
      const res = await sendAPIPUT(`meal_productions/${productionId}`, {
        meal_id: newMealId,
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`Failed to update meal production ${productionId}:`, res.status, text);
        fetchWeekData();
      }
    } catch (err) {
      console.error(`Error updating meal production ${productionId}:`, err);
      fetchWeekData();
    }
  };

  const handleQuantityChange = async (
    dateStr: string,
    productionId: number,
    newQty: number
  ) => {
    setProductionsByDate((prev) => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).map((card) =>
        card.productionId === productionId ? { ...card, units: newQty } : card
      ),
    }));

    try {
      const res = await sendAPIPUT(`meal_productions/${productionId}`, {
        quantity: newQty,
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`Failed to update quantity for production ${productionId}:`, res.status, text);
        fetchWeekData();
      }
    } catch (err) {
      console.error(`Error updating quantity for production ${productionId}:`, err);
      fetchWeekData();
    }
  };

  /* --- RENDER --- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-[1200px] mx-auto"
    >
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-on-surface mb-2">
            Planning hebdomadaire
          </h2>
        </div>
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
          <button
            type="button"
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
            type="button"
            onClick={handleNextWeek}
            className="p-2 hover:bg-surface-container rounded transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {days.map((dayName, idx) => {
          const dateStr = currentWeekDates[idx];
          const dayCards = productionsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;

          return (
            <div
              key={dayName}
              className={`flex flex-col gap-4 rounded-xl transition-all ${
                isToday
                  ? 'bg-primary/5 p-2 -m-2 border-2 border-primary shadow-xs'
                  : isPast
                  ? 'opacity-60 hover:opacity-90 bg-surface-container-low/40 p-2 -m-2 border border-outline-variant/30'
                  : ''
              }`}
            >
              <div
                className={`px-3 py-2 rounded-t-lg flex flex-wrap items-center justify-between gap-1 ${
                  isToday
                    ? 'bg-primary/10'
                    : isPast
                    ? 'bg-surface-container/60'
                    : 'bg-surface-container'
                }`}
              >
                <div>
                  <h3
                    className={`font-label text-xs font-semibold uppercase tracking-widest ${
                      isToday
                        ? 'text-primary font-bold'
                        : isPast
                        ? 'text-on-surface-variant/70'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {dayName}
                  </h3>
                  <p
                    className={`text-xs ${
                      isToday
                        ? 'text-primary/80 font-medium'
                        : isPast
                        ? 'text-on-surface-variant/50'
                        : 'text-on-surface-variant/70'
                    }`}
                  >
                    {formatDateHeader(dateStr)}
                  </p>
                </div>
                {isToday && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary text-white shadow-xs">
                    Aujourd'hui
                  </span>
                )}
                {isPast && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-surface-container text-on-surface-variant/70">
                    Passé
                  </span>
                )}
              </div>

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
                            type="button"
                            className="p-2 text-tertiary/40 hover:text-tertiary hover:bg-tertiary/5 rounded-full transition-all shrink-0 cursor-pointer"
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

              <div className="py-0">
                <button
                  type="button"
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

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function App() {
  /* --- HOOKS & STATE --- */
  const [user, setUser] = useState<{ email: string; name: string } | null>(() => {
    const token = localStorage.getItem('google_token');
    if (!token || !isTokenValid(token)) return null;

    try {
      const payload = parseJwtPayload(token);
      if (ALLOWED_DOMAIN && payload.hd !== ALLOWED_DOMAIN) return null;
      return { email: payload.email, name: payload.name };
    } catch {
      return null;
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>(SIDEBAR_IDS.SHOPPING_LIST_NAME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!user);
  
  const handleLogout = () => {
    localStorage.removeItem('google_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  /* --- AUTH HANDLER --- */
  const handleGoogleSuccess = (credentialResponse: any) => {
    setError(null);
    const token = credentialResponse?.credential;

    if (!token) {
      setError('Aucun jeton de connexion reçu.');
      return;
    }

    try {
      const payload = parseJwtPayload(token);

      if (ALLOWED_DOMAIN && payload.hd !== ALLOWED_DOMAIN) {
        throw new Error(`Accès réservé aux comptes @${ALLOWED_DOMAIN}`);
      }

      if (!isTokenValid(token)) {
        throw new Error('Jeton d\'authentification expiré.');
      }

      localStorage.setItem('google_token', token);
      setUser({
        email: payload.email,
        name: payload.name,
      });
      setIsAuthenticated(true);
    } catch (err: any) {
      localStorage.removeItem('google_token');
      setIsAuthenticated(false);
      setUser(null);
      setError(err.message || 'Erreur lors de la connexion');
    }
  };

  /* --- DISCONNECTED --- */
  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-container-low p-8 rounded-2xl shadow-lg text-center border border-outline-variant/15">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-xl font-semibold text-on-surface mb-2">Accès Restreint</h1>
          <p className="text-sm text-on-surface-variant mb-6">
            Connectez-vous avec votre compte tn.net pour accéder à la sandwichotek.
          </p>

          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google auth failed')}
              hosted_domain={ALLOWED_DOMAIN}
            />
          </div>

          {error && (
            <p className="text-sm text-error bg-error-container/20 p-2 rounded-lg mt-4">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* --- MAIN RENDER --- */
  return (
    <div className="min-h-screen flex bg-surface">
      <Sidebar
        currentView={view}
        setView={setView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-h-screen flex flex-col lg:ml-64 transition-all">
        <header className="flex justify-start h-16 bg-surface-container-low border-b border-outline-variant/15 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-4 text-on-surface-variant hover:bg-surface-container-high rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <Logo />
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
            ) : view === SIDEBAR_IDS.BRANDSANDSHELVES_NAME ?(
              <BrandsAndShelvesView key={SIDEBAR_IDS.BRANDSANDSHELVES_NAME} />
            ) : (
              <PlanningView key={SIDEBAR_IDS.PLANNING_NAME} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}