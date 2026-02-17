import { useState, useEffect } from 'react';
import { Calculator, History, Trash2, Download, TrendingUp, Moon, Sun, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import Faqs from './faqs';

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
}

interface FormData {
  productName: string;
  fixedCosts: string;
  variableCostPerUnit: string;
  unitsProduced: string;
  markupPercentage: string;
}

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
  const [showHistory, setShowHistory] = useState(false);

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

  const calculatePrice = () => {
    const fixedCosts = parseFloat(formData.fixedCosts) || 0;
    const variableCostPerUnit = parseFloat(formData.variableCostPerUnit) || 0;
    const unitsProduced = parseFloat(formData.unitsProduced) || 0;
    const markupPercentage = parseFloat(formData.markupPercentage) || 0;

    // Step 4: Fixed Cost Per Unit = Total Fixed Costs / Units Produced
    const fixedCostPerUnit = unitsProduced > 0 ? fixedCosts / unitsProduced : 0;

    // Step 5: Cost Per Unit = Fixed Cost Per Unit + Variable Cost Per Unit
    const costPerUnit = fixedCostPerUnit + variableCostPerUnit;

    // Step 7: Selling Price = Cost Per Unit + (Cost Per Unit × Markup)
    const sellingPrice = costPerUnit + (costPerUnit * (markupPercentage / 100));

    // Profit Per Unit = Selling Price - Cost Per Unit
    const profitPerUnit = sellingPrice - costPerUnit;

    const calculation: Calculation = {
      productName: formData.productName,
      fixedCosts,
      variableCostPerUnit,
      unitsProduced,
      markupPercentage,
      fixedCostPerUnit: Math.round(fixedCostPerUnit),
      costPerUnit: Math.round(costPerUnit),
      sellingPrice: Math.round(sellingPrice),
      profitPerUnit: Math.round(profitPerUnit),
      timestamp: new Date().toISOString(),
    };

    setCurrentCalculation(calculation);
    setShowResults(true);
  };

  const generatePDF = (calc: Calculation) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text('Smart Pricing System', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Product: ' + calc.productName, 20, 40);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Date: ' + new Date(calc.timestamp).toLocaleString(), 20, 48);

    doc.setDrawColor(16, 185, 129);
    doc.line(20, 52, 190, 52);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Cost Breakdown:', 20, 62);

    doc.setFontSize(11);
    let y = 72;
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

    y += 4;
    doc.setDrawColor(16, 185, 129);
    doc.line(25, y, 160, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('', 'bold');
    doc.setTextColor(16, 185, 129);
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
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    } relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 -left-4 w-96 h-96 ${
          isDarkMode ? 'bg-primary/20' : 'bg-primary/10'
        } rounded-full mix-blend-multiply filter blur-3xl animate-pulse`}></div>
        <div className={`absolute top-0 -right-4 w-96 h-96 ${
          isDarkMode ? 'bg-secondary/20' : 'bg-secondary/10'
        } rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700`}></div>
        <div className={`absolute -bottom-8 left-20 w-96 h-96 ${
          isDarkMode ? 'bg-primary/10' : 'bg-primary/5'
        } rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000`}></div>
      </div>
    
        <Faqs/>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-primary/50 hover:shadow-primary/70 border-1 border-gray-600' 
            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/50 hover:shadow-amber-500/70'
        }`}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? (
          <Sun className="w-6 h-6 animate-spin-slow" style={{ animation: 'spin 20s linear infinite' }} />
        ) : (
          <Moon className="w-6 h-6" />
        )}
      </button>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center relative">
            <img
              src="/autopri.png"
              alt="autopricing"
              className="w-30 h-30 rounded-2xl border border-white/60 shadow-lg shadow-primary/50"
            />
          </div>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-2xl font-medium`}>
            AutoPricing
          </p>
          <p className='text-[#808080] w-100 justify-self-center'>
            Fast Pricing, Zero Hassle!
          </p>
        </header>

        {/* Main Content - Toggle between Calculator and History */}
        <div className="animate-slide-up">
          {!showHistory ? (
            /* Calculator Card */
            <div className={`${
              isDarkMode 
                ? 'bg-dark-surface/80 border-dark-border/50 hover:border-primary/30' 
                : 'bg-white/80 border-slate-200 hover:border-primary/50'
            } backdrop-blur-xl rounded-3xl p-8 shadow-2xl border transition-all duration-300 hover:shadow-primary/10 hover:shadow-2xl relative`}>
              
              {/* History Toggle Button */}
              <button
                onClick={() => setShowHistory(true)}
                className={`absolute top-6 right-6 p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-dark-bg hover:bg-dark-bg/80 border-slate-50 text-primary' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-primary'
                } border-2 hover:border-primary flex items-center gap-2`}
                title="View History"
              >
                <History className={`w-5 h-5 ${isDarkMode? 'text-white' : 'text-black'}`} />
                {history.length > 0 && (
                  <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-xs font-bold  rounded-full w-5 h-5 flex items-center justify-center`}>
                    {history.length}
                  </span>
                )}
              </button>

              <div className={`flex items-center justify-self-center gap-3 mb-8 pb-6 border-b ${
                isDarkMode ? 'border-[#b7b7b7]' : 'border-slate-200'
              }`}>
                <Calculator className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-primary'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Cost-Plus Pricing Calculator</h2>
              </div>

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); calculatePrice(); }}>
                {/* Product Name */}
                <div>
                  <label htmlFor="productName" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
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
                        ? 'bg-dark-bg border-dark-border text-slate-100 placeholder-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200`}
                  />
                </div>

                {/* Step 1: Fixed Costs */}
                <div>
                  <label htmlFor="fixedCosts" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
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
                          ? 'bg-dark-bg border-dark-border text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      } border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 font-mono`}
                    />
                  </div>
                </div>

                {/* Step 2: Variable Cost Per Unit */}
                <div>
                  <label htmlFor="variableCostPerUnit" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
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
                          ? 'bg-dark-bg border-dark-border text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      } border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 font-mono`}
                    />
                  </div>
                </div>

                {/* Step 3: Units Produced */}
                <div>
                  <label htmlFor="unitsProduced" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  } mb-2 uppercase tracking-wide`}>
                    Step 3: Units Produced
                  </label>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                    How many units will be produced?
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
                        ? 'bg-dark-bg border-dark-border text-slate-100 placeholder-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 font-mono`}
                  />
                </div>

                {/* Step 6: Markup Percentage */}
                <div>
                  <label htmlFor="markupPercentage" className={`block text-sm font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  } mb-2 uppercase tracking-wide`}>
                    Step 6: Markup Percentage
                  </label>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                    Recommended: 25%-50%
                  </p>
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
                          ? 'bg-dark-bg border-dark-border text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      } border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 font-mono`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className='w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1 uppercase tracking-wide text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50'
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
                      isDarkMode ? 'bg-dark-bg border-dark-border' : 'bg-slate-50 border-slate-200'
                    } border rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      } uppercase tracking-wider mb-1`}>Fixed Cost Per Unit</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>₱{currentCalculation.fixedCostPerUnit}</p>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-dark-bg border-dark-border' : 'bg-slate-50 border-slate-200'
                    } border rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      } uppercase tracking-wider mb-1`}>Cost Per Unit</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>₱{currentCalculation.costPerUnit}</p>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-dark-bg border-dark-border' : 'bg-slate-50 border-slate-200'
                    } border rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      } uppercase tracking-wider mb-1`}>Markup ({currentCalculation.markupPercentage}%)</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>₱{currentCalculation.profitPerUnit}</p>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-dark-bg border-dark-border' : 'bg-slate-50 border-slate-200'
                    } border rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      } uppercase tracking-wider mb-1`}>Profit Per Unit</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>₱{currentCalculation.profitPerUnit}</p>
                    </div>
                  </div>

                  <div className={`rounded-2xl p-6 shadow-xl animate-pulse-glow bg-gradient-to-br from-emerald-500 to-emerald-600`}>
                    <div className="flex items-center justify-between">
                      <span className="text-white/90 font-semibold uppercase tracking-widest text-sm">Selling Price</span>
                      <span className="text-4xl font-bold text-white font-mono">₱{currentCalculation.sellingPrice}</span>
                    </div>
                  </div>

                  <button
                    onClick={saveCalculation}
                    className={`w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1 uppercase tracking-wide text-sm ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600  hover:from-blue-600 hover:to-blue-700 text-white shadow-secondary/30 hover:shadow-secondary/50'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/30 hover:shadow-blue-500/50'
                    }`}
                  >
                    <Download className="w-5 h-5" />
                    Save & Download PDF
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* History Card */
            <div className={`${
              isDarkMode 
                ? 'bg-dark-surface/80 border-dark-border/50 hover:border-primary/30' 
                : 'bg-white/80 border-slate-200 hover:border-primary/50'
            } backdrop-blur-xl rounded-3xl p-8 shadow-2xl border transition-all duration-300 relative`}>
              
              {/* Back Button */}
              <div className='flex items-center justify-center'>
                <button
                  onClick={() => setShowHistory(false)}
                  className={`absolute top-6 left-6 p-2 rounded-lg transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-dark-bg hover:bg-dark-bg/80 border-slate-50 text-primary text-white' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-primary'
                  } border-2 hover:border-primary flex items-center gap-2`}
                  title="Back to Calculator"
                >
                  <ArrowLeft className='w-5 h-5'/>
                  <span className="text-sm font-semibold">Back</span>
                </button>

                <div className={`flex items-center gap-3 mb-8 pb-6 border-b ml-10 ${
                  isDarkMode ? 'border-dark-border text-white' : 'border-slate-200'
                }`}>
                  <History className={`w-6 h-6 ${isDarkMode ? 'text-primary' : 'text-primary'}`} />
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Calculation History</h2>
                </div>
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

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary scrollbar-track-dark-bg">
                {history.length === 0 ? (
                  <div className="text-center py-20">
                    <History className={`w-16 h-16 ${
                      isDarkMode ? 'text-dark-border' : 'text-slate-300'
                    } mx-auto mb-4 opacity-50`} />
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
                          ? 'bg-dark-bg hover:bg-dark-bg/80' 
                          : 'bg-slate-50 hover:bg-white'
                      } border-l-4 border-primary rounded-xl p-5 hover:border-primary-light transition-all duration-300 group`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`${isDarkMode ? 'text-white' : 'text-black'} text-lg font-bold group-hover:text-primary-light transition-colors`}>
                            {calc.productName}
                          </h3>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          } font-mono mt-1`}>
                            {new Date(calc.timestamp).toLocaleString()}
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
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>₱{calc.costPerUnit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Profit/Unit:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>₱{calc.profitPerUnit}</span>
                        </div>
                      </div>

                      <div className={`pt-4 border-t ${
                        isDarkMode ? 'border-dark-border text-white' : 'border-slate-200'
                      } flex justify-between items-center`}>
                        <span className={`${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        } font-semibold`}>Selling Price</span>
                        <span className="text-2xl font-bold text-primary font-mono">₱{calc.sellingPrice}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;