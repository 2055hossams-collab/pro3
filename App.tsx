import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, DollarSign, Activity, FileText, Plus, Search, CheckCircle, 
  AlertTriangle, Beaker, Save, Wand2, FlaskConical, Settings, 
  LayoutDashboard, ClipboardList, Printer, Trash2, Edit, X, Bell, Wifi, WifiOff
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sidebar } from './components/Sidebar';
import { StatsCard } from './components/StatsCard';
import { analyzeLabResults } from './services/geminiService';
import { Patient, LabTest, Visit, Gender, VisitStatus, TestResult, LabSettings } from './types';

// --- INITIAL MOCK DATA ---
const INITIAL_PATIENTS: Patient[] = [
  { id: '1', name: 'أحمد محمد علي', age: 34, gender: Gender.Male, phone: '0501234567', registeredAt: '2023-10-01' },
  { id: '2', name: 'سارة خالد', age: 28, gender: Gender.Female, phone: '0509876543', registeredAt: '2023-10-05' },
];

const INITIAL_TESTS: LabTest[] = [
  { id: 't1', name: 'CBC - صورة دم كاملة', code: 'HEM001', price: 150, unit: '-', normalRange: 'N/A', category: 'Hematology' },
  { id: 't2', name: 'Fasting Blood Sugar', code: 'BIO001', price: 50, unit: 'mg/dL', normalRange: '70-100', category: 'Biochemistry' },
  { id: 't3', name: 'HbA1c', code: 'BIO002', price: 120, unit: '%', normalRange: '4.0-5.6', category: 'Biochemistry' },
  { id: 't4', name: 'Vitamin D', code: 'HOR001', price: 300, unit: 'ng/mL', normalRange: '30-100', category: 'Hormones' },
  { id: 't5', name: 'Lipid Profile', code: 'BIO003', price: 200, unit: 'mg/dL', normalRange: '<200', category: 'Biochemistry' },
];

const INITIAL_SETTINGS: LabSettings = {
  labName: "مختبر الشفاء الطبي",
  address: "الرياض - شارع الملك فهد",
  phone: "011-1234567",
  footerText: "نتمنى لكم دوام الصحة والعافية"
};

// Hook for local storage
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

const App: React.FC = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Data with Persistence
  const [patients, setPatients] = useStickyState<Patient[]>(INITIAL_PATIENTS, 'lab_patients');
  const [tests, setTests] = useStickyState<LabTest[]>(INITIAL_TESTS, 'lab_tests');
  const [visits, setVisits] = useStickyState<Visit[]>([], 'lab_visits'); 
  const [settings, setSettings] = useStickyState<LabSettings>(INITIAL_SETTINGS, 'lab_settings');

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Forms & Modals
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [printVisitId, setPrintVisitId] = useState<string | null>(null);
  
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState(Gender.Male);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedVisitTests, setSelectedVisitTests] = useState<string[]>([]);
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [resultInputs, setResultInputs] = useState<Record<string, string>>({});

  const [testForm, setTestForm] = useState<Partial<LabTest>>({ category: 'Biochemistry' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // --- NOTIFICATION HELPER ---
  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- COMPUTED DATA ---
  const filteredPatients = useMemo(() => {
    return patients.filter(p => p.name.includes(searchTerm) || p.phone.includes(searchTerm));
  }, [patients, searchTerm]);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const p = patients.find(pat => pat.id === v.patientId);
      return p?.name.includes(searchTerm) || v.id.includes(searchTerm);
    });
  }, [visits, patients, searchTerm]);

  const filteredTests = useMemo(() => {
    return tests.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.code.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tests, searchTerm]);

  // --- ACTIONS ---
  const handleAddPatient = () => {
    if (!newPatientName) return;
    const newPatient: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPatientName,
      phone: newPatientPhone,
      age: parseInt(newPatientAge) || 0,
      gender: newPatientGender,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    setPatients(prev => [...prev, newPatient]);
    setShowNewPatientModal(false);
    setNewPatientName(''); setNewPatientPhone(''); setNewPatientAge('');
    notify('تم إضافة المريض بنجاح');
  };

  const handleCreateVisit = () => {
    if (!selectedPatientId || selectedVisitTests.length === 0) return;
    const totalCost = selectedVisitTests.reduce((sum, tid) => {
      const t = tests.find(test => test.id === tid);
      return sum + (t?.price || 0);
    }, 0);

    const newVisit: Visit = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: selectedPatientId,
      date: new Date().toISOString().split('T')[0],
      status: VisitStatus.Pending,
      selectedTestIds: selectedVisitTests,
      results: [],
      totalCost
    };
    setVisits(prev => [newVisit, ...prev]);
    setShowNewVisitModal(false);
    setSelectedVisitTests([]); setSelectedPatientId('');
    notify('تم إنشاء الزيارة بنجاح');
  };

  const handleDeleteVisit = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
      setVisits(prev => prev.filter(v => v.id !== id));
      notify('تم حذف الزيارة');
    }
  };

  const handleSaveResults = async (visitId: string) => {
    const currentVisit = visits.find(v => v.id === visitId);
    if (!currentVisit) return;

    const results: TestResult[] = currentVisit.selectedTestIds.map(tid => ({
      testId: tid,
      value: resultInputs[tid] || '',
      flag: 'Normal' 
    }));

    const updatedVisit = { ...currentVisit, results, status: VisitStatus.Completed };
    setVisits(prev => prev.map(v => v.id === visitId ? updatedVisit : v));
    setActiveVisitId(null);
    notify('تم حفظ النتائج');
  };

  const handleAnalyzeAI = async (visit: Visit) => {
    if (!isOnline) {
      notify('يجب توفر اتصال بالإنترنت لاستخدام الذكاء الاصطناعي', 'error');
      return;
    }
    setIsAnalyzing(true);
    const p = patients.find(pat => pat.id === visit.patientId);
    if (p) {
      const analysis = await analyzeLabResults(p, visit.results, tests);
      const updatedVisits = visits.map(v => v.id === visit.id ? { ...v, aiAnalysis: analysis } : v);
      setVisits(updatedVisits);
      notify('تم التحليل بنجاح');
    }
    setIsAnalyzing(false);
  };

  const handleSaveTest = () => {
    if (!testForm.name || !testForm.price) {
      notify('الرجاء تعبئة الاسم والسعر', 'error');
      return;
    }

    if (editingTest) {
      setTests(prev => prev.map(t => t.id === editingTest.id ? { ...editingTest, ...testForm } as LabTest : t));
      notify('تم تعديل الفحص');
    } else {
      const newTest: LabTest = {
        id: Math.random().toString(36).substr(2, 9),
        name: testForm.name || '',
        code: testForm.code || 'GEN',
        price: Number(testForm.price),
        unit: testForm.unit || '',
        normalRange: testForm.normalRange || '',
        category: testForm.category as any
      };
      setTests(prev => [...prev, newTest]);
      notify('تم إضافة الفحص');
    }
    setShowTestModal(false);
    setEditingTest(null);
    setTestForm({ category: 'Biochemistry' });
  };

  const handleDeleteTest = (id: string) => {
    if (window.confirm('هل أنت متأكد؟')) {
      setTests(prev => prev.filter(t => t.id !== id));
      notify('تم حذف الفحص');
    }
  };

  const openEditTest = (test: LabTest) => {
    setEditingTest(test);
    setTestForm(test);
    setShowTestModal(true);
  };

  const handlePrintPreview = (visitId: string) => {
    setPrintVisitId(visitId);
    setShowPrintModal(true);
  };

  const triggerPrint = () => {
    window.print();
  };

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="إجمالي المرضى" value={patients.length} icon={Users} colorClass="bg-blue-500" />
        <StatsCard title="دخل اليوم" value={`${visits.filter(v => v.date === new Date().toISOString().split('T')[0]).reduce((acc, v) => acc + v.totalCost, 0)} ر.س`} icon={DollarSign} colorClass="bg-emerald-500" trend="المحفظة" />
        <StatsCard title="نتائج قيد الانتظار" value={visits.filter(v => v.status !== VisitStatus.Completed).length} icon={Beaker} colorClass="bg-amber-500" />
        <StatsCard title="الفحوصات المكتملة" value={visits.filter(v => v.status === VisitStatus.Completed).length} icon={CheckCircle} colorClass="bg-purple-500" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
        <h3 className="text-lg font-bold text-slate-800 mb-6">إحصائيات الزيارات</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[{ name: 'السبت', visits: 4 }, { name: 'الأحد', visits: 8 }, { name: 'الاثنين', visits: 12 }, { name: 'اليوم', visits: visits.length }]}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="visits" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPatients = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">سجل المرضى</h2>
        <button onClick={() => setShowNewPatientModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          <span>إضافة مريض</span>
        </button>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-2">
         <Search className="w-5 h-5 text-slate-400" />
         <input type="text" placeholder="بحث باسم المريض أو رقم الهاتف..." className="flex-1 outline-none bg-transparent" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[600px]">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="p-4">الاسم</th>
                <th className="p-4">العمر</th>
                <th className="p-4">الجنس</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{patient.name}</td>
                  <td className="p-4 text-slate-600">{patient.age}</td>
                  <td className="p-4 text-slate-600">{patient.gender}</td>
                  <td className="p-4 text-slate-600">{patient.phone}</td>
                  <td className="p-4 text-slate-600">{patient.registeredAt}</td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">لا يوجد مرضى مطابقين للبحث</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderVisits = () => (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">الزيارات والنتائج</h2>
        <button onClick={() => setShowNewVisitModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <FileText className="w-5 h-5" />
          <span>زيارة جديدة</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-2">
         <Search className="w-5 h-5 text-slate-400" />
         <input type="text" placeholder="بحث برقم الزيارة أو اسم المريض..." className="flex-1 outline-none bg-transparent" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid gap-4">
        {filteredVisits.length === 0 && <p className="text-center text-slate-500 py-10">لا توجد زيارات</p>}
        {filteredVisits.map(visit => {
          const patient = patients.find(p => p.id === visit.patientId);
          const isExpanded = activeVisitId === visit.id;

          return (
            <div key={visit.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => setActiveVisitId(isExpanded ? null : visit.id)}>
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${visit.status === VisitStatus.Completed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {visit.status === VisitStatus.Completed ? <CheckCircle className="w-6 h-6" /> : <Beaker className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{patient?.name || 'مريض غير معروف'}</h4>
                    <p className="text-sm text-slate-500">#{visit.id.substring(0,6)} • {visit.date} • {visit.selectedTestIds.length} فحوصات</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 justify-between md:justify-end w-full md:w-auto">
                   <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        visit.status === VisitStatus.Completed ? 'bg-emerald-100 text-emerald-700' : 
                        visit.status === VisitStatus.InProcess ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {visit.status}
                      </span>
                      <span className="font-bold text-slate-700">{visit.totalCost} ر.س</span>
                   </div>
                   <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteVisit(visit.id); }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-50 p-6 border-t border-slate-100">
                  <h5 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-emerald-600" />
                    نتائج الفحص
                  </h5>
                  
                  <div className="grid gap-4 mb-6">
                    {visit.selectedTestIds.map(tid => {
                      const t = tests.find(test => test.id === tid);
                      const result = visit.results.find(r => r.testId === tid);
                      return (
                        <div key={tid} className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
                          <div className="flex-1">
                            <span className="font-medium text-slate-800 block">{t?.name}</span>
                            <span className="text-xs text-slate-500">Range: {t?.normalRange} {t?.unit}</span>
                          </div>
                          <div className="w-full md:w-48">
                            {visit.status === VisitStatus.Completed ? (
                                <span className="font-mono font-bold text-lg text-slate-800">{result?.value} <span className="text-sm font-normal text-slate-500">{t?.unit}</span></span>
                            ) : (
                              <input 
                                type="text" 
                                placeholder="النتيجة..." 
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={resultInputs[tid] || result?.value || ''}
                                onChange={(e) => setResultInputs(prev => ({...prev, [tid]: e.target.value}))}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap justify-end gap-3">
                    {visit.status !== VisitStatus.Completed ? (
                      <button 
                        onClick={() => handleSaveResults(visit.id)}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        حفظ وإنهاء
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handlePrintPreview(visit.id)}
                          className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          طباعة التقرير
                        </button>
                        
                        {!visit.aiAnalysis && (
                          <div className="relative group">
                            <button 
                              onClick={() => handleAnalyzeAI(visit)}
                              disabled={isAnalyzing || !isOnline}
                              className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${isOnline ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                              <Wand2 className="w-4 h-4" />
                              {isAnalyzing ? 'جاري التحليل...' : 'تحليل AI'}
                            </button>
                            {!isOnline && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-black text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                غير متوفر بدون إنترنت
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {visit.aiAnalysis && (
                    <div className="mt-4 bg-purple-50 border border-purple-200 p-4 rounded-lg animate-fade-in">
                      <div className="flex items-center gap-2 mb-2 text-purple-800 font-bold">
                        <Wand2 className="w-5 h-5" />
                        تقرير الذكاء الاصطناعي
                      </div>
                      <p className="text-purple-900 text-sm whitespace-pre-line leading-relaxed">
                        {visit.aiAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">دليل الفحوصات الطبية</h2>
        <button onClick={() => { setEditingTest(null); setTestForm({ category: 'Biochemistry' }); setShowTestModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          <span>إضافة فحص جديد</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-2">
         <Search className="w-5 h-5 text-slate-400" />
         <input type="text" placeholder="بحث عن اسم الفحص..." className="flex-1 outline-none bg-transparent" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[600px]">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="p-4">اسم الفحص</th>
                <th className="p-4">الكود</th>
                <th className="p-4">السعر</th>
                <th className="p-4">المعدل الطبيعي</th>
                <th className="p-4">الوحدة</th>
                <th className="p-4">تحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.map(test => (
                <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{test.name}</td>
                  <td className="p-4 text-slate-500 text-sm">{test.code}</td>
                  <td className="p-4 text-emerald-600 font-bold">{test.price} ر.س</td>
                  <td className="p-4 text-slate-600" dir="ltr">{test.normalRange}</td>
                  <td className="p-4 text-slate-600">{test.unit}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => openEditTest(test)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteTest(test.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800">إعدادات النظام والطباعة</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">اسم المختبر (يظهر في التقرير)</label>
          <input type="text" className="w-full border p-2 rounded-lg" value={settings.labName} onChange={e => setSettings({...settings, labName: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
          <input type="text" className="w-full border p-2 rounded-lg" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
          <input type="text" className="w-full border p-2 rounded-lg" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">نص تذييل التقرير (Footer)</label>
          <input type="text" className="w-full border p-2 rounded-lg" value={settings.footerText} onChange={e => setSettings({...settings, footerText: e.target.value})} />
        </div>
        <div className="pt-4 flex justify-end">
          <button onClick={() => notify('تم حفظ الإعدادات')} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2">
            <Save className="w-4 h-4" />
            حفظ التغييرات
          </button>
        </div>
      </div>
      <div className="text-center text-slate-400 text-sm mt-8">
        <p>Al-Mokhtabar Pro v1.2</p>
        <p>يعمل في وضع عدم الاتصال (Offline Compatible)</p>
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-4 left-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-bounce ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 left-4 z-50 p-2 rounded-full shadow-md bg-white border border-slate-200" title={isOnline ? "متصل بالإنترنت" : "وضع عدم الاتصال"}>
        {isOnline ? (
          <Wifi className="w-5 h-5 text-emerald-500" />
        ) : (
          <WifiOff className="w-5 h-5 text-slate-400" />
        )}
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white p-4 z-20 flex justify-between items-center shadow-md">
        <span className="font-bold">المختبر الذكي</span>
        <button onClick={() => setActiveTab('analytics')} className="p-2"><Settings className="w-5 h-5" /></button>
      </div>

      <main className="flex-1 md:mr-64 p-4 md:p-8 pt-20 pb-24 md:pt-8 md:pb-8 overflow-y-auto min-h-screen">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'patients' && renderPatients()}
        {activeTab === 'visits' && renderVisits()}
        {activeTab === 'tests' && renderTests()}
        {activeTab === 'analytics' && renderSettings()}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center z-30 pb-safe">
        {[
          { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
          { id: 'patients', label: 'المرضى', icon: Users },
          { id: 'visits', label: 'الزيارات', icon: ClipboardList },
          { id: 'tests', label: 'الفحوصات', icon: FlaskConical },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full py-3 transition-colors ${
                isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* MODALS */}

      {/* New Patient Modal */}
      {showNewPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 mb-4">إضافة مريض جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل</label>
                <input type="text" value={newPatientName} onChange={e => setNewPatientName(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 ring-emerald-500 outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">العمر</label>
                  <input type="number" value={newPatientAge} onChange={e => setNewPatientAge(e.target.value)} className="w-full border p-2 rounded-lg" />
                </div>
                <div className="flex-1">
                   <label className="block text-sm font-medium text-slate-700 mb-1">الجنس</label>
                   <select className="w-full border p-2 rounded-lg" value={newPatientGender} onChange={(e) => setNewPatientGender(e.target.value as Gender)}>
                      <option value={Gender.Male}>ذكر</option>
                      <option value={Gender.Female}>أنثى</option>
                   </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                <input type="tel" value={newPatientPhone} onChange={e => setNewPatientPhone(e.target.value)} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowNewPatientModal(false)} className="text-slate-500 hover:text-slate-700 px-4 py-2">إلغاء</button>
                <button onClick={handleAddPatient} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Visit Modal */}
      {showNewVisitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 mb-4">تسجيل زيارة جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اختر المريض</label>
                <select 
                  className="w-full border p-2 rounded-lg focus:ring-2 ring-blue-500 outline-none"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">-- اختر مريض --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اختر الفحوصات المطلوبة</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border p-2 rounded-lg bg-slate-50">
                  {tests.map(t => (
                    <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedVisitTests.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedVisitTests([...selectedVisitTests, t.id]);
                          else setSelectedVisitTests(selectedVisitTests.filter(id => id !== t.id));
                        }}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <div className="flex-1 flex justify-between">
                        <span className="font-medium text-slate-700">{t.name}</span>
                        <span className="text-emerald-600 font-bold">{t.price} ر.س</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-lg font-bold text-slate-800">الإجمالي:</span>
                <span className="text-xl font-bold text-emerald-600">
                  {selectedVisitTests.reduce((sum, tid) => sum + (tests.find(t => t.id === tid)?.price || 0), 0)} ر.س
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setShowNewVisitModal(false)} className="text-slate-500 hover:text-slate-700 px-4 py-2">إلغاء</button>
                <button onClick={handleCreateVisit} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">إنشاء زيارة</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Manager Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{editingTest ? 'تعديل الفحص' : 'إضافة فحص جديد'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">اسم الفحص</label>
                <input className="w-full border p-2 rounded" value={testForm.name || ''} onChange={e => setTestForm({...testForm, name: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                   <label className="text-xs text-slate-500">الكود</label>
                   <input className="w-full border p-2 rounded" value={testForm.code || ''} onChange={e => setTestForm({...testForm, code: e.target.value})} />
                </div>
                <div className="flex-1">
                   <label className="text-xs text-slate-500">السعر</label>
                   <input type="number" className="w-full border p-2 rounded" value={testForm.price || ''} onChange={e => setTestForm({...testForm, price: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-2">
                 <div className="flex-1">
                   <label className="text-xs text-slate-500">المعدل الطبيعي (للعرض فقط)</label>
                   <input className="w-full border p-2 rounded" value={testForm.normalRange || ''} onChange={e => setTestForm({...testForm, normalRange: e.target.value})} placeholder="e.g. 70-110" />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs text-slate-500">الوحدة</label>
                    <input className="w-full border p-2 rounded" value={testForm.unit || ''} onChange={e => setTestForm({...testForm, unit: e.target.value})} placeholder="e.g. mg/dL" />
                 </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowTestModal(false)} className="px-4 py-2 text-slate-500">إلغاء</button>
                <button onClick={handleSaveTest} className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintModal && printVisitId && (() => {
         const visit = visits.find(v => v.id === printVisitId);
         const patient = patients.find(p => p.id === visit?.patientId);
         if(!visit || !patient) return null;

         return (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-90 z-[100] overflow-y-auto p-4 flex flex-col items-center">
             <div className="w-full max-w-4xl flex justify-between items-center text-white mb-4 print:hidden">
               <h2 className="text-xl font-bold">معاينة التقرير</h2>
               <div className="flex gap-3">
                  <button onClick={() => setShowPrintModal(false)} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded flex gap-2"><X className="w-5 h-5"/> إغلاق</button>
                  <button onClick={triggerPrint} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-2 rounded flex gap-2"><Printer className="w-5 h-5"/> طباعة</button>
               </div>
             </div>
             
             {/* The Printable Paper */}
             <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl text-black print:w-full print:h-full print:shadow-none print:m-0 print:p-8 rounded-sm">
                
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
                   <div>
                      <h1 className="text-3xl font-bold text-slate-900 mb-2">{settings.labName}</h1>
                      <p className="text-slate-600">{settings.address}</p>
                      <p className="text-slate-600">{settings.phone}</p>
                   </div>
                   <div className="text-left">
                      <h2 className="text-xl font-bold text-slate-800">تقرير نتائج طبية</h2>
                      <p className="text-sm text-slate-500 mt-1">Medical Laboratory Report</p>
                      <p className="text-sm font-mono mt-2 text-slate-400">ID: {visit.id.substring(0,8).toUpperCase()}</p>
                   </div>
                </div>

                {/* Patient Info */}
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 grid grid-cols-2 gap-y-4">
                   <div><span className="text-slate-500 block text-xs">اسم المريض</span><span className="font-bold text-lg">{patient.name}</span></div>
                   <div><span className="text-slate-500 block text-xs">تاريخ الزيارة</span><span className="font-bold text-lg">{visit.date}</span></div>
                   <div><span className="text-slate-500 block text-xs">العمر / الجنس</span><span className="font-bold">{patient.age} سنة / {patient.gender}</span></div>
                   <div><span className="text-slate-500 block text-xs">رقم الهاتف</span><span className="font-bold">{patient.phone}</span></div>
                </div>

                {/* Results Table */}
                <table className="w-full mb-8">
                   <thead>
                      <tr className="border-b-2 border-slate-800 text-slate-700">
                         <th className="text-right py-3 px-2">الفحص (Test Name)</th>
                         <th className="text-center py-3 px-2">النتيجة (Result)</th>
                         <th className="text-center py-3 px-2">الوحدة (Unit)</th>
                         <th className="text-left py-3 px-2" dir="ltr">المعدل الطبيعي (Ref. Range)</th>
                      </tr>
                   </thead>
                   <tbody>
                      {visit.selectedTestIds.map(tid => {
                         const t = tests.find(test => test.id === tid);
                         const r = visit.results.find(res => res.testId === tid);
                         return (
                            <tr key={tid} className="border-b border-slate-100">
                               <td className="py-4 px-2 font-bold text-slate-800">{t?.name}</td>
                               <td className="py-4 px-2 text-center font-mono text-lg">{r?.value || '-'}</td>
                               <td className="py-4 px-2 text-center text-slate-500 text-sm">{t?.unit}</td>
                               <td className="py-4 px-2 text-left text-slate-500 text-sm" dir="ltr">{t?.normalRange}</td>
                            </tr>
                         )
                      })}
                   </tbody>
                </table>
                
                {/* AI Note (Optional in Print) */}
                {visit.aiAnalysis && (
                  <div className="mt-8 pt-4 border-t border-slate-200">
                    <h4 className="font-bold text-sm text-slate-500 mb-2">ملاحظات التقرير الذكي:</h4>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">{visit.aiAnalysis}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-20 pt-8 border-t border-slate-300 flex justify-between items-end">
                   <div className="text-center">
                      <p className="text-sm font-bold text-slate-800 mb-8">مدير المختبر</p>
                      <div className="w-32 h-0 border-b border-slate-800"></div>
                   </div>
                   <div className="text-left text-xs text-slate-400">
                      <p>{settings.footerText}</p>
                      <p>تاريخ الطباعة: {new Date().toLocaleString('en-US')}</p>
                   </div>
                </div>

             </div>
          </div>
         )
      })()}

    </div>
  );
};

export default App;