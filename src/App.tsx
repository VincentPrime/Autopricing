import { useState, useEffect } from 'react';
import { Calculator, History, Trash2, Download, TrendingUp, Moon, Sun, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';

interface Calculation {
  productName: string;
  materialCost: number;
  laborCost: number;
  overheadExpenses: number;
  profitPercentage: number;
  discountPercentage: number;
  taxPercentage: number;
  baseCost: number;
  profitAmount: number;
  withProfit: number;
  discountAmount: number;
  afterDiscount: number;
  taxAmount: number;
  totalPrice: number;
  timestamp: string;
}

interface FormData {
  productName: string;
  materialCost: string;
  laborCost: string;
  overheadExpenses: string;
  profitPercentage: string;
  discountPercentage: string;
  taxPercentage: string;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    materialCost: '',
    laborCost: '',
    overheadExpenses: '',
    profitPercentage: '',
    discountPercentage: '',
    taxPercentage: '',
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
    const materialCost = parseFloat(formData.materialCost) || 0;
    const laborCost = parseFloat(formData.laborCost) || 0;
    const overheadExpenses = parseFloat(formData.overheadExpenses) || 0;
    const profitPercentage = parseFloat(formData.profitPercentage) || 0;
    const discountPercentage = parseFloat(formData.discountPercentage) || 0;
    const taxPercentage = parseFloat(formData.taxPercentage) || 0;

    const baseCost = materialCost + laborCost + overheadExpenses;
    const profitAmount = baseCost * (profitPercentage / 100);
    const withProfit = baseCost + profitAmount;
    const discountAmount = withProfit * (discountPercentage / 100);
    const afterDiscount = withProfit - discountAmount;
    const taxAmount = afterDiscount * (taxPercentage / 100);
    const totalPrice = afterDiscount + taxAmount;

    const calculation: Calculation = {
      productName: formData.productName,
      materialCost,
      laborCost,
      overheadExpenses,
      profitPercentage,
      discountPercentage,
      taxPercentage,
      baseCost,
      profitAmount,
      withProfit,
      discountAmount,
      afterDiscount,
      taxAmount,
      totalPrice,
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
      doc.text('$' + value.toFixed(2), 160, y, { align: 'right' });
      y += 8;
    };

    addLine('Material Cost:', calc.materialCost);
    addLine('Labor Cost:', calc.laborCost);
    addLine('Overhead Expenses:', calc.overheadExpenses);

    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(25, y, 160, y);
    y += 8;

    addLine('Base Cost:', calc.baseCost, true);

    y += 4;
    addLine('Profit (' + calc.profitPercentage + '%):', calc.profitAmount);
    addLine('Price with Profit:', calc.withProfit, true);

    y += 4;
    addLine('Discount (' + calc.discountPercentage + '%):', -calc.discountAmount);
    addLine('Price after Discount:', calc.afterDiscount, true);

    y += 4;
    addLine('Tax (' + calc.taxPercentage + '%):', calc.taxAmount);

    y += 4;
    doc.setDrawColor(16, 185, 129);
    doc.line(25, y, 160, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('TOTAL PRICE:', 25, y);
    doc.text('$' + calc.totalPrice.toFixed(2), 160, y, { align: 'right' });

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
      materialCost: '',
      laborCost: '',
      overheadExpenses: '',
      profitPercentage: '',
      discountPercentage: '',
      taxPercentage: '',
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
              src="/Pricinglogo.png"
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
                  <span className={`${isDarkMode ? 'text-white' : 'text-black'} text-xs font-bold bg-primary rounded-full w-5 h-5 flex items-center justify-center`}>
                    {history.length}
                  </span>
                )}
              </button>

              <div className={`flex items-center  justify-self-center gap-3 mb-8 pb-6 border-b ${
                isDarkMode ? 'border-[#b7b7b7]' : 'border-slate-200'
              }`}>
                <Calculator className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-primary'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Price Calculator</h2>
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
                    placeholder="Enter product name"
                    required
                    className={`w-full px-4 py-3 ${
                      isDarkMode 
                        ? 'bg-dark-bg border-dark-border text-slate-100 placeholder-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    } border-2 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200`}
                  />
                </div>

                {/* Cost Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="materialCost" className={`block text-sm font-semibold ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    } mb-2 uppercase tracking-wide`}>
                      Material Cost
                    </label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      } font-mono font-semibold`}>₱</span>
                      <input
                        type="number"
                        id="materialCost"
                        name="materialCost"
                        value={formData.materialCost}
                        onChange={handleInputChange}
                        placeholder="0.00"
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

                  <div>
                    <label htmlFor="laborCost" className={`block text-sm font-semibold ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    } mb-2 uppercase tracking-wide`}>
                      Labor Cost
                    </label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      } font-mono font-semibold`}>₱</span>
                      <input
                        type="number"
                        id="laborCost"
                        name="laborCost"
                        value={formData.laborCost}
                        onChange={handleInputChange}
                        placeholder="0.00"
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

                  <div>
                    <label htmlFor="overheadExpenses" className={`block text-sm font-semibold ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    } mb-2 uppercase tracking-wide`}>
                      Overhead
                    </label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      } font-mono font-semibold`}>₱</span>
                      <input
                        type="number"
                        id="overheadExpenses"
                        name="overheadExpenses"
                        value={formData.overheadExpenses}
                        onChange={handleInputChange}
                        placeholder="0.00"
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

                  <div>
                    <label htmlFor="profitPercentage" className={`block text-sm font-semibold ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    } mb-2 uppercase tracking-wide`}>
                      Profit Margin
                    </label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      } font-mono font-semibold`}>%</span>
                      <input
                        type="number"
                        id="profitPercentage"
                        name="profitPercentage"
                        value={formData.profitPercentage}
                        onChange={handleInputChange}
                        placeholder="0.00"
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

                  <div>
                    <label htmlFor="discountPercentage" className={`block text-sm font-semibold ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    } mb-2 uppercase tracking-wide`}>
                      Discount
                    </label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      } font-mono font-semibold`}>%</span>
                      <input
                        type="number"
                        id="discountPercentage"
                        name="discountPercentage"
                        value={formData.discountPercentage}
                        onChange={handleInputChange}
                        placeholder="0.00"
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

                  <div>
                    <label htmlFor="taxPercentage" className={`block text-sm font-semibold ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    } mb-2 uppercase tracking-wide`}>
                      Tax Rate
                    </label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      } font-mono font-semibold`}>%</span>
                      <input
                        type="number"
                        id="taxPercentage"
                        name="taxPercentage"
                        value={formData.taxPercentage}
                        onChange={handleInputChange}
                        placeholder="0.00"
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
                      } uppercase tracking-wider mb-1`}>Base Cost</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>${currentCalculation.baseCost.toFixed(2)}</p>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-dark-bg border-dark-border' : 'bg-slate-50 border-slate-200'
                    } border rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      } uppercase tracking-wider mb-1`}>With Profit ({currentCalculation.profitPercentage}%)</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>${currentCalculation.withProfit.toFixed(2)}</p>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-dark-bg border-dark-border' : 'bg-slate-50 border-slate-200'
                    } border rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      } uppercase tracking-wider mb-1`}>After Discount ({currentCalculation.discountPercentage}%)</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>${currentCalculation.afterDiscount.toFixed(2)}</p>
                    </div>
                    <div className={`${
                      isDarkMode ? 'bg-dark-bg border-dark-border' : 'bg-slate-50 border-slate-200'
                    } border rounded-xl p-4`}>
                      <p className={`text-xs font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      } uppercase tracking-wider mb-1`}>Tax ({currentCalculation.taxPercentage}%)</p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      } font-mono`}>${currentCalculation.taxAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className={`rounded-2xl p-6 shadow-xl animate-pulse-glow ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-primary to-primary-dark'
                      : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-white/90 font-semibold uppercase tracking-widest text-sm">Total Price</span>
                      <span className="text-4xl font-bold text-white font-mono">${currentCalculation.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={saveCalculation}
                    className={`w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all duration-300 hover:-translate-y-1 uppercase tracking-wide text-sm ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary text-white shadow-secondary/30 hover:shadow-secondary/50'
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
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>  Calculation History</h2>
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
                          <h3 className={`${isDarkMode? 'text-white' : 'text-black'} text-lg font-bold group-hover:text-primary-light transition-colors`}>
                            {calc.productName}
                          </h3>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-slate-500 ' : 'text-slate-400'
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
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Material:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>${calc.materialCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Labor:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>${calc.laborCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Overhead:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>${calc.overheadExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Profit:</span>
                          <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-mono`}>{calc.profitPercentage}%</span>
                        </div>
                      </div>

                      <div className={`pt-4 border-t ${
                        isDarkMode ? 'border-dark-border text-white' : 'border-slate-200'
                      } flex justify-between items-center`}>
                        <span className={`${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        } font-semibold`}>Total Price</span>
                        <span className="text-2xl font-bold text-primary font-mono">${calc.totalPrice.toFixed(2)}</span>
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