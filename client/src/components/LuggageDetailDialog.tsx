import { useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, FileText, Plus, Camera, Loader2, Check } from "lucide-react";
import { useManifestItems, useDeleteManifestItem } from "@/hooks/useManifestItems";
import { useGenerateLuggageCertificate } from "@/hooks/useCertificates";
import { useToast } from "@/hooks/use-toast";
import ManifestItemCard from "@/components/ManifestItemCard";
import ManifestItemForm from "@/components/ManifestItemForm";

const CLOUDINARY_CLOUD_NAME = "drjrozqs8";
const CLOUDINARY_UPLOAD_PRESET = "luggage_photos";

export default function LuggageDetailDialog({ luggage, trip, user, open, onOpenChange }: any) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: items, isLoading } = useManifestItems(luggage?.id);
  const generateCertificate = useGenerateLuggageCertificate();
  const deleteItem = useDeleteManifestItem();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingOpen, setUploadingOpen] = useState(false);
  const [uploadingClosed, setUploadingClosed] = useState(false);

  const openPhotoInputRef = useRef<HTMLInputElement>(null);
  const closedPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    if (!items?.length) return toast({ title: t("error"), description: t("addItems") });

    try {
      const res = await generateCertificate.mutateAsync({ luggage, items, trip, user });
      if (res) {
        toast({ title: t("success"), description: t("certificateGenerated") });
        setTimeout(() => {
          onOpenChange(false);
        }, 1000);
      }
    } catch (e) {
      toast({ title: "Error", description: "Revisa la conexión del servidor.", variant: "destructive" });
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEditingItem(null);
                  setShowForm(true);
                }} 
                className="border-zinc-700"
              >
                <Plus className="h-4 w-4 mr-1" /> {t('item')}
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
              className="bg-zinc-800 text-zinc-300 border-zinc-700 relative"
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
              {t('openPhoto')}
            </Button>

            <Button 
              variant="secondary" 
              className="bg-zinc-800 text-zinc-300 border-zinc-700"
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
              {t('closedPhoto')}
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
                    {t('openPhoto')}
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
                    {t('closedPhoto')}
                  </span>
                </div>
              )}
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
        </div>
      </DialogContent>

      {showForm && (
        <ManifestItemForm 
          luggageId={luggage.id} 
          item={editingItem}
          open={showForm} 
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setEditingItem(null);
          }} 
        />
      )}
    </Dialog>
  );
}