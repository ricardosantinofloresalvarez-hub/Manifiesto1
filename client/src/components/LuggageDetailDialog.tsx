import { useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, FileText, Plus, Camera, Loader2, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import RecoveryLabel from "@/components/RecoveryLabel";
import { useManifestItems, useDeleteManifestItem } from "@/hooks/useManifestItems";
import { useGenerateLuggageCertificate } from "@/hooks/useCertificates";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import ManifestItemCard from "@/components/ManifestItemCard";
import ManifestItemForm from "@/components/ManifestItemForm";
import DictateItemForm from "@/components/DictateItemForm";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const CLOUDINARY_CLOUD_NAME = "drjrozqs8";
const CLOUDINARY_UPLOAD_PRESET = "luggage_photos";

export default function LuggageDetailDialog({ luggage, trip, user, open, onOpenChange }: any) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: items, isLoading } = useManifestItems(luggage?.id, user?.id);
  const generateCertificate = useGenerateLuggageCertificate();
  const deleteItem = useDeleteManifestItem();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingOpen, setUploadingOpen] = useState(false);
  const [uploadingClosed, setUploadingClosed] = useState(false);
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
  const [showDictatePanel, setShowDictatePanel] = useState(false);
  const [showDictateForm, setShowDictateForm] = useState(false);
  const [dictatedText, setDictatedText] = useState("");
  const dictatedDataRef = useRef<any>({ name: "", category: "", brand: "", quantity: 1, value: null });
  const { isListening, transcript, error: speechError, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  const openPhotoInputRef = useRef<HTMLInputElement>(null);
  const closedPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    if (!items?.length) return toast({ title: t("error"), description: t("addItems") });

    try {
      const res = await generateCertificate.mutateAsync({ luggage, items, trip, user });
      if (res) {
        setTimeout(() => {
          onOpenChange(false);
          setShowVerifyPrompt(true);
        }, 2500);
      }
    } catch (e: any) {
      if (e?.message !== "No credits") {
        toast({ title: "Error", description: "Revisa la conexión del servidor.", variant: "destructive" });
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem.mutateAsync({ id, luggageId: luggage.id });
      toast({ title: t("success"), description: t("itemDeleted") });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el artículo", variant: "destructive" });
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const uploadToCloudinary = async (file: File, type: 'open' | 'closed') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'manifiesto');

    try {
      if (type === 'open') setUploadingOpen(true);
      else setUploadingClosed(true);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const imageUrl = data.secure_url;

      // Guardar URL en PostgreSQL
      const fieldName = type === 'open' ? 'openPhotoUrl' : 'closedPhotoUrl';
      const updateRes = await fetch(`/api/luggage/${luggage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: imageUrl }),
      });

      if (!updateRes.ok) throw new Error('Failed to save photo URL');

      toast({
        title: "Éxito",
        description: `Foto ${type === 'open' ? 'abierta' : 'cerrada'} guardada correctamente`,
      });

      // Actualizar el objeto luggage localmente
      luggage[fieldName] = imageUrl;

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la foto. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      if (type === 'open') setUploadingOpen(false);
      else setUploadingClosed(false);
    }
  };

  const handlePhotoSelect = (type: 'open' | 'closed') => {
    if (type === 'open') {
      openPhotoInputRef.current?.click();
    } else {
      closedPhotoInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'open' | 'closed') => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona una imagen válida",
          variant: "destructive",
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no debe superar 5MB",
          variant: "destructive",
        });
        return;
      }

      uploadToCloudinary(file, type);
    }
  };

  if (!luggage) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="text-blue-500" /> {luggage.nickname || "Detalle Maleta"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg">
            <div>
              <p className="text-2xl font-bold text-white">
                {t('total')}: ${items?.reduce((s: number, i: any) => s + (i.value || 0), 0).toLocaleString()}
              </p>
              <p className="text-zinc-400 text-sm">{items?.length || 0} {t('items')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEditingItem(null);
                  setShowForm(true);
                }} 
                className="border-zinc-700"
              >
                <Plus className="h-4 w-4 mr-1" /> {t('addItem')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowDictatePanel(true); resetTranscript(); setDictatedText(""); }}
                className="border-zinc-700"
                title="Dictar artículo por voz"
              >
                🎙️ {isListening ? "Escuchando..." : "Dictar"}
              </Button>
              <Button 
                size="sm" 
                onClick={handleDownload} 
                disabled={generateCertificate.isPending} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {generateCertificate.isPending ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4 mr-1" />
                )}
                {t('certificate')}
              </Button>
            </div>
          </div>

          {showGeneratePrompt && (
            <div className="rounded-xl p-3 mb-2 flex flex-col gap-2" style={{ background: "rgba(79,195,247,0.12)", border: "1px solid rgba(79,195,247,0.3)" }}>
              <p className="text-xs text-white/80">🎉 {t('generatePromptDesc')}</p>
              <button
                onClick={() => { setShowGeneratePrompt(false); handleDownload(); }}
                className="w-full py-2 rounded-lg text-xs font-bold text-gray-900"
                style={{ background: "#4FC3F7" }}
              >
                {t('generatePromptButton')}
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input
              ref={openPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'open')}
            />
            <input
              ref={closedPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'closed')}
            />

            <Button 
              variant="secondary" 
              className="bg-zinc-800 text-zinc-300 border-zinc-700 relative text-xs"
              onClick={() => handlePhotoSelect('open')}
              disabled={uploadingOpen}
            >
              {uploadingOpen ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : luggage.openPhotoUrl ? (
                <Check className="h-4 w-4 mr-2 text-green-400" />
              ) : (
                <Camera className="h-4 w-4 mr-2 text-blue-400" />
              )}
              {t('openLuggagePhoto')}
            </Button>

            <Button 
              variant="secondary" 
              className="bg-zinc-800 text-zinc-300 border-zinc-700 text-xs"
              onClick={() => handlePhotoSelect('closed')}
              disabled={uploadingClosed}
            >
              {uploadingClosed ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : luggage.closedPhotoUrl ? (
                <Check className="h-4 w-4 mr-2 text-green-400" />
              ) : (
                <Camera className="h-4 w-4 mr-2 text-green-400" />
              )}
              {t('closedLuggagePhoto')}
            </Button>
          </div>

          {/* Mostrar fotos si existen */}
          {(luggage.openPhotoUrl || luggage.closedPhotoUrl) && (
            <div className="grid grid-cols-2 gap-2">
              {luggage.openPhotoUrl && (
                <div className="relative">
                  <img 
                    src={luggage.openPhotoUrl} 
                    alt={t('openLuggagePhoto')}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    {t('openLuggagePhoto')}
                  </span>
                </div>
              )}
              {luggage.closedPhotoUrl && (
                <div className="relative">
                  <img 
                    src={luggage.closedPhotoUrl} 
                    alt={t('closedLuggagePhoto')}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    {t('closedLuggagePhoto')}
                  </span>
                </div>
              )}
            </div>
          )}

          {showDictatePanel && (
            <div className="rounded-xl p-4 space-y-3 bg-zinc-900 border border-zinc-700">
              <p className="text-sm text-zinc-300 font-medium">🎙️ Dictar artículo</p>
              {!isListening && !dictatedText && (
                <button
                  onClick={startListening}
                  disabled={!isSupported}
                  className="w-full py-3 rounded-lg text-sm font-bold text-gray-900"
                  style={{ background: "#4FC3F7" }}
                >
                  {isSupported ? "Presiona y habla" : "No disponible en este navegador"}
                </button>
              )}
              {isListening && (
                <div className="text-center space-y-2">
                  <div className="flex justify-center gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-6 bg-blue-400 rounded animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400">Escuchando...</p>
                  <button onClick={stopListening} className="text-xs text-red-400 underline">Detener</button>
                </div>
              )}
              {transcript && !dictatedText && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400">Escuché:</p>
                  <input
                    className="w-full bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm border border-zinc-600"
                    value={transcript}
                    onChange={(e) => {}}
                    readOnly
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => { const text = transcript; try { const res = await fetch('/api/dictate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); const parsed = await res.json(); dictatedDataRef.current = { name: parsed.name || text, category: parsed.category || '', brand: parsed.brand || '', quantity: parsed.quantity || 1, value: parsed.value || null }; } catch { dictatedDataRef.current = { name: text, category: '', brand: '', quantity: 1, value: null }; } setShowDictatePanel(false); resetTranscript(); setShowDictateForm(true); }}
                      className="flex-1 py-2 rounded-lg text-sm font-bold text-gray-900"
                      style={{ background: "#4FC3F7" }}
                    >
                      ✓ Usar este texto
                    </button>
                    <button
                      onClick={() => { resetTranscript(); startListening(); }}
                      className="flex-1 py-2 rounded-lg text-sm text-zinc-300 border border-zinc-600"
                    >
                      🔄 Repetir
                    </button>
                  </div>
                </div>
              )}
              {speechError && <p className="text-xs text-red-400">{speechError}</p>}
              <button onClick={() => { setShowDictatePanel(false); resetTranscript(); }} className="text-xs text-zinc-500 underline">Cancelar</button>
            </div>
          )}

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {items?.map((item: any) => (
                <ManifestItemCard 
                  key={item.id} 
                  {...item} 
                  onEdit={() => handleEditItem(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
            </div>
          </ScrollArea>

          {luggage.recoveryToken && (
            <div className="rounded-xl p-3 bg-zinc-900 border border-zinc-700 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-blue-400" />
                  <p className="text-xs text-zinc-300 font-medium">QR de Recuperación</p>
                </div>
                <button
                  onClick={() => window.open(`/label/${luggage.recoveryToken}`, '_blank')}
                  className="text-xs text-blue-400 underline"
                >
                  Imprimir etiqueta
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="bg-white p-1.5 rounded-lg">
                  <QRCodeSVG value={`https://manifiesto.app/found/${luggage.recoveryToken}`} size={70} />
                </div>
                <p className="text-xs text-zinc-400">Si alguien encuentra tu maleta y escanea este código, recibirás una notificación inmediata.</p>
              </div>
            </div>
          )}

        </div>
      </DialogContent>

      {showDictateForm && (
        <DictateItemForm
          luggageId={luggage.id}
          open={showDictateForm}
          onOpenChange={(open) => { setShowDictateForm(open); if (!open) dictatedDataRef.current = { name: '', category: '', brand: '', quantity: 1, value: null }; }}
          onSuccess={() => {
            const key = `generate_prompt_shown_${luggage.id}`;
            if (!localStorage.getItem(key)) { localStorage.setItem(key, 'true'); setShowGeneratePrompt(true); }
          }}
          initialData={dictatedDataRef.current}
        />
      )}

      {showForm && (
        <ManifestItemForm 
          luggageId={luggage.id} 
          item={editingItem}
          initialName={dictatedDataRef.current.name || undefined}
          open={showForm} 
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) { setEditingItem(null); setDictatedText(''); dictatedDataRef.current = { name: '', category: '', brand: '', quantity: 1, value: null }; }
          }}
          onSuccess={() => {
            const key = `generate_prompt_shown_${luggage.id}`;
            if (!localStorage.getItem(key)) {
              localStorage.setItem(key, 'true');
              setShowGeneratePrompt(true);
            }
          }}
        />
      )}
    </Dialog>


      {/* Modal: Ir a Verificar después de generar certificado */}
      {showVerifyPrompt && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6 w-full max-w-sm text-center shadow-xl">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-white font-bold text-lg mb-1">{t('verifyPromptTitle')}</h2>
            <p className="text-white/60 text-sm mb-5">{t('verifyPromptDesc')}</p>
            <button
              onClick={() => { setShowVerifyPrompt(false); window.location.href = '/verify'; }}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-900 mb-2"
              style={{ background: "#4FC3F7" }}
            >
              {t('verifyPromptButton')}
            </button>
            <button
              onClick={() => setShowVerifyPrompt(false)}
              className="w-full py-2 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              {t('nextStepSkip')}
            </button>
          </div>
        </div>
      , document.body)}
    </>
  );
}