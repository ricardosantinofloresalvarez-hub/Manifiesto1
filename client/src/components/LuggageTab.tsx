import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Briefcase, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LuggageCard from '@/components/LuggageCard';
import LuggageDetailDialog from '@/components/LuggageDetailDialog';
import {
  useLuggage,
  useCreateLuggage,
  useUpdateLuggage,
  useDeleteLuggage,
} from '@/hooks/useLuggage';
import {
  LUGGAGE_BRANDS,
  LUGGAGE_COLORS,
  LUGGAGE_SIZES,
  LUGGAGE_TYPE_OPTIONS,
} from '@/constants/manifestItems';
import type { Luggage, InsertLuggage, Trip } from '@shared/schema';

const luggageFormSchema = z.object({
  nickname: z.string().optional(),
  brand: z.string().optional(),
  type: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  isSealed: z.boolean().default(false),
  isLocked: z.boolean().default(false),
});

type LuggageFormValues = z.infer<typeof luggageFormSchema>;

interface LuggageTabProps {
  tripId: string;
  trip: Trip | null;
  user: { name: string; email: string } | null;
}

export default function LuggageTab({ tripId, trip, user }: LuggageTabProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Traducir opciones dinámicamente
  const translatedTypeOptions = LUGGAGE_TYPE_OPTIONS.map(opt => ({
    value: opt.value,
    label: t(opt.value) // cabin, checked, backpack, handbag
  }));

  const translatedSizeOptions = LUGGAGE_SIZES.map(opt => ({
    value: opt.value,
    label: t(opt.value) // small, medium, large, xlarge
  }));
  const translatedColors = LUGGAGE_COLORS.map(color => {
    const colorKey = color.toLowerCase().replace(/\//g, '').replace(/ /g, '');
    return t(`color_${colorKey}`, color); // fallback al original si no existe
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLuggage, setEditingLuggage] = useState<Luggage | null>(null);
  const [deletingLuggage, setDeletingLuggage] = useState<Luggage | null>(null);
  const [selectedLuggage, setSelectedLuggage] = useState<Luggage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showAddItemsPrompt, setShowAddItemsPrompt] = useState(false);

  const { data: luggageList, isLoading, error } = useLuggage(tripId);
  const createMutation = useCreateLuggage();
  const updateMutation = useUpdateLuggage();
  const deleteMutation = useDeleteLuggage();

  const createForm = useForm<LuggageFormValues>({
    resolver: zodResolver(luggageFormSchema),
    defaultValues: {
      nickname: '',
      brand: '',
      type: '',
      size: '',
      color: '',
      isSealed: false,
      isLocked: false,
    },
  });

  const editForm = useForm<LuggageFormValues>({
    resolver: zodResolver(luggageFormSchema),
    defaultValues: {
      nickname: '',
      brand: '',
      type: '',
      size: '',
      color: '',
      isSealed: false,
      isLocked: false,
    },
  });

  const handleCreate = async (values: LuggageFormValues) => {
    try {
      const data: InsertLuggage = {
        tripId,
        nickname: values.nickname || undefined,
        brand: values.brand || undefined,
        type: values.type || undefined,
        size: values.size || undefined,
        color: values.color || undefined,
        isSealed: values.isSealed,
        isLocked: values.isLocked,
      };

      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
      createForm.reset();
      setShowAddItemsPrompt(true);
    } catch (err) {
      toast({ title: t('error'), description: t('errorCreatingLuggage'), variant: 'destructive' });
    }
  };

  const handleEdit = async (values: LuggageFormValues) => {
    if (!editingLuggage) return;

    try {
      await updateMutation.mutateAsync({
        id: editingLuggage.id,
        data: {
          nickname: values.nickname || undefined,
          brand: values.brand || undefined,
          type: values.type || undefined,
          size: values.size || undefined,
          color: values.color || undefined,
          isSealed: values.isSealed,
          isLocked: values.isLocked,
        },
      });
      toast({ title: t('luggageUpdated'), description: t('luggageUpdatedSuccess') });
      setEditingLuggage(null);
    } catch (err) {
      toast({ title: t('error'), description: t('errorUpdatingLuggage'), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingLuggage) return;

    try {
      await deleteMutation.mutateAsync({ id: deletingLuggage.id, tripId });
      toast({ title: t('luggageDeleted'), description: t('luggageDeletedSuccess') });
      setDeletingLuggage(null);
    } catch (err) {
      toast({ title: t('error'), description: t('errorDeletingLuggage'), variant: 'destructive' });
    }
  };

  const openEdit = (luggage: Luggage) => {
    editForm.reset({
      nickname: luggage.nickname || '',
      brand: luggage.brand || '',
      type: luggage.type || '',
      size: luggage.size || '',
      color: luggage.color || '',
      isSealed: luggage.isSealed || false,
      isLocked: luggage.isLocked || false,
    });
    setEditingLuggage(luggage);
  };

  const openDetail = (luggage: Luggage) => {
    setSelectedLuggage(luggage);
    setDetailOpen(true);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground">Error al cargar el equipaje</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          {t('luggage')}
        </h3>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          data-testid="button-add-luggage"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('add')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : luggageList && luggageList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {luggageList.map(item => (
            <LuggageCard
              key={item.id}
              luggage={item}
              onEdit={openEdit}
              onDelete={setDeletingLuggage}
              onClick={openDetail}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg">
          <Briefcase className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">Sin equipaje registrado</p>
          <p className="text-sm text-muted-foreground mb-4">
            Agrega tus maletas para organizar mejor tus artículos
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            data-testid="button-add-luggage-empty"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar equipaje
          </Button>
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addLuggageTitle')}</DialogTitle>
            <DialogDescription>
              {t('addLuggageDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('luggageNicknameLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('enterLuggageNickname')}
                        {...field}
                        data-testid="input-luggage-nickname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('type')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-luggage-type">
                            <SelectValue placeholder={t('selectOption')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {translatedTypeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('size')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-luggage-size">
                            <SelectValue placeholder={t('selectOption')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {translatedSizeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('brand')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-luggage-brand">
                            <SelectValue placeholder={t('selectOption')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LUGGAGE_BRANDS.map(brand => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('color')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-luggage-color">
                            <SelectValue placeholder={t('selectOption')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LUGGAGE_COLORS.map((color, index) => {
                            const translatedColor = translatedColors[index];
                            return (
                              <SelectItem key={color} value={translatedColor}>
                                {translatedColor}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <FormField
                  control={createForm.control}
                  name="isSealed"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-luggage-sealed"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">{t('isSealed')}</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="isLocked"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-luggage-locked"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">{t('isLocked')}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  data-testid="button-cancel-luggage"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-luggage"
                >
                  {createMutation.isPending ? t('saving') + '...' : t('save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingLuggage} onOpenChange={(open) => !open && setEditingLuggage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editLuggageTitle')}</DialogTitle>
            <DialogDescription>
              {t('editLuggageDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('luggageNicknameLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('enterLuggageNickname')}
                        {...field}
                        data-testid="input-edit-luggage-nickname"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('type')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-luggage-type">
                            <SelectValue placeholder={t('selectOption')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {translatedTypeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('size')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-luggage-size">
                            <SelectValue placeholder={t('selectOption')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {translatedSizeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('brand')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-luggage-brand">
                            <SelectValue placeholder={t('selectOption')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LUGGAGE_BRANDS.map(brand => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('color')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-luggage-color">
                            <SelectValue placeholder={t('selectOption')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LUGGAGE_COLORS.map((color, index) => {
                            const translatedColor = translatedColors[index];
                            return (
                              <SelectItem key={color} value={translatedColor}>
                                {translatedColor}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <FormField
                  control={editForm.control}
                  name="isSealed"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-luggage-sealed"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">{t('isSealed')}</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="isLocked"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-edit-luggage-locked"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">{t('isLocked')}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLuggage(null)}
                  data-testid="button-cancel-edit-luggage"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-update-luggage"
                >
                  {updateMutation.isPending ? t('savingChanges') + '...' : t('saveChanges')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingLuggage} onOpenChange={(open) => !open && setDeletingLuggage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipaje?</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteLuggageConfirmation')} "{deletingLuggage?.nickname || t('thisLuggage')}"?
                {t('actionCannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-luggage">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-luggage"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LuggageDetailDialog
        luggage={selectedLuggage}
        trip={trip}
        user={user}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedLuggage(null);
        }}
      />
    </div>

      {showAddItemsPrompt && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1b2e] p-6 w-full max-w-sm text-center shadow-xl">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-white font-bold text-lg mb-1">{t('luggageCreatedPromptTitle')}</h2>
            <p className="text-white/60 text-sm mb-5">{t('luggageCreatedPromptDesc')}</p>
            <button
              onClick={() => setShowAddItemsPrompt(false)}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-gray-900 mb-2"
              style={{ background: "#4FC3F7" }}
            >
              {t('luggageCreatedPromptButton')}
            </button>
          </div>
        </div>
      , document.body)}
    </>
  );
}
