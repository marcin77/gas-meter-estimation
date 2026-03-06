import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  Upload,
  Download,
  Plus,
  Trash2,
  Play,
  ToggleLeft,
  ToggleRight,
  FileSpreadsheet,
  BarChart3,
  Table,
  Calculator,
  AlertCircle,
  CheckCircle,
  X,
  Edit3,
  Save,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Globe,
  Copy,
  Check,
  HelpCircle,
  Info,
  Clock,
  ExternalLink,
  Mail,
  Github,
} from "lucide-react";
import { fitLinearRegression, ModelResult } from "./linearRegression";

declare global {
  interface Window {
    electronAPI?: {
      getUserDataPath: () => Promise<string>;
      saveData: (data: any) => Promise<{ success: boolean; error?: string }>;
      loadData: () => Promise<{ success: boolean; data?: any; error?: string }>;
    }
  }
}

/* ────────── i18n ────────── */
const LANG_PL = {
  app_title: "Gas Meter Estimation",
  app_subtitle: "Regresja liniowa — szacowanie odczytów gazomierza",
  rows: "Wiersze",
  valid: "Ważne",
  invalid: "Nie ważne",
  tab_data: "Dane",
  tab_results: "Wyniki modelu",
  tab_estimation: "Tabela estymacji",
  tab_prediction: "Predykcja",
  import_csv: "Import CSV",
  export_csv: "Export CSV",
  export_json: "Export JSON",
  add_row: "Dodaj wiersz",
  train_model: "Trenuj model",
  drag_title: "Przeciągnij plik CSV lub kliknij aby wybrać",
  drag_desc: "Wymagane kolumny: FIELD_VALID, FIELD_DATETIME, FIELD_HC, FIELD_HWC, FIELD_METER, FIELD_COMMENT",
  select_file: "Wybierz plik CSV",
  sample_data: "Dane przykładowe",
  new_row: "Nowy wiersz",
  datetime: "Data/czas",
  comment: "Komentarz",
  meter: "Odczyt",
  optional: "Opcjonalny",
  add: "Dodaj",
  cancel: "Anuluj",
  actions: "Akcje",
  intercept: "Intercept",
  coef_hc: "Współczynnik HC",
  coef_hwc: "Współczynnik HWC",
  formula: "Wzór estymacji",
  r2_train: "R² (Training)",
  r2_test: "R² (Testing)",
  mae: "MAE (Mean Absolute Error)",
  rmse: "RMSE (Root Mean Squared Error)",
  est_title: "Tabela estymacji — porównanie odczytów rzeczywistych z szacowanymi",
  meter_real: "Odczyt (rzeczywisty)",
  estimated: "Szacowany",
  error_col: "Błąd",
  prediction_title: "Ręczna predykcja",
  prediction_desc: "Wprowadź wartości HC i HWC aby obliczyć szacowany odczyt gazomierza.",
  estimated_reading: "Szacowany odczyt gazomierza",
  loaded_rows: (n: number) => `Załadowano ${n} wierszy z pliku CSV`,
  loaded_sample: "Załadowano dane przykładowe",
  row_added: "Dodano nowy wiersz",
  row_updated: "Wiersz zaktualizowany",
  model_trained: "Model wytrenowany pomyślnie!",
  fill_required: "Wypełnij wszystkie wymagane pola (data, HC, HWC, meter)",
  min_rows: "Potrzeba minimum 4 prawidłowych wierszy (valid=1) do treningu modelu",
  train_error: (msg: string) => `Błąd treningu: ${msg}`,
  parse_error: "Błąd parsowania pliku CSV",
  read_error: "Nie można odczytać pliku",
  drop_csv: "Proszę przeciągnąć plik .csv",
  toggle_valid: "Przełącz valid",
  edit: "Edytuj",
  delete: "Usuń",
  save: "Zapisz",
  copy: "Kopiuj",
  copied: "Skopiowano!",
  last_file: "Ostatni plik",
  last_file_load: "Wczytaj ostatnie dane",
  no_last_file: "Brak zapisanych danych z poprzedniej sesji",
  page: "Strona",
  of: "z",
  help: "Instrukcja",
  about: "O programie",
  help_title: "Instrukcja / Pomoc",
  about_title: "O programie / Informacje",
  close: "Zamknij",
  help_content: {
    title: "Jak korzystać z aplikacji",
    sections: [
      {
        heading: "1. Wczytanie danych",
        text: "Przeciągnij plik CSV na obszar aplikacji lub kliknij \"Import CSV\". Możesz też załadować dane przykładowe klikając \"Dane przykładowe\"."
      },
      {
        heading: "2. Wymagany format CSV",
        text: "Plik musi zawierać kolumny: FIELD_VALID (0/1), FIELD_DATETIME (data/czas), FIELD_HC (heat counter), FIELD_HWC (hot water counter), FIELD_METER (odczyt gazomierza), FIELD_COMMENT (opcjonalny komentarz)."
      },
      {
        heading: "3. Edycja danych",
        text: "Kliknij ikonę ołówka ✏️ aby edytować wiersz. Użyj przełącznika Valid aby włączyć/wyłączyć wiersz (wiersze z Valid=0 nie są brane pod uwagę w modelu). Kliknij ikonę kosza 🗑️ aby usunąć wiersz."
      },
      {
        heading: "4. Trenowanie modelu",
        text: "Ustaw parametry test_size (domyślnie 0.25) i random_state (domyślnie 42), następnie kliknij \"Trenuj model\". Model regresji liniowej zostanie wytrenowany na danych z Valid=1."
      },
      {
        heading: "5. Wyniki",
        text: "Zakładka \"Wyniki modelu\" pokazuje współczynniki regresji (Intercept, HC, HWC), R² (Training/Testing), MAE i RMSE. Użyj przycisków \"Kopiuj\" aby skopiować wartości współczynników."
      },
      {
        heading: "6. Tabela estymacji",
        text: "Porównanie odczytów rzeczywistych z szacowanymi. Błędy oznaczone kolorami: 🟢 < 1, 🟡 < 5, 🔴 ≥ 5."
      },
      {
        heading: "7. Predykcja",
        text: "Wpisz wartości HC i HWC aby obliczyć szacowany odczyt gazomierza na podstawie wytrenowanego modelu."
      },
      {
        heading: "8. Zapamiętywanie ustawień",
        text: "Aplikacja automatycznie zapamiętuje: wybrany język (PL/EN), motyw (jasny/ciemny) oraz ostatnio wczytane dane. Przy następnym uruchomieniu możesz jednym kliknięciem wczytać ostatnie dane."
      },
    ],
  },
};

const LANG_EN: typeof LANG_PL = {
  app_title: "Gas Meter Estimation",
  app_subtitle: "Linear regression — gas meter readings estimation",
  rows: "Rows",
  valid: "Valid",
  invalid: "Invalid",
  tab_data: "Data",
  tab_results: "Model Results",
  tab_estimation: "Estimation Table",
  tab_prediction: "Prediction",
  import_csv: "Import CSV",
  export_csv: "Export CSV",
  export_json: "Export JSON",
  add_row: "Add Row",
  train_model: "Train Model",
  drag_title: "Drag CSV file or click to select",
  drag_desc: "Required columns: FIELD_VALID, FIELD_DATETIME, FIELD_HC, FIELD_HWC, FIELD_METER, FIELD_COMMENT",
  select_file: "Select CSV file",
  sample_data: "Sample Data",
  new_row: "New Row",
  datetime: "Date/time",
  comment: "Comment",
  meter: "Meter",
  optional: "Optional",
  add: "Add",
  cancel: "Cancel",
  actions: "Actions",
  intercept: "Intercept",
  coef_hc: "Coefficient HC",
  coef_hwc: "Coefficient HWC",
  formula: "Estimation Formula",
  r2_train: "R² (Training)",
  r2_test: "R² (Testing)",
  mae: "MAE (Mean Absolute Error)",
  rmse: "RMSE (Root Mean Squared Error)",
  est_title: "Estimation table — comparison of actual and estimated readings",
  meter_real: "Meter (actual)",
  estimated: "Estimated",
  error_col: "Error",
  prediction_title: "Manual Prediction",
  prediction_desc: "Enter HC and HWC values to calculate estimated gas meter reading.",
  estimated_reading: "Estimated gas meter reading",
  loaded_rows: (n: number) => `Loaded ${n} rows from CSV file`,
  loaded_sample: "Sample data loaded",
  row_added: "New row added",
  row_updated: "Row updated",
  model_trained: "Model trained successfully!",
  fill_required: "Fill all required fields (date, HC, HWC, meter)",
  min_rows: "Need at least 4 valid rows (valid=1) to train model",
  train_error: (msg: string) => `Training error: ${msg}`,
  parse_error: "CSV file parsing error",
  read_error: "Cannot read file",
  drop_csv: "Please drag a .csv file",
  toggle_valid: "Toggle valid",
  edit: "Edit",
  delete: "Delete",
  save: "Save",
  copy: "Copy",
  copied: "Copied!",
  last_file: "Last file",
  last_file_load: "Load last data",
  no_last_file: "No saved data from previous session",
  page: "Page",
  of: "of",
  help: "Help",
  about: "About",
  help_title: "Help / Instructions",
  about_title: "About / Info",
  close: "Close",
  help_content: {
    title: "How to use the application",
    sections: [
      {
        heading: "1. Loading data",
        text: "Drag a CSV file onto the application area or click \"Import CSV\". You can also load sample data by clicking \"Sample Data\"."
      },
      {
        heading: "2. Required CSV format",
        text: "The file must contain columns: FIELD_VALID (0/1), FIELD_DATETIME (date/time), FIELD_HC (heat counter), FIELD_HWC (hot water counter), FIELD_METER (gas meter reading), FIELD_COMMENT (optional comment)."
      },
      {
        heading: "3. Editing data",
        text: "Click the pencil icon ✏️ to edit a row. Use the Valid toggle to enable/disable a row (rows with Valid=0 are not used in the model). Click the trash icon 🗑️ to delete a row."
      },
      {
        heading: "4. Training the model",
        text: "Set test_size (default 0.25) and random_state (default 42) parameters, then click \"Train Model\". The linear regression model will be trained on data with Valid=1."
      },
      {
        heading: "5. Results",
        text: "The \"Model Results\" tab shows regression coefficients (Intercept, HC, HWC), R² (Training/Testing), MAE and RMSE. Use \"Copy\" buttons to copy coefficient values."
      },
      {
        heading: "6. Estimation table",
        text: "Comparison of actual and estimated readings. Errors color-coded: 🟢 < 1, 🟡 < 5, 🔴 ≥ 5."
      },
      {
        heading: "7. Prediction",
        text: "Enter HC and HWC values to calculate the estimated gas meter reading based on the trained model."
      },
      {
        heading: "8. Remembering settings",
        text: "The application automatically remembers: selected language (PL/EN), theme (light/dark) and last loaded data. On next launch you can load last data with one click."
      },
    ],
  },
};

/* ────────── Types ────────── */
interface DataRow {
  id: number;
  FIELD_VALID: number;
  FIELD_DATETIME: string;
  FIELD_HC: number;
  FIELD_HWC: number;
  FIELD_METER: number;
  FIELD_COMMENT: string;
}

type TabKey = "data" | "results" | "estimation" | "predict";
type Lang = "pl" | "en";
type Theme = "dark" | "light";

/* ────────── Sample data ────────── */
const SAMPLE_DATA: DataRow[] = [
  { id: 1, FIELD_VALID: 1, FIELD_DATETIME: "2024-01-15 08:00", FIELD_HC: 100, FIELD_HWC: 50, FIELD_METER: 1523.4, FIELD_COMMENT: "Odczyt styczeń" },
  { id: 2, FIELD_VALID: 1, FIELD_DATETIME: "2024-02-15 08:00", FIELD_HC: 250, FIELD_HWC: 110, FIELD_METER: 1589.7, FIELD_COMMENT: "Odczyt luty" },
  { id: 3, FIELD_VALID: 1, FIELD_DATETIME: "2024-03-15 08:00", FIELD_HC: 410, FIELD_HWC: 175, FIELD_METER: 1661.2, FIELD_COMMENT: "Odczyt marzec" },
  { id: 4, FIELD_VALID: 0, FIELD_DATETIME: "2024-04-15 08:00", FIELD_HC: 500, FIELD_HWC: 200, FIELD_METER: 9999.0, FIELD_COMMENT: "Błędny odczyt" },
  { id: 5, FIELD_VALID: 1, FIELD_DATETIME: "2024-04-20 08:00", FIELD_HC: 520, FIELD_HWC: 220, FIELD_METER: 1710.5, FIELD_COMMENT: "Poprawiony odczyt" },
  { id: 6, FIELD_VALID: 1, FIELD_DATETIME: "2024-05-15 08:00", FIELD_HC: 620, FIELD_HWC: 270, FIELD_METER: 1755.3, FIELD_COMMENT: "Odczyt maj" },
  { id: 7, FIELD_VALID: 1, FIELD_DATETIME: "2024-06-15 08:00", FIELD_HC: 680, FIELD_HWC: 310, FIELD_METER: 1790.1, FIELD_COMMENT: "Odczyt czerwiec" },
  { id: 8, FIELD_VALID: 1, FIELD_DATETIME: "2024-07-15 08:00", FIELD_HC: 710, FIELD_HWC: 355, FIELD_METER: 1815.6, FIELD_COMMENT: "Odczyt lipiec" },
  { id: 9, FIELD_VALID: 1, FIELD_DATETIME: "2024-08-15 08:00", FIELD_HC: 730, FIELD_HWC: 400, FIELD_METER: 1840.2, FIELD_COMMENT: "Odczyt sierpień" },
  { id: 10, FIELD_VALID: 1, FIELD_DATETIME: "2024-09-15 08:00", FIELD_HC: 800, FIELD_HWC: 440, FIELD_METER: 1878.9, FIELD_COMMENT: "Odczyt wrzesień" },
  { id: 11, FIELD_VALID: 1, FIELD_DATETIME: "2024-10-15 08:00", FIELD_HC: 920, FIELD_HWC: 490, FIELD_METER: 1935.4, FIELD_COMMENT: "Odczyt październik" },
  { id: 12, FIELD_VALID: 1, FIELD_DATETIME: "2024-11-15 08:00", FIELD_HC: 1080, FIELD_HWC: 540, FIELD_METER: 2010.7, FIELD_COMMENT: "Odczyt listopad" },
  { id: 13, FIELD_VALID: 1, FIELD_DATETIME: "2024-12-15 08:00", FIELD_HC: 1250, FIELD_HWC: 600, FIELD_METER: 2095.3, FIELD_COMMENT: "Odczyt grudzień" },
  { id: 14, FIELD_VALID: 1, FIELD_DATETIME: "2025-01-15 08:00", FIELD_HC: 1450, FIELD_HWC: 660, FIELD_METER: 2192.1, FIELD_COMMENT: "Odczyt styczeń 2025" },
  { id: 15, FIELD_VALID: 1, FIELD_DATETIME: "2025-02-15 08:00", FIELD_HC: 1620, FIELD_HWC: 720, FIELD_METER: 2275.8, FIELD_COMMENT: "Odczyt luty 2025" },
  { id: 16, FIELD_VALID: 1, FIELD_DATETIME: "2025-03-15 08:00", FIELD_HC: 1760, FIELD_HWC: 780, FIELD_METER: 2348.0, FIELD_COMMENT: "Odczyt marzec 2025" },
];

let nextId = 100;

/* ────────── LocalStorage keys ────────── */
const LS_LANG = "gme_lang";
const LS_THEME = "gme_theme";
const LS_LAST_DATA = "gme_last_data";
const LS_LAST_FILENAME = "gme_last_filename";
const LS_LAST_DATE = "gme_last_date";

/* ────────── Theme classes helper ────────── */
function cx(theme: Theme) {
  const dark = theme === "dark";
  return {
    bg: dark ? "bg-gray-950" : "bg-gray-50",
    text: dark ? "text-gray-100" : "text-gray-900",
    header: dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200 shadow-sm",
    headerText: dark ? "text-white" : "text-gray-900",
    headerSub: dark ? "text-gray-400" : "text-gray-500",
    navBg: dark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200",
    tabActive: dark ? "border-amber-500 text-amber-400" : "border-amber-600 text-amber-700",
    tabInactive: dark ? "text-gray-400 hover:text-gray-200 hover:border-gray-600" : "text-gray-500 hover:text-gray-700 hover:border-gray-300",
    tabDisabled: dark ? "text-gray-600" : "text-gray-300",
    card: dark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200 shadow-sm",
    cardAlt: dark ? "bg-gray-800/60 border-gray-700" : "bg-gray-50 border-gray-200",
    cardDark: dark ? "bg-gray-800/40 border-gray-700" : "bg-gray-100 border-gray-200",
    badge: dark ? "bg-gray-800" : "bg-gray-100 text-gray-700",
    badgeGreen: dark ? "bg-emerald-900/60 text-emerald-300" : "bg-emerald-100 text-emerald-700",
    badgeRed: dark ? "bg-red-900/60 text-red-300" : "bg-red-100 text-red-700",
    btn: dark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700",
    btnPrimary: "bg-amber-600 hover:bg-amber-500 text-white",
    btnGreen: "bg-emerald-700 hover:bg-emerald-600 text-white",
    input: dark ? "bg-gray-900 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-900",
    inputFocus: dark ? "focus:border-amber-500" : "focus:border-amber-600",
    table: dark ? "bg-gray-800/80 text-gray-400" : "bg-gray-50 text-gray-500",
    tableRow: dark ? "hover:bg-gray-800/30" : "hover:bg-gray-50",
    tableRowInvalid: dark ? "bg-red-950/20 text-gray-500" : "bg-red-50 text-gray-400",
    tableDivide: dark ? "divide-gray-800/50" : "divide-gray-100",
    textMuted: dark ? "text-gray-500" : "text-gray-400",
    textLight: dark ? "text-gray-300" : "text-gray-600",
    textAmber: dark ? "text-amber-300" : "text-amber-600",
    textAmber2: dark ? "text-amber-400" : "text-amber-700",
    textBlue: dark ? "text-blue-300" : "text-blue-600",
    textBlue2: dark ? "text-blue-400" : "text-blue-700",
    textPurple: dark ? "text-purple-400" : "text-purple-600",
    textEmerald: dark ? "text-emerald-400" : "text-emerald-600",
    textOrange: dark ? "text-orange-400" : "text-orange-600",
    textRose: dark ? "text-rose-400" : "text-rose-600",
    mono: dark ? "bg-gray-900" : "bg-gray-100",
    bar: dark ? "bg-gray-800" : "bg-gray-200",
    predBg: dark ? "bg-amber-900/20 border-amber-700/50" : "bg-amber-50 border-amber-200",
    predLabel: dark ? "text-amber-400/70" : "text-amber-600",
    dropzone: dark ? "border-gray-700 hover:border-amber-600/50" : "border-gray-300 hover:border-amber-500/50",
    dropzoneIcon: dark ? "text-gray-600" : "text-gray-300",
    errBg: dark ? "bg-red-900/90 border-red-700 text-red-100" : "bg-red-50 border-red-200 text-red-800",
    okBg: dark ? "bg-emerald-900/90 border-emerald-700 text-emerald-100" : "bg-emerald-50 border-emerald-200 text-emerald-800",
    paramBg: dark ? "bg-gray-800/50 border-gray-700" : "bg-gray-100 border-gray-200",
    modalBg: dark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200",
    modalOverlay: "bg-black/60",
    divider: dark ? "border-gray-700" : "border-gray-200",
    link: dark ? "text-amber-400 hover:text-amber-300" : "text-amber-600 hover:text-amber-500",
  };
}

/* ────────── App ────────── */
export default function App() {
  const [data, setData] = useState<DataRow[]>([]);
  const [tab, setTab] = useState<TabKey>("data");
  const [model, setModel] = useState<ModelResult | null>(null);
  const [testSize, setTestSize] = useState(0.25);
  const [randomState, setRandomState] = useState(42);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<DataRow>>({});
  const [predHC, setPredHC] = useState("");
  const [predHWC, setPredHWC] = useState("");
  const [sortField, setSortField] = useState<keyof DataRow>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // Load saved preferences from localStorage
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem(LS_LANG);
    return (saved === "en" || saved === "pl") ? saved : "pl";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(LS_THEME);
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  // Check if last data exists
  const [hasLastData, setHasLastData] = useState(() => !!localStorage.getItem(LS_LAST_DATA));
  const [lastFileName, setLastFileName] = useState(() => localStorage.getItem(LS_LAST_FILENAME) || "");
  const [lastDate, setLastDate] = useState(() => localStorage.getItem(LS_LAST_DATE) || "");

  const t = lang === "pl" ? LANG_PL : LANG_EN;
  const c = cx(theme);

  const [newRow, setNewRow] = useState({ datetime: "", hc: "", hwc: "", meter: "", comment: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  // Save preferences to localStorage
  useEffect(() => { localStorage.setItem(LS_LANG, lang); }, [lang]);
  useEffect(() => { localStorage.setItem(LS_THEME, theme); }, [theme]);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    if (data.length > 0) {
      try {
        localStorage.setItem(LS_LAST_DATA, JSON.stringify(data));
        setHasLastData(true);
      } catch { /* localStorage full */ }
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      // Próba zapisu przez Electron (jeśli dostępny)
      const saveToElectron = async () => {
        if (window.electronAPI) {
          try {
            const result = await window.electronAPI.saveData({
              data: data,
              settings: {
                lang,
                theme,
                testSize,
                randomState
              }
            });
            if (!result.success) {
              console.warn('Nie można zapisać przez Electron:', result.error);
            }
          } catch (e) {
            console.warn('Błąd zapisu przez Electron:', e);
          }
        }
      };
      
      saveToElectron();
      
      // Zapasowy zapis do localStorage
      try {
        localStorage.setItem(LS_LAST_DATA, JSON.stringify(data));
        setHasLastData(true);
      } catch { 
        console.warn("Cannot save data to localStorage");
      }
    }
  }, [data, lang, theme, testSize, randomState]);

  // 🔥 Popraw też loadLastData
  const loadLastData = async () => {
    // Próba wczytania przez Electron
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.loadData();
        if (result.success && result.data) {
          setData(result.data.data);
          if (result.data.settings) {
            setLang(result.data.settings.lang);
            setTheme(result.data.settings.theme);
            setTestSize(result.data.settings.testSize ?? 0.25);
            setRandomState(result.data.settings.randomState ?? 42);
          }
          setModel(null);
          flash(t.loaded_rows(result.data.data.length), "success");
          return;
        }
      } catch (e) {
        console.warn('Błąd wczytywania przez Electron:', e);
      }
    }
    
    // Fallback do localStorage
    const saved = localStorage.getItem(LS_LAST_DATA);
    if (saved) {
      try {
        const rows = JSON.parse(saved) as DataRow[];
        nextId = Math.max(...rows.map(r => r.id)) + 1;
        setData(rows);
        setModel(null);
        flash(t.loaded_rows(rows.length), "success");
      } catch {
        flash(t.no_last_file, "error");
      }
    } else {
      flash(t.no_last_file, "error");
    }
  };
  /* ── Helpers ── */
  const flash = (msg: string, type: "error" | "success") => {
    if (type === "error") { setError(msg); setTimeout(() => setError(null), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
  };

  const copyToClipboard = (value: string, fieldName: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  /* ── CSV Import ── */
const handleFile = useCallback((file: File) => {
  localStorage.setItem(LS_LAST_FILENAME, file.name);
  const now = new Date().toLocaleString();
  localStorage.setItem(LS_LAST_DATE, now);
  setLastFileName(file.name);
  setLastDate(now);

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      try {
        // Walidacja nagłówków
        const headers = results.meta.fields || [];
        const requiredHeaders = ['FIELD_VALID', 'FIELD_DATETIME', 'FIELD_HC', 'FIELD_HWC', 'FIELD_METER'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          flash(`Brakuje kolumn: ${missingHeaders.join(', ')}`, "error");
          return;
        }

        const rows: DataRow[] = (results.data as Record<string, string>[]).map((r, i) => ({
          id: i + 1,
          FIELD_VALID: parseInt(r.FIELD_VALID) || 0,
          FIELD_DATETIME: r.FIELD_DATETIME || "",
          FIELD_HC: parseFloat(r.FIELD_HC) || 0,
          FIELD_HWC: parseFloat(r.FIELD_HWC) || 0,
          FIELD_METER: parseFloat(r.FIELD_METER) || 0,
          FIELD_COMMENT: r.FIELD_COMMENT || "",
        }));
        nextId = rows.length + 1;
        setData(rows);
        setModel(null);
        flash(t.loaded_rows(rows.length), "success");
      } catch {
        flash(t.parse_error, "error");
      }
    },
    error: () => flash(t.read_error, "error"),
  });
}, [t]);

  /* ── CSV & JSON Export ── */
  const exportCSV = () => {
    const csv = Papa.unparse(data.map(({ id: _id, ...rest }) => rest), { header: true });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "meter_readings.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  const exportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = "meter_readings.json"; 
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Data operations ── */
  const toggleValid = (id: number) => { setData((d) => d.map((r) => r.id === id ? { ...r, FIELD_VALID: r.FIELD_VALID === 1 ? 0 : 1 } : r)); setModel(null); };
  const deleteRow = (id: number) => {
  if (window.confirm(lang === 'pl' ? 'Czy na pewno usunąć ten wiersz?' : 'Are you sure you want to delete this row?')) {
    setData((d) => d.filter((r) => r.id !== id));
    setModel(null);
  }
};
  const addRow = () => {
    if (!newRow.datetime || !newRow.hc || !newRow.hwc || !newRow.meter) { flash(t.fill_required, "error"); return; }
    const row: DataRow = { id: nextId++, FIELD_VALID: 1, FIELD_DATETIME: newRow.datetime, FIELD_HC: parseFloat(newRow.hc), FIELD_HWC: parseFloat(newRow.hwc), FIELD_METER: parseFloat(newRow.meter), FIELD_COMMENT: newRow.comment };
    setData((d) => [...d, row]);
    setNewRow({ datetime: "", hc: "", hwc: "", meter: "", comment: "" });
    setShowAddForm(false); setModel(null);
    flash(t.row_added, "success");
  };

// W tabeli użyj paginatedData zamiast sortedData
// Dodaj kontrolki paginacji na dole
  const startEdit = (row: DataRow) => { setEditingRow(row.id); setEditValues({ ...row }); };
  const saveEdit = () => {
  if (editingRow === null) return;
  
  // Walidacja
  if (!editValues.FIELD_DATETIME || 
      editValues.FIELD_HC === undefined || 
      editValues.FIELD_HWC === undefined || 
      editValues.FIELD_METER === undefined) {
    flash(t.fill_required, "error");
    return;
  }

  setData((d) => d.map((r) => 
    r.id === editingRow ? { 
      ...r, 
      FIELD_DATETIME: editValues.FIELD_DATETIME ?? r.FIELD_DATETIME,
      FIELD_HC: editValues.FIELD_HC ?? r.FIELD_HC,
      FIELD_HWC: editValues.FIELD_HWC ?? r.FIELD_HWC,
      FIELD_METER: editValues.FIELD_METER ?? r.FIELD_METER,
      FIELD_COMMENT: editValues.FIELD_COMMENT ?? r.FIELD_COMMENT 
    } : r
  ));
  setEditingRow(null); 
  setEditValues({}); 
  setModel(null);
  flash(t.row_updated, "success");
};
  const cancelEdit = () => { setEditingRow(null); setEditValues({}); };

  /* ── Sorting ── */
  const handleSort = (field: keyof DataRow) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" 
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [data, sortField, sortDir]);

  // paginowane dane
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  // Resetuj stronę gdy zmieniają się dane
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  // const sortedData = [...data].sort((a, b) => {
  //   const av = a[sortField]; const bv = b[sortField];
  //   if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
  //   return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  // });

  /* ── Train model ── */
  const trainModel = () => {
    const validData = data.filter((r) => r.FIELD_VALID === 1);
    if (validData.length < 4) { flash(t.min_rows, "error"); return; }
    try {
      const X = validData.map((r) => [r.FIELD_HC, r.FIELD_HWC]);
      const y = validData.map((r) => r.FIELD_METER);
      const result = fitLinearRegression(X, y, testSize, randomState);
      //const allPredictions = data.map((r, i) => ({ index: i, predicted: result.intercept + r.FIELD_HC * result.coefficients[0] + r.FIELD_HWC * result.coefficients[1] }));
      //result.allPredictions = allPredictions;
      setModel(result); setTab("results");
      flash(t.model_trained, "success");
    } catch (e) {
      flash(t.train_error(e instanceof Error ? e.message : "Unknown"), "error");
    }
  };

  const predictValue = model && predHC && predHWC ? model.intercept + parseFloat(predHC) * model.coefficients[0] + parseFloat(predHWC) * model.coefficients[1] : null;

  /* ── Drag & Drop ── */
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files[0]; if (file && file.name.endsWith(".csv")) handleFile(file); else flash(t.drop_csv, "error"); };

  const validCount = data.filter((r) => r.FIELD_VALID === 1).length;
  const invalidCount = data.length - validCount;

  const SortIcon = ({ field }: { field: keyof DataRow }) => sortField === field ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />) : null;

  /* ── CopyButton component ── */
  const CopyButton = ({ value, fieldName, colorClass }: { value: string; fieldName: string; colorClass: string }) => (
    <button
      onClick={() => copyToClipboard(value, fieldName)}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
        copiedField === fieldName
          ? "bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30"
          : `${c.btn} ${colorClass}`
      }`}
      title={t.copy}
    >
      {copiedField === fieldName ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copiedField === fieldName ? t.copied : t.copy}
    </button>
  );

  return (
    <div className={`min-h-screen ${c.bg} ${c.text} transition-colors duration-200`}>
      {/* ── Notifications ── */}
      {error && (
        <div className={`fixed top-4 right-4 z-[100] ${c.errBg} border px-4 py-3 rounded-lg flex items-center gap-2 shadow-xl max-w-md animate-slide-in`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" /><span className="text-sm">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className={`fixed top-4 right-4 z-[100] ${c.okBg} border px-4 py-3 rounded-lg flex items-center gap-2 shadow-xl max-w-md animate-slide-in`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" /><span className="text-sm">{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Help Modal ── */}
      {showHelp && (
        <div className={`fixed inset-0 z-50 ${c.modalOverlay} flex items-center justify-center p-4`} onClick={() => setShowHelp(false)}>
          <div className={`${c.modalBg} border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${c.divider}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold">{t.help_title}</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className={`${c.btn} p-2 rounded-lg transition-colors`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[65vh] px-6 py-4 space-y-5">
              <h3 className={`text-base font-semibold ${c.textAmber2}`}>{t.help_content.title}</h3>
              {t.help_content.sections.map((section, i) => (
                <div key={i}>
                  <h4 className={`text-sm font-semibold mb-1 ${c.textLight}`}>{section.heading}</h4>
                  <p className={`text-sm ${c.textMuted} leading-relaxed`}>{section.text}</p>
                </div>
              ))}
            </div>
            <div className={`px-6 py-3 border-t ${c.divider} flex justify-end`}>
              <button onClick={() => setShowHelp(false)} className={`${c.btnPrimary} px-5 py-2 rounded-lg text-sm font-medium`}>{t.close}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── About Modal ── */}
      {showAbout && (
        <div className={`fixed inset-0 z-50 ${c.modalOverlay} flex items-center justify-center p-4`} onClick={() => setShowAbout(false)}>
          <div className={`${c.modalBg} border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${c.divider}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold">{t.about_title}</h2>
              </div>
              <button onClick={() => setShowAbout(false)} className={`${c.btn} p-2 rounded-lg transition-colors`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* App icon and name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 48 48" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M24 4C18 4 14 8 14 14V18H12C10.9 18 10 18.9 10 20V42C10 43.1 10.9 44 12 44H36C37.1 44 38 43.1 38 42V20C38 18.9 37.1 18 36 18H34V14C34 8 30 4 24 4Z" strokeLinejoin="round"/>
                    <path d="M18 18V14C18 10.7 20.7 8 24 8C27.3 8 30 10.7 30 14V18" strokeLinejoin="round"/>
                    <circle cx="24" cy="30" r="4"/>
                    <line x1="24" y1="34" x2="24" y2="38"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Gas Meter Estimation</h3>
                  <div className={`text-sm ${c.textMuted}`}>v1.0.1</div>
                </div>
              </div>

              <div className={`border-t ${c.divider}`} />

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className={`w-4 h-4 mt-0.5 ${c.textMuted} flex-shrink-0`} />
                  <div>
                    <span className={c.textMuted}>Build: </span>
                    <span className="font-medium">2026-03-05</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Github className={`w-4 h-4 mt-0.5 ${c.textMuted} flex-shrink-0`} />
                  <div>
                    <span className={c.textMuted}>{lang === "pl" ? "Autorzy / Źródła:" : "Authors / Sources:"}</span>
                    <div className="mt-1 space-y-1">
                      <div>
                        <a href="https://github.com/marcin77/gas-meter-estimation" target="_blank" rel="noopener noreferrer" className={`${c.link} underline inline-flex items-center gap-1`}>
                          marcin77 <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className={c.textMuted}> — {lang === "pl" ? "GUI / skrypt Python" : "GUI /Python script"}</span>
                      </div>                      
                      <div>
                        <a href="https://github.com/andr2000/ufh-controller/blob/872a2783040d9da02c5a526eea54a5c14f791468/gas_meter/meter_readings.py" target="_blank" rel="noopener noreferrer" className={`${c.link} underline inline-flex items-center gap-1`}>
                          andr2000 <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className={c.textMuted}> — {lang === "pl" ? "skrypt Python" : "Python script"}</span>
                      </div>
                      <div>
                        <a href="https://techniczny.wordpress.com/2018/04/08/pomiar-zuzycia-gazu-przez-raspberry-pi-i-ebus/" target="_blank" rel="noopener noreferrer" className={`${c.link} underline inline-flex items-center gap-1`}>
                          techniczny <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className={c.textMuted}> — {lang === "pl" ? "pomiar zużycia gazu" : "gas consumption measurement"}</span>
                      </div>
                      <div>
                        <a href="https://medium.com/ds-notes/multiple-linear-regression-with-scikit-learn-a-quickstart-guide-41a310bd8414" target="_blank" rel="noopener noreferrer" className={`${c.link} underline inline-flex items-center gap-1`}>
                          Bee Guan Teo <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className={c.textMuted}> — MLR guide</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`border-t ${c.divider}`} />

                <div className="flex items-start gap-3">
                  <FileSpreadsheet className={`w-4 h-4 mt-0.5 ${c.textMuted} flex-shrink-0`} />
                  <div>
                    <span className={c.textMuted}>{lang === "pl" ? "Licencja:" : "License:"} </span>
                    <span className="font-medium">MIT</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BarChart3 className={`w-4 h-4 mt-0.5 ${c.textMuted} flex-shrink-0`} />
                  <div>
                    <span className={c.textMuted}>{lang === "pl" ? "Biblioteki:" : "Libraries:"} </span>
                    <span className="font-medium">React, Vite, Tailwind CSS, PapaParse, Lucide Icons</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className={`w-4 h-4 mt-0.5 ${c.textMuted} flex-shrink-0`} />
                  <div>
                    <span className={c.textMuted}>{lang === "pl" ? "Wsparcie / Zgłaszanie błędów:" : "Support / Bug reports:"} </span>
                    <a href="https://github.com/marcin77/gas-meter-estimation/issues" className={`${c.link} underline`}>GitHub</a>
                  </div>
                </div>
              </div>
            </div>
            <div className={`px-6 py-3 border-t ${c.divider} flex justify-end`}>
              <button onClick={() => setShowAbout(false)} className={`${c.btnPrimary} px-5 py-2 rounded-lg text-sm font-medium`}>{t.close}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className={`${c.header} border-b px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* App Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <svg viewBox="0 0 48 48" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M24 4C18 4 14 8 14 14V18H12C10.9 18 10 18.9 10 20V42C10 43.1 10.9 44 12 44H36C37.1 44 38 43.1 38 42V20C38 18.9 37.1 18 36 18H34V14C34 8 30 4 24 4Z" strokeLinejoin="round"/>
                <path d="M18 18V14C18 10.7 20.7 8 24 8C27.3 8 30 10.7 30 14V18" strokeLinejoin="round"/>
                <circle cx="24" cy="30" r="3"/>
                <line x1="24" y1="33" x2="24" y2="37"/>
              </svg>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${c.headerText}`}>{t.app_title}</h1>
              <p className={`text-xs ${c.headerSub}`}>{t.app_subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.length > 0 && (
              <div className="flex items-center gap-2 text-sm mr-2">
                <span className={`${c.badge} px-3 py-1 rounded-full`}>{t.rows}: <strong>{data.length}</strong></span>
                <span className={`${c.badgeGreen} px-3 py-1 rounded-full`}>{t.valid}: <strong>{validCount}</strong></span>
                {invalidCount > 0 && <span className={`${c.badgeRed} px-3 py-1 rounded-full`}>{t.invalid}: <strong>{invalidCount}</strong></span>}
              </div>
            )}
            {/* Help */}
            <button onClick={() => setShowHelp(true)} className={`${c.btn} p-2 rounded-lg transition-colors`} title={t.help}>
              <HelpCircle className="w-4 h-4" />
            </button>
            {/* About */}
            <button onClick={() => setShowAbout(true)} className={`${c.btn} p-2 rounded-lg transition-colors`} title={t.about}>
              <Info className="w-4 h-4" />
            </button>
            {/* Divider */}
            <div className={`w-px h-6 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
            {/* Theme toggle */}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className={`${c.btn} p-2 rounded-lg transition-colors`} title={theme === "dark" ? "Light mode" : "Dark mode"}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Language toggle */}
            <button onClick={() => setLang(lang === "pl" ? "en" : "pl")} className={`${c.btn} px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors`}>
              <Globe className="w-4 h-4" />
              {lang === "pl" ? "🇵🇱 PL" : "🇬🇧 EN"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <nav className={`${c.navBg} border-b`}>
        <div className="max-w-7xl mx-auto flex">
          {([
            { key: "data" as TabKey, label: t.tab_data, icon: FileSpreadsheet },
            { key: "results" as TabKey, label: t.tab_results, icon: BarChart3, disabled: !model },
            { key: "estimation" as TabKey, label: t.tab_estimation, icon: Table, disabled: !model },
            { key: "predict" as TabKey, label: t.tab_prediction, icon: Calculator, disabled: !model },
          ]).map(({ key, label, icon: Icon, disabled }) => (
            <button key={key} onClick={() => !disabled && setTab(key)} disabled={disabled}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? c.tabActive : disabled ? `border-transparent ${c.tabDisabled} cursor-not-allowed` : `border-transparent ${c.tabInactive}`}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* ══════ TAB: DATA ══════ */}
        {tab === "data" && (
          <div className="space-y-6">
            {data.length === 0 ? (
              <div onDragOver={handleDragOver} onDrop={handleDrop} className={`border-2 border-dashed ${c.dropzone} rounded-2xl p-16 text-center transition-colors`}>
                <Upload className={`w-16 h-16 ${c.dropzoneIcon} mx-auto mb-4`} />
                <h2 className={`text-xl font-semibold ${c.textLight} mb-2`}>{t.drag_title}</h2>
                <p className={`text-sm ${c.textMuted} mb-6`}>{t.drag_desc}</p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <button onClick={() => fileInputRef.current?.click()} className={`${c.btnPrimary} px-6 py-2.5 rounded-lg font-medium transition-colors`}>
                    <Upload className="w-4 h-4 inline mr-2" />{t.select_file}
                  </button>
                  <button onClick={() => { setData(SAMPLE_DATA); nextId = 100; flash(t.loaded_sample, "success"); }} className={`${c.btn} px-6 py-2.5 rounded-lg font-medium transition-colors`}>
                    <FileSpreadsheet className="w-4 h-4 inline mr-2" />{t.sample_data}
                  </button>
                  {hasLastData && (
                    <button onClick={loadLastData} className="bg-blue-700 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t.last_file_load}
                      {lastFileName && <span className="text-xs opacity-70">({lastFileName}{lastDate ? ` — ${lastDate}` : ""})</span>}
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className={`${c.btn} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors`}>
                    <Upload className="w-4 h-4" /> {t.import_csv}
                  </button>
                  <button onClick={exportCSV} className={`${c.btn} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors`}>
                    <Download className="w-4 h-4" /> {t.export_csv}
                  </button>
                  <button onClick={exportJSON} className={`${c.btn} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors`}>
                    <FileSpreadsheet className="w-4 h-4" /> {t.export_json}
                  </button>
                  <button 
                      onClick={() => {
                        if (!showAddForm) {
                          const now = new Date();
                          const pad = (n: number) => n.toString().padStart(2, '0');
                          const datetime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                          setNewRow({
                            datetime,
                            hc: "",
                            hwc: "",
                            meter: "",
                            comment: ""
                          });
                        }
                        setShowAddForm(!showAddForm);
                      }}
                      className={`${c.btnGreen} px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors`}
                    >
                      <Plus className="w-4 h-4" /> {t.add_row}
                    </button>
                  <div className="flex-1" />
                  <div className={`flex items-center gap-4 ${c.paramBg} border px-4 py-2 rounded-lg`}>
                    <label className={`text-xs ${c.textMuted} flex items-center gap-2`}>
                      test_size:
                      <input type="number" value={testSize} onChange={(e) => setTestSize(parseFloat(e.target.value) || 0.25)} step={0.05} min={0.1} max={0.9} className={`w-16 ${c.input} border rounded px-2 py-1 text-xs`} />
                    </label>
                    <label className={`text-xs ${c.textMuted} flex items-center gap-2`}>
                      random_state:
                      <input type="number" value={randomState} onChange={(e) => setRandomState(parseInt(e.target.value) || 42)} className={`w-16 ${c.input} border rounded px-2 py-1 text-xs`} />
                    </label>
                  </div>
                  <button onClick={trainModel} className={`${c.btnPrimary} px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors`}>
                    <Play className="w-4 h-4" /> {t.train_model}
                  </button>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>

                {/* Add row form */}
                {showAddForm && (
                  <div className={`${c.cardAlt} border rounded-xl p-4 space-y-3`}>
                    <h3 className={`text-sm font-semibold ${c.textLight} flex items-center gap-2`}><Plus className="w-4 h-4" /> {t.new_row}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div><label className={`text-xs ${c.textMuted} block mb-1`}>{t.datetime} *</label><input type="text" placeholder="2025-01-15 08:00" value={newRow.datetime} onChange={(e) => setNewRow({ ...newRow, datetime: e.target.value })} className={`w-full ${c.input} border rounded px-3 py-2 text-sm`} /></div>
                      <div><label className={`text-xs ${c.textMuted} block mb-1`}>HC *</label><input type="number" placeholder="0" value={newRow.hc} onChange={(e) => setNewRow({ ...newRow, hc: e.target.value })} className={`w-full ${c.input} border rounded px-3 py-2 text-sm`} /></div>
                      <div><label className={`text-xs ${c.textMuted} block mb-1`}>HWC *</label><input type="number" placeholder="0" value={newRow.hwc} onChange={(e) => setNewRow({ ...newRow, hwc: e.target.value })} className={`w-full ${c.input} border rounded px-3 py-2 text-sm`} /></div>
                      <div><label className={`text-xs ${c.textMuted} block mb-1`}>{t.meter} *</label><input type="number" placeholder="0" step="0.001" value={newRow.meter} onChange={(e) => setNewRow({ ...newRow, meter: e.target.value })} className={`w-full ${c.input} border rounded px-3 py-2 text-sm`} /></div>
                      <div><label className={`text-xs ${c.textMuted} block mb-1`}>{t.comment}</label><input type="text" placeholder={t.optional} value={newRow.comment} onChange={(e) => setNewRow({ ...newRow, comment: e.target.value })} className={`w-full ${c.input} border rounded px-3 py-2 text-sm`} /></div>
                    </div>``
                    <div className="flex gap-2">
                      <button onClick={addRow} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t.add}</button>
                      <button onClick={() => setShowAddForm(false)} className={`${c.btn} px-4 py-2 rounded-lg text-sm`}>{t.cancel}</button>
                    </div>
                  </div>
                )}

                {/* Data table */}
                <div className={`${c.card} border rounded-xl overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`${c.table} text-xs uppercase tracking-wider`}>
                          <th className="px-3 py-3 text-left cursor-pointer hover:text-gray-200" onClick={() => handleSort("FIELD_VALID")}>{t.valid} <SortIcon field="FIELD_VALID" /></th>
                          <th className="px-3 py-3 text-left cursor-pointer hover:text-gray-200" onClick={() => handleSort("FIELD_DATETIME")}>{t.datetime} <SortIcon field="FIELD_DATETIME" /></th>
                          <th className="px-3 py-3 text-right cursor-pointer hover:text-gray-200" onClick={() => handleSort("FIELD_HC")}>HC <SortIcon field="FIELD_HC" /></th>
                          <th className="px-3 py-3 text-right cursor-pointer hover:text-gray-200" onClick={() => handleSort("FIELD_HWC")}>HWC <SortIcon field="FIELD_HWC" /></th>
                          <th className="px-3 py-3 text-right cursor-pointer hover:text-gray-200" onClick={() => handleSort("FIELD_METER")}>{t.meter} <SortIcon field="FIELD_METER" /></th>
                          <th className="px-3 py-3 text-left">{t.comment}</th>
                          <th className="px-3 py-3 text-center">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${c.tableDivide}`}>
                        {paginatedData.map((row) => (
                          <tr key={row.id} className={`transition-colors ${row.FIELD_VALID === 0 ? c.tableRowInvalid : c.tableRow}`}>
                            {editingRow === row.id ? (
                              <>
                                <td className="px-3 py-2"><button onClick={() => toggleValid(row.id)}>{row.FIELD_VALID ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-red-400" />}</button></td>
                                <td className="px-3 py-2"><input type="text" value={editValues.FIELD_DATETIME ?? ""} onChange={(e) => setEditValues({ ...editValues, FIELD_DATETIME: e.target.value })} className={`w-full ${c.input} border rounded px-2 py-1 text-xs`} /></td>
                                <td className="px-3 py-2"><input type="number" value={editValues.FIELD_HC ?? 0} onChange={(e) => setEditValues({ ...editValues, FIELD_HC: parseFloat(e.target.value) })} className={`w-20 ${c.input} border rounded px-2 py-1 text-xs text-right`} /></td>
                                <td className="px-3 py-2"><input type="number" value={editValues.FIELD_HWC ?? 0} onChange={(e) => setEditValues({ ...editValues, FIELD_HWC: parseFloat(e.target.value) })} className={`w-20 ${c.input} border rounded px-2 py-1 text-xs text-right`} /></td>
                                <td className="px-3 py-2"><input type="number" step="0.001" value={editValues.FIELD_METER ?? 0} onChange={(e) => setEditValues({ ...editValues, FIELD_METER: parseFloat(e.target.value) })} className={`w-24 ${c.input} border rounded px-2 py-1 text-xs text-right`} /></td>
                                <td className="px-3 py-2"><input type="text" value={editValues.FIELD_COMMENT ?? ""} onChange={(e) => setEditValues({ ...editValues, FIELD_COMMENT: e.target.value })} className={`w-full ${c.input} border rounded px-2 py-1 text-xs`} /></td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={saveEdit} className="p-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white" title={t.save}><Save className="w-3.5 h-3.5" /></button>
                                    <button onClick={cancelEdit} className={`p-1.5 rounded ${c.btn}`} title={t.cancel}><X className="w-3.5 h-3.5" /></button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-3 py-2"><button onClick={() => toggleValid(row.id)} title={t.toggle_valid}>{row.FIELD_VALID ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-red-400" />}</button></td>
                                <td className={`px-3 py-2 ${c.textLight} font-mono text-xs`}>{row.FIELD_DATETIME}</td>
                                <td className="px-3 py-2 text-right font-mono">{row.FIELD_HC}</td>
                                <td className="px-3 py-2 text-right font-mono">{row.FIELD_HWC}</td>
                                <td className={`px-3 py-2 text-right font-mono font-semibold ${c.textAmber}`}>{row.FIELD_METER}</td>
                                <td className={`px-3 py-2 ${c.textMuted} text-xs max-w-[200px] truncate`}>{row.FIELD_COMMENT}</td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => startEdit(row)} className={`p-1.5 rounded hover:bg-gray-700 ${c.textMuted} hover:text-amber-400 transition-colors`} title={t.edit}><Edit3 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => deleteRow(row.id)} className={`p-1.5 rounded hover:bg-gray-700 ${c.textMuted} hover:text-red-400 transition-colors`} title={t.delete}><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* 🔥 PAGINACJA - wklej TUTAJ */}
                  {data.length > 0 && (
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${c.divider}`}>
                      <div className={`text-xs ${c.textMuted}`}>
                        {t.rows}: <span className="font-medium">{data.length}</span> • {t.page} <span className="font-medium">{currentPage}</span> {t.of} <span className="font-medium">{totalPages}</span>
                      </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`${c.btn} px-3 py-1.5 rounded text-sm disabled:opacity-50`}
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`${c.btn} px-3 py-1.5 rounded text-sm disabled:opacity-50`}
                       >
                        →
                      </button>
                    </div>
                  </div>
                 )}
                </div>
              </>
             )}
          </div>
        )}

        {/* ══════ TAB: RESULTS ══════ */}
        {tab === "results" && model && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className={`${c.card} border rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-xs ${c.textMuted} uppercase tracking-wider`}>{t.intercept}</div>
                  <CopyButton value={model.intercept.toFixed(16)} fieldName="intercept" colorClass="hover:text-amber-400" />
                </div>
                <div className={`text-lg font-mono font-bold ${c.textAmber2}`}>{model.intercept.toFixed(10)}</div>
              </div>
              <div className={`${c.card} border rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-xs ${c.textMuted} uppercase tracking-wider`}>{t.coef_hc}</div>
                  <CopyButton value={model.coefficients[0].toExponential(16)} fieldName="hc" colorClass="hover:text-blue-400" />
                </div>
                <div className={`text-lg font-mono font-bold ${c.textBlue2}`}>{model.coefficients[0].toExponential(10)}</div>
              </div>
              <div className={`${c.card} border rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-xs ${c.textMuted} uppercase tracking-wider`}>{t.coef_hwc}</div>
                  <CopyButton value={model.coefficients[1].toExponential(16)} fieldName="hwc" colorClass="hover:text-purple-400" />
                </div>
                <div className={`text-lg font-mono font-bold ${c.textPurple}`}>{model.coefficients[1].toExponential(10)}</div>
              </div>
            </div>

            <div className={`${c.cardDark} border rounded-xl p-5`}>
              <div className={`text-xs ${c.textMuted} uppercase tracking-wider mb-2`}>{t.formula}</div>
              <div className={`font-mono text-sm ${c.mono} p-3 rounded-lg overflow-x-auto`}>
                meter = {model.intercept.toFixed(6)} + HC × {model.coefficients[0].toExponential(6)} + HWC × {model.coefficients[1].toExponential(6)}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={`${c.card} border rounded-xl p-5`}>
                <div className={`text-xs ${c.textMuted} uppercase tracking-wider mb-1`}>{t.r2_train}</div>
                <div className={`text-2xl font-bold ${c.textEmerald} mb-2`}>{(model.trainR2 * 100).toFixed(4)}%</div>
                <div className={`w-full ${c.bar} rounded-full h-2`}>
                  <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.max(0, model.trainR2 * 100)}%` }} />
                </div>
              </div>
              <div className={`${c.card} border rounded-xl p-5`}>
                <div className={`text-xs ${c.textMuted} uppercase tracking-wider mb-1`}>{t.r2_test}</div>
                <div className={`text-2xl font-bold ${c.textBlue2} mb-2`}>{(model.testR2 * 100).toFixed(4)}%</div>
                <div className={`w-full ${c.bar} rounded-full h-2`}>
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.max(0, model.testR2 * 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={`${c.card} border rounded-xl p-5`}>
                <div className={`text-xs ${c.textMuted} uppercase tracking-wider mb-1`}>{t.mae}</div>
                <div className={`text-2xl font-mono font-bold ${c.textOrange}`}>{model.mae.toFixed(6)}</div>
              </div>
              <div className={`${c.card} border rounded-xl p-5`}>
                <div className={`text-xs ${c.textMuted} uppercase tracking-wider mb-1`}>{t.rmse}</div>
                <div className={`text-2xl font-mono font-bold ${c.textRose}`}>{model.rmse.toFixed(6)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB: ESTIMATION TABLE ══════ */}
        {tab === "estimation" && model && (
          <div className="space-y-4">
            <h2 className={`text-lg font-semibold ${c.textLight}`}>{t.est_title}</h2>
            <div className={`${c.card} border rounded-xl overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${c.table} text-xs uppercase tracking-wider`}>
                      <th className="px-4 py-3 text-center">{t.valid}</th>
                      <th className="px-4 py-3 text-left">{t.datetime}</th>
                      <th className="px-4 py-3 text-right">{t.meter_real}</th>
                      <th className="px-4 py-3 text-right">{t.estimated}</th>
                      <th className="px-4 py-3 text-right">{t.error_col}</th>
                      <th className="px-4 py-3 text-left">{t.comment}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${c.tableDivide}`}>
                    {data.map((row, i) => {
                      const pred = model.allPredictions[i]?.predicted ?? 0;
                      const err = pred - row.FIELD_METER;
                      return (
                        <tr key={row.id} className={row.FIELD_VALID === 0 ? c.tableRowInvalid : c.tableRow}>
                          <td className="px-4 py-2 text-center">
                            {row.FIELD_VALID ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" /> : <span className="inline-block w-2 h-2 rounded-full bg-red-400" />}
                          </td>
                          <td className={`px-4 py-2 font-mono text-xs ${c.textLight}`}>{row.FIELD_DATETIME}</td>
                          <td className={`px-4 py-2 text-right font-mono font-semibold ${c.textAmber}`}>{row.FIELD_METER.toFixed(3)}</td>
                          <td className={`px-4 py-2 text-right font-mono ${c.textBlue}`}>{pred.toFixed(3)}</td>
                          <td className={`px-4 py-2 text-right font-mono font-semibold ${Math.abs(err) < 1 ? "text-emerald-400" : Math.abs(err) < 5 ? "text-yellow-400" : "text-red-400"}`}>
                            {err >= 0 ? "+" : ""}{err.toFixed(3)}
                          </td>
                          <td className={`px-4 py-2 ${c.textMuted} text-xs`}>{row.FIELD_COMMENT}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB: PREDICT ══════ */}
        {tab === "predict" && model && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className={`${c.card} border rounded-xl p-6 space-y-4`}>
              <h2 className={`text-lg font-semibold flex items-center gap-2`}>
                <Calculator className={`w-5 h-5 ${c.textAmber2}`} />{t.prediction_title}
              </h2>
              <p className={`text-sm ${c.textMuted}`}>{t.prediction_desc}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs ${c.textMuted} block mb-1`}>FIELD_HC</label>
                  <input type="number" value={predHC} onChange={(e) => setPredHC(e.target.value)} placeholder="np. 1500"
                    className={`w-full ${c.input} border rounded-lg px-4 py-3 ${c.inputFocus} focus:outline-none`} />
                </div>
                <div>
                  <label className={`text-xs ${c.textMuted} block mb-1`}>FIELD_HWC</label>
                  <input type="number" value={predHWC} onChange={(e) => setPredHWC(e.target.value)} placeholder="np. 700"
                    className={`w-full ${c.input} border rounded-lg px-4 py-3 ${c.inputFocus} focus:outline-none`} />
                </div>
              </div>
              {predictValue !== null && (
                <div className={`${c.predBg} border rounded-xl p-5 text-center`}>
                  <div className={`text-xs ${c.predLabel} uppercase tracking-wider mb-1`}>{t.estimated_reading}</div>
                  <div className={`text-3xl font-mono font-bold ${c.textAmber2}`}>{predictValue.toFixed(3)}</div>
                  <div className={`text-xs ${c.textMuted} mt-2 font-mono`}>
                    = {model.intercept.toFixed(4)} + {predHC} × {model.coefficients[0].toExponential(4)} + {predHWC} × {model.coefficients[1].toExponential(4)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className={`${c.header} border-t px-6 py-3 mt-8`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <span className={c.textMuted}>Gas Meter Estimation v1.0.1 • MIT License</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHelp(true)} className={`${c.textMuted} hover:${c.textLight} transition-colors flex items-center gap-1`}>
              <HelpCircle className="w-3 h-3" /> {t.help}
            </button>
            <button onClick={() => setShowAbout(true)} className={`${c.textMuted} hover:${c.textLight} transition-colors flex items-center gap-1`}>
              <Info className="w-3 h-3" /> {t.about}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
