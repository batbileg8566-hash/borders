import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, Lock, LogIn, Loader2, AlertTriangle, ShieldCheck, MapPin, Info, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { borderCrossings, GOODS } from '../data';
import { getSupabase, resetSupabaseInstance } from '../lib/supabase';
import { validateData, ValidationError } from '../lib/dataValidator';
import { Settings, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { createClient } from '@supabase/supabase-js';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const isValidLatLng = (lat: any, lng: any) => {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || !isFinite(lat) || isNaN(lng) || !isFinite(lng)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

const ChangeView = ({ lat, lng, zoom = 7 }: { lat: number, lng: number, zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (isValidLatLng(lat, lng)) {
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1 });
    }
  }, [lat, lng, map, zoom]);
  return null;
};

interface AdminImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  currentBorders: any[];
}

const LocationPicker = ({ lat, lng, onChange }: { lat: number, lng: number, onChange: (lat: number, lng: number) => void }) => {
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        onChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const centerLat = isValidLatLng(lat, lng) ? lat : 47.9188;
  const centerLng = isValidLatLng(lat, lng) ? lng : 106.9176;

  return (
    <div className="h-64 w-full rounded-2xl overflow-hidden border border-gray-200 relative">
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
        <ChangeView lat={centerLat} lng={centerLng} zoom={isValidLatLng(lat, lng) ? 12 : 5} />
        {isValidLatLng(lat, lng) && (
          <Marker position={[lat, lng]} />
        )}
      </MapContainer>
      <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur p-2 rounded-lg text-[10px] font-black shadow-sm border border-gray-100 uppercase tracking-widest">
        Байршил сонгох
      </div>
    </div>
  );
};

interface PortEditData {
  name: string;
  lat: number;
  lng: number;
  ubDistance: number;
  aimagDistance: number;
  operationalStatus: string;
  trafficStatus: string;
  capacity: number;
  areaSize: number;
  staffGUAB: number;
  staffGUB: number;
  customsLabInfo: string;
  testedGoodsInfo: string;
  description: string;
  imageUrl: string;
}

export const AdminImageModal: React.FC<AdminImageModalProps> = ({ isOpen, onClose, onUpdate, currentBorders }) => {
  const supabase = getSupabase();
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [mode, setMode] = useState<'port' | 'good' | 'validation' | 'setup'>('port');
  const [portTab, setPortTab] = useState<'info' | 'image' | 'location'>('info');
  const [selectedId, setSelectedId] = useState(borderCrossings[0].id);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | null, message: string | null }>({ type: null, message: null });
  const [validationResults, setValidationResults] = useState<ValidationError[]>([]);

  // Port detail state
  const [editData, setEditData] = useState<Partial<PortEditData>>({});
  
  // Setup fields
  const [setupUrl, setSetupUrl] = useState(localStorage.getItem('CUSTOM_SUPABASE_URL') || '');
  const [setupKey, setSetupKey] = useState(localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) {
      setMode('setup');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Load current data when port changes
  useEffect(() => {
    if (mode === 'port') {
      const port = (currentBorders || borderCrossings).find((b: any) => b.id === selectedId);
      if (port) {
        setEditData({
          name: port.name,
          lat: port.lat,
          lng: port.lng,
          ubDistance: port.ubDistance,
          aimagDistance: port.aimagDistance,
          operationalStatus: port.operationalStatus,
          trafficStatus: port.trafficStatus,
          capacity: port.capacity,
          areaSize: port.areaSize,
          staffGUAB: port.staffGUAB,
          staffGUB: port.staffGUB,
          customsLabInfo: port.customsLabInfo || '',
          testedGoodsInfo: port.testedGoodsInfo || '',
          description: port.description,
          imageUrl: port.imageUrl
        });
      }
    }
  }, [selectedId, mode, currentBorders]);

  const handleModeChange = (newMode: 'port' | 'good' | 'validation' | 'setup') => {
    setMode(newMode);
    if (newMode === 'validation') {
      setValidationResults(validateData());
    } else if (newMode === 'setup') {
      // Setup mode uses state
    } else {
      setSelectedId(newMode === 'port' ? borderCrossings[0].id : '_default');
      setPreview(null);
      setFile(null);
    }
  };

  const handleSetupSave = async () => {
    setIsAuthLoading(true);
    setAuthError(null);

    const cleanInput = (val: string) => {
      let cleaned = val.trim();
      if (cleaned.includes('=')) {
        const parts = cleaned.split('=');
        cleaned = parts[parts.length - 1].trim();
      }
      if (cleaned.includes(':') && !cleaned.startsWith('http')) {
        const parts = cleaned.split(':');
        cleaned = parts.slice(1).join(':').trim();
      }
      cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
      
      if (cleaned.startsWith('http')) {
        try {
          const urlObj = new URL(cleaned);
          cleaned = `${urlObj.protocol}//${urlObj.host}`;
        } catch (e) {
          cleaned = cleaned.replace(/\/$/, '');
          cleaned = cleaned.replace(/\/rest\/v1.*$/, '');
          cleaned = cleaned.replace(/\/auth\/v1.*$/, '');
        }
      }
      return cleaned;
    };

    const trimmedUrl = cleanInput(setupUrl);
    const trimmedKey = cleanInput(setupKey);
    
    if (trimmedUrl.includes('supabase.com/dashboard')) {
      setAuthError('Та Supabase Dashboard-ын URL-ыг оруулсан байна. Settings хэсгээс Project URL-ыг авна уу.');
      setIsAuthLoading(false);
      return;
    }

    if (!trimmedUrl.startsWith('http')) {
      setAuthError('Supabase URL нь http:// эсвэл https://-ээр эхлэх ёстой.');
      setIsAuthLoading(false);
      return;
    }

    try {
      // 5 second timeout for connection test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const testClient = createClient(trimmedUrl, trimmedKey);
      const { error: testError } = await testClient.auth.getSession();
      
      clearTimeout(timeoutId);

      if (testError) {
        if (testError.message.includes('Invalid path')) {
          throw new Error('Оруулсан URL буруу байна. Танд зөвхөн Project URL (жишээ: https://xxx.supabase.co) хэрэгтэй.');
        }
        throw testError;
      }

      localStorage.setItem('CUSTOM_SUPABASE_URL', trimmedUrl);
      localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', trimmedKey);
      resetSupabaseInstance();
      
      alert('Холболт амжилттай! Систем дахин ачаална.');
      window.location.reload(); 
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setAuthError('Холболт амжилтгүй. URL-аа шалгана уу (Timeout).');
      } else {
        setAuthError(err.message || 'Холболт хийхэд алдаа гарлаа.');
      }
      setIsAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError('Supabase тохиргоо хийгдээгүй байна.');
      setMode('setup');
      return;
    }

    setIsAuthLoading(true);
    setAuthError(null);

    // Create a promise for timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 8000)
    );

    try {
      // Race the login against the timeout
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      
      const result: any = await Promise.race([loginPromise, timeoutPromise]);
      const { data, error: loginError } = result;
      
      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          setAuthError('Мэйл хаяг эсвэл нууц үг буруу байна.');
        } else if (loginError.message.includes('Network request failed')) {
          setAuthError('Интернэт эсвэл Supabase-тэй холбогдож чадсангүй. URL-аа шалгана уу.');
        } else {
          setAuthError(loginError.message);
        }
      } else if (data.user) {
        setUser(data.user);
        setAuthError(null);
      } else {
        setAuthError('Систем хариу өгсөнгүй. Түр хүлээгээд дахин оролдоно уу.');
      }
    } catch (err: any) {
      if (err.message === 'timeout') {
        setAuthError('Нэвтрэх үйлдэл хэт удлаа (Timeout). Supabase URL-аа зөв эсэхийг шалгана уу.');
      } else {
        setAuthError('Нэвтрэх явцад алдаа гарлаа. Холболтоо шалгана уу.');
        console.error('Login error:', err);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => supabase?.auth.signOut();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsCompressing(true);
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setIsCompressing(false);
    };
    reader.readAsDataURL(selectedFile);
  };

  const getOptimizedUrl = (url: string | undefined, width = 600) => {
    if (!url) return '';
    // Supabase supports basic transformation via query params if the proxy is enabled, 
    // but standard public URLs often ignore them unless using the explicit transform endpoint.
    // However, for standard usage, we can at least suggest the pattern.
    if (url.includes('storage/v1/object/public')) {
      return `${url.split('?')[0]}?width=${width}&quality=80`;
    }
    return url;
  };

  const handleSave = async () => {
    if (!user || !supabase) return;

    // Validation
    if (mode === 'port') {
      if (!isValidLatLng(editData.lat, editData.lng)) {
        setNotification({ type: 'error', message: 'Байршлын координат буруу байна. (Lat: -90...90, Lng: -180...180)' });
        return;
      }
    }
    
    setIsUploading(true);
    setNotification({ type: null, message: null });
    
    try {
      let publicUrl = editData.imageUrl;

      // 1. Handle Image Upload if new file selected
      if (file) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
        const fileName = `${mode}/${selectedId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('port-images')
          .upload(fileName, file, { 
            upsert: true,
            contentType: file.type
          });

        if (uploadError) throw new Error(`Зураг хуулахад алдаа: ${uploadError.message}`);

        const { data: { publicUrl: newUrl } } = supabase.storage
          .from('port-images')
          .getPublicUrl(fileName);
        
        publicUrl = newUrl;

        // 2. Save image URL to custom_images table
        // This is the specific requirement to keep image URLs in a secondary table
        const { error: imageDbError } = await supabase
          .from('custom_images')
          .upsert({
            entity_id: selectedId,
            category: mode,
            image_url: publicUrl,
            updated_at: new Date().toISOString()
          }, { onConflict: 'entity_id,category' });

        if (imageDbError) console.warn('custom_images table update failed:', imageDbError.message);
      }

      const overrideData = {
        ...editData,
        imageUrl: publicUrl
      };

      // 3. Optimistic local update
      const localOverrides = JSON.parse(localStorage.getItem('LOCAL_OVERRIDES_DATA') || '{}');
      localOverrides[`${mode}:${selectedId}`] = overrideData;
      localStorage.setItem('LOCAL_OVERRIDES_DATA', JSON.stringify(localOverrides));

      // 4. Save metadata overrides to custom_overrides table
      const { error: dbError } = await supabase
        .from('custom_overrides')
        .upsert({
          entity_id: selectedId,
          category: mode,
          data: overrideData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'entity_id,category' });

      if (dbError) throw new Error(`Өгөгдөл хадгалахад алдаа: ${dbError.message}`);

      setNotification({ type: 'success', message: 'Мэдээлэл амжилттай хадгалагдлаа!' });
      
      // Refresh parent state
      onUpdate();
      
      // Cleanup after success
      setFile(null);
      setPreview(null);

      // Close modal after a short delay to show success
      setTimeout(() => {
        onClose();
        setNotification({ type: null, message: null });
      }, 2000);

    } catch (err: any) {
      console.error('Save error:', err);
      setNotification({ type: 'error', message: err.message || 'Тодорхойгүй алдаа гарлаа.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = async () => {
    if (!user || !supabase) return;
    
    setIsUploading(true);
    try {
      // 1. Delete from overrides table
      const { error: dbError } = await supabase
        .from('custom_overrides')
        .delete()
        .match({ entity_id: selectedId, category: mode });

      if (dbError) throw dbError;

      // 2. Delete from images table
      const { error: imgError } = await supabase
        .from('custom_images')
        .delete()
        .match({ entity_id: selectedId, category: mode });

      // 3. Update local storage
      const localOverrides = JSON.parse(localStorage.getItem('LOCAL_OVERRIDES_DATA') || '{}');
      delete localOverrides[`${mode}:${selectedId}`];
      localStorage.setItem('LOCAL_OVERRIDES_DATA', JSON.stringify(localOverrides));

      setNotification({ type: 'success', message: 'Өгөгдлийг амжилттай устгаж, үндсэн төлөвт нь буцаалаа.' });
      onUpdate();
      
      setTimeout(() => {
        onClose();
        setNotification({ type: null, message: null });
        setShowConfirmDelete(false);
      }, 1500);

    } catch (err: any) {
      console.error('Reset error:', err);
      setNotification({ type: 'error', message: err.message || 'Устгахад алдаа гарлаа.' });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Notification Overlay */}
          <AnimatePresence>
            {notification.message && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex items-center gap-3 p-4 z-50 ${
                  notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {notification.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
                <p className="text-sm font-black uppercase tracking-widest flex-1">{notification.message}</p>
                <button onClick={() => setNotification({ type: null, message: null })} className="p-1 hover:bg-white/20 rounded-lg">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">Админ удирдлага</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Зураг ба мэдээлэл шинэчлэх</p>
            </div>
            <div className="flex items-center gap-2">
              {supabase && (
                <button 
                  onClick={() => onUpdate()} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-blue-600"
                  title="Шинэчлэх"
                >
                  <RefreshCw size={18} />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>
          </div>

          {!supabase ? (
            /* Supabase Missing Configuration Error */
            <div className="p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Холболтын алдаа</h3>
              <p className="text-sm font-bold text-gray-500 leading-relaxed mb-8 px-4">
                Supabase байхгүй эсвэл буруу тохируулагдсан байна. <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-[10px] font-mono mt-2 inline-block">
                  VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
                </code> <br />
                хувьсагчууд тохируулагдсан эсэхийг шалгана уу.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setMode('setup')}
                  className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                >
                  Тохиргоо хийх
                </button>
                <p className="text-[10px] font-bold text-gray-400 italic">
                  Анхааруулга: Тохиргоо хийгдээгүй үед өгөгдөл хадгалагдахгүй.
                </p>
              </div>
            </div>
          ) : (mode !== 'setup' && !user) ? (
            /* Login Form */
            <div className="p-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8" />
                </div>
              </div>
              <div className="mb-6 text-center">
                <p className="text-[11px] font-bold text-gray-500 leading-relaxed px-4">
                  Supabase төслийнхөө <span className="text-blue-600">Auth {"->"} Users</span> хэсэгт бүртгэсэн мэйл хаягаар нэвтэрнэ үү.
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Мэйл хаяг</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="admin@border.mn"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Нууц үг</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {authError && (
                  <p className="text-[10px] font-bold text-red-500 bg-red-50 p-3 rounded-xl italic">
                    {authError === 'Invalid login credentials' ? 'Нэвтрэх нэр эсвэл нууц үг буруу байна.' : authError}
                  </p>
                )}
                <button 
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isAuthLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <LogIn size={18} />}
                  Нэвтрэх
                </button>
                
                <button 
                  type="button"
                  onClick={() => setMode('setup')}
                  className="w-full py-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
                >
                  Холболтын Тохиргоо Засах
                </button>
              </form>
            </div>
          ) : (
            /* Upload UI / Validation UI */
            <>
              <div className="p-6 space-y-6 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
                <div className="flex p-1 bg-gray-100 rounded-2xl">
                  {([
                    { id: 'port', label: 'Боомт' },
                    { id: 'good', label: 'Бараа' },
                    { id: 'validation', label: 'Дата Шалгалт' },
                    { id: 'setup', label: 'Тохиргоо' }
                  ] as const).map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => handleModeChange(tab.id)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {mode === 'setup' ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                      <Settings className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
                        Supabase холболтын мэдээллээ оруулснаар админ үйлдлүүд (зураг солих г.м) идэвхжинэ. Холболтын мэдээллийг Project Settings болон API хэсгээс авна.
                      </p>
                    </div>

                    {authError && (
                      <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex gap-2 items-center">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-[10px] font-bold text-red-600">{authError}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Supabase URL</label>
                        <input 
                          type="text"
                          value={setupUrl}
                          onChange={(e) => setSetupUrl(e.target.value)}
                          placeholder="https://xxx.supabase.co"
                          className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Anon API Key</label>
                        <input 
                          type="password"
                          value={setupKey}
                          onChange={(e) => setSetupKey(e.target.value)}
                          placeholder="your-anon-key"
                          className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ) : mode === 'validation' ? (
                  <div className="space-y-4 pr-2">
                    {validationResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                        <ShieldCheck className="w-12 h-12 text-emerald-500" />
                        <div className="text-center">
                          <p className="text-sm font-black text-emerald-700 uppercase tracking-widest">Өгөгдөл цэвэр байна</p>
                          <p className="text-xs font-bold text-emerald-500/70">Ямар нэг алдаа олдсонгүй.</p>
                        </div>
                      </div>
                    ) : (
                      validationResults.map((error, idx) => (
                        <div key={idx} className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-wide">{error.item}</p>
                            <p className="text-[11px] font-bold text-amber-700 leading-relaxed">{error.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : mode === 'port' ? (
                  /* ENHANCED PORT EDITOR */
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Боомт сонгох</label>
                      <select 
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none appearance-none cursor-pointer"
                      >
                        {borderCrossings.map(port => (
                          <option key={port.id} value={port.id}>{port.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100">
                      {([
                        { id: 'info', icon: <Info size={14} />, label: 'Мэдээлэл' },
                        { id: 'image', icon: <ImageIcon size={14} />, label: 'Зураг' },
                        { id: 'location', icon: <MapPin size={14} />, label: 'Байршил' }
                      ] as const).map(tab => (
                        <button 
                          key={tab.id}
                          onClick={() => setPortTab(tab.id)}
                          className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${portTab === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <motion.div
                      key={portTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      {portTab === 'info' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Боомтын тайлбар</label>
                            <textarea 
                              value={editData.description || ''}
                              onChange={(e) => setEditData({...editData, description: e.target.value})}
                              rows={3}
                              className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                              placeholder="Тайлбар..."
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Зам талбай (м.кв)</label>
                            <input 
                              type="number"
                              value={editData.areaSize || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                if (!isNaN(val)) setEditData({...editData, areaSize: val});
                              }}
                              className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Хүчин чадал</label>
                            <input 
                              type="number"
                              value={editData.capacity || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                if (!isNaN(val)) setEditData({...editData, capacity: val});
                              }}
                              className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">ГУАБ тоо</label>
                            <input 
                              type="number"
                              value={editData.staffGUAB || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                if (!isNaN(val)) setEditData({...editData, staffGUAB: val});
                              }}
                              className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">ГҮБ тоо</label>
                            <input 
                              type="number"
                              value={editData.staffGUB || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                if (!isNaN(val)) setEditData({...editData, staffGUB: val});
                              }}
                              className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </div>
                          <div className="col-span-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Гаалийн салбар лабораторын мэдээлэл</label>
                             <input 
                               type="text"
                               value={editData.customsLabInfo || ''}
                               onChange={(e) => setEditData({...editData, customsLabInfo: e.target.value})}
                               className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                               placeholder="Салбар лабораторын мэдээлэл..."
                             />
                          </div>
                          <div className="col-span-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Шинжилгээ хийдэг барааны мэдээлэл</label>
                             <textarea 
                               value={editData.testedGoodsInfo || ''}
                               onChange={(e) => setEditData({...editData, testedGoodsInfo: e.target.value})}
                               rows={2}
                               className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                               placeholder="Шинжилгээ хийдэг бараанууд..."
                             />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">УБ хүртэл (км)</label>
                            <input 
                              type="number"
                              value={editData.ubDistance || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                if (!isNaN(val)) setEditData({...editData, ubDistance: val});
                              }}
                              className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Аймаг хүртэл (км)</label>
                            <input 
                              type="number"
                              value={editData.aimagDistance || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                if (!isNaN(val)) setEditData({...editData, aimagDistance: val});
                              }}
                              className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {portTab === 'image' && (
                        <div className="space-y-2">
                           <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                              preview || editData.imageUrl ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                            }`}
                          >
                            {(preview || editData.imageUrl) ? (
                              <img src={preview || editData.imageUrl} className="w-full h-full object-cover rounded-[22px]" alt="Preview" />
                            ) : (
                              <div className="text-center space-y-2">
                                <Upload className={`mx-auto ${isCompressing ? 'animate-bounce' : ''} text-gray-400`} />
                                <p className="text-sm font-bold text-gray-500">{isCompressing ? 'Боловсруулж байна...' : 'Зураг сонгох'}</p>
                              </div>
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              ref={fileInputRef} 
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </div>
                          {preview && (
                            <button 
                              onClick={() => { setPreview(null); setFile(null); }}
                              className="text-[9px] font-black text-red-500 uppercase tracking-widest w-full text-center py-2"
                            >
                              Цэвэрлэх
                            </button>
                          )}
                        </div>
                      )}

                      {portTab === 'location' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Өргөрөг (Lat)</label>
                              <input 
                                type="number"
                                value={editData.lat || ''}
                                onChange={(e) => setEditData({...editData, lat: Number(e.target.value)})}
                                className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Уртраг (Lng)</label>
                              <input 
                                type="number"
                                value={editData.lng || ''}
                                onChange={(e) => setEditData({...editData, lng: Number(e.target.value)})}
                                className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                              />
                            </div>
                          </div>
                          <LocationPicker 
                            lat={editData.lat} 
                            lng={editData.lng} 
                            onChange={(lat, lng) => setEditData({...editData, lat, lng})} 
                          />
                        </div>
                      )}
                    </motion.div>
                  </div>
                ) : (
                  /* GOOD EDITOR (Legacy simple image upload) */
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        Бараа / Төрөл сонгох
                      </label>
                      <select 
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none appearance-none cursor-pointer"
                      >
                        <option value="_default">Үндсэн Лого</option>
                        {GOODS.map(good => (
                          <option key={good.id} value={good.id}>{good.icon} {good.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Шинэ зураг</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                          preview ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                        }`}
                      >
                        {preview ? (
                          <img src={preview} className="w-full h-full object-cover rounded-[22px]" alt="Preview" />
                        ) : (
                          <div className="text-center space-y-2">
                            <Upload className={`mx-auto ${isCompressing ? 'animate-bounce' : ''} text-gray-400`} />
                            <p className="text-sm font-bold text-gray-500">{isCompressing ? 'Боловсруулж байна...' : 'Зураг сонгох'}</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          ref={fileInputRef} 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 pt-0 space-y-3 shrink-0">
                {mode === 'setup' ? (
                  <button 
                    onClick={handleSetupSave}
                    disabled={!setupUrl || !setupKey || isAuthLoading}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-gray-200"
                  >
                    {isAuthLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Холболтыг Шалгаж байна...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} />
                        Холболт Хийх & Дахин Ачаалах
                      </>
                    )}
                  </button>
                ) : mode !== 'validation' && (
                  <button 
                    disabled={isCompressing || isUploading}
                    onClick={handleSave}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                      isCompressing || isUploading
                        ? 'bg-gray-100 text-gray-300' 
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-[0.98]'
                    }`}
                  >
                    {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Check size={18} />}
                    {isUploading ? 'Хадгалж байна...' : 'Хадгалах'}
                  </button>
                )}
                {user && (
                  <button 
                    onClick={handleLogout}
                    className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                  >
                    Админаас Гарах
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

