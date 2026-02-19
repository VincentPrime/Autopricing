import { useState, useEffect } from 'react';
import { Calculator, History, Trash2, Download, TrendingUp, Moon, Sun, BookOpen, Phone, Home } from 'lucide-react';
import jsPDF from 'jspdf';

interface Calculation {
  productName: string;
  fixedCosts: number;
  variableCostPerUnit: number;
  unitsProduced: number;
  markupPercentage: number;
  fixedCostPerUnit: number;
  costPerUnit: number;
  sellingPrice: number;
  profitPerUnit: number;
  timestamp: string;
  timeUnit: 'day' | 'week' | 'month';
  includeVAT: boolean;
}

interface FormData {
  productName: string;
  fixedCosts: string;
  variableCostPerUnit: string;
  unitsProduced: string;
  markupPercentage: string;
}

type Section = 'home' | 'definitions' | 'history' | 'contacts';

function App() {
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    fixedCosts: '',
    variableCostPerUnit: '',
    unitsProduced: '',
    markupPercentage: '',
  });

  const [currentCalculation, setCurrentCalculation] = useState<Calculation | null>(null);
  const [history, setHistory] = useState<Calculation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [timeUnit, setTimeUnit] = useState<'day' | 'week' | 'month'>('day');
  const [includeVAT, setIncludeVAT] = useState(false);

  const quickMarkupOptions = [25, 30, 40, 50];

  useEffect(() => {
    loadHistory();
    loadThemePreference();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const loadThemePreference = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const loadHistory = () => {
    const savedHistory = localStorage.getItem('pricingHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setQuickMarkup = (percentage: number) => {
    setFormData(prev => ({ ...prev, markupPercentage: percentage.toString() }));
  };

  const calculatePrice = () => {
    const fixedCosts = parseFloat(formData.fixedCosts) || 0;
    const variableCostPerUnit = parseFloat(formData.variableCostPerUnit) || 0;
    const unitsProduced = parseFloat(formData.unitsProduced) || 0;
    const markupPercentage = parseFloat(formData.markupPercentage) || 0;

    const fixedCostPerUnit = unitsProduced > 0 ? fixedCosts / unitsProduced : 0;
    const costPerUnit = fixedCostPerUnit + variableCostPerUnit;
    let sellingPrice = costPerUnit + (costPerUnit * (markupPercentage / 100));
    
    // Add VAT if enabled
    if (includeVAT) {
      sellingPrice = sellingPrice * 1.12; // Add 12% VAT
    }

    const profitPerUnit = sellingPrice - costPerUnit;

    const calculation: Calculation = {
      productName: formData.productName,
      fixedCosts,
      variableCostPerUnit,
      unitsProduced,
      markupPercentage,
      fixedCostPerUnit: Math.round(fixedCostPerUnit * 100) / 100,
      costPerUnit: Math.round(costPerUnit * 100) / 100,
      sellingPrice: Math.round(sellingPrice * 100) / 100,
      profitPerUnit: Math.round(profitPerUnit * 100) / 100,
      timestamp: new Date().toISOString(),
      timeUnit,
      includeVAT,
    };

    setCurrentCalculation(calculation);
    setShowResults(true);
  };

  const generatePDF = (calc: Calculation) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102); // Navy blue
    doc.text('AutoPrice System', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Product: ' + calc.productName, 20, 40);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Date: ' + new Date(calc.timestamp).toLocaleString(), 20, 48);
    doc.text('Time Unit: Per ' + calc.timeUnit.charAt(0).toUpperCase() + calc.timeUnit.slice(1), 20, 54);
    doc.text('VAT: ' + (calc.includeVAT ? 'Included (12%)' : 'Not Included'), 20, 60);

    doc.setDrawColor(255, 215, 0); // Yellow
    doc.line(20, 64, 190, 64);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Cost Breakdown:', 20, 74);

    doc.setFontSize(11);
    let y = 84;
    const addLine = (label: string, value: number, bold = false) => {
      if (bold) doc.setFont('', 'bold');
      else doc.setFont('', 'normal');
      doc.text(label, 25, y);
      doc.text('₱' + value.toFixed(2), 160, y, { align: 'right' });
      y += 8;
    };

    addLine('Total Fixed Costs:', calc.fixedCosts);
    addLine('Units Produced:', calc.unitsProduced);
    addLine('Fixed Cost Per Unit:', calc.fixedCostPerUnit);
    addLine('Variable Cost Per Unit:', calc.variableCostPerUnit);

    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(25, y, 160, y);
    y += 8;

    addLine('Cost Per Unit:', calc.costPerUnit, true);

    y += 4;
    addLine('Markup (' + calc.markupPercentage + '%):', calc.profitPerUnit);

    if (calc.includeVAT) {
      y += 4;
      addLine('VAT (12%):', calc.sellingPrice * 0.12 / 1.12);
    }

    y += 4;
    doc.setDrawColor(255, 215, 0);
    doc.line(25, y, 160, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('SELLING PRICE:', 25, y);
    doc.text('₱' + calc.sellingPrice.toFixed(2), 160, y, { align: 'right' });

    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.text('PROFIT PER UNIT:', 25, y);
    doc.text('₱' + calc.profitPerUnit.toFixed(2), 160, y, { align: 'right' });

    const fileName = calc.productName.replace(/[^a-z0-9]/gi, '_') + '_pricing.pdf';
    doc.save(fileName);
  };

  const saveCalculation = () => {
    if (!currentCalculation) return;

    const newHistory = [currentCalculation, ...history];
    setHistory(newHistory);
    localStorage.setItem('pricingHistory', JSON.stringify(newHistory));

    generatePDF(currentCalculation);

    setFormData({
      productName: '',
      fixedCosts: '',
      variableCostPerUnit: '',
      unitsProduced: '',
      markupPercentage: '',
    });
    setShowResults(false);
    setCurrentCalculation(null);
  };

  const deleteHistoryItem = (index: number) => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem('pricingHistory', JSON.stringify(newHistory));
  };

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to delete ALL calculations?')) {
      setHistory([]);
      localStorage.removeItem('pricingHistory');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-[#001529] via-[#002140] to-[#001529]' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    } relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 -left-4 w-96 h-96 ${
          isDarkMode ? 'bg-[#003366]/30' : 'bg-[#003366]/10'
        } rounded-full mix-blend-multiply filter blur-3xl animate-pulse`}></div>
        <div className={`absolute top-0 -right-4 w-96 h-96 ${
          isDarkMode ? 'bg-[#FFD700]/20' : 'bg-[#FFD700]/10'
        } rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700`}></div>
        <div className={`absolute -bottom-8 left-20 w-96 h-96 ${
          isDarkMode ? 'bg-[#003366]/20' : 'bg-[#003366]/5'
        } rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000`}></div>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-[#003366] to-[#001f3f] text-[#FFD700] shadow-[#FFD700]/30 hover:shadow-[#FFD700]/50 border border-[#FFD700]/30' 
            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/50 hover:shadow-amber-500/70'
        }`}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? (
          <Sun className="w-6 h-6" />
        ) : (
          <Moon className="w-6 h-6" />
        )}
      </button>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        <nav className={`${
          isDarkMode 
            ? 'bg-[#002140]/80 border-[#FFD700]/20' 
            : 'bg-white/80 border-slate-200'
        } backdrop-blur-xl rounded-2xl p-2 shadow-xl border mb-8`}>
          <div className="flex justify-around items-center gap-2">
            <button
              onClick={() => setCurrentSection('home')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                currentSection === 'home'
                  ? isDarkMode
                    ? 'bg-[#003366] text-[#FFD700] shadow-lg shadow-[#FFD700]/20'
                    : 'bg-[#003366] text-white shadow-lg'
                  : isDarkMode
                    ? 'text-slate-300 hover:bg-[#003366]/30'
                    : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="font-semibold text-sm">Home</span>
            </button>
            
            <button
              onClick={() => setCurrentSection('definitions')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                currentSection === 'definitions'
                  ? isDarkMode
                    ? 'bg-[#003366] text-[#FFD700] shadow-lg shadow-[#FFD700]/20'
                    : 'bg-[#003366] text-white shadow-lg'
                  : isDarkMode
                    ? 'text-slate-300 hover:bg-[#003366]/30'
                    : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-semibold text-sm">Definitions</span>
            </button>
            
            <button
              onClick={() => setCurrentSection('history')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                currentSection === 'history'
                  ? isDarkMode
                    ? 'bg-[#003366] text-[#FFD700] shadow-lg shadow-[#FFD700]/20'
                    : 'bg-[#003366] text-white shadow-lg'
                  : isDarkMode
                    ? 'text-slate-300 hover:bg-[#003366]/30'
                    : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="font-semibold text-sm">History</span>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#003366] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setCurrentSection('contacts')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                currentSection === 'contacts'
                  ? isDarkMode
                    ? 'bg-[#003366] text-[#FFD700] shadow-lg shadow-[#FFD700]/20'
                    : 'bg-[#003366] text-white shadow-lg'
                  : isDarkMode
                    ? 'text-slate-300 hover:bg-[#003366]/30'
                    : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span className="font-semibold text-sm">Contacts</span>
            </button>
          </div>
        </nav>
        
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center relative">
            <img
              src="/autopri.png"
              alt="autoprice"
              className={`w-30 h-30 rounded-2xl border-2 shadow-lg ${
                isDarkMode ? 'border-[#FFD700]/60 shadow-[#FFD700]/30' : 'border-white/60 shadow-primary/30'
              }`}
            />
          </div>
          <p className={`${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'} text-2xl font-bold mt-2`}>
            AutoPrice
          </p>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-sm`}>
            Fast Pricing, Zero Hassle!
          </p>
        </header>

        {/* Main Content */}
        <div className="animate-slide-up">
          {currentSection === 'home' && (
            <div className={`${
              isDarkMode 
                ? 'bg-[#002140]/80 border-[#FFD700]/20 hover:border-[#FFD700]/40' 
                : 'bg-white/80 border-slate-200 hover:border-[#003366]/50'
            } backdrop-blur-xl rounded-3xl p-8 shadow-2xl border transition-all duration-300`}>
              
              <div className={`flex items-center gap-3 mb-8 pb-6 border-b ${
                isDarkMode ? 'border-[#FFD700]/20' : 'border-slate-200'
              }`}>
                <Calculator className={`w-6 h-6 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Cost-Plus Pricing Calculator</h2>
              </div>

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); calculatePrice(); }}>
                {/* Product Name */}
                <div>
                  <label htmlFor="productName" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                  } mb-2 uppercase tracking-wide`}>
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="productName"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="e.g., Cookie"
                    required
                    className={`w-full px-4 py-3 ${
                      isDarkMode 
                        ? 'bg-[#001529] border-[#FFD700]/30 text-slate-100 placeholder-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } border-2 rounded-xl focus:outline-none focus:border-[#FFD700] focus:ring-4 focus:ring-[#FFD700]/20 transition-all duration-200`}
                  />
                </div>

                {/* Time Unit Selection */}
                <div>
                  <label className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                  } mb-2 uppercase tracking-wide`}>
                    Production Time Unit
                  </label>
                  <div className="flex gap-3">
                    {(['day', 'week', 'month'] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setTimeUnit(unit)}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                          timeUnit === unit
                            ? isDarkMode
                              ? 'bg-[#FFD700] text-[#003366] shadow-lg shadow-[#FFD700]/30'
                              : 'bg-[#003366] text-white shadow-lg'
                            : isDarkMode
                              ? 'bg-[#001529] border-2 border-[#FFD700]/30 text-slate-300 hover:border-[#FFD700]'
                              : 'bg-white border-2 border-slate-300 text-slate-600 hover:border-[#003366]'
                        }`}
                      >
                        Per {unit.charAt(0).toUpperCase() + unit.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* VAT Toggle */}
                <div>
                  <label className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                  } mb-2 uppercase tracking-wide`}>
                    VAT (12%)
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIncludeVAT(true)}
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        includeVAT
                          ? isDarkMode
                            ? 'bg-[#FFD700] text-[#003366] shadow-lg shadow-[#FFD700]/30'
                            : 'bg-[#003366] text-white shadow-lg'
                          : isDarkMode
                            ? 'bg-[#001529] border-2 border-[#FFD700]/30 text-slate-300 hover:border-[#FFD700]'
                            : 'bg-white border-2 border-slate-300 text-slate-600 hover:border-[#003366]'
                      }`}
                    >
                      Include VAT
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncludeVAT(false)}
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        !includeVAT
                          ? isDarkMode
                            ? 'bg-[#FFD700] text-[#003366] shadow-lg shadow-[#FFD700]/30'
                            : 'bg-[#003366] text-white shadow-lg'
                          : isDarkMode
                            ? 'bg-[#001529] border-2 border-[#FFD700]/30 text-slate-300 hover:border-[#FFD700]'
                            : 'bg-white border-2 border-slate-300 text-slate-600 hover:border-[#003366]'
                      }`}
                    >
                      No VAT
                    </button>
                  </div>
                </div>

                {/* Fixed Costs */}
                <div>
                  <label htmlFor="fixedCosts" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                  } mb-2 uppercase tracking-wide`}>
                    Step 1: Total Fixed Costs
                  </label>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                    Costs that stay the same (Rent, Utilities, Equipment Depreciation)
                  </p>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    } font-mono font-semibold`}>₱</span>
                    <input
                      type="number"
                      id="fixedCosts"
                      name="fixedCosts"
                      value={formData.fixedCosts}
                      onChange={handleInputChange}
                      placeholder="11000"
                      step="0.01"
                      required
                      className={`w-full pl-8 pr-4 py-3 ${
                        isDarkMode 
                          ? 'bg-[#001529] border-[#FFD700]/30 text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      } border-2 rounded-xl focus:outline-none focus:border-[#FFD700] focus:ring-4 focus:ring-[#FFD700]/20 transition-all duration-200 font-mono`}
                    />
                  </div>
                </div>

                {/* Variable Cost Per Unit */}
                <div>
                  <label htmlFor="variableCostPerUnit" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                  } mb-2 uppercase tracking-wide`}>
                    Step 2: Variable Cost Per Unit
                  </label>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                    Cost for materials, packaging, and labor per unit
                  </p>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    } font-mono font-semibold`}>₱</span>
                    <input
                      type="number"
                      id="variableCostPerUnit"
                      name="variableCostPerUnit"
                      value={formData.variableCostPerUnit}
                      onChange={handleInputChange}
                      placeholder="35"
                      step="0.01"
                      required
                      className={`w-full pl-8 pr-4 py-3 ${
                        isDarkMode 
                          ? 'bg-[#001529] border-[#FFD700]/30 text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      } border-2 rounded-xl focus:outline-none focus:border-[#FFD700] focus:ring-4 focus:ring-[#FFD700]/20 transition-all duration-200 font-mono`}
                    />
                  </div>
                </div>

                {/* Units Produced */}
                <div>
                  <label htmlFor="unitsProduced" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                  } mb-2 uppercase tracking-wide`}>
                    Step 3: Units Produced (per {timeUnit})
                  </label>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                    How many units will be produced per {timeUnit}?
                  </p>
                  <input
                    type="number"
                    id="unitsProduced"
                    name="unitsProduced"
                    value={formData.unitsProduced}
                    onChange={handleInputChange}
                    placeholder="700"
                    step="1"
                    required
                    className={`w-full px-4 py-3 ${
                      isDarkMode 
                        ? 'bg-[#001529] border-[#FFD700]/30 text-slate-100 placeholder-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } border-2 rounded-xl focus:outline-none focus:border-[#FFD700] focus:ring-4 focus:ring-[#FFD700]/20 transition-all duration-200 font-mono`}
                  />
                </div>

                {/* Markup Percentage with Quick Select */}
                <div>
                  <label htmlFor="markupPercentage" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                  } mb-2 uppercase tracking-wide`}>
                    Step 4: Markup Percentage
                  </label>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-3`}>
                    Quick select or enter custom percentage
                  </p>
                  
                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {quickMarkupOptions.map((percentage) => (
                      <button
                        key={percentage}
                        type="button"
                        onClick={() => setQuickMarkup(percentage)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                          formData.markupPercentage === percentage.toString()
                            ? isDarkMode
                              ? 'bg-[#FFD700] text-[#003366] shadow-lg shadow-[#FFD700]/30'
                              : 'bg-[#003366] text-white shadow-lg'
                            : isDarkMode
                              ? 'bg-[#001529] border-2 border-[#FFD700]/30 text-slate-300 hover:border-[#FFD700]'
                              : 'bg-white border-2 border-slate-300 text-slate-600 hover:border-[#003366]'
                        }`}
                      >
                        {percentage}%
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    } font-mono font-semibold`}>%</span>
                    <input
                      type="number"
                      id="markupPercentage"
                      name="markupPercentage"
                      value={formData.markupPercentage}
                      onChange={handleInputChange}
                      placeholder="50"
                      step="0.01"
                      required
                      className={`w-full pl-8 pr-4 py-3 ${
                        isDarkMode 
                          ? 'bg-[#001529] border-[#FFD700]/30 text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      } border-2 rounded-xl focus:outline-none focus:border-[#FFD700] focus:ring-4 focus:ring-[#FFD700]/20 transition-all duration-200 font-mono`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1 uppercase tracking-wide text-sm ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FFD700] text-[#003366] shadow-[#FFD700]/30 hover:shadow-[#FFD700]/50'
                      : 'bg-gradient-to-r from-[#003366] to-[#002244] hover:from-[#002244] hover:to-[#003366] text-white shadow-[#003366]/30 hover:shadow-[#003366]/50'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  Calculate Price
                </button>
              </form>

              {/* Results Section */}
              {showResults && currentCalculation && (
                <div className="mt-8 space-y-6 animate-slide-up">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`${
                      isDarkMode ? 'bg-[#001529] border-[#FFD700]/30' : 'bg-slate-50 border-slate-200'
                    } border-2 rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                      } uppercase tracking-wider mb-1`}>Fixed Cost Per Unit</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>₱{currentCalculation.fixedCostPerUnit.toFixed(2)}</p>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-[#001529] border-[#FFD700]/30' : 'bg-slate-50 border-slate-200'
                    } border-2 rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                      } uppercase tracking-wider mb-1`}>Cost Per Unit</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>₱{currentCalculation.costPerUnit.toFixed(2)}</p>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-[#001529] border-[#FFD700]/30' : 'bg-slate-50 border-slate-200'
                    } border-2 rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                      } uppercase tracking-wider mb-1`}>Markup ({currentCalculation.markupPercentage}%)</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>₱{(currentCalculation.costPerUnit * (currentCalculation.markupPercentage / 100)).toFixed(2)}</p>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-[#001529] border-[#FFD700]/30' : 'bg-slate-50 border-slate-200'
                    } border-2 rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                      } uppercase tracking-wider mb-1`}>Profit Per Unit</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>₱{currentCalculation.profitPerUnit.toFixed(2)}</p>
                    </div>
                  </div>

                  {includeVAT && (
                    <div className={`${
                      isDarkMode ? 'bg-[#001529] border-[#FFD700]/30' : 'bg-slate-50 border-slate-200'
                    } border-2 rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                      } uppercase tracking-wider mb-1`}>VAT Amount (12%)</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>₱{(currentCalculation.sellingPrice * 0.12 / 1.12).toFixed(2)}</p>
                    </div>
                  )}

                  <div className={`rounded-2xl p-6 shadow-xl ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA500]'
                      : 'bg-gradient-to-br from-[#003366] to-[#002244]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`${
                          isDarkMode ? 'text-[#003366]' : 'text-white/90'
                        } font-semibold uppercase tracking-widest text-sm block mb-1`}>
                          Selling Price {includeVAT && '(incl. VAT)'}
                        </span>
                        <span className={`${
                          isDarkMode ? 'text-[#003366]/70' : 'text-white/70'
                        } text-xs`}>
                          Per {timeUnit}
                        </span>
                      </div>
                      <span className={`text-4xl font-bold font-mono ${
                        isDarkMode ? 'text-[#003366]' : 'text-white'
                      }`}>₱{currentCalculation.sellingPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={saveCalculation}
                    className={`w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1 uppercase tracking-wide text-sm ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-[#003366] to-[#002244] hover:from-[#002244] hover:to-[#003366] text-[#FFD700] shadow-[#003366]/30 hover:shadow-[#003366]/50 border-2 border-[#FFD700]/30'
                        : 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FFD700] text-[#003366] shadow-[#FFD700]/30 hover:shadow-[#FFD700]/50'
                    }`}
                  >
                    <Download className="w-5 h-5" />
                    Save & Download PDF
                  </button>
                </div>
              )}
            </div>
          )}

          {currentSection === 'definitions' && (
            <div className={`${
              isDarkMode 
                ? 'bg-[#002140]/80 border-[#FFD700]/20' 
                : 'bg-white/80 border-slate-200'
            } backdrop-blur-xl rounded-3xl p-8 shadow-2xl border`}>
              <div className={`flex items-center gap-3 mb-8 pb-6 border-b ${
                isDarkMode ? 'border-[#FFD700]/20' : 'border-slate-200'
              }`}>
                <BookOpen className={`w-6 h-6 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Definition of Terms</h2>
              </div>

              <div className="space-y-6">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#001529]' : 'bg-slate-50'}`}>
                  <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`}>Fixed Costs</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Expenses that remain constant regardless of production volume. Examples include rent, salaries, insurance, and equipment depreciation.
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#001529]' : 'bg-slate-50'}`}>
                  <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`}>Variable Cost Per Unit</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Costs that change with the number of units produced. This includes raw materials, packaging, and direct labor costs per item.
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#001529]' : 'bg-slate-50'}`}>
                  <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`}>Markup Percentage</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    The percentage added to the cost to determine the selling price. A 50% markup means you add 50% of the cost to get your selling price.
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#001529]' : 'bg-slate-50'}`}>
                  <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`}>Cost-Plus Pricing</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    A pricing strategy where you calculate the total cost per unit and add a markup percentage to determine the selling price. Formula: Selling Price = Cost Per Unit × (1 + Markup %)
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#001529]' : 'bg-slate-50'}`}>
                  <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`}>VAT (Value Added Tax)</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    A consumption tax of 12% (in the Philippines) added to the selling price. When enabled, the final price includes this tax.
                  </p>
                </div>

                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#001529]' : 'bg-slate-50'}`}>
                  <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`}>Break-Even Point</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    The point where total revenue equals total costs. At this point, you're neither making a profit nor a loss.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'history' && (
            <div className={`${
              isDarkMode 
                ? 'bg-[#002140]/80 border-[#FFD700]/20' 
                : 'bg-white/80 border-slate-200'
            } backdrop-blur-xl rounded-3xl p-8 shadow-2xl border`}>
              
              <div className={`flex items-center gap-3 mb-8 pb-6 border-b ${
                isDarkMode ? 'border-[#FFD700]/20' : 'border-slate-200'
              }`}>
                <History className={`w-6 h-6 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Calculation History</h2>
              </div>

              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className={`w-full mb-6 ${
                    isDarkMode 
                      ? 'bg-red-600/10 hover:bg-red-600/20 border-red-600/50 hover:border-red-600 text-red-400 hover:text-red-300' 
                      : 'bg-red-50 hover:bg-red-100 border-red-300 hover:border-red-500 text-red-600 hover:text-red-700'
                  } border-2 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 uppercase tracking-wide text-sm`}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All History
                </button>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {history.length === 0 ? (
                  <div className="text-center py-20">
                    <History className={`w-16 h-16 ${
                      isDarkMode ? 'text-[#FFD700]/20' : 'text-slate-300'
                    } mx-auto mb-4`} />
                    <p className={`${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    } font-medium text-lg mb-1`}>No calculations saved yet</p>
                    <p className={`${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    } text-sm`}>Your pricing history will appear here</p>
                  </div>
                ) : (
                  history.map((calc, index) => (
                    <div
                      key={index}
                      className={`${
                        isDarkMode 
                          ? 'bg-[#001529] hover:bg-[#001529]/80 border-l-4 border-[#FFD700]' 
                          : 'bg-slate-50 hover:bg-white border-l-4 border-[#003366]'
                      } rounded-xl p-5 transition-all duration-300 group`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'} text-lg font-bold`}>
                            {calc.productName}
                          </h3>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          } font-mono mt-1`}>
                            {new Date(calc.timestamp).toLocaleString()}
                          </p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          } mt-1`}>
                            Per {calc.timeUnit} • {calc.includeVAT ? 'With VAT' : 'No VAT'}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteHistoryItem(index)}
                          className={`p-2 rounded-lg border-2 ${
                            isDarkMode 
                              ? 'border-red-600/30 hover:border-red-600 hover:bg-red-600/10 text-red-500 hover:text-red-400' 
                              : 'border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600 hover:text-red-700'
                          } transition-all duration-200`}
                          title="Delete calculation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Fixed Costs:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>₱{calc.fixedCosts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Variable/Unit:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>₱{calc.variableCostPerUnit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Units:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>{calc.unitsProduced}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Markup:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>{calc.markupPercentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Cost/Unit:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>₱{calc.costPerUnit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Profit/Unit:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>₱{calc.profitPerUnit.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className={`pt-4 border-t ${
                        isDarkMode ? 'border-[#FFD700]/20' : 'border-slate-200'
                      } flex justify-between items-center`}>
                        <span className={`${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        } font-semibold`}>Selling Price</span>
                        <span className={`text-2xl font-bold font-mono ${
                          isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'
                        }`}>₱{calc.sellingPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentSection === 'contacts' && (
            <div className={`${
              isDarkMode 
                ? 'bg-[#002140]/80 border-[#FFD700]/20' 
                : 'bg-white/80 border-slate-200'
            } backdrop-blur-xl rounded-3xl p-8 shadow-2xl border`}>
              
              <div className={`flex items-center gap-3 mb-8 pb-6 border-b ${
                isDarkMode ? 'border-[#FFD700]/20' : 'border-slate-200'
              }`}>
                <Phone className={`w-6 h-6 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Contact Information</h2>
              </div>

              <div className="space-y-6">
                <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-[#001529]' : 'bg-slate-50'}`}>
                  <h3 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'}`}>Get in Touch</h3>
                  
                  <div className="space-y-4">

                    <div className={`flex items-start gap-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className={`${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'} font-semibold w-24`}>Developer:</span>
                      <span>Stsgroup1 Team</span>
                    </div>

                    <div className={`flex items-start gap-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className={`${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'} font-semibold w-24`}>Email:</span>
                      <span>stsgroup1f@gmail.com</span>
                    </div>
                    
                    <div className={`flex items-start gap-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className={`${isDarkMode ? 'text-[#FFD700]' : 'text-[#003366]'} font-semibold w-24`}>Phone:</span>
                      <span>+63 0961-034-1169</span>
                    </div>
                    
                  </div>
                </div>

                
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;