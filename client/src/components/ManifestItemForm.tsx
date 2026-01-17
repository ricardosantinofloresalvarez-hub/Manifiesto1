import { useEffect, useState } from 'react';
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
  quantity: z.coerce.number().min(1, 'La cantidad es requerida'),
  value: z.coerce.number().optional(),
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
  const [showCustomName, setShowCustomName] = useState(false);
  const [showCustomBrand, setShowCustomBrand] = useState(false);

  const form = useForm<ManifestItemFormValues>({
    resolver: zodResolver(manifestItemFormSchema),
    defaultValues: {
      name: '',
      category: '',
      brand: '',
      quantity: 1,
      value: undefined,
      serialNumber: '',
      notes: '',
    },


  });

  const selectedCategory = form.watch('category') as ItemCategory;

  useEffect(() => {
    if (item) {
      const categoryData = ITEM_CATEGORIES[item.category as ItemCategory];
      const isNameInSuggestions = categoryData?.suggestions.includes(item.name);
      const isBrandInList = categoryData?.brands.includes(item.brand || '');

      form.reset({
        name: isNameInSuggestions ? item.name : '',
        category: item.category,
        brand: isBrandInList ? item.brand || '' : '',
        quantity: String(item.quantity),
        value: item.value ? String(item.value) : '',
        serialNumber: item.serialNumber || '',
        notes: item.notes || '',
      });

      setShowCustomName(!isNameInSuggestions);
      setShowCustomBrand(!isBrandInList && !!item.brand);
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
      setShowCustomName(false);
      setShowCustomBrand(false);
    }
  }, [item, form]);

  const handleSubmit = async (values: ManifestItemFormValues) => {
    try {
      const data: InsertManifestItem = {
        luggageId,
        name: values.name,
        category: values.category,
        brand: values.brand || undefined,
        quantity: values.quantity,
        value: values.value,
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
      console.error("CREATE MANIFEST ITEM ERROR:", error);

      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }

  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const categoryKeys = Object.keys(ITEM_CATEGORIES) as ItemCategory[];
  const currentCategoryData = selectedCategory ? ITEM_CATEGORIES[selectedCategory] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
            {/* CATEGORÍA */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('name', '');
                      form.setValue('brand', '');
                      setShowCustomName(false);
                      setShowCustomBrand(false);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-item-category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryKeys.map((key) => {
                        const cat = ITEM_CATEGORIES[key];
                        return (
                          <SelectItem key={key} value={key}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NOMBRE DEL ARTÍCULO (con sugerencias) */}
            {selectedCategory && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del artículo *</FormLabel>
                      {!showCustomName ? (
                        <Select 
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setShowCustomName(true);
                              field.onChange('');
                            } else {
                              field.onChange(value);
                            }
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-item-name">
                              <SelectValue placeholder="Selecciona un artículo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currentCategoryData?.suggestions.map((suggestion) => (
                              <SelectItem key={suggestion} value={suggestion}>
                                {suggestion}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">✏️ Otro (escribir)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-2">
                          <FormControl>
                            <Input
                              placeholder="Escribe el nombre del artículo"
                              {...field}
                              data-testid="input-item-name-custom"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowCustomName(false);
                              field.onChange('');
                            }}
                          >
                            ← Volver a sugerencias
                          </Button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* MARCA DEL ARTÍCULO (según categoría) */}
                {currentCategoryData && currentCategoryData.brands.length > 0 && (
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca del artículo</FormLabel>
                        {!showCustomBrand ? (
                          <Select 
                            onValueChange={(value) => {
                              if (value === 'custom') {
                                setShowCustomBrand(true);
                                field.onChange('');
                              } else {
                                field.onChange(value);
                              }
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-item-brand">
                                <SelectValue placeholder="Seleccionar marca" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currentCategoryData.brands.map((brand) => (
                                <SelectItem key={brand} value={brand}>
                                  {brand}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="space-y-2">
                            <FormControl>
                              <Input
                                placeholder="Escribe la marca"
                                {...field}
                                data-testid="input-item-brand-custom"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowCustomBrand(false);
                                field.onChange('');
                              }}
                            >
                              ← Volver a marcas
                            </Button>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {/* CANTIDAD Y VALOR */}
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

            {/* NÚMERO DE SERIE (solo para electrónicos) */}
            {selectedCategory === 'electronics' && (
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de serie</FormLabel>
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
            )}

            {/* NOTAS */}
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