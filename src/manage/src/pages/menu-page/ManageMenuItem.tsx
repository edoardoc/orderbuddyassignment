import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonProgressBar,
  IonText,
  IonTextarea,
} from '@ionic/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useIonRouter } from '@ionic/react';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';
import {
  menuItemSchemaPriceInCents,
  menuItemSchemaPriceInCentsType,
  useManageMenu,
} from '../../queries/manage-menu/useManageMenu';
import { useParams } from 'react-router';
import { useMenu } from '../../queries/useMenu';
import { useStations } from '../../queries/useStations';
import { azureConfig, AzureStorageService } from '../../service/azureBob';
import ObjectID from 'bson-objectid';
import { useStorage } from '../../queries/manage-menu/useStorage';
interface Variant {
  id?: string;
  name: string;
  priceCents: number;
  default?: boolean;
}

export const ManageMenuItem: React.FC = () => {
  const { restaurantId, locationId, menuId, categoryId, itemId } = useParams<{
    restaurantId: string;
    locationId: string;
    menuId: string;
    categoryId: string;
    itemId?: string;
  }>();

  const router = useIonRouter();
  const isEdit = !!itemId && itemId !== 'new';

  // Fetch menu data for categories and item details
  const { data: menu } = useMenu(restaurantId, locationId, menuId);
  const { data: stations } = useStations(restaurantId, locationId);
  const selectedItem = useMemo(() => {
    if (!isEdit || !menu?.items) return null;
    return menu.items.find((item) => item.id === itemId);
  }, [isEdit, itemId, menu]);
  const [variants, setVariants] = useState<Variant[]>(selectedItem?.variants || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>(selectedItem?.imageUrls || []);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { uploadImage } = useStorage();

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        name: '',
        priceCents: 0,
        default: variants.length === 0,
      },
    ]);
  };
  const handleRemoveVariant = (index: number) => {
    const variantToRemove = variants[index];

    if (variantToRemove.default && variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      newVariants[0].default = true;
      setVariants(newVariants);
      setValue('variants', newVariants);
      setValue('priceCents', newVariants[0].priceCents / 100);
    } else {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };
  const handleVariantChange = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];

    if (field === 'default') {
      if (value === false && newVariants[index].default && !newVariants.some((v, i) => i !== index && v.default)) {
        return;
      }

      if (value === true) {
        newVariants.forEach((variant, i) => {
          if (i !== index) {
            variant.default = false;
          }
        });
        setValue('priceCents', newVariants[index].priceCents / 100);
      }
    }

    const processedValue = field === 'priceCents' ? Math.round(Number(value) * 100) : value;
    newVariants[index] = {
      ...newVariants[index],
      [field]: processedValue,
    };

    setValue('variants', newVariants);
    setVariants(newVariants);
  };

  const { upsertMenuItem } = useManageMenu({
    restaurantId,
    locationId,
    menuId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<menuItemSchemaPriceInCentsType>({
    resolver: zodResolver(menuItemSchemaPriceInCents),
    defaultValues: {
      id: selectedItem?.id || '',
      name: {
        en: selectedItem?.name?.en || '',
        es: selectedItem?.name?.es || '',
        pt: selectedItem?.name?.pt || '',
      },
      description: {
        en: selectedItem?.description?.en || '',
        es: selectedItem?.description?.es || '',
        pt: selectedItem?.description?.pt || '',
      },
      categoryId: selectedItem?.categoryId || categoryId,
      priceCents: selectedItem?.priceCents ? selectedItem.priceCents / 100 : 0,
      stationTags: selectedItem?.stationTags || [],
      variants: selectedItem?.variants || [],
    },
  });

  const selectedTags = watch('stationTags') || [];

  const handleTagToggle = (tag: string) => {
    const currentTags = selectedTags;
    const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
    setValue('stationTags', newTags);
  };
  useEffect(() => {
    if (menu && itemId) {
      const item = menu.items.find((item) => item.id === itemId);
      if (item) {
        reset({
          id: item.id,
          name: {
            en: item.name.en ?? undefined,
            es: item.name.es ?? undefined,
            pt: item.name.pt ?? undefined,
          },
          description: {
            en: item.description.en ?? undefined,
            es: item.description.es ?? undefined,
            pt: item.description.pt ?? undefined,
          },
          categoryId: item.categoryId,
          priceCents: item.priceCents / 100,
          stationTags: item.stationTags || [],
          variants: item.variants || [],
        });
        setVariants(item.variants || []);
      }
    }
  }, [menu, itemId, reset]);

  const handleFormSubmit = async (data: menuItemSchemaPriceInCentsType) => {
    try {
      const hasDefaultVariant = variants.some((v) => v.default);
      if (variants.length > 0 && !hasDefaultVariant) {
        const updatedVariants = variants.map((v, i) => ({
          ...v,
          default: i === 0,
        }));
        setVariants(updatedVariants);
        setValue('variants', updatedVariants);
      }

      const defaultVariant = variants.find((v) => v.default);
      const submissionData = {
        id: data.id,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        price: defaultVariant ? defaultVariant.priceCents / 100 : Number(data.priceCents),
        stationTags: data.stationTags,
        imageUrls: imageUrls, // Add this
        variants: variants.map((v) => ({
          ...v,
          priceCents: Math.round(Number(v.priceCents)),
        })),
      };
      await upsertMenuItem.mutateAsync(submissionData);
      router.push(`/${restaurantId}/${locationId}/apps/menu/${menuId}/${categoryId}/items`);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  useEffect(() => {
    const defaultVariant = variants.find((v) => v.default);
    if (defaultVariant) {
      setValue('priceCents', defaultVariant.priceCents / 100);
    }
  }, [variants, setValue]);
  useEffect(() => {
    setValue('variants', variants);
  }, [variants, setValue]);

  const storageService = useMemo(() => new AzureStorageService(), []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleImageUpload called');
    const files = event.target.files;
    if (!files?.length) return;

    let file = files[0];
    // const fileExtension = file.name.split('.').pop();
    console.log('Selected file:', file.name);
    const newFileName = new ObjectID().toString(); // Generate a new unique file name
    const fileExtension = file.name.split('.').pop();
    file = new File([file], `${newFileName}.${fileExtension}`, { type: file.type });
    console.log('File to upload:', file.name);
    // Validate file
    if (file.size > azureConfig.maxFileSize) {
      setToastMessage('File size exceeds 5MB limit');
      setShowToast(true);
      return;
    }

    if (!azureConfig.allowedFileTypes.includes(file.type)) {
      setToastMessage('File type not supported. Please use JPG, PNG or WebP');
      setShowToast(true);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const imageUrl = await uploadImage.mutateAsync({ file, restaurantId });

      // Update form state
      const updatedUrls = [...imageUrls, imageUrl];
      setImageUrls(updatedUrls);
      setValue('imageUrls', updatedUrls);

      setToastMessage('Image uploaded successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Upload failed:', error);
      setToastMessage('Failed to upload image');
      setShowToast(true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  return (
    <IonPage>
      <LaunchPadNavBar title={isEdit ? 'Edit Menu Item' : 'Add Menu Item'} />
      <IonContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className='ion-padding'>
          <IonItem lines='none'>
            <IonInput label='Name' labelPlacement='stacked' placeholder='Enter item name' {...register('name.en')} />
          </IonItem>
          {errors.name?.en && (
            <IonItem lines='none'>
              {errors.name?.en && <IonText color='danger'>{errors.name.en.message}</IonText>}
            </IonItem>
          )}

          <IonItem lines='none'>
            <IonTextarea
              label='Description'
              labelPlacement='stacked'
              placeholder='Enter item description'
              {...register('description.en')}
            />
          </IonItem>
          {errors.description?.en && (
            <IonItem lines='none'>
              {errors.description?.en && <IonText color='danger'>{errors.description.en.message}</IonText>}
            </IonItem>
          )}
          <IonItem lines='none'>
            <IonInput
              label='Price ($)'
              labelPlacement='stacked'
              type='number'
              min='0'
              step='0.01'
              placeholder='Enter price in dollars'
              disabled={variants.some((v) => v.default)}
              {...register('priceCents', {
                valueAsNumber: true,
              })}
            />
          </IonItem>
          {errors.priceCents && (
            <IonItem lines='none'>
              {errors.priceCents && <IonText color='danger'>{errors.priceCents.message}</IonText>}
            </IonItem>
          )}
          <IonItem lines='none'>
            <IonLabel>Station Tags</IonLabel>
          </IonItem>
          {stations?.map((station) => (
            <IonItem key={station._id} lines='none'>
              <IonCheckbox
                checked={selectedTags.includes(station.tags[0])}
                onIonChange={() => handleTagToggle(station.tags[0])}
              >
                <IonLabel className='ion-padding-start'>{station.name}</IonLabel>
              </IonCheckbox>
            </IonItem>
          ))}

          {/* <IonItem lines='none'>
            <IonSelect
              label='Category'
              labelPlacement='stacked'
              placeholder='Select a category'
              {...register('categoryId')}
            >
              {categories?.map((category) => (
                <IonSelectOption key={category.id} value={category.id}>
                  {category.name.en}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem lines='none'>
            {errors.categoryId && <IonText color='danger'>{errors.categoryId.message}</IonText>}
          </IonItem> */}

          <IonCard>
            <IonItem lines='none'>
              <IonLabel>Variants</IonLabel>
              <IonButton slot='end' size='small' onClick={handleAddVariant}>
                Add Variant
              </IonButton>
            </IonItem>
          </IonCard>

          {variants.map((variant, index) => (
            <IonCard key={index} className='ion-padding-bottom'>
              <IonCardContent>
                <IonText color='medium'>Variant {index + 1}</IonText>
              </IonCardContent>
              <IonItem lines='none'>
                <IonInput
                  label='Variant Name'
                  labelPlacement='stacked'
                  value={variant.name}
                  onIonChange={(e) => handleVariantChange(index, 'name', e.detail.value!)}
                  placeholder='Enter variant name'
                />
              </IonItem>

              <IonItem lines='none'>
                <IonInput
                  label='Price ($)'
                  labelPlacement='stacked'
                  type='number'
                  min='0'
                  step='0.01'
                  value={variant.priceCents / 100}
                  onIonChange={(e) => handleVariantChange(index, 'priceCents', e.detail.value!)}
                  placeholder='Enter price'
                />
              </IonItem>

              <IonItem lines='none'>
                <IonCheckbox
                  checked={variant.default}
                  onIonChange={(e) => handleVariantChange(index, 'default', e.detail.checked)}
                  labelPlacement='end'
                  disabled={variant.default && !variants.some((v) => v.default && v.id !== variant.id)}
                >
                  Default Variant
                </IonCheckbox>
                <IonButton
                  slot='end'
                  color='danger'
                  fill='clear'
                  onClick={() => handleRemoveVariant(index)}
                  disabled={variant.default && variants.length > 1}
                >
                  Remove
                </IonButton>
              </IonItem>
            </IonCard>
          ))}

          <IonCard>
            <IonItem lines='none'>
              <IonLabel>Images</IonLabel>
              <input
                type='file'
                accept={azureConfig.allowedFileTypes.join(',')}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id='image-upload'
              />
              <IonButton
                slot='end'
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Add Image'}
              </IonButton>
            </IonItem>

            {uploading && <IonProgressBar value={uploadProgress}></IonProgressBar>}

            <IonItem lines='none' className='ion-margin-top'>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {imageUrls.map((url, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt={`Item ${index + 1}`}
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                    <IonButton
                      fill='clear'
                      color='danger'
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        margin: 0,
                        '--padding-start': '4px',
                        '--padding-end': '4px',
                      }}
                      // onClick={() => handleImageDelete(url)}
                    ></IonButton>
                  </div>
                ))}
              </div>
            </IonItem>
          </IonCard>
          <IonButton type='submit' expand='block' className='ion-margin-top'>
            {isEdit ? 'Update Item' : 'Create Item'}
          </IonButton>
        </form>{' '}
      </IonContent>
    </IonPage>
  );
};
