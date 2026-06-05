import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreateManifestItem } from '@/hooks/useManifestItems';

const CATEGORY_LABELS: Record<string, string> = {
  clothing: "👕 Ropa",
  electronics: "💻 Electrónicos",
  footwear: "👟 Calzado",
  accessories: "👜 Accesorios",
  documents: "📄 Documentos",
  medications: "💊 Medicamentos",
  other: "📦 Otro",
};

interface DictateItemFormProps {
  luggageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData: { name: string; category: string; brand: string; quantity: number; value: number | null };
}

export default function DictateItemForm({ luggageId, open, onOpenChange, onSuccess, initialData }: DictateItemFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const createMutation = useCreateManifestItem();

  const [name, setName] = useState(initialData.name || "");
  const [category, setCategory] = useState(initialData.category || "");
  const [brand, setBrand] = useState(initialData.brand || "");
  const [quantity, setQuantity] = useState(initialData.quantity || 1);
  const [value, setValue] = useState(initialData.value || 0);

  const handleSubmit = async () => {
    if (!name || !category) {
      toast({ title: "Error", description: "Nombre y categoría son requeridos", variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync({ luggageId, name, category, brand: brand || undefined, quantity, value: value || undefined });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo agregar el artículo", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar artículo dictado</DialogTitle>
          <DialogDescription>Revisa y ajusta los datos antes de agregar</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Categoría *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Nombre *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Marca</Label>
            <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Cantidad</Label>
              <Input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Valor ($)</Label>
              <Input type="number" min="0" step="0.01" value={value} onChange={e => setValue(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>{t("cancel")}</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}