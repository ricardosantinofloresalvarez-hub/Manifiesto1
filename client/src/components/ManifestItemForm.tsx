import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateManifestItem,
  useUpdateManifestItem,
} from '@/hooks/useManifestItems';
import { ITEM_CATEGORIES, type ItemCategory } from '@/constants/manifestItems';
import type { ManifestItem, InsertManifestItem } from '@shared/schema';

const manifestItemFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.string().min(1, 'La categoría es requerida'),
  brand: z.string().optional(),
  quantity: z.string().min(1, 'La cantidad es requerida'),
  value: z.string().optional(),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
});

type ManifestItemFormValues = z.infer<typeof manifestItemFormSchema>;

interface ManifestItemFormProps {
  luggageId: string;
  item?: ManifestItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ManifestItemForm({
  luggageId,
  item,
  open,
  onOpenChange,
  onSuccess,
}: ManifestItemFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateManifestItem();
  const updateMutation = useUpdateManifestItem();

  const isEditing = !!item;

  const form = useForm<ManifestItemFormValues>({
    resolver: zodResolver(manifestItemFormSchema),
    defaultValues: {
      name: '',
      category: '',
      brand: '',
      quantity: '1',
      value: '',
      serialNumber: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        category: item.category,
        brand: item.brand || '',
        quantity: String(item.quantity),
        value: item.value ? String(item.value) : '',
        serialNumber: item.serialNumber || '',
        notes: item.notes || '',
      });
    } else {
      form.reset({
        name: '',
        category: '',
        brand: '',
        quantity: '1',
        value: '',
        serialNumber: '',
        notes: '',
      });
    }
  }, [item, form]);

  const handleSubmit = async (values: ManifestItemFormValues) => {
    try {
      const data: InsertManifestItem = {
        luggageId,
        name: values.name,
        category: values.category,
        brand: values.brand || undefined,
        quantity: parseInt(values.quantity, 10) || 1,
        value: values.value ? parseFloat(values.value) : undefined,
        serialNumber: values.serialNumber || undefined,
        notes: values.notes || undefined,
      };

      if (isEditing && item) {
        await updateMutation.mutateAsync({
          id: item.id,
          data,
          luggageId,
        });
        toast({
          title: 'Artículo actualizado',
          description: `"${values.name}" ha sido actualizado.`,
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: 'Artículo agregado',
          description: `"${values.name}" ha sido agregado a la maleta.`,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: isEditing
          ? 'No se pudo actualizar el artículo.'
          : 'No se pudo agregar el artículo.',
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const categoryKeys = Object.keys(ITEM_CATEGORIES) as ItemCategory[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Artículo' : 'Agregar Artículo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los detalles del artículo.'
              : 'Ingresa los detalles del artículo para agregarlo a la maleta.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Laptop, Cámara, Camisas..."
                      {...field}
                      data-testid="input-item-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-item-category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryKeys.map((key) => (
                        <SelectItem key={key} value={key}>
                          {ITEM_CATEGORIES[key].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        data-testid="input-item-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor estimado ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-item-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Apple, Samsung, Nike..."
                      {...field}
                      data-testid="input-item-brand"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de serie (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Para electrónicos..."
                      {...field}
                      data-testid="input-item-serial"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      data-testid="input-item-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel-item"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-item">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
